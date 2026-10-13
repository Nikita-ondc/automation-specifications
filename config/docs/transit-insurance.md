# **Use Case Brief**

#  **Sachet Transit Insurance**

## **Overview**

Transit sachet insurance lets a buyer app that holds a master group policy insure one shipment at a time against damage, theft or loss in transit. Each shipment gets a child policy issued over ONDC (domain ONDC:FIS13, category MICRO\_TRANSIT\_INSURANCE), and the premium is debited from the buyer app's CD balance with the insurer.

## **Participants**

| Participant | Role |
| :---- | :---- |
| Insurer (BPP) | IRDAI-licensed insurer. Publishes the master policy and its plans, checks eligibility, prices each shipment, issues the child policy and handles claims. |
| Buyer app (BAP) | Master policy holder: an insurtech, SaaS or logistics platform, or any active ONDC node. Sets its own eligibility rules, sends shipment data and confirms the policy. A distribution licence is optional. |
| Insured | The seller or shipper whose goods are in transit. Receives the policy details and raises claims with the insurer. |

The buyer app and insurer agree the master group policy offline, which produces the master policy ID (MASTER\_POLICY.POLICY\_ID) used on every call. The buyer app also keeps a CD (credit) balance with the insurer, which funds every premium.

## **User Journey**

### **1\. Eligibility check on the buyer app**

When a shipment is created, the buyer app applies its own rules to decide whether to insure it. These rules can cover order value, route, seller or logistics partner. This step happens inside the buyer app, with no network call.

### **2\. Discovery of insurers and master policies**

The buyer app broadcasts a search for MICRO\_TRANSIT\_INSURANCE through the gateway. Each insurer replies with an on\_search carrying its provider details and the master policy ID it holds with the buyer app.

### **3\. Product discovery under the master policy**

The buyer app sends a search to one insurer with the provider ID and master policy ID. The insurer's on\_search returns the transit product and an empty BAP\_INPUTS template listing the shipment details it needs.

### **4\. Sharing shipment details**

The buyer app sends a search with the filled BAP\_INPUTS (every field is optional in the attribute sheet).

| Group | Fields |
| :---- | :---- |
| Buyer | BUYER\_NAME (Salutation | First | Middle | Last), BUYER\_PHONE\_NUMBER (\+91-XXXXXXXXXX), BUYER\_PAN\_NUMBER, DERIVED\_DATA (URL to a JSON file) |
| Order | ORDER\_ID, ORDER\_TYPE, PRODUCT\_CATEGORY, ORDER\_VALUE (INR), ORDER\_WEIGHT, PAYMENT\_MODE |
| Route | START\_ADDRESS, END\_ADDRESS (Address | Pincode), TRANSIT\_START\_DATE, TRANSIT\_END\_DATE (DD/MM/YYYY), MODE\_OF\_TRANSPORT |
| Packaging | PACKAGING\_TYPE, PACKAGING\_VIDEO (url | formats | validity), SEALING\_TYPE, WATERPROOFING |
| Logistics | LOGISTICS\_COST, ORDERS\_ONTIME\_PCT, LOGISTICS\_PARTNER\_GSTIN |
| Delivery executive | DELIVERY\_EXECUTIVE\_NAME, \_PHONE\_NO, \_UNIQUE\_ID, \_VEHICLE\_NO |

### **5\. Offers from the insurer**

The insurer checks eligibility and returns priced plans as child items in on\_search, each valid for OFFER\_VALIDITY (P15D in the example).

| Attribute | Plan (example) | Plus Plan (example) |
| :---- | :---- | :---- |
| COVERAGE\_AMOUNT (INR) | 10,000,000 | 10,000,000 |
| Price: base · convenience · processing · tax (INR) | 900 · 50 · 10 · 40 | 1,000 · 50 · 10 · 40 |
| CO\_PAYMENT / CLAIM\_SETTLEMENT\_RATIO | — | Yes / 20.3% |
| Inclusions | Transit coverage, multi-mode transport, natural calamities | Transit coverage, multi-mode transport, accidental damages |
| Exclusions | Ordinary wear and tear, delays | Inherent vice (natural deterioration of goods) |

### **6\. Plan selection**

The buyer app sends select with the chosen plan. The insurer's on\_select returns the quote breakup, which totals INR 1,000 for the first plan. It also returns the NOMINEE\_DETAILS template with NOMINEE\_NAME.

### **7\. Policy initiation**

The buyer app sends init with the nominee's name and a payment of type: ON\_ORDER, status: NOT-PAID. The insurer's on\_init returns the policyholder's name and phone, and the cancellation terms as a URL.

### **8\. Confirmation and premium deduction**

The buyer app sends confirm. The insurer debits the premium from the buyer app's CD balance and issues a child policy under the master policy. Its on\_confirm returns:

* the order (order.id \= child policy ID) as ACTIVE  
* the fulfillment as INITIATED  
* the payment as PAID, with the amount and transaction ID

### **9\. Policy issuance**

The insurer sends an unsolicited on\_update once the policy is live:

* the fulfillment moves to GRANTED  
* POLICY\_INFO gives the start, end and renewal dates and the claims helpdesk phone and email  
* POLICY\_DOC links the signed, password-protected policy PDF

The buyer app then shares the policy details and the claims process with the insured.

## **Additional Scenarios**

### **Shipment not eligible**

The insurer runs its eligibility check on the shipment details shared in step 4\. If the shipment does not qualify, no offer comes back in on\_search, and the buyer app handles the uninsured shipment in its own experience.

### **Insufficient CD balance**

The insurer checks the CD balance offline before issuing the policy. If the balance cannot cover the premium, on\_init returns error 81201 "Insufficient CD Balance" and no policy is issued. The buyer app tops up its CD balance outside the protocol and can retry.

### **Next shipment**

Each shipment is a new purchase. The buyer app broadcasts again from step 2 and may choose a different insurer; nothing carries over from an earlier transit policy.

### **Cancellation**

Cancellation follows the terms linked in cancellation\_terms in on\_init. The transit flow has no cancel call on the network.

### **Claims**

If goods are damaged, stolen or lost in transit, the insured contacts the insurer's claims helpdesk shared in on\_update. The insurer reviews the claim against the policy and the insured's details, and pays out under the policy terms. Claims run outside the protocol.