export async function updateDefaultGenerator(existingPayload: any, sessionData: any) {

  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  // Update transaction_id from session data
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Load order_id into order.id (structure uses order.id)
  if (sessionData.order_id && existingPayload.message) {
    existingPayload.message.order = existingPayload.message.order || {};
    existingPayload.message.order.id = sessionData.order_id;
  }

  // Load update_target from session data
  if (sessionData.update_target && existingPayload.message) {
    existingPayload.message.update_target = sessionData.update_target;
  }

  // Normalize message.update_target to string and map payment label/amount
  if (existingPayload.message) {
    // Ensure update_target is a simple string 'payments'
    if (!existingPayload.message.update_target)
      existingPayload.message.update_target = 'payments';
  }
  return existingPayload;
} 