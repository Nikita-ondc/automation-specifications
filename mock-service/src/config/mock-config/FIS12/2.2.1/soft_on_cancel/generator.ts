import { injectBuyerFinderFees } from "../settlement-utils";
import { loadMockSessionData } from "../../../../../services/data-services";

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

    // Map order.id from session data (carry-forward from confirm)
    if (sessionData.order) {
      existingPayload.message.order = sessionData?.order || existingPayload.message.order;
    }
    const order = existingPayload.message.order || (existingPayload.message.order = {});
    order.status = "SOFT_CANCEL"

    //Extract payment installments payload from order
    const previous_payments = order?.payments || [];

    const newPayments = [
      {
        id: "PID-11000",
        type: "POST_FULFILLMENT",
        status: "NOT-PAID",
        collected_by: "BPP",
        params: {
          amount: previous_payments?.[1]?.params?.amount || "1000",
          currency: "INR",
          bank_account_number: "1800002341",
          bank_code: "SBIN0001234"
        }
      },
      {
        id: "PID-12000",
        type: "POST_FULFILLMENT",
        status: "NOT-PAID",
        collected_by: "BPP",
        params: {
          amount:
            order?.quote?.breakup
              ?.find((item: any) => item.title === "NET_DISBURSED_AMOUNT")
              ?.price?.value || "0",
          currency: "INR",
          bank_account_number: "1600002341",
          bank_code: "SBIN0001234"
        }
      }
    ];

    // old payments me se same id hata do
    const filteredOldPayments = previous_payments.filter(
      (p: any) => !newPayments.some(n => n.id === p.id)
    );

    existingPayload.message.order.payments = [
      ...newPayments,
      ...filteredOldPayments
    ];

    const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
    console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
    sessionData.form_data = form_data
    const downPaymentEntered = sessionData?.form_data?.down_payment_form?.updateDownpayment;
    existingPayload.message.order.payments[0].params.amount = downPaymentEntered
  }
  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}
