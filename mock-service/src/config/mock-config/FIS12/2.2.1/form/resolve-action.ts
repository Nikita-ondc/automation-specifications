import * as cheerio from "cheerio";
import logger from "@ondc/automation-logger";
/**
 * Resolves <form action> URLs in an HTML string against a base URL.
 * - If a form's action is an absolute http(s) URL (or protocol-relative //...), it is left as-is.
 * - Otherwise, it is resolved with new URL(action, baseUrl).
 * - If action is empty, "#", or "javascript:*", it becomes baseUrl (no fragment).
 *
 * Works in Node.js environments using Cheerio for HTML parsing.
 */
export function resolveFormActions(baseUrl: string, html: string): string {
	logger.info("Resolving form actions", { baseUrl, html });
	// Validate baseUrl
	let base: URL;
	try {
		base = new URL(baseUrl);
		if (!/^https?:$/i.test(base.protocol)) {
			throw new Error("Base URL must be http(s)");
		}
	} catch {
		throw new Error(`Invalid baseUrl: ${baseUrl}`);
	}

	const $ = cheerio.load(html);

	const isAbsoluteHttp = (u: string) => /^https?:\/\//i.test(u);
	const isProtocolRelative = (u: string) => /^\/\//.test(u);
	const isBad = (u: string) =>
		/^\s*javascript\s*:/i.test(u) || u.trim() === "" || u.trim() === "#";

	// Update every <form> that has a non-proper action
	$("form").each((_, element) => {
		const $form = $(element);
		const raw = ($form.attr("action") || "").trim();

		// already proper? leave it
		if (isAbsoluteHttp(raw) || isProtocolRelative(raw)) return;

		// bad or relative: resolve against base
		let resolved: string;
		if (isBad(raw)) {
			// Use base URL without any fragment
			const cleanBase = new URL(base.toString());
			cleanBase.hash = "";
			resolved = cleanBase.toString();
		} else {
			resolved = new URL(raw, base).toString();
		}
		$form.attr("action", resolved);
	});

	logger.info("Resolved form actions", { html: $.html() });

	// Return the modified HTML
	return $.html();
}