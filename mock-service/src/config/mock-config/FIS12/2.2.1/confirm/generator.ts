
import { loadMockSessionData } from "../../../../../services/data-services";
import { injectLoanDetails, injectSettlementAmount, injectBuyerFinderFees } from "../settlement-utils";
export async function confirmDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("sessionData for confirm", sessionData);

  // Update context timestamp and action
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
    existingPayload.context.action = "confirm";
  }

  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Generate new UUID message_id for confirm (new API call)
  if (existingPayload.context) {
    existingPayload.context.message_id = crypto.randomUUID();
    console.log("Generated new UUID message_id for confirm:", existingPayload.context.message_id);
  }

  // Update provider.id if available from session data (carry-forward from previous flows)
  if (sessionData.selected_provider?.id && existingPayload.message?.order?.provider) {
    existingPayload.message.order.provider.id = sessionData.selected_provider.id;
    console.log("Updated provider.id:", sessionData.selected_provider.id);
  }

  // Update item.id if available from session data (carry-forward from previous flows)
  const selectedItem = sessionData.selected_items_1[0] || (Array.isArray(sessionData.items) ? (sessionData.items?.[1] ?? sessionData.items?.[0]) : undefined);
  if (selectedItem?.id && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].id = selectedItem.id;
    existingPayload.message.order.items[0].parent_item_id = selectedItem.parent_item_id;

    console.log("Updated item.id:", selectedItem.id);
  }
  const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
  console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
  sessionData.form_data = form_data
  injectLoanDetails(existingPayload, sessionData);
  // ── Dynamic SETTLEMENT_AMOUNT: inject pre-calculated value from session ──
  injectSettlementAmount(existingPayload, sessionData);
  // ─────────────────────────────────────────────────────────────────────────

  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}
