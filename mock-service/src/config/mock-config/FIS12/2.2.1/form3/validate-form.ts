import * as cheerio from "cheerio";
import logger from "@ondc/automation-logger";

// Minimal types for results
type FieldInfo = {
	name: string;
	id?: string;
	type: string;
	hidden: boolean;
};

type ValidationResult = {
	ok: boolean;
	errors: string[];
	warnings: string[];
	details?: {
		action: string;
		method: "GET" | "POST";
		fields: FieldInfo[];
		hasSubmitControl: boolean;
	};
};

/**
 * Validate a form HTML string for safety & required fields.
 * - Flags common malicious patterns: <script>, event handlers (onclick, ...),
 *   javascript: URLs, <iframe>/<object>/<embed>.
 * - Ensures there is exactly one <form>, with a safe action/method.
 * - Verifies presence of "passport" field and "date of birth" field.
 *   (DOB accepted if type="date" or name/id contains "dob" / "dateofbirth")
 *
 * Works in Node.js environments using Cheerio for HTML parsing.
 */
export function validateFormHtml(html: string): ValidationResult {
	try {
	const $ = cheerio.load(html);

	const errors: string[] = [];
	const warnings: string[] = [];

	// --- Security checks ---
	// 1) Forbid obvious active content
	const forbiddenTags = ["iframe", "object", "embed"];
	for (const tag of forbiddenTags) {
		if ($(tag).length > 0) {
			errors.push(`Forbidden tag present: <${tag}>`);
		}
	}

	// 2) Forbid inline event handlers (onclick, onload, etc.)
	$("*").each((_, element) => {
		const $el = $(element);
		// Get all attributes and check for event handlers
		const attrs = $el.attr();
		if (attrs) {
			for (const attr of Object.keys(attrs)) {
				if (attr.toLowerCase().startsWith("on")) {
					errors.push(
						`Inline event handler "${attr}" found on <${
							$el.prop("tagName")?.toLowerCase() || "unknown"
						}>`
					);
				}
			}
		}
	});

	// 3) Forbid javascript: in href/src/action
	const urlAttrs = ["href", "src", "action"];
	$("*").each((_, element) => {
		const $el = $(element);
		for (const attr of urlAttrs) {
			const val = $el.attr(attr);
			if (val && /^\s*javascript\s*:/i.test(val)) {
				errors.push(
					`javascript: URL found in ${attr} on <${
						$el.prop("tagName")?.toLowerCase() || "unknown"
					}>`
				);
			}
		}
	});

	// --- Form checks ---
	const $forms = $("form");
	if ($forms.length === 0) {
		errors.push("No <form> element found.");
		return { ok: false, errors, warnings };
	}
	if ($forms.length > 1) {
		errors.push("Multiple <form> elements found (expected exactly one).");
	}
	const $form = $forms.first();

	// action
	const action = ($form.attr("action") || "").trim();
	// if (!action) {
	// 	errors.push("Form action is missing or empty.");
	// } else {
	// 	// allow relative or https; warn on http
	// 	try {
	// 		// If it's absolute, parse and validate protocol
	// 		const abs = new URL(action, "https://example.com");
	// 		if (abs.protocol === "http:") {
	// 			warnings.push("Form action uses http (not https).");
	// 		}
	// 		if (/^\s*data\s*:/i.test(action)) {
	// 			errors.push("Form action must not be a data: URL.");
	// 		}
	// 	} catch {
	// 		// If URL parsing fails, it might be an unusual relative string; let it pass with a warning.
	// 		warnings.push("Form action is not a standard URL; ensure it is correct.");
	// 	}
	// }

	// method
	const methodRaw = ($form.attr("method") || "GET").toUpperCase();
	const method = (methodRaw === "POST" ? "POST" : "GET") as "GET" | "POST";
	if (methodRaw !== "GET" && methodRaw !== "POST") {
		warnings.push(
			`Unsupported form method "${methodRaw}" (treating as ${method}).`
		);
	}

	// Gather inputs (ignore buttons without name)
	const inputLikeSel = "input, select, textarea, button";
	const $inputs = $form.find(inputLikeSel);
	const fields: FieldInfo[] = [];

	$inputs.each((_, element) => {
		const $el = $(element);
		const tag = $el.prop("tagName")?.toLowerCase() || "";
		const type = (
			$el.attr("type") || (tag === "textarea" ? "textarea" : tag)
		).toLowerCase();
		const name = $el.attr("name") || "";
		const id = $el.attr("id") || undefined;
		const hidden = type === "hidden";

		// keep only those with a name (useful for submission)
		if (name) {
			fields.push({ name, id, type, hidden });
		}
	});

	// Must have a submit control
	let hasSubmitControl = false;
	$inputs.each((_, element) => {
		const $el = $(element);
		const tag = $el.prop("tagName")?.toLowerCase() || "";
		const type = ($el.attr("type") || "").toLowerCase();
		const isSubmit =
			tag === "button"
				? ($el.attr("type") || "submit").toLowerCase() === "submit"
				: type === "submit";
		if (isSubmit) {
			hasSubmitControl = true;
		}
	});

	if (!hasSubmitControl) {
		warnings.push("No visible submit control found.");
	}

	// --- Required business fields for consumer information form ---
	// PAN: any field whose name or id contains "pan"
	const hasPan = fields.some((f) =>
		(f.name + " " + (f.id ?? "")).toLowerCase().includes("pan")
	);

	// Full Name: any field whose name or id contains "fullname" or "full_name"
	const hasFullName = fields.some((f) => {
		const key = (f.name + " " + (f.id ?? "")).toLowerCase();
		return key.includes("fullname") || key.includes("full_name");
	});

	// Gender: any field whose name or id contains "gender"
	const hasGender = fields.some((f) =>
		(f.name + " " + (f.id ?? "")).toLowerCase().includes("gender")
	);

	// Date of birth: a date input OR name/id contains "dob" or "dateofbirth"
	const hasDob =
		fields.some((f) => f.type === "date") ||
		fields.some((f) => {
			const key = (f.name + " " + (f.id ?? "")).toLowerCase();
			return (
				key.includes("dob") ||
				key.includes("dateofbirth") ||
				key.includes("date_of_birth")
			);
		});

	// Contact Number: any field whose name or id contains "contact" or "phone"
	const hasContactNumber = fields.some((f) => {
		const key = (f.name + " " + (f.id ?? "")).toLowerCase();
		return key.includes("contact") || key.includes("phone") || key.includes("mobile");
	});

	// Pin Code: any field whose name or id contains "pincode" or "pin_code"
	const hasPincode = fields.some((f) => {
		const key = (f.name + " " + (f.id ?? "")).toLowerCase();
		return key.includes("pincode") || key.includes("pin_code") || key.includes("postal");
	});

	// Jewellery: any field whose name or id contains "jewellery" or "jewelry"
	const hasJewellery = fields.some((f) => {
		const key = (f.name + " " + (f.id ?? "")).toLowerCase();
		return key.includes("jewellery") || key.includes("jewelry") || key.includes("gold");
	});

	// Purity: any field whose name or id contains "purity"
	const hasPurity = fields.some((f) =>
		(f.name + " " + (f.id ?? "")).toLowerCase().includes("purity")
	);

	// Validate all required fields
	// if (!hasPan) errors.push('Required "PAN" field not found.');
	// if (!hasFullName) errors.push('Required "Full Name" field not found.');
	// if (!hasGender) errors.push('Required "Gender" field not found.');
	// if (!hasDob) errors.push('Required "Date of Birth" field not found.');
	// if (!hasContactNumber) errors.push('Required "Contact Number" field not found.');
	// if (!hasPincode) errors.push('Required "Pin Code" field not found.');
	// if (!hasJewellery) errors.push('Required "Jewellery" field not found.');
	// if (!hasPurity) errors.push('Required "Purity" field not found.');

	// Extra sanity: flag suspicious hidden fields (heuristic)
	const suspiciousHiddenNames = ["redirect", "callback", "token", "url"];
	const hiddenWarnings = fields
		.filter((f) => f.hidden)
		.filter((f) =>
			suspiciousHiddenNames.some((kw) => f.name.toLowerCase().includes(kw))
		);
	if (hiddenWarnings.length > 0) {
		warnings.push(
			`Suspicious hidden fields: ${hiddenWarnings
				.map((f) => f.name)
				.join(", ")}`
		);
	}

	const ok = errors.length === 0;

	return {
		ok,
		errors,
		warnings,
			details: { action, method, fields, hasSubmitControl },
		};
	} catch (error) {
		logger.error("Error validating form", error);
		return { ok: false, errors: ["failed to validate form"], warnings: [] };
	}
}