
import { loadMockSessionData } from "../../../../../services/data-services";
import { injectLoanDetails } from "../settlement-utils";

export async function onSelectDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("On Select generator - Available session data:", {
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id,
    quote: !!sessionData.quote,
    items: !!sessionData.items
  });

  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }

  // Update provider.id if available from session data (carry-forward from select)
  if (sessionData.selected_provider?.id && existingPayload.message?.order?.provider) {
    existingPayload.message.order.provider.id = sessionData.selected_provider.id;
    console.log("Updated provider.id:", sessionData.selected_provider.id);
  }

  // Update item.id if available from session data (carry-forward from select)
  if (sessionData.items && Array.isArray(sessionData.items) && sessionData.items.length > 0) {
    const item = sessionData.selected_items_1;

    const itemIds = new Set(item.map((i: any) => i.id));

    const selectedItems = sessionData.items.filter((i: any) =>
      itemIds.has(i.id)
    );

    existingPayload.message.order.items = existingPayload.message.order.items.map(
      (orderItem: any, index: number) => {
        const selectedItem = selectedItems[index];

        if (!selectedItem) return orderItem;

        return {
          ...orderItem,
          id: selectedItem.id,
          parent_item_id: selectedItem.parent_item_id,
          category_ids: selectedItem.category_ids,
          price: selectedItem.price,
          tags: [...selectedItem.tags,

          {
            "display": true,
            "descriptor": {
              "name": "Checklists",
              "code": "CHECKLISTS"
            },
            "list":
              sessionData?.flow_id?.includes("Single_Redirection") ?
                [
                  {
                    "descriptor": {
                      "name": "Set Loan Amount",
                      "code": "SET_DOWN_PAYMENT"
                    },
                    "value": "PENDING"
                  },
                  {
                    "descriptor": {
                      "name": "KYC, enach, esign",
                      "code": "KYC_ENACH_ESIGN"
                    },
                    "value": "PENDING"
                  }
                ] :
                [
                  {
                    "descriptor": {
                      "name": "Set Loan Amount",
                      "code": "SET_DOWN_PAYMENT"
                    },
                    "value": "PENDING"
                  },
                  {
                    "descriptor": {
                      "name": "KYC",
                      "code": "KYC"
                    },
                    "value": "PENDING"
                  },
                  {
                    "descriptor": {
                      "name": "Emandate",
                      "code": "EMANDATE"
                    },
                    "value": "PENDING"
                  },
                  {
                    "descriptor": {
                      "name": "Esign",
                      "code": "ESIGN"
                    },
                    "value": "PENDING"
                  }
                ]
          }]
        };
      }
    );
  }
  if (sessionData?.flow_id?.includes("Single_Redirection") && existingPayload.message?.order?.items?.[0]?.xinput) {
    // existingPayload.message.order.items[0].xinput.head.descriptor.name = ""
    existingPayload.message.order.items[0].xinput.head.headings[1] = "KYC_ENACH_ESIGN"
  }
  // redirection to be done
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    const url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/down_payment_form?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
    existingPayload.message.order.items[0].xinput.form.id = "down_payment_form";
    existingPayload.message.order.items[0].xinput.form.url = url;
    console.log("Updated xinput form to down_payment form");
  }

  const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
  console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
  sessionData.form_data = form_data
  // ── Dynamic Loan Details (down payment, EMI, interest, quote breakup) ────────
  // This runs even if down_payment is 0 so quote/items tags stay consistent.
  injectLoanDetails(existingPayload, sessionData);
  // ────────────────────────────────────────────────────────────────────────

  return existingPayload;
} 