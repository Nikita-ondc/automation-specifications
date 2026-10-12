import * as cheerio from "cheerio";
import logger from "@ondc/automation-logger";

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

export function validateFormHtml(html: string): ValidationResult {
  try {
    const $ = cheerio.load(html);
    const errors: string[] = [];
    const warnings: string[] = [];

    // --- Security checks ---
    const forbiddenTags = ["iframe", "object", "embed", "script"];
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
              `Inline event handler "${attr}" found on <${$el.prop("tagName")?.toLowerCase()}>`
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
            `javascript: URL found in ${attr} on <${$el.prop("tagName")?.toLowerCase()}>`
          );
        }
      }
    });

    // --- Form existence check ---
    const $forms = $("form");
    if ($forms.length === 0) {
      errors.push("No <form> element found.");
      return { ok: false, errors, warnings };
    }
    if ($forms.length > 1) {
      warnings.push("Multiple <form> elements found (validating first one).");
    }

    const $form = $forms.first();
    const action = ($form.attr("action") || "").trim();
    const methodRaw = ($form.attr("method") || "GET").toUpperCase();
    const method = methodRaw === "POST" ? "POST" : "GET";

    // --- Field extraction ---
    const $inputs = $form.find("input, select, textarea, button");
    const fields: FieldInfo[] = [];

    $inputs.each((_, el) => {
      const $el = $(el);
      const tag = $el.prop("tagName")?.toLowerCase() || "";
      const type = ($el.attr("type") || (tag === "textarea" ? "textarea" : tag)).toLowerCase();
      const name = $el.attr("name") || "";
      const id = $el.attr("id") || undefined;
      const hidden = type === "hidden";
      if (name || id) fields.push({ name, id, type, hidden });
    });

    // --- Label mapping ---
    const labelMap: Record<string, string> = {};
    $("label[for]").each((_, el) => {
      const $el = $(el);
      const forAttr = $el.attr("for");
      const labelText = $el.text().trim().toLowerCase();
      if (forAttr) labelMap[forAttr.toLowerCase()] = labelText;
    });

    // --- Combine searchable identifiers ---
    const searchable: string[] = [];
    fields.forEach((f) => {
      const combined = (f.name + " " + (f.id ?? "")).toLowerCase();
      searchable.push(combined);
      if (f.id && labelMap[f.id.toLowerCase()]) {
        searchable.push(labelMap[f.id.toLowerCase()]);
      }
    });

    // --- Dynamic mustHave list (from input names) ---
    const mustHave = fields
      .filter((f) => !f.hidden && f.name && f.type !== "submit" && f.type !== "button")
      .map((f) => f.name.toLowerCase());

    const hasSubmitControl = fields.some(
      (f) => f.type === "submit" || f.type === "button"
    );

    // --- Validation ---
    for (const requiredName of mustHave) {
      const found = searchable.some((text) => text.includes(requiredName));
      if (!found) errors.push(`Field "${requiredName}" not found in form.`);
    }

    // Hidden formId check
    const hasFormId = searchable.some((text) => text.includes("formid"));
    if (!hasFormId) warnings.push('Hidden "formId" field not found.');

    if (!hasSubmitControl) warnings.push("No visible submit button found.");

    const ok = errors.length === 0;

    return {
      ok,
      errors,
      warnings,
      details: { action, method, fields, hasSubmitControl },
    };
  } catch (err) {
    logger.error("Error validating form", err);
    return { ok: false, errors: ["failed to validate form"], warnings: [] };
  }
}
