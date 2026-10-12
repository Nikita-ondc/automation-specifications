export async function cancelGenerator(existingPayload: any, sessionData: any) {
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  if (existingPayload.context?.transaction_id) {
    existingPayload.message = existingPayload.message || {};
    // existingPayload.message.ref_id = existingPayload.context.transaction_id;
    existingPayload.message.order_id = sessionData?.order.id || existingPayload.message.order_id

    delete existingPayload.message.transaction_id;
  }


  return existingPayload;
}
