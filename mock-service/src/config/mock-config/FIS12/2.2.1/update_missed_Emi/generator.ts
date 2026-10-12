/**
 * Update Generator for FIS12 Gold Loans
 * 
 * Logic:
 * 1. Update context with current timestamp
 * 2. Update transaction_id and message_id from session data
 * 3. Load order_id and update_target from session data
 * 4. Handle Gold Loan specific update scenarios (foreclosure, missed EMI, part payment)
 */

export async function updateDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("Gold Loan Update generator - Available session data:", {
    transaction_id: sessionData.transaction_id,
    message_id: sessionData.message_id,
    order_id: sessionData.order_id,
    update_target: sessionData.update_target,
    flow_id: sessionData.flow_id,
    user_inputs: sessionData.user_inputs
  });

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
    if (!existingPayload.message.update_target) existingPayload.message.update_target = 'payments';

    existingPayload.message.order = existingPayload.message.order || {};
    existingPayload.message.order.payments = existingPayload.message.order.payments || [{}];

    const payment = existingPayload.message.order.payments[0];
    payment.time = payment.time || {};

    // Choose label based on flow_id, user_inputs, or saved update_label
    let labelFromSession = sessionData.update_label;
    
    // Map flow IDs to specific payment labels
    if (sessionData.flow_id) {
      if (sessionData.flow_id.includes('Missed_EMI')) {
        labelFromSession = 'MISSED_EMI_PAYMENT';
      } else if (sessionData.flow_id.includes('Foreclosure')) {
        labelFromSession = 'FORECLOSURE';
      } else if (sessionData.flow_id.includes('Part_Payment') || sessionData.flow_id.includes('Pre_Part')) {
        labelFromSession = 'PRE_PART_PAYMENT';
      }
    }
    
    // Fallback to user_inputs if no flow-based mapping found
    if (!labelFromSession) {
      labelFromSession = sessionData.user_inputs?.foreclosure_amount ? 'FORECLOSURE'
        : sessionData.user_inputs?.missed_emi_amount ? 'MISSED_EMI_PAYMENT'
        : sessionData.user_inputs?.part_payment_amount ? 'PRE_PART_PAYMENT'
        : payment.time.label;
    }
    
    if (labelFromSession) {
      payment.time.label = labelFromSession;
      console.log(`Payment label set to: ${labelFromSession} based on flow_id: ${sessionData.flow_id}`);
    }

    // Amount mapping for part payment (optional for other labels)
    if (sessionData.user_inputs?.part_payment_amount) {
      payment.params = payment.params || {};
      payment.params.amount = String(sessionData.user_inputs.part_payment_amount);
      payment.params.currency = payment.params.currency || sessionData.update_currency || 'INR';
    }
  }
  
  console.log("Gold Loan update payload generated successfully");
  return existingPayload;
} 