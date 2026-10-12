/**
 * Select Generator for FIS12 Gold Loan
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data (carry-forward mapping)
 * 3. Update form_response with status and submission_id (preserve existing structure)
 */

export async function selectDefaultGenerator(existingPayload: any, sessionData: any) {

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
  const userInputs = sessionData.user_inputs;

  if (userInputs.order) {
    existingPayload.message.order = userInputs.order
  }

  return existingPayload;
} 