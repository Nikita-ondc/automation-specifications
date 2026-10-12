
import { randomUUID } from "node:crypto";
import { loadMockSessionData } from "../../../../../services/data-services";
import { injectSettlementAmount, injectLoanDetails, generateInstallmentPayments, injectBuyerFinderFees } from "../settlement-utils";
export async function onInitDefaultGenerator(existingPayload: any, sessionData: any) {
  console.log("sessionData for on_init", sessionData);

  // Update context timestamp
  if (existingPayload.context) {
    existingPayload.context.timestamp = new Date().toISOString();
  }

  // Update transaction_id from session data (carry-forward mapping)
  if (sessionData.transaction_id && existingPayload.context) {
    existingPayload.context.transaction_id = sessionData.transaction_id;
  }

  // Use the same message_id as init (matching pair)
  if (sessionData.message_id && existingPayload.context) {
    existingPayload.context.message_id = sessionData.message_id;
    console.log("Using matching message_id from init:", sessionData.message_id);
  }

  // Update provider.id if available from session data (carry-forward from init)
  if (sessionData.selected_provider?.id && existingPayload.message?.order?.provider) {
    existingPayload.message.order.provider.id = sessionData.selected_provider.id;
    console.log("Updated provider.id:", sessionData.selected_provider.id);
  }

  // Update item.id from the actually selected item (carry-forward from select)
  // selected_items_1 holds what the user chose from the multiple-offer screen.
  // We find the matching full item from the on_search catalog (sessionData.items).
  const selectedItemId = Array.isArray(sessionData.selected_items_1)
    ? sessionData.selected_items_1?.[0]?.id
    : undefined;
  const selectedItem = (selectedItemId && Array.isArray(sessionData.items))
    ? sessionData.items.find((i: any) => i.id === selectedItemId)
    : sessionData.item; // fallback to previously saved item

  if (selectedItem?.id && existingPayload.message?.order?.items?.[0]) {
    existingPayload.message.order.items[0].id = selectedItem.id;
    existingPayload.message.order.items[0].parent_item_id = selectedItem.parent_item_id;
    existingPayload.message.order.items[0].category_ids = selectedItem.category_ids;
    existingPayload.message.order.items[0].price = selectedItem.price;
    existingPayload.message.order.items[0].tags = [
      ...(selectedItem.tags || []),
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
              { descriptor: { name: "Emandate", code: "EMANDATE" }, value: "PENDING" },
              { descriptor: { name: "Esign", code: "ESIGN" }, value: "PENDING" }
            ]
      }
    ];
    console.log("[on_init] Set item from selected_items_1:", selectedItem.id);
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
    console.log("sessionData", sessionData);
  }

  if (sessionData.customer_email && existingPayload.message?.order?.fulfillments?.[0]?.customer?.contact) {
    existingPayload.message.order.fulfillments[0].customer.contact.email = sessionData.customer_email;
    console.log("Updated customer email:", sessionData.customer_email);
  }
  //  Update form URLs for items with session data (preserve existing structure)
  if (existingPayload.message?.order?.items) {
    console.log("check for form +++")
    existingPayload.message.order.items = existingPayload.message.order.items.map((item: any) => {
      if (item.xinput?.form) {
        // Generate dynamic form URL with session data
        const url = `${process.env.FORM_SERVICE}/forms/${sessionData.domain}/Emanadate_verification_status?session_id=${sessionData.session_id}&flow_id=${sessionData.flow_id}&transaction_id=${existingPayload.context.transaction_id}`;
        console.log("Form URL generated:", url);
        item.xinput.form.id = "Emanadate_verification_status";
        item.xinput.form.url = url;
      }

      if (sessionData?.flow_id?.includes("Single_Redirection")) {
        delete item.xinput
      }
      return item;
    });
  }

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

  if (sessionData?.flow_id?.includes("Single_Redirection")) {
    existingPayload.message.order.payments[1].status = "PAID"
    existingPayload.message.order.payments[1].params.transaction_id = "3b5a664d-077e-47f0-96d1-06e68d397c78"
  }
  injectBuyerFinderFees(existingPayload, sessionData);
  return existingPayload;
}
