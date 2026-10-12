
import { loadMockSessionData } from "../../../../../services/data-services";
import { generateInstallmentPayments, injectLoanDetails, injectSettlementAmount, injectBuyerFinderFees } from "../settlement-utils";
export async function onUpdateUnsolicitedDefaultGenerator(existingPayload: any, sessionData: any) {
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  if (existingPayload.context) {
    existingPayload.context.message_id = generateUUID();
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  if (existingPayload.message) {
    const order = existingPayload.message.order || (existingPayload.message.order = {});

    if (sessionData.order_id) {
      order.id = sessionData.order_id;
    }

    if (sessionData.selected_provider?.id && order.provider) {
      order.provider.id = sessionData.selected_provider.id;
    }

    const selectedItem = sessionData.item || (Array.isArray(sessionData.items) ? (sessionData.items?.[1] ?? sessionData.items?.[0]) : undefined);
    // if (selectedItem?.id && order.items?.[0]) {
    //   order.items[0].id = selectedItem.id;
    // }

    if (selectedItem?.id && existingPayload.message?.order?.items?.[0]) {
      existingPayload.message.order.items[0].id = sessionData.selected_items_id;
      existingPayload.message.order.items[0].parent_item_id = selectedItem.parent_item_id
      existingPayload.message.order.items[0].category_ids = selectedItem.category_ids
      existingPayload.message.order.items[0].price = selectedItem.price,
        existingPayload.message.order.items[0].tags =
        [
          {
            "display": true,
            "descriptor": {
              "name": "Checklists",
              "code": "CHECKLISTS"
            },
            "list":
              sessionData?.flow_id?.includes("Single_Redirection") ?
                [
                  {
                    "descriptor": {
                      "name": "Set Loan Amount",
                      "code": "SET_DOWN_PAYMENT"
                    },
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "KYC, enach, esign",
                      "code": "KYC_ENACH_ESIGN"
                    },
                    "value": "COMPLETED"
                  }
                ] :
                [
                  {
                    "descriptor": {
                      "name": "Set Loan Amount",
                      "code": "SET_DOWN_PAYMENT"
                    },
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "KYC",
                      "code": "KYC"
                    },
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "Emandate",
                      "code": "EMANDATE"
                    },
                    "value": "COMPLETED"
                  },
                  {
                    "descriptor": {
                      "name": "Esign",
                      "code": "ESIGN"
                    },
                    "value": "COMPLETED"
                  }
                ]
          }]
    }

    if (sessionData.quote_id && order.quote) {
      order.quote.id = sessionData.quote_id;
    }
  }

  function upsertBreakup(order: any, title: string, value: string, currency: string = 'INR') {
    order.quote = order.quote || { price: { currency: 'INR', value: '0' }, breakup: [] };
    order.quote.breakup = Array.isArray(order.quote.breakup) ? order.quote.breakup : [];
    const idx = order.quote.breakup.findIndex((b: any) => (b.title || '').toUpperCase() === title.toUpperCase());
    const row = { title, price: { value, currency } };
    if (idx >= 0) order.quote.breakup[idx] = row; else order.quote.breakup.push(row);
  }

  function generateTimeRangeFromContext(contextTimestamp: string) {
    const contextDate = new Date(contextTimestamp);
    const year = contextDate.getUTCFullYear();
    const month = contextDate.getUTCMonth();

    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  function updatePaymentStatus(payments: any[], status: string, count?: number) {
    if (!Array.isArray(payments)) return;

    let updatedCount = 0;
    payments.forEach(payment => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT') {
        if (count === undefined || updatedCount < count) {
          payment.status = status;
          updatedCount++;
        }
      }
    });
  }

  function updateForeclosurePaymentStatus(payments: any[]) {
    if (!Array.isArray(payments)) return;

    payments.forEach(payment => {

      const hasTerms = payment.tags?.some((tag: any) =>
        tag?.descriptor?.code === "BAP_TERMS" ||
        tag?.descriptor?.code === "BPP_TERMS"
      );

      if (hasTerms) {
        delete payment.time;
        delete payment.url;
      }

      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT') {
        if (payment.status !== 'PAID') {
          payment.status = 'NOT-PAID';
        }
      }

    });
  }


  function updateMissedEMIStatus(payments: any[], contextTimestamp: string) {
    if (!Array.isArray(payments)) return;

    const contextDate = new Date(contextTimestamp);
    const contextMonth = contextDate.getUTCMonth();
    const contextYear = contextDate.getUTCFullYear();

    payments.forEach(payment => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT' && payment.time?.range?.start) {
        const paymentDate = new Date(payment.time?.range?.start);
        const paymentMonth = paymentDate.getUTCMonth();
        const paymentYear = paymentDate.getUTCFullYear();

        if (paymentMonth === contextMonth && paymentYear === contextYear) {
          payment.status = 'PAID';
        }
      }
    });
  }

  function updatePrePartPaymentStatus(payments: any[], contextTimestamp: string) {
    if (!Array.isArray(payments)) return;

    const contextDate = new Date(contextTimestamp);
    const contextMonth = contextDate.getUTCMonth();
    const contextYear = contextDate.getUTCFullYear();

    let paidCount = 0;
    let deferredCount = 0;

    payments.forEach(payment => {
      if (payment.time?.label === 'INSTALLMENT' && payment.type === 'POST_FULFILLMENT' && payment.time?.range?.start) {
        const paymentDate = new Date(payment.time?.range?.start);
        const paymentMonth = paymentDate.getUTCMonth();
        const paymentYear = paymentDate.getUTCFullYear();

        if (paymentMonth >= contextMonth && paymentMonth <= contextMonth + 2 && paymentYear === contextYear && paidCount < 3) {
          payment.status = 'PAID';
          paidCount++;
        }
        else if (paymentMonth > contextMonth + 2 && paymentMonth <= contextMonth + 4 && paymentYear === contextYear && deferredCount < 2) {
          payment.status = 'NOT-PAID';
          deferredCount++;
        }
      }
    });
  }

  const orderRef = existingPayload.message?.order || {};
  const label = sessionData.update_label
    || orderRef?.payments?.[0]?.time?.label
    || sessionData.user_inputs?.foreclosure_amount && 'FORECLOSURE'
    || sessionData.user_inputs?.missed_emi_amount && 'MISSED_EMI_PAYMENT'
    || sessionData.user_inputs?.part_payment_amount && 'PRE_PART_PAYMENT'
    || 'FORECLOSURE';

  orderRef.payments = orderRef.payments.slice(0, -1) || [{}];
  const firstPayment = orderRef.payments[0];
  firstPayment.time = firstPayment.time || {};
  firstPayment.time.label = label;

  if (label === 'MISSED_EMI_PAYMENT') {
    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = "46360";
    firstPayment.params.currency = "INR";

    const contextTimestamp = existingPayload.context?.timestamp || new Date().toISOString();
    firstPayment.time.range = generateTimeRangeFromContext(contextTimestamp);

    updateMissedEMIStatus(orderRef.payments, contextTimestamp);

    const refId = sessionData.message_id || orderRef.id || 'b5487595-42c3-4e20-bd43-ae21400f60f0';
    firstPayment.url = `https://pg.icici.com/?amount=46360&ref_id=${encodeURIComponent(refId)}`;
  }

  if (label === 'FORECLOSURE') {
    orderRef.quote = sessionData?.quote
    const outstandingPrincipal = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_PRINCIPAL')?.price?.value || '139080';
    const outstandingInterest = orderRef.quote?.breakup?.find((b: any) => b.title === 'OUTSTANDING_INTEREST')?.price?.value || '0';
    const foreclosureAmount = String(parseInt(outstandingPrincipal) + parseInt(outstandingInterest));

    // firstPayment.params = firstPayment.params || {};
    // firstPayment.params.amount = foreclosureAmount;
    // firstPayment.params.currency = "INR";

    updateForeclosurePaymentStatus(orderRef.payments);

    if (firstPayment?.time?.range) delete firstPayment?.time?.range;

    // const refId = sessionData.message_id || orderRef.id || 'b5487595-42c3-4e20-bd43-ae21400f60f0';
    // firstPayment.url = `https://pg.icici.com/?amount=${foreclosureAmount}&ref_id=${encodeURIComponent(refId)}`;
  }

  if (label === 'PRE_PART_PAYMENT') {
    upsertBreakup(orderRef, 'PRE_PAYMENT_CHARGE', '4500');

    firstPayment.params = firstPayment.params || {};
    firstPayment.params.amount = "50860";
    firstPayment.params.currency = "INR";

    const contextTimestamp = existingPayload.context?.timestamp || new Date().toISOString();
    updatePrePartPaymentStatus(orderRef.payments, contextTimestamp);

    if (firstPayment.time?.range) delete firstPayment.time?.range;

    const refId = sessionData.message_id || orderRef.id || 'b5487595-42c3-4e20-bd43-ae21400f60f0';
    firstPayment.url = `https://pg.icici.com/?amount=50860&ref_id=${encodeURIComponent(refId)}`;
  }
  const currentDate = new Date(existingPayload.context.timestamp).toISOString();
  existingPayload.message.order.payments = sessionData.payments
  existingPayload.message.order.created_at = sessionData.created_at;
  existingPayload.message.order.updated_at = currentDate;
  const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
  console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
  sessionData.form_data = form_data
  // ── Dynamic Loan Details: quote breakup + item tags ───────────────────────────
  injectLoanDetails(existingPayload, sessionData);

  // ── Dynamic Installment Payments (POST_FULFILLMENT) ─────────────────────────
  // generateInstallmentPayments(existingPayload, sessionData);
  // ── Dynamic SETTLEMENT_AMOUNT: inject pre-calculated value from session ──
  injectSettlementAmount(existingPayload, sessionData);
  // ─────────────────────────────────────────────────────────────────────────
  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}
