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

export async function validateFormHtml(html: string): Promise<ValidationResult> {
  const $ = cheerio.load(html);
  const errors: string[] = [];
  const warnings: string[] = [];

  const form = $("form").first();

  if (!form.length) {
    errors.push(" No <form> element found in the provided HTML.");
    return { ok: false, errors, warnings };
  }

  const action = form.attr("action");
  const method = (form.attr("method")?.toUpperCase() || "GET") as "GET" | "POST";

  if (!action) {
    warnings.push(" The <form> element does not have an 'action' attribute.");
  }

  const inputs = form.find("input, select, textarea");
  const fields: FieldInfo[] = [];
  const labelMap = new Map<string, string>();

  // Collect all label references
  $("label").each((_, el) => {
    const idRef = $(el).attr("for");
    if (idRef) {
      labelMap.set(idRef, $(el).text().trim());
    }
  });

  const nameSet = new Set<string>();
  const idSet = new Set<string>();

  inputs.each((_, el) => {
    const tag = el.tagName.toLowerCase();
    const type = $(el).attr("type") || (tag === "select" ? "select" : "text");
    const name = $(el).attr("name");
    const id = $(el).attr("id");
    const hidden = type === "hidden";
    

    if (!name && type !== "submit") {
      errors.push(` Field of type <${tag}> is missing a 'name' attribute.`);
    } else {
      if (name) 
      if (nameSet.has(name)) {
        warnings.push(` Duplicate field name detected: "${name}".`);
      
      nameSet.add(name);}
    }

    if (!id) {
      warnings.push(` Field "${name || "(unnamed)"}" is missing an 'id' attribute.`);
    } else {
      if (idSet.has(id)) {
        warnings.push(` Duplicate field id detected: "${id}".`);
      }
      idSet.add(id);

      // check label linkage
      if (!labelMap.has(id)) {
        warnings.push(` Field id "${id}" has no matching <label for="${id}">.`);
      }
    }

    fields.push({
      name: name || "",
      id,
      type,
      hidden,
    });
  });

  // Check for submit control
  const hasSubmitControl = form.find('input[type="submit"], button[type="submit"]').length > 0;
  if (!hasSubmitControl) {
    warnings.push(" No submit control found (missing <input type='submit'> or <button type='submit'>).");
  }

  // Special logic for this buyer-details form
  if (action?.includes("buyer-details")) {
    const requiredFields = ["firstName", "lastName", "dob", "gender", "email", "phone"];
    requiredFields.forEach((field) => {
      if (!fields.find((f) => f.name === field)) {
        errors.push(` Missing mandatory field: '${field}'`);
      }
    });
  }

  // Basic email/phone pattern warnings if field types not used correctly
  const emailField = fields.find((f) => f.name === "email");
  if (emailField && emailField.type !== "email") {
    warnings.push("'email' field should ideally use type='email'.");
  }

  const phoneField = fields.find((f) => f.name === "phone");
  if (phoneField && phoneField.type !== "tel") {
    warnings.push(" 'phone' field should ideally use type='tel'.");
  }

  const ok = errors.length === 0;
  const result: ValidationResult = {
    ok,
    errors,
    warnings,
    details: {
      action: action || "",
      method,
      fields,
      hasSubmitControl,
    },
  };

  if (!ok) {
    logger.error("Form validation failed", { errors });
  } else {
    logger.info("Form validation successful", { action, fieldCount: fields.length });
  }

  return result;
}


