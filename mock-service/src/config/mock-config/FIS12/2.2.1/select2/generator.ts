/**
 * Select Generator for FIS12 Gold Loan
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data (carry-forward mapping)
 * 3. Update form_response with status and submission_id (preserve existing structure)
 */

export async function selectDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("Select generator - Available session data:", {
    selected_provider: !!sessionData.selected_provider,
    selected_items: !!sessionData.selected_items,
    selected_items_1: !!sessionData.selected_items_1,
    items: !!sessionData.items,
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id
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
    existingPayload.context.message_id = crypto.randomUUID();;
  }

  // Update provider.id if available from session data (carry-forward from on_search)
  if (sessionData.selected_provider?.id && existingPayload.message?.order?.provider) {
    existingPayload.message.order.provider.id = sessionData.selected_provider.id;
    console.log("Updated provider.id:", sessionData.selected_provider.id);
  }

  // Update item.id if available from session data (carry-forward from on_search)
  if (sessionData.items && Array.isArray(sessionData.items) && sessionData.items.length > 0) {
    if (existingPayload.message?.order?.items) {
      existingPayload.message.order.items = sessionData.selected_items_1;
    }
  }

  // Update form_response with status and submission_id (preserve existing structure)
  if (existingPayload.message?.order?.items?.[0]?.xinput?.form_response) {
    existingPayload.message.order.items[0].xinput.form_response.status = "SUCCESS";
    existingPayload.message.order.items[0].xinput.form.id = "Ekyc_details_verification_status";
    existingPayload.message.order.items[0].xinput.form_response.submission_id = sessionData.Ekyc_details_verification_status;
    console.log("Updated form_response with status and submission_id");
  }

  return existingPayload;
} 