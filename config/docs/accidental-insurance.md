# **Use Case Brief** 

# **Sachet Accidental Insurance**

## **Overview**

Accidental sachet insurance covers a person against accidental death and disability, with medical, hospitalisation and EMI-protection benefits, for a short window such as a working day or a trip. A buyer app issues it as a child policy under its master group policy over ONDC (domain ONDC:FIS13, category MICRO\_ACCIDENTAL\_INSURANCE), and the premium is debited from the buyer app's CD balance with the insurer.

## **Participants**

| Participant | Role |
| :---- | :---- |
| Insurer (BPP) | IRDAI-licensed insurer. Publishes the master policy and its plans, checks eligibility (including age limits), issues the child policy and settles claims. |
| Buyer app (BAP) | Master policy holder: a gig, delivery or workforce platform, insurtech or SaaS provider, or any active ONDC node. Sets eligibility rules (activity, task completion, performance), sends the worker's details and confirms the policy. A distribution licence is optional. |
| Insured | The worker or user covered. Gives nominee details and a good-health declaration, then claims directly with the insurer. |

The buyer app and insurer agree the master group policy offline, which produces the master policy ID (MASTER\_POLICY.POLICY\_ID) used on every call. The buyer app also keeps a CD (credit) balance with the insurer, which funds every premium.

## **User Journey**

### **1\. Eligibility check on the buyer app**

The buyer app applies its own rules to decide whether a worker gets cover for the coming period. Rules can cover activity, task completion, shift start or performance goals. This step happens inside the buyer app, with no network call.

### **2\. Discovery of insurers and master policies**

The buyer app broadcasts a search through the gateway. Each insurer replies with an on\_search carrying its provider details and the master policy ID it holds with the buyer app.

### **3\. Product discovery under the master policy**

The buyer app sends a search for MICRO\_ACCIDENTAL\_INSURANCE to one insurer, with the provider ID and master policy ID. The insurer's on\_search returns the accidental product and an empty BAP\_INPUTS template listing the details it needs.

### **4\. Sharing customer details**

The buyer app sends a search with the filled BAP\_INPUTS (every field is optional in the attribute sheet).

| Field | Format / example |
| :---- | :---- |
| BUYER\_NAME | Salutation | First | Middle | Last, e.g. Mr. | Joe | Wick | Adams |
| BUYER\_PHONE\_NUMBER, BUYER\_EMAIL | \+91-9988776655; john.doe@example.com |
| BUYER\_PAN\_NUMBER | Alphanumeric PAN |
| BUYER\_DOB | DD/MM/YYYY |
| BUYER\_PED | Pre-existing disease: true or false |
| SUM\_INSURED | INR, no separators, e.g. 100000 |
| TENURE, TENURE\_TYPE | ISO 8601 duration, e.g. P1M; tenure type (the example sends TRANSIT) |

### **5\. Offers from the insurer**

The insurer checks eligibility, including the age band, and returns priced plans as child items in on\_search. Each offer is valid for OFFER\_VALIDITY (P15D in the example) and links its terms in TNC\_LINK.

| Attribute | Example value |
| :---- | :---- |
| ACCIDENTAL\_DEATH\_SUM\_INSURED (INR) | 10,000,000 |
| Permanent total / permanent partial / temporary total disability (INR) | 10,000,000 each |
| MEDICAL\_EXPENSES\_COVERAGE (INR) | 100,000 |
| HOSPITALIZATION\_BENEFITS (INR) | 10,000 |
| EMI cover during temporary / permanent disability | Yes / No, up to 5 EMIs (NUMBER\_OF\_EMI\_PAYABLE) |
| INITIAL\_WAITING\_PERIOD | Applies (true) |
| Age band (years) | 15–75 |
| Price: base · convenience · processing · tax (INR) | 900 · 50 · 10 · 40 (Plus Plan: 1,000 base) |

### **6\. Plan selection**

The buyer app sends select with the chosen plan. The insurer's on\_select returns the quote breakup, which totals INR 1,000 for the first plan. It also returns the NOMINEE\_DETAILS template: NOMINEE\_NAME, NOMINEE\_DOB, NOMINEE\_RELATIONSHIP, APPOINTEE\_NAME, APPOINTEE\_RELATIONSHIP and GOOD\_HEALTH\_DECLARATION.

### **7\. Policy initiation**

The buyer app sends init with the nominee and appointee details, the insured's good-health declaration, and a payment of type: ON\_ORDER. The insurer's on\_init returns the policyholder's name and phone, and the cancellation terms as a URL.

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

### **Worker not eligible**

The insurer runs its eligibility check on the details shared in step 4, including the 15–75 age band in the example. If the worker does not qualify, no offer comes back in on\_search, and the buyer app handles the non-eligible worker in its own experience.

### **Insufficient CD balance**

The insurer checks the CD balance offline before issuing the policy. If the balance cannot cover the premium, on\_init returns error 81201 "Insufficient CD Balance" and no policy is issued. The buyer app tops up its CD balance outside the protocol and can retry.

### **Next shift or period**

Each new cover window is a new purchase. The buyer app broadcasts again from step 2 and may choose a different insurer.

### **Cancellation**

Cancellation follows the terms linked in cancellation\_terms in on\_init. The accidental flow has no cancel call on the network.

### **Claims**

After an accident, the insured or the nominee contacts the insurer's claims helpdesk shared in on\_update. The insurer reviews the claim against the policy and the insured's details (PAN, phone, demographics), and pays the death, disability, medical or EMI benefit under the policy terms. Per the BRD, the buyer app's location and timestamp data can help validate the accident. Claims run outside the protocol.