
import { loadMockSessionData } from "../../../../../services/data-services";
import { injectSettlementAmount, injectLoanDetails, applyForeclosureInstallmentStatuses, injectBuyerFinderFees } from "../settlement-utils";
export async function onUpdateUnsolicitedDefaultGenerator(existingPayload: any, sessionData: any) {
  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  // Update transaction_id from session data
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Generate new message_id for unsolicited update
  if (existingPayload.context) {
    existingPayload.context.message_id = generateUUID();
  }

  // Helper function to generate UUID v4
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Load order from session data
  if (existingPayload.message) {
    const order = existingPayload.message.order || (existingPayload.message.order = {});

    // Map order.id from session data (carry-forward from confirm)
    if (sessionData.order_id) {
      order.id = sessionData.order_id;
    }

    // Map provider.id from session data (carry-forward from confirm)
    if (sessionData.selected_provider?.id && order.provider) {
      order.provider.id = sessionData.selected_provider.id;
    }

    // Map item.id from session data (carry-forward from confirm)
    const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? (sessionData.items?.[1] ?? sessionData.items?.[0]) : undefined);
    // if (selectedItem?.id && order.items?.[0]) {
    //   order.items[0].id = selectedItem.id;
    // }

    if (selectedItem?.id && existingPayload.message?.order?.items?.[0]) {
      existingPayload.message.order.items[0].id = sessionData.selected_items_id;
      existingPayload.message.order.items[0].parent_item_id = selectedItem.parent_item_id
      existingPayload.message.order.items[0].category_ids = selectedItem.category_ids
      existingPayload.message.order.items[0].price = selectedItem.price,
        existingPayload.message.order.items[0].tags =
        [
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
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "KYC, enach, esign",
                      "code": "KYC_ENACH_ESIGN"
                    },
                    "value": "COMPLETED"
                  }
                ] :
                [
                  {
                    "descriptor": {
                      "name": "Set Loan Amount",
                      "code": "SET_DOWN_PAYMENT"
                    },
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "KYC",
                      "code": "KYC"
                    },
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "Emandate",
                      "code": "EMANDATE"
                    },
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "Esign",
                      "code": "ESIGN"
                    },
                    "value": "COMPLETED"
                  }
                ]
          }]
    }

    // Map quote.id from session data (carry-forward from confirm)
    if (sessionData.quote_id && order.quote) {
      order.quote.id = sessionData.quote_id;
    }
  }

  const currentDate = new Date(existingPayload.context.timestamp).toISOString();

  existingPayload.message.order.created_at = sessionData.created_at;
  existingPayload.message.order.updated_at = currentDate;
  const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
  console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
  sessionData.form_data = form_data
  // ── Dynamic Loan Details: quote breakup + item tags ───────────────────────────
  injectLoanDetails(existingPayload, sessionData);
  // ── Build payments[0] (PID-8000) + installments in one step ────────────────
  // Unsolicited: PID-8000 = PAID + transaction_id + timestamp
  //              ALL remaining installments = DEFERRED
  //              Past installments preserved PAID from sessionData.payments
  applyForeclosureInstallmentStatuses(existingPayload, sessionData, true);
  // ── Dynamic SETTLEMENT_AMOUNT ──────────────────────────────────────────────
  injectSettlementAmount(existingPayload, sessionData);

  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}
