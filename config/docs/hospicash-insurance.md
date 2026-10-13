# **Use Case Brief**

# **Sachet Hospicash Insurance**

## **Overview**

Hospicash sachet insurance pays the insured a fixed cash amount for each day in hospital. The policy is a short, low-premium child policy that a buyer app issues under its master group policy over ONDC (domain ONDC:FIS13, category MICRO\_HOSPICASH\_INSURANCE), and the premium is debited from the buyer app's CD balance with the insurer.

## **Participants**

| Participant | Role |
| :---- | :---- |
| Insurer (BPP) | IRDAI-licensed insurer. Publishes the master policy and its plans, checks eligibility (including age limits), issues the child policy and pays claims. |
| Buyer app (BAP) | Master policy holder: an insurtech, SaaS platform, gig or workforce platform, or any active ONDC node. Sets eligibility rules, sends the customer's details and confirms the policy. A distribution licence is optional. |
| Insured | The person covered, e.g. a delivery agent. Gives nominee details and a good-health declaration, then claims directly with the insurer. |

The buyer app and insurer agree the master group policy offline, which produces the master policy ID (MASTER\_POLICY.POLICY\_ID) used on every call. The buyer app also keeps a CD (credit) balance with the insurer, which funds every premium.

## **User Journey**

### **1\. Eligibility check on the buyer app**

The buyer app applies its own rules to decide whether a user gets cover, and whether to buy a new policy or renew an existing one. Rules can cover user activity, task completion or performance goals. This step happens inside the buyer app, with no network call.

### **2\. Discovery of insurers and master policies**

The buyer app broadcasts a search for MICRO\_HOSPICASH\_INSURANCE through the gateway. Each insurer replies with an on\_search carrying its provider details and the master policy ID it holds with the buyer app.

### **3\. Product discovery under the master policy**

The buyer app sends a search to one insurer with the provider ID and master policy ID. The insurer's on\_search returns the hospicash product and an empty BAP\_INPUTS template listing the customer details it needs.

### **4\. Sharing customer details**

The buyer app sends a search with the filled BAP\_INPUTS (every field is optional in the attribute sheet).

| Field | Format / example |
| :---- | :---- |
| BUYER\_NAME | Salutation | First | Middle | Last, e.g. Mr. | Joe | Wick | Adams |
| BUYER\_PHONE\_NUMBER, BUYER\_EMAIL | \+91-9988776655; john.doe@example.com |
| BUYER\_PAN\_NUMBER | Alphanumeric PAN |
| BUYER\_DOB | DD/MM/YYYY |
| BUYER\_GENDER | Male, female or transgender |
| SUM\_INSURED | INR, no separators, e.g. 100000 |
| TENURE | ISO 8601 duration, e.g. P1M |

### **5\. Offers from the insurer**

The insurer checks eligibility, including the age band, and returns priced plans as child items in on\_search. Each offer is valid for OFFER\_VALIDITY (P15D in the example).

| Attribute | Example value |
| :---- | :---- |
| DAILY\_CASH\_BENEFIT (INR per day) | 1,000, for up to MAX\_HOSPITALIZATION\_DAYS P10D |
| ICU\_BENEFIT\_PER\_DAY (INR) | 5,000 |
| SURGICAL\_BENEFIT (INR, one-time) | 50,000 |
| CONVALESCENCE\_BENEFIT (INR) | 500,000, after a stay of at least P7D |
| INITIAL\_WAITING\_PERIOD / DURATION\_OF\_COVER | P7D / P7D |
| Age band (years) | 18–60 |
| Price: base · convenience · processing · tax (INR) | 900 · 50 · 10 · 40 (Plus Plan: 1,000 base) |
| Inclusions / exclusions | Hospitalisation, surgery (Plus Plan adds medications) / physiotherapy |

### **6\. Plan selection**

The buyer app sends select with the chosen plan. The insurer's on\_select returns the quote breakup, which totals INR 1,000 for the first plan. It also returns the NOMINEE\_DETAILS template: NOMINEE\_NAME, NOMINEE\_DOB, APPOINTEE\_NAME, APPOINTEE\_DOB and GOOD\_HEALTH\_DECLARATION.

### **7\. Policy initiation**

The buyer app sends init with the nominee and appointee details, the insured's good-health declaration, and a payment of type: ON\_ORDER, status: NOT-PAID. The insurer's on\_init returns the policyholder's name and phone, and the cancellation terms as a URL.

### **8\. Confirmation and premium deduction**

The buyer app sends confirm. The insurer debits the premium from the buyer app's CD balance and issues a child policy under the master policy. Its on\_confirm returns:

* the order (order.id \= child policy ID) as ACTIVE  
* the fulfillment as INITIATED  
* the payment as PAID

### **9\. Policy issuance**

The insurer sends an unsolicited on\_update once the policy is live:

* the fulfillment moves to GRANTED  
* POLICY\_INFO gives the start, end and renewal dates and the claims helpdesk phone and email  
* POLICY\_DOC links the signed, password-protected policy PDF

The buyer app then shares the policy details and the claims process with the insured.

## **Additional Scenarios**

### **User not eligible**

The insurer runs its eligibility check on the details shared in step 4, including the 18–60 age band in the example. If the user does not qualify, no offer comes back in on\_search, and the buyer app handles the non-eligible user in its own experience.

### **Insufficient CD balance**

The insurer checks the CD balance offline before issuing the policy. If the balance cannot cover the premium, on\_init returns error 81201 "Insufficient CD Balance" and no policy is issued. The buyer app tops up its CD balance outside the protocol and can retry.

### **Policy renewal**

Per the BRD, hospicash renews over the existing policy rather than through a fresh broadcast. That keeps waiting-period credit and a better cost structure with the same insurer. The buyer app sends the child policy number, plus refreshed customer details if needed, to that insurer only. It can still reject the renewal quote.

### **Claim during the waiting period**

Hospitalisation inside INITIAL\_WAITING\_PERIOD (P7D in the example), counted from the policy start date, is not paid.

### **Cancellation**

Cancellation follows the terms linked in cancellation\_terms in on\_init. The hospicash flow has no cancel call on the network.

### **Claims**

After a hospital stay, the insured contacts the insurer's claims helpdesk shared in on\_update. The insurer reviews the claim against the policy and the insured's details (PAN, phone, demographics), and pays the daily cash and other benefits under the policy terms. Claims run outside the protocol.