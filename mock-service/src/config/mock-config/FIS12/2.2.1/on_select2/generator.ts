import { loadMockSessionData } from "../../../../../services/data-services";
import { injectLoanDetails } from "../settlement-utils";

export async function onSelectDefaultGenerator(
  existingPayload: any,
  sessionData: any
) {
  console.log("On Select generator - Available session data:", {
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id,
    quote: !!sessionData.quote,
    items: !!sessionData.items,
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
  if (
    sessionData.selected_provider?.id &&
    existingPayload.message?.order?.provider
  ) {
    existingPayload.message.order.provider.id =
      sessionData.selected_provider.id;
    console.log("Updated provider.id:", sessionData.selected_provider.id);
  }

  // Update item.id if available from session data (carry-forward from select)
  if (
    sessionData.items &&
    Array.isArray(sessionData.items) &&
    sessionData.items.length > 0
  ) {
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
          tags: [...selectedItem.tags, {
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
  const formId = sessionData.form_id
  // redirection to be done
  const submission_id =
    formId === "Ekyc_details_verification_status"
      ? sessionData.Ekyc_details_verification_status : formId === "Emanadate_verification_status" ? sessionData.Emanadate_verification_status
        : sessionData.E_sign_verification_status;

  const form_status =
    formId === "E_sign_verification_status"
      ? sessionData?.form_data?.E_sign_verification_status?.idType
      : formId === "Emanadate_verification_status" ? sessionData?.form_data?.Emanadate_verification_status?.idType
        : sessionData?.form_data?.Ekyc_details_verification_status?.idType;
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
    existingPayload.message.order.items[0].xinput.form_response.status =
      form_status;
    existingPayload.message.order.items[0].xinput.form.id = sessionData.form_id;
    existingPayload.message.order.items[0].xinput.form_response.submission_id =
      submission_id
    console.log("Updated form_response with status and submission_id");
  }

  // ── Dynamic Loan Details using user-entered down payment ──────────────────────
  // form_data.down_payment_form.updateDownpayment is the user-entered value.
  // This recalculates: principal, EMI, total interest, net_disbursed_amount
  // and injects them into quote.breakup, item INFO tags, and PRE_ORDER payment.
  const downPaymentEntered = sessionData?.form_data?.down_payment_form?.updateDownpayment;
  console.log("[on_select2] Down payment from form:", downPaymentEntered);
  const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
  console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
  sessionData.form_data = form_data
  injectLoanDetails(existingPayload, sessionData);
  // ────────────────────────────────────────────────────────────────────────

  return existingPayload;
}
