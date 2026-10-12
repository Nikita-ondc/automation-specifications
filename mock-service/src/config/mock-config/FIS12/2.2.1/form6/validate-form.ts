import * as cheerio from "cheerio";
import logger from "@ondc/automation-logger";

// ---- Types ----
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
		nomineeGroups?: number;
	};
};

// ---- Validator ----
export function validateFormHtml(html: string): ValidationResult {
	try {
		const $ = cheerio.load(html);
		const errors: string[] = [];
		const warnings: string[] = [];

		// --- Security Checks ---
		const forbiddenTags = ["script", "iframe", "object", "embed"];
		for (const tag of forbiddenTags) {
			if ($(tag).length > 0) {
				errors.push(`Forbidden tag present: <${tag}>`);
			}
		}

		$("*").each((_, el) => {
			const $el = $(el);
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

		const urlAttrs = ["href", "src", "action"];
		$("*").each((_, el) => {
			const $el = $(el);
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

		// --- Form Validation ---
		const $forms = $("form");
		if ($forms.length === 0) {
			errors.push("No <form> element found.");
			return { ok: false, errors, warnings };
		}
		if ($forms.length > 1) {
			warnings.push("Multiple <form> elements found — only first is validated.");
		}
		const $form = $forms.first();

		const action = ($form.attr("action") || "").trim();
		const methodRaw = ($form.attr("method") || "POST").toUpperCase();
		const method = (methodRaw === "POST" ? "POST" : "GET") as "GET" | "POST";

		if (!action) {
			warnings.push("Form action is missing or empty.");
		}
		if (methodRaw !== "GET" && methodRaw !== "POST") {
			warnings.push(
				`Unsupported form method "${methodRaw}" (defaulting to ${method}).`
			);
		}

		// --- Field Extraction ---
		const inputSel = "input, select, textarea, button";
		const $inputs = $form.find(inputSel);
		const fields: FieldInfo[] = [];

		$inputs.each((_, el) => {
			const $el = $(el);
			const tag = $el.prop("tagName")?.toLowerCase() || "";
			const type =
				($el.attr("type") || (tag === "textarea" ? "textarea" : tag)).toLowerCase();
			const name = $el.attr("name") || "";
			const id = $el.attr("id") || undefined;
			const hidden = type === "hidden";
			if (name) fields.push({ name, id, type, hidden });
		});

		// --- Submit Check ---
		let hasSubmitControl = false;
		$inputs.each((_, el) => {
			const $el = $(el);
			const tag = $el.prop("tagName")?.toLowerCase() || "";
			const type = ($el.attr("type") || "").toLowerCase();
			const isSubmit =
				tag === "button"
					? ($el.attr("type") || "submit").toLowerCase() === "submit"
					: type === "submit";
			if (isSubmit) hasSubmitControl = true;
		});
		if (!hasSubmitControl) {
			warnings.push("No submit control found in form.");
		}

		// --- Business Validation for Nominee Form ---
		const requiredNomineeFields = ["firstName", "lastName", "dob", "relation"];
		const nomineeGroups: Record<string, string[]> = {};

		for (const field of fields) {
			const match = field.id?.match(/_(\d+)$/); // e.g. firstName_1, dob_2
			if (match) {
				const index = match[1];
				if (!nomineeGroups[index]) nomineeGroups[index] = [];
				nomineeGroups[index].push(field.name);
			}
		}

		// const groupCount = Object.keys(nomineeGroups).length;
		// if (groupCount === 0) {
		// 	errors.push("No nominee field groups detected (expected *_1, *_2, etc.).");
		// }

		// Object.entries(nomineeGroups).forEach(([idx, names]) => {
		// 	for (const required of requiredNomineeFields) {
		// 		if (!names.includes(required)) {
		// 			errors.push(`Nominee group ${idx} missing field "${required}".`);
		// 		}
		// 	}
		// });

		// Hidden form ID check
		const hasFormId = fields.some(
			(f) => f.name === "formId" && f.hidden && f.id === "formId"
		);
		if (!hasFormId) {
			errors.push('Missing hidden "formId" field.');
		}

		// Suspicious hidden field heuristic
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
			// details: { action, method, fields, hasSubmitControl, nomineeGroups: groupCount },
		};
	} catch (error) {
		logger.error("Error validating form", error);
		return { ok: false, errors: ["Failed to validate form."], warnings: [] };
	}
}
