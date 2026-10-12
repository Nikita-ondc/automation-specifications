import { injectSettlementAmount, injectBuyerFinderFees } from "../settlement-utils";
export async function onStatusUnsolicitedGenerator(existingPayload: any, sessionData: any) {
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  console.log("sessionData for on_status_unsolicited", sessionData);

  const submission_id = sessionData?.form_data?.E_sign_verification_status?.form_submission_id;
  console.log("form_data ------->", sessionData?.form_data?.E_sign_verification_status);

  const form_status = sessionData?.form_data?.E_sign_verification_status?.idType;

  // Update transaction_id and message_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }

  // Update order ID from session data if available
  if (sessionData.order_id) {
    existingPayload.message = existingPayload.message || {};
    existingPayload.message.order = existingPayload.message.order || {};
    existingPayload.message.order.id = sessionData.order_id;
  }

  // Update provider information from session data (carry-forward from on_select_2)
  if (sessionData.provider_id) {
    existingPayload.message = existingPayload.message || {};
    existingPayload.message.order = existingPayload.message.order || {};
    existingPayload.message.order.provider = existingPayload.message.order.provider || {};
    existingPayload.message.order.provider.id = sessionData.provider_id;
  }

  // Update item.id from session data (carry-forward from on_select_2)
  const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? (sessionData.items?.[1] ?? sessionData.items?.[0]) : undefined);

  if (selectedItem?.id && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].id = sessionData.selected_items_id;
    existingPayload.message.order.items[0].parent_item_id = selectedItem.parent_item_id

    console.log("Updated item.id:", selectedItem.id);
    console.log('sessionData>>>', sessionData)
  }


  // Update form ID to FO3 (carry-forward from on_select_2)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form) {
    existingPayload.message.order.items[0].xinput.form.id = "FO3";
    console.log("Updated form ID to FO3");
  }

  // Update form response status - on_status_unsolicited uses APPROVED status
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
    const formResponse = existingPayload.message.order.items[0].xinput.form_response;
    // if (sessionData.form_status) {
    //   formResponse.status = sessionData.form_status;
    // } else {
    //   formResponse.status = "APPROVED";
    // }

    // Update submission ID if provided
    if (sessionData.submission_id) {
      formResponse.submission_id = sessionData.submission_id;
    }
  }

  // Update customer name in fulfillments if available from session data
  if (sessionData.customer_name && existingPayload.message?.order?.fulfillments?.[0]?.customer?.person) {
    existingPayload.message.order.fulfillments[0].customer.person.name = sessionData.customer_name;
    console.log("Updated customer name:", sessionData.customer_name);
  }

  // Note: Gold loans don't have payments in status responses
  // Payments are handled separately during loan servicing (EMIs, foreclosure, etc.)

  // Update quote information if provided
  if (sessionData.quote_amount && existingPayload.message?.order?.quote) {
    existingPayload.message.order.quote.price.value = sessionData.quote_amount;
  }

  // Update loan amount in items if provided
  if (sessionData.loan_amount && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].price.value = sessionData.loan_amount;
  }

  if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
    existingPayload.message.order.items[0].xinput.form_response.submission_id = submission_id;
  }
  const currentDate = new Date(existingPayload.context.timestamp).toISOString();

  existingPayload.message.order.created_at = sessionData.created_at;
  existingPayload.message.order.updated_at = currentDate;

  // ── Dynamic SETTLEMENT_AMOUNT: inject pre-calculated value from session ──
  injectSettlementAmount(existingPayload, sessionData);
  // ─────────────────────────────────────────────────────────────────────────

  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}
