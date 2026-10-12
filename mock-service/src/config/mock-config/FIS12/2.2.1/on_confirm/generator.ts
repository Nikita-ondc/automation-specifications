
import { loadMockSessionData } from "../../../../../services/data-services";
import { injectSettlementAmount, injectLoanDetails, generateInstallmentPayments, injectBuyerFinderFees } from "../settlement-utils";
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
export async function onConfirmDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("sessionData for on_confirm", sessionData);

  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }
  const contextTimestamp = existingPayload.context?.timestamp || new Date().toISOString();

  existingPayload.message.order?.payments?.forEach((payment: any) => {
    if (payment?.time?.range) {
      payment.time.range = generateTimeRangeFromContext(contextTimestamp);
    }

  });

  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Use the same message_id as confirm (matching pair)
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
    console.log("Using matching message_id from confirm:", sessionData.message_id);
  }


  // Generate order.id (first time order ID is created in the flow)
  const txnId = (sessionData?.transaction_id || '').slice(-8);
  if (existingPayload.message?.order) {
    existingPayload.message.order.id = `ORDER-${txnId}`;
    console.log("Generated order.id:", existingPayload.message.order.id);
  }

  // Update provider.id if available from session data (carry-forward from confirm)
  if (sessionData.selected_provider?.id && existingPayload.message?.order?.provider) {
    existingPayload.message.order.provider.id = sessionData.selected_provider.id;
    console.log("Updated provider.id:", sessionData.selected_provider.id);
  }

  // Update item.id from the actually selected item (carry-forward from select)
  // selected_items_1 holds what the user chose from the multiple-offer screen.
  const selectedItemId = Array.isArray(sessionData.selected_items_1)
    ? sessionData.selected_items_1?.[0]?.id
    : undefined;
  const selectedItem = (selectedItemId && Array.isArray(sessionData.items))
    ? sessionData.items.find((i: any) => i.id === selectedItemId)
    : sessionData.item || (Array.isArray(sessionData.items) ? (sessionData.items?.[1] ?? sessionData.items?.[0]) : undefined);

  if (selectedItem?.id && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].id = selectedItem.id;
    existingPayload.message.order.items[0].parent_item_id = selectedItem.parent_item_id;
    existingPayload.message.order.items[0].category_ids = selectedItem.category_ids;
    existingPayload.message.order.items[0].price = selectedItem.price;
    existingPayload.message.order.items[0].tags = [
      {
        display: true,
        descriptor: { name: "Checklists", code: "CHECKLISTS" },
        list:
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
              { descriptor: { name: "Set Loan Amount", code: "SET_DOWN_PAYMENT" }, value: "COMPLETED" },
              { descriptor: { name: "KYC", code: "KYC" }, value: "COMPLETED" },
              { descriptor: { name: "Emandate", code: "EMANDATE" }, value: "COMPLETED" },
              { descriptor: { name: "Esign", code: "ESIGN" }, value: "COMPLETED" }
            ]
      }
    ];
    console.log("[on_confirm] Set item from selected_items_1:", selectedItem.id);
  }

  // Update location_ids from session data (carry-forward from previous flows)
  const selectedLocationId = sessionData.selected_location_id;
  if (selectedLocationId && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].location_ids = [selectedLocationId];
    console.log("Updated location_ids:", selectedLocationId);
  }

  // Update customer name in fulfillments if available from session data
  if (sessionData.customer_name && existingPayload.message?.order?.fulfillments?.[0]?.customer?.person) {
    existingPayload.message.order.fulfillments[0].customer.person.name = sessionData.customer_name;
    console.log("Updated customer name:", sessionData.customer_name);
  }

  // Update customer contact information if available from session data
  if (sessionData.customer_phone && existingPayload.message?.order?.fulfillments?.[0]?.customer?.contact) {
    existingPayload.message.order.fulfillments[0].customer.contact.phone = sessionData.customer_phone;
    console.log("Updated customer phone:", sessionData.customer_phone);
  }

  if (sessionData.customer_email && existingPayload.message?.order?.fulfillments?.[0]?.customer?.contact) {
    existingPayload.message.order.fulfillments[0].customer.contact.email = sessionData.customer_email;
    console.log("Updated customer email:", sessionData.customer_email);
  }

  // Update fulfillment state to DISBURSED (loan has been confirmed and disbursed)
  // if (existingPayload.message?.order?.fulfillments?.[0]?.state?.descriptor) {
  //   existingPayload.message.order.fulfillments[0].state.descriptor.code = "DISBURSED";
  //   existingPayload.message.order.fulfillments[0].state.descriptor.name = "Loan Disbursed";
  //   console.log("Updated fulfillment state to DISBURSED");
  // }
  if (existingPayload.message?.order) {
    existingPayload.message.order.created_at = contextTimestamp;
    existingPayload.message.order.updated_at = contextTimestamp;
  }
  const form_data = await loadMockSessionData(`form_data_${sessionData.transaction_id}`, "");
  console.log("mockSessionDatamockSessionData", JSON.stringify(form_data))
  sessionData.form_data = form_data
  // ── Dynamic Loan Details: quote breakup + item tags ───────────────────────────
  injectLoanDetails(existingPayload, sessionData);
  // ── Dynamic Installment Payments (POST_FULFILLMENT) ─────────────────────────
  generateInstallmentPayments(existingPayload, sessionData);
  // ── Dynamic SETTLEMENT_AMOUNT: inject pre-calculated value from session ──
  injectSettlementAmount(existingPayload, sessionData);
  // ─────────────────────────────────────────────────────────────────────────

  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}

