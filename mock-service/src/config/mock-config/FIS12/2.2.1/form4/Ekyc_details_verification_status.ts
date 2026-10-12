import axios from "axios";
import { validateFormHtml } from "./validate-form";
import { resolveFormActions } from "./resolve-action";
import { MockAction, MockOutput, saveType } from "../../classes/mock-action";
import { SessionData } from "../../session-types";

export class MockEkycDetailsFormClass extends MockAction {
	name(): string {
		return "Ekyc_details_verification_status";
	}
	get description(): string {
		return "Mock for Ekyc_details_verification_status";
	}
	generator(existingPayload: any, sessionData: SessionData): Promise<any> {
		console.log("Ekyc_details_verification_status generator", existingPayload, sessionData);
		return Promise.resolve(existingPayload);
	}
	async validate(
		targetPayload: any,
		sessionData?: SessionData
	): Promise<MockOutput> {
		if (!sessionData) {
			return {
				valid: false,
				message: "Session data is required for validation",
			};
		}
		const formLink = sessionData["Ekyc_details_verification_status"];
		if (!formLink) {
			return { valid: false, message: "Form link not found in session data" };
		}
		const formRaw = await axios.get(formLink);
		const formData = formRaw.data;
		const r1:any = validateFormHtml(formData);
		if (r1.ok === false) {
			return { valid: false, message: r1.errors.join("; ") };
		}
		return { valid: true };
	}

	override async __forceSaveData(
		sessionData: SessionData
	): Promise<Record<string, any>> {
		const formLink = sessionData["Ekyc_details_verification_status"];
		if (!formLink) {
			throw new Error("Form link not found in session data");
		}
		const formRaw = await axios.get(formLink);
		const formData = formRaw.data;
		return {
			...sessionData,
			Ekyc_details_verification_status: resolveFormActions(formLink, formData),
		};
	}

	meetRequirements(sessionData: SessionData): Promise<MockOutput> {
		return Promise.resolve({ valid: true });
	}
	get saveData(): saveType {
		return { "save-data": { Ekyc_details_verification_status: "Ekyc_details_verification_status" } };
	}
	get defaultData(): any {
		return {};
	}
	get inputs(): any {
		return {};
	}
}