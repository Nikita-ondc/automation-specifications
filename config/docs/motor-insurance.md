# **Motor Insurance**

## **Overview**

Motor insurance on ONDC lets a buyer app compare and buy private two-wheeler and four-wheeler policies from multiple insurers in one journey. The policy can be third party, own damage or comprehensive. The buyer shares vehicle and previous-policy details once and gets priced offers with IDV ranges and add-ons. KYC, the IRDAI Customer Information Sheet (CIS)\[optional in protocol currently\] and payment are all completed with the insurer, without leaving the buyer app.

| Attribute | Motor insurance |
| :---- | :---- |
| Domain / version | ONDC:FIS13, spec 2.0.0 (branch release-FIS13-motor) |
| Category | MOTOR\_INSURANCE → TWO\_WHEELER\_INSURANCE / FOUR\_WHEELER\_INSURANCE |
| Cover types | Comprehensive, third party and own damage for each vehicle type, e.g. FOUR\_WHEELER\_COMPRIHENSIVE\_INSURANCE, TWO\_WHEELER\_THIRD\_PARTY\_INSURANCE |
| Use cases | Buy or port a new policy, renewal, cancellation and refund, claim initiation |
| Policy tenure | Set by the insurer per offer (P1Y in the example) |
| Pricing in the offer | Premium split into own damage and third party, NCB and OD discounts, fees and tax, a per-add-on premium, and an IDV with a min–max range |
| KYC | Aadhaar eKYC or PAN KYC on the insurer's page |
| Consent | Dynamically generated CIS, accepted before payment (IRDAI requirement) |
| Payment | Collected by the insurer (collected\_by: BPP). The default is PRE-FULFILLMENT (link in on\_confirm); PRE-ORDER (link before confirm) is also supported. |
| Documents | Policy PDF (POLICY\_DOC) and claim URL (CLAIM\_DOC) |

## **Participants**

| Participant | Role |
| :---- | :---- |
| Insurer (BPP) | IRDAI-licensed insurer. Publishes motor products and add-ons, fetches vehicle and previous-policy data from VAHAN, prices offers, runs manual inspection, KYC and CIS, collects the premium, and issues the policy. |
| Buyer app (BAP) | IRDAI-registered broker, web aggregator or corporate agent. Collects the buyer's vehicle details, broadcasts to insurers, shows offers side by side, renders the insurer's forms, and keeps the buyer updated. |
| Buyer | Vehicle owner buying, renewing or porting a policy. Completes KYC, consents to the CIS, pays the insurer, and raises claims. |
| POSP (optional) | Point-of-sales person who assists the buyer in a POSP-led sale. The buyer app shares the POSP and DMS codes with insurers. |
| VAHAN | Government vehicle registry. The insurer uses it to retrieve vehicle and previous-policy details and to prefill forms. |
| UIDAI / DigiLocker | Used by the insurer for Aadhaar eKYC and eSign where applicable. |

## **User Journey**

This is the default journey for buying a new policy ("Motor Insurance Application" in the spec), with payment collected after confirm. At each form step the insurer sends a form link in xinput. The buyer app renders the form, and on its next call it passes back the submission\_id the form returns.

### **1\. Discovery of insurers**

The buyer app broadcasts a search for MOTOR\_INSURANCE through the gateway. Each insurer replies with an on\_search catalogue listing:

* its two-wheeler and four-wheeler cover types (comprehensive, third party, own damage)  
* the add-ons it offers  
* a link to its Vehicle Details form

### **2\. Vehicle and owner details**

The buyer fills the insurer's Vehicle Details form inside the buyer app, and the buyer app sends a second search with the form's submission\_id.

| Group | Fields |
| :---- | :---- |
| Owner | First and last name, email, phone, gender |
| Vehicle | Vehicle unique code, registration number, RTO code, registration date |
| Cover asked for | Cover type (third party, own damage, comprehensive), IDV (optional), personal accident cover and PA tenure |
| Previous policy | Insurer, policy type, number, expiry date, name on policy, tenure, claim status, NCB % |

