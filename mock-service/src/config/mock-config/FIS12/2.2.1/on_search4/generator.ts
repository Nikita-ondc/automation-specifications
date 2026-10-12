import { injectBuyerFinderFees } from "../settlement-utils";
export async function onSearchDefaultGenerator(existingPayload: any, sessionData: any) {

  // Set payment_collected_by if present in session data
  if (sessionData.collected_by && existingPayload.message?.catalog?.providers?.[0]?.payments?.[0]) {
    existingPayload.message.catalog.providers[0].payments[0].collected_by = sessionData.collected_by;
  }

  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }
  console.log("sessionData for aggregator search", JSON.stringify(sessionData));
  console.log("sessionData for aggregator search form_data", JSON.stringify(sessionData.form_data));

  existingPayload.message.catalog.providers[0].categories = sessionData.categories;

  // Update form URLs for items with session data (preserve existing structure)
  if (sessionData.item_id) {
    existingPayload.message.catalog.providers[0].items[0].id = sessionData.item_id
    existingPayload.message.catalog.providers[0].items[1].parent_item_id = sessionData.item_id
    existingPayload.message.catalog.providers[0].items[2].parent_item_id = sessionData.item_id
  }
  if (existingPayload.message?.catalog?.providers?.[0]?.items) {

    existingPayload.message.catalog.providers[0].items = existingPayload.message.catalog.providers[0].items.map((item: any) => {
      item.category_ids = sessionData.item.category_ids

      if (item.xinput?.form) {
        item.xinput.form.id = "personal_details_information_form";
        item.xinput.form_response.status = "SUCCESS";
        item.xinput.form_response.submission_id = sessionData.personal_details_information_form;
        console.log("Updated form_response with status and submission_id");
      }
      return item;
    });
  }

  console.log("session data of on_search", sessionData);
  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
} 