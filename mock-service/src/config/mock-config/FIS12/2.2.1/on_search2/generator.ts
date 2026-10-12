import { injectBuyerFinderFees } from "../settlement-utils";
export async function onSearchDefaultGenerator(existingPayload: any, sessionData: any) {
  const categories = [
    {
      "id": "101123",
      "descriptor": {
        "code": "PURCHASE_FINANCE",
        "name": "Purchase Finance"
      }
    },
    {
      "id": "101124",
      "parent_category_id": "101123",
      "descriptor": {
        "code": "AGRI_PURCHASE_FINANCE",
        "name": "Agri Purchase Finance"
      }
    },
    {
      "id": "101125",
      "parent_category_id": "101123",
      "descriptor": {
        "code": "ELECTRONICS_PURCHASE_FINANCE",
        "name": "Electronics Purchase Finance"
      }
    }
  ]
  console.log("existingPayload on search", existingPayload);

  // Set payment_collected_by if present in session data
  if (sessionData.collected_by && existingPayload.message?.catalog?.providers?.[0]?.payments?.[0]) {
    existingPayload.message.catalog.providers[0].payments[0].collected_by = sessionData.collected_by;
  }

  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }
  console.log("sessionData.message_id", sessionData);
  if (sessionData.provider_id) {
    existingPayload.message.catalog.providers[0].id = sessionData.provider_id
  }
  // Update form URLs for items with session data (preserve existing structure)
  if (existingPayload.message?.catalog?.providers?.[0]?.items) {
    console.log("check for form +++")
    // Filter items from on_search session to find the one selected in search2 (matched by item_id)
    const matchedItem = (sessionData.items as any[])?.find(
      (item: any) => item.id === sessionData.item_id
    );

    if (matchedItem) {
      // Match item.category_ids against sessionData.categories and return filtered array
      const matchingCategories = Array.isArray(matchedItem?.category_ids) && Array.isArray(categories)
        ? categories.filter((category: any) =>
          matchedItem.category_ids.includes(category.id)
        )
        : [];
      existingPayload.message.catalog.providers[0].categories = matchingCategories;

      if (matchedItem.xinput) {
        matchedItem.xinput.head = {
          "descriptor": {
            "name": "Personal Information"
          },
          "index": {
            "min": 0,
            "cur": 1,
            "max": 1
          },
          "headings": [
            "MERCHANT_AND_PRDOUCT_DEATILS",
            "PERSONAL_INFORMATION"
          ]
        }
        if (matchedItem.xinput?.form) {
          // Generate dynamic form URL with session data
          const url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/personal_details_information_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
          console.log("Form URL generated:", url);
          matchedItem.xinput.form.id = "personal_details_information_form";
          matchedItem.xinput.form.url = url;
        }
      }

      // Return only the matched item in the items array
      existingPayload.message.catalog.providers[0].items = [matchedItem];
    } else {
      console.log(`[on_search2] No item found matching item_id: ${sessionData.item_id}`);
      existingPayload.message.catalog.providers[0].items = [];
    }
  }

  console.log("session data of on_search", sessionData);
  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
} 