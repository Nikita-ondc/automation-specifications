
import { loadMockSessionData } from "../../../../../services/data-services";
import { calculateSettlementAmount, injectSettlementAmount, injectLoanDetails, injectBuyerFinderFees } from "../settlement-utils";
export async function initDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("sessionData for init", sessionData);

  // Update context timestamp and action
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
    existingPayload.context.action = "init";
  }

  const submission_id = sessionData.kyc_verification_status;

  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Generate new UUID message_id for init (new API call)
  if (existingPayload.context) {
    existingPayload.context.message_id = crypto.randomUUID();
    console.log("Generated new UUID message_id for init:", existingPayload.context.message_id);
  }

  // Update provider.id if available from session data (carry-forward from previous flows)
  if (sessionData.selected_provider?.id && existingPayload.message?.order?.provider) {
    existingPayload.message.order.provider.id = sessionData.selected_provider.id;
    console.log("Updated provider.id:", sessionData.selected_provider.id);
  }

  // Update item.id if available from session data (carry-forward from previous flows)
  existingPayload.message.order.items = sessionData?.selected_items_1;
  const item = existingPayload.message.order.items[0];
  // if (item.xinput?.form) {
  //   // Use form ID from session data or default to FO3 (from on_select_2/on_status_unsolicited)
  //   const formId = sessionData.form_id || "E_sign_verification_status";
  //   item.xinput.form.id = formId;
  //   console.log("Updated form ID:", formId);

  //   const submission_id =
  //     formId === "Ekyc_details_verification_status"
  //       ? sessionData.Ekyc_details_verification_status
  //       : formId === "Emanadate_verification_status"
  //         ? sessionData.Emanadate_verification_status
  //         : sessionData.E_sign_verification_status;

  //   const form_status =
  //     formId === "E_sign_verification_status"
  //       ? sessionData?.form_data?.E_sign_verification_status?.idType
  //       : formId === "Emanadate_verification_status"
  //         ? sessionData?.form_data?.Emanadate_verification_status?.idType
  //         : sessionData?.form_data?.Ekyc_details_verification_status?.idType;

  //   // Set form status
  //   if (item.xinput?.form_response) {
  //     item.xinput.form_response.status = form_status;
  //     if (submission_id) {
  //       item.xinput.form_response.submission_id = submission_id;
  //     }
  //   }
  // }
  const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
  console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
  sessionData.form_data = form_data

  // ── Dynamic Loan Details ──────────────────────────────────────────────────────
  // Must run BEFORE calculateSettlementAmount so net_disbursed_amount is fresh.
  injectLoanDetails(existingPayload, sessionData);
  // ── Dynamic SETTLEMENT_AMOUNT ─────────────────────────────────────────────────
  // injectLoanDetails clears settlement_amount, so it is recalculated here.
  // Calculated once (first init call) and reused by all downstream generators.
  if (!sessionData.settlement_amount) {
    sessionData.settlement_amount = calculateSettlementAmount(sessionData);
    console.log("Calculated and saved settlement_amount:", sessionData.settlement_amount);
  }
  injectSettlementAmount(existingPayload, sessionData);
  // ─────────────────────────────────────────────────────────────────────────────
  // if (sessionData?.flow_id?.includes("Single_Redirection")) {
  delete item?.xinput
  // }
  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}

