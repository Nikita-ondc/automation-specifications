import { readFileSync } from "fs";
import logger from "@ondc/automation-logger";
import path from "path";
import yaml from "js-yaml";
import { SessionData as MockSessionData } from "./FIS12/session-types";
import { createMockResponse as createFIS12MockResponse } from "./FIS12/version-factory";
import { getMockAction as getFIS12MockAction } from "./FIS12/action-factory";

export { MockSessionData };

// Default to FIS13 for testing
const defaultDomain = process.env.DOMAIN || "ONDC:FIS13";

function getActionConfig(domain: string = defaultDomain) {
	let factoryPath: string;
	switch (domain) {
		case "ONDC:FIS12":
			factoryPath = path.join(__dirname, "./FIS12/factory.yaml");
			break;
		case "ONDC:FIS13":
		default:
			factoryPath = path.join(__dirname, "./FIS13/factory.yaml");
			break;
	}
	return yaml.load(readFileSync(factoryPath, "utf8")) as any;
}

export const actionConfig = getActionConfig(defaultDomain);

export const defaultSessionData = (domain: string = defaultDomain) => {
	let sessionDataPath: string;
	switch (domain) {
		case "ONDC:FIS13":
			sessionDataPath = path.join(__dirname, `./FIS13/session-data.yaml`);
			break;
		case "ONDC:FIS14":
			sessionDataPath = path.join(__dirname, `./FIS14/session-data.yaml`);
			break;
		case "ONDC:FIS10":
			sessionDataPath = path.join(__dirname, `./FIS10/session-data.yaml`);
			break;
		case "ONDC:FIS12":
			sessionDataPath = path.join(__dirname, `./FIS12/session-data.yaml`);
			break;
		case "ONDC:TRV14":
			sessionDataPath = path.join(__dirname, `./TRV14/session-data.yaml`);
			break;
		default:
			sessionDataPath = path.join(__dirname, `./${domain}/session-data.yaml`);
			break;
	}

	return yaml.load(readFileSync(sessionDataPath, "utf8")) as { session_data: MockSessionData };
};

export async function generateMockResponse(
	session_id: string,
	sessionData: any,
	action_id: string,
	input?: any,
	domain: string = defaultDomain
) {
	try {
		console.log("generateMockResponse - action_id:", action_id);
		console.log("generateMockResponse - domain:", domain);
		console.log("generateMockResponse - defaultDomain:", defaultDomain);
		console.log("generateMockResponse - sessionData", sessionData);

		let response = await createFIS12MockResponse(
			session_id,
			sessionData,
			action_id,
			input
		);
		response.context.timestamp = new Date().toISOString();
		return response;
	} catch (e) {
		logger.error("Error in generating mock response", e);
		throw e;
	}
}

export function getMockActionObject(actionId: string, domain: string = defaultDomain) {
	return getFIS12MockAction(actionId);
}

export function getActionData(code: number, domain: string = defaultDomain) {
	const config = getActionConfig(domain);
	if (!config) {
		throw new Error(`Domain ${domain} not supported`);
	}

	const actionData = config.codes.find(
		(action: any) => action.code === code
	);
	if (actionData) {
		return actionData;
	}
	throw new Error(`Action code ${code} not found for domain ${domain}`);
}

export function getSaveDataContent(version: string, action: string, domain: string = defaultDomain) {
	let actionFolderPath: string;

	switch (domain) {
		case "ONDC:FIS14":
		case "ONDC:FIS13":
		case "ONDC:TRV14":
		case "ONDC:FIS10":
		case "ONDC:FIS12":
			actionFolderPath = path.resolve(
				__dirname,
				`./${domain}/${version}/${action}`
			);
			break;
		default:
			actionFolderPath = path.resolve(
				__dirname,
				`./${domain}/${version}/${action}`
			);
			break;
	}

	const saveDataFilePath = path.join(actionFolderPath, "save-data.yaml");
	const fileContent = readFileSync(saveDataFilePath, "utf8");
	const cont = yaml.load(fileContent) as any;
	console.log(cont);
	return cont;
}

export function getUiMetaKeys(): (keyof MockSessionData)[] {
	return ["down_payment_form", "personal_details_information_form", "product_details_form", "individual_information_form",
		"family_information_form", "Ekyc_details_verification_status", "Proposer_Details_form", "nominee_details_form", "consumer_information_form",
		"vehicle_details_form", "vehicle_nominee_details_form", "pan_details_form", "personal_details_form", "verification_status",
		"kyc_verification_status", "Emanadate_verification_status", "E_sign_verification_status", "E_sign_verification_status", "payment_url_form"];
}