### **3\. Offers from insurers**

Each insurer returns priced offers as child items in on\_search, and the buyer app shows them side by side. The insurer flags offers that need manual inspection, and the buyer app highlights them.

| Attribute | Example value |
| :---- | :---- |
| PREMIUM | INR 12,531 |
| OWN\_DAMAGE\_PREMIUM / THIRD\_PARTY\_PREMIUM | INR 9,000 / INR 3,531 |
| NCB\_DISCOUNT\_PERCENTAGE / NCB\_DISCOUNT\_AMOUNT | 10% / INR 1,000 |
| OD\_DISCOUNT\_PERCENTAGE / OD\_DISCOUNT\_AMOUNT | 10% / INR 1,000 |
| IDV\_VALUE (range IDV\_MIN\_VALUE–IDV\_MAX\_VALUE) | INR 3,50,000 (1,50,000–5,00,000) |
| Built-in features | Personal accident cover, roadside assistance, depreciation cover, engine cover, CNG/LPG kit cover and others, in the insurer's own wording |
| CONVIENCE\_FEE · PROCESSING\_FEE · TAX | INR 50 · 20 · 30 |
| MANUAL\_REVIEW | true when the offer needs inspection |
| OFFER\_VALIDITY | P15D |

Add-ons such as consumables, zero depreciation, key, tyre, return-to-invoice and personal baggage cover each carry their own premium (for example consumables at INR 900). Each add-on also says whether it is mandatory (priced into the base premium) or voluntary (selected by the buyer), and lists any inputs it needs, such as sum insured or a nominee.

### **4\. Offer and add-on selection**

The buyer picks an offer and any add-ons, and the buyer app sends select. The insurer's on\_select returns:

* the vehicle details it fetched from VAHAN: make, model, variant, fuel type, registered city and date, chassis and engine numbers, and the previous policy number, insurer and end date  
* the quote breakup (base premium, fees, tax and add-ons; INR 13,531 in the example)  
* the forms still needed before ordering: MANUAL\_REVIEW, PAN\_DOB and KYC

The buyer can change the IDV within the range, the plan type or the add-ons, and the insurer returns a revised quote.

### **5\. Manual inspection (when flagged)**

The insurer shares a manual review form where the buyer uploads photos of the vehicle, or it schedules an offline inspection. The buyer app polls with status; on\_status reports the form as processed once the inspection is done. The buyer app notifies the buyer of the outcome, then sends select with the submission ID.

### **6\. PAN and date of birth**

The insurer asks for the buyer's PAN and date of birth, which can unlock a reduced quote. The buyer app sends select with the submission ID.

### **7\. KYC**

The insurer shares an Aadhaar eKYC or PAN KYC link. The buyer completes KYC on the insurer's page and returns to the buyer app. The insurer then retrieves the buyer's name, address and contact details.

### **8\. Vehicle and nominee details**

The buyer app sends init with the KYC submission. The insurer's on\_init returns the policy fulfillment as INITIATED and a Vehicle & Nominee form, prefilled from VAHAN where possible. The form covers:

* vehicle: registration, chassis and engine numbers  
* previous policy: OD and TP policy numbers and issuers  
* nominee: name, date of birth and relationship  
* appointee: name and relationship

### **9\. Personal details**

The buyer app sends init with that submission. The insurer's on\_init returns a Personal Info form for the buyer to confirm: name, address, pincode, state, date of birth, gender, politically exposed person status, email, phone and GSTIN.

### **10\. Customer Information Sheet**

The buyer app sends init with the personal-info submission. The insurer's on\_init returns a dynamically generated CIS with the offer summary. The buyer reviews it and gives consent, as IRDAI requires before any payment.

### **11\. Confirmation and payment**

The buyer app sends confirm with the CIS submission. The insurer's on\_confirm returns:

* the order as ACTIVE  
* the policy fulfillment as INITIATED  
* a PRE-FULFILLMENT payment marked NOT-PAID, with the insurer's payment link

