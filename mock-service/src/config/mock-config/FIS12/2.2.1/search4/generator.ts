import { SessionData } from "../../session-types";

export async function searchDefaultGenerator(
	existingPayload: any,
	sessionData: SessionData
) {
	console.log("sessionData in search4", JSON.stringify(sessionData))
	// Remove BPP context fields (not needed in search)
	delete existingPayload.context.bpp_uri;
	delete existingPayload.context.bpp_id;

	// Set start and end date dynamically
	const now = new Date();
	const end = new Date(now);
	end.setDate(now.getDate() + 2);
	if (
		existingPayload.message?.intent?.fulfillment?.stops?.[0]?.time?.range
	) {
		existingPayload.message.intent.fulfillment.stops[0].time.range.start = now.toISOString();
		existingPayload.message.intent.fulfillment.stops[0].time.range.end = end.toISOString();
	}

	// Set city code from user inputs if available
	if (sessionData.user_inputs?.city_code) {
		existingPayload.context.location.city.code = sessionData.user_inputs.city_code;
	}
	// Update form_response with status and submission_id (preserve existing structure)
	if (existingPayload.message?.intent?.provider?.items?.[0]?.xinput?.form_response) {
		existingPayload.message.intent.provider = sessionData?.provider
		existingPayload.message.intent.provider.items[0].xinput.form.id = "personal_details_information_form";
		existingPayload.message.intent.provider.items[0].xinput.form_response.status = "SUCCESS";
		existingPayload.message.intent.provider.items[0].xinput.form_response.submission_id = sessionData.personal_details_information_form;
	}
	return existingPayload;
} 