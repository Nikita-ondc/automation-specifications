import { SessionData } from "../../session-types";

export async function searchDefaultGenerator(
  existingPayload: any,
  sessionData: SessionData
) {
  // Remove BPP context fields (not needed in search)
  delete existingPayload.context.bpp_uri;
  delete existingPayload.context.bpp_id;

  // Set start and end date dynamically
  // const now = new Date();
  // const end = new Date(now);
  // end.setDate(now.getDate() + 2);
  // if (
  // 	existingPayload.message?.intent?.fulfillment?.stops?.[0]?.time?.range
  // ) {
  // 	existingPayload.message.intent.fulfillment.stops[0].time.range.start = now.toISOString();
  // 	existingPayload.message.intent.fulfillment.stops[0].time.range.end = end.toISOString();
  // }

  // Set city code from user inputs if available
  if (sessionData.user_inputs?.city_code) {
    existingPayload.context.location.city.code =
      sessionData.user_inputs.city_code;
  }
  const userInputs = sessionData.user_inputs
  // Update form_response with status and submission_id (preserve existing structure)
  if (
    userInputs
  ) {
    existingPayload.message.intent.provider = userInputs?.provider
    existingPayload.message.intent.provider.items[0].xinput.form.id =
      "product_details_form";
    existingPayload.message.intent.provider.items[0].xinput.form_response.status =
      "SUCCESS";
    existingPayload.message.intent.provider.items[0].xinput.form_response.submission_id =
      sessionData.product_details_form;
    console.log("Updated form_response with status and submission_id");
  }

  console.log(
    "sessionData.message_id in search generator",
    sessionData.message_id
  );

  return existingPayload;
}
