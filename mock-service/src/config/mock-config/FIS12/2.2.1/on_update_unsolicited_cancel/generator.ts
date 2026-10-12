import { injectBuyerFinderFees } from "../settlement-utils";
import { randomUUID } from "node:crypto";

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
    // Map order.id from session data (carry-forward from confirm)
    if (sessionData.order) {
      existingPayload.message.order = sessionData?.order || existingPayload.message.order;
    }
    const currentDate = new Date(existingPayload.context.timestamp).toISOString();

    //Extract payment installments payload from order
    existingPayload.message.order.payments[0].status = "PAID",
      existingPayload.message.order.payments[0].params.transaction_id = randomUUID()
    existingPayload.message.order.payments[1].status = "PAID"
    existingPayload.message.order.payments[1].params.transaction_id = randomUUID()
    existingPayload.message.order.updated_at = currentDate;

  }
  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}