The buyer pays on the insurer's payment gateway.

### **12\. Policy issuance**

Once payment succeeds, the insurer sends an unsolicited on\_update:

* the payment moves to PAID, with the transaction ID  
* the fulfillment moves to GRANTED  
* POLICY\_DOC links the policy PDF  
* CLAIM\_DOC links the insurer's claim page

The insurer can share the proposal number with the buyer app. The policy document also goes to the buyer by email or phone.

## **Additional Scenarios**

### **Policy renewal or porting**

The journey follows the same steps as a new purchase. The insurer retrieves the vehicle and the previous policy from VAHAN and asks the buyer to confirm them before quoting. VAHAN data isn't always available, so the insurer can also ask the buyer app for the previous policy details: insurer, policy type, number, expiry date, claim status and NCB %. The spec provides a separate renewal form for these details. The buyer app should list the buyer's active policies with an option to renew.

### **Change in IDV, plan or add-ons**

After seeing the offers, the buyer can pick a different IDV within the insurer's min–max range, switch plan type, or add or remove features and add-ons. The buyer app sends select again, and the insurer returns a revised quote in on\_select. Adding certain add-ons can make an offer need manual inspection even if it wasn't flagged at the quote stage.

### **Manual inspection outcome**

While inspection is in progress, the buyer app polls with status. The form status moves from pending to approved or processed. The buyer app notifies the buyer by phone, email or push notification. If the offer is approved, the buyer app shows the approved offer and the journey continues from PAN and DOB.

### **Payment before order (PRE-ORDER)**

Some insurers collect payment before confirm. In that flow, the CIS form in on\_init embeds the payment link (CIS and Payment Details) and the payment type is PRE-ORDER. After the buyer pays, the insurer sends an unsolicited on\_status with the payment as PAID. The buyer app then sends confirm, and on\_confirm returns the policy as GRANTED with the policy document and claim link.

### **Payment before order, without CIS**

A variant of the pre-order flow for insurers that don't use a separate CIS form. Here the payment link comes in the on\_init that carries the Personal Info form. The rest matches the pre-order flow: an unsolicited on\_status confirms payment, then confirm and on\_confirm.

### **Payment failure**

| Payment model | What happens |
| :---- | :---- |
| PRE-FULFILLMENT (default) | The insurer sends an unsolicited on\_update with the payment as FAILED. The buyer app asks for a new link with update (update\_target: order.payments), and the insurer's on\_update returns a new NOT-PAID payment link alongside the failed attempt. |
| PRE-ORDER | The insurer sends an unsolicited on\_status with the payment as FAILED. The buyer app sends init again, and the insurer's on\_init returns a new payment link alongside the failed attempt. |

### **Form status tracking**

For any form that takes time to process, such as KYC or vehicle and nominee details, the buyer app can call status. The insurer replies with an on\_status carrying the form's state: pending, approved or processed. The buyer app moves to the next step only once the form is approved.

### **Cancellation and refund**

The buyer cancels from the buyer app, which sends cancel with the order ID and a reason (for example "User bought other policy"). The insurer's on\_cancel returns the order as CANCELLATION\_INITIATED with the cancellation terms and refund amount. An unsolicited on\_update later marks it CANCELLED. The refund itself is processed off the network.

### **Claims**

The buyer starts a claim from the buyer app, which redirects them to the insurer's claim page (CLAIM\_DOC from policy issuance). The insurer then keeps the buyer app updated with unsolicited on\_update calls that add a CLAIM fulfillment. Its status moves from INITIATED to PROCESSING to PROCESSED. The buyer app can also check the claim with status.

### **POSP-led sale**

When a point-of-sales person assists the buyer, the buyer app shares the POSP's details with insurers in the first search (fulfillment.agent.person.id). The BRD also asks for the dealer's DMS code, which has no field in the current examples. The rest of the journey is unchanged.

### **Support and grievances**

Issues and grievances on a policy are raised and resolved through ONDC's IGM framework.