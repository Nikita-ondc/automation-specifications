
import { injectSettlementAmount, injectBuyerFinderFees } from "../settlement-utils";
export async function onCancelDefaultGenerator(existingPayload: any, sessionData: any) {
  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  // Update transaction_id from session data
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Update message_id from session data
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
  }

  // Load order from session data
  if (existingPayload.message) {
    const order = sessionData.order || existingPayload.message.order;
    order.status = "CANCELLED"
    existingPayload.message.order = order

  }

  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload
}
