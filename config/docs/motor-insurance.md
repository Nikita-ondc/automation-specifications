# Insurance


- [Overview](#overview)
- [Participants](#participants)
- [The User Journey](#the-user-journey)
  - [1. Plan Discovery](#1-plan-discovery)
  - [2. Eligibility Check and PED Disclosure](#2-eligibility-check-and-ped-disclosure)
  - [3. Add-on Selection](#3-add-on-selection)
  - [4. eKYC](#4-ekyc)
  - [5. Proposer and Medical Details](#5-proposer-and-medical-details)
  - [6. Nominee Details](#6-nominee-details)
  - [7. Manual Review (Where Required)](#7-manual-review-where-required)
  - [8. Consent (CIS) and Payment](#8-consent-cis-and-payment)
- [Additional Scenarios](#additional-scenarios)
  - [1. Renewal](#1-renewal)
  - [2. Cancellation and Refund](#2-cancellation-and-refund)
  - [3. Claims](#3-claims)
- [Issue and Grievance Management](#issue-and-grievance-management)

## Overview

Health Insurance covers medical expenses in exchange for a premium. An Individual plan covers one person, a Family Floater plan pools everyone covered under a single Sum Insured - sized against the oldest member's age, so any one person's claim draws down the whole family's pool. A declared Pre-Existing Disease (PED) triggers a waiting period before related claims are admissible, and a claim is settled either cashless (the insurer pays the network hospital directly) or via reimbursement (the customer pays first and claims back).

What ONDC changes is how a customer gets to that product. Today, comparing health insurance means visiting each insurer's app or a handful of aggregator platforms separately, each with its own intake flow. On ONDC, a single buyer app can broadcast one application to every participating insurer at once, surface their quotes side by side, and carry the customer through KYC, medical disclosure, and payment - all without leaving that app. The insurance product itself, and everything about underwriting it, stays entirely the insurer's own, ONDC only standardizes the discovery, comparison, and application layer sitting in front of it, the same role it plays for lending products like Personal Loans.

This guide explains the Health Insurance use case and end-to-end journey from a business and product perspective, before covering the corresponding technical specifications and API flows. Network interactions in this guide reference the ONDC:FIS13 domain, version 2.0.0 (release-FIS13-health).

## Participants

| Participant | What This Means |
|-------------|-----------------|
| Insurer | An IRDAI-registered entity holding an Insurer licence. Owns the product, underwriting, medical review, policy issuance, and claims decisioning. |
| Buyer App | An IRDAI-registered Broker, Web Aggregator, or Corporate Agent through which the customer discovers plans, compares quotes, and completes the purchase. |
| Buyer / Insured | The individual (or family, under a floater plan) being covered. |
| POSP (Point of Sale Person) | Where a sales agent is involved, the buyer app shares that agent's DMS Code and POSP Code with insurers alongside the application. |
| KYC & Identity Providers | UIDAI and DigiLocker for eKYC. |

## The User Journey

The Health Insurance journey enables a buyer to discover plans, get a quote, disclose medical information, complete KYC, and pay for a policy. The journey consists of the following stages:

### 1. Plan Discovery

The buyer app collects the buyer's date of birth and PED status for every individual to be insured (a single questionnaire covers everyone under a family floater), along with phone number, email, pincode, plan type, Sum Insured, and zone.

Network interaction:

| API | Description |
|-----|-------------|
| `/search` | The buyer app queries the network for available health insurance plans. |
| `/on_search` | Each insurer returns its catalogue of health insurance products, along with a personal/family information form. |

A further `/search`/`/on_search` round carries that form's submission, after which insurers return quotes based on the information provided.

### 2. Eligibility Check and PED Disclosure

If a PED was declared in discovery, the buyer app displays a standard PED questionnaire. Separately, the insurer may request the buyer's PAN and DOB to check eligibility for a reduced quote.

Network interaction:

| API | Description |
|-----|-------------|
| `/select` | The buyer app selects a plan, submitting PAN and DOB. |
| `/on_select` | The insurer responds with the PED details form (if applicable), then - once submitted via a further `/select`/`/on_select` round - flags the offer for manual review if required. Manual-review flagging at this stage is optional, the offer can still move to manual review later if the buyer adds an add-on that requires it. |

If the buyer changes the Sum Insured, zone, or adds/removes a policy feature at any point, the insurer shares a revised offer where required - don't assume the original quote holds once the buyer starts adjusting parameters.

### 3. Add-on Selection

Once a plan is selected, the buyer app retrieves additional, insurer-specific add-ons the buyer can choose from - for example, a zero-depreciation cover or a daily hospital cash benefit. Each add-on is either:

- **Mandatory** - its cost is already factored into the base premium quoted.
- **Voluntary** - the buyer opts in, and its premium is added separately on top of the base premium.

Every add-on carries the same structure: a name, its type (mandatory/voluntary), whether the customer selected it, the sum insured it applies to, nominee details where relevant, and a calculated premium. That per-add-on premium must appear in the Offer response itself - not only in a later policy summary - so the buyer app can show a cost breakdown at the point of selection.

### 4. eKYC

Network interaction:

| API | Description |
|-----|-------------|
| `/select` | The buyer app submits the manual-review or add-on selection. |
| `/on_select` | The insurer returns an Aadhaar eKYC/PAN KYC form. |
| form | The buyer app fetches this form, the buyer completes eKYC and is redirected back. On successful verification, the insurer retrieves the buyer's name, address, and contact details. |

### 5. Proposer and Medical Details

Network interaction:

| API | Description |
|-----|-------------|
| `/init` | The buyer app submits the eKYC completion, initiating the purchase. |
| `/on_init` | The insurer requests proposer details - height, weight, gender, and further medical information for each insured individual - via a form. |

A further `/init`/`/on_init` round carries that submission.

### 6. Nominee Details

Network interaction:

| API | Description |
|-----|-------------|
| `/init` | The buyer app submits proposer/medical details. |
| `/on_init` | The insurer requests nominee details (name, relationship, contact) via a form, and - where the case needs it - returns a Manual Review form instead of proceeding straight to confirmation. |

### 7. Manual Review (Where Required)

Some applications need a medical checkup (via teleconsultation or in-person tests) before the insurer can finalize terms. The insurer tracks this as a form-level status the buyer app can poll or receive pushed:

- **PENDING** - under review.
- **APPROVED** - cleared, the insurer may share a revised offer at this point, which the buyer can accept or reject.

Manual review isn't limited to the eligibility stage - adding certain add-ons post-selection can push an otherwise-clean application into manual review. Design the status model so a policy can enter this state from more than one point in the journey.

### 8. Consent (CIS) and Payment

For every new policy, the insurer shares a dynamically generated Customer Information Sheet (CIS) - the IRDAI-mandated, standardized summary of what the policy actually covers - and captures the buyer's consent before payment.

Network interaction:

| API | Description |
|-----|-------------|
| `/confirm` | The buyer app submits the CIS consent (and manual-review outcome, where applicable) and confirms the purchase. |
| `/on_confirm` | The insurer confirms the policy request and provides a payment link. |
| `/on_update` (unsolicited) | Once payment succeeds, the insurer shares the proposal number, and later the policy document, via email/phone and the buyer app. |

## Additional Scenarios

### 1. Renewal

The buyer app displays active policies with a renewal option. The insurer provides revised policy details and a payment URL.

Network interaction:

| API | Description |
|-----|-------------|
| `/on_update` (unsolicited) | The insurer shares renewal terms and the payment redirection details. |
| `/on_status` | The insurer confirms the renewed policy status once payment succeeds, and shares the updated policy document with the buyer. |

### 2. Cancellation and Refund

The buyer app allows cancellation of an active policy. The insurer shares cancellation terms and the refund amount if the buyer proceeds.

Network interaction:

| API | Description |
|-----|-------------|
| `/on_update` (unsolicited) | The insurer confirms cancellation - the order moves to CANCELLED. |

The refund itself is processed off the network. Note also that the underlying policy fulfillment can still show as GRANTED even after the order is marked CANCELLED - treat the order-level status as the authoritative cancellation signal, not the policy fulfillment state.

### 3. Claims

The buyer app displays an option to initiate a claim on an active policy, where supported.

Network interaction:

| API | Description |
|-----|-------------|
| `/on_update` (unsolicited) | The insurer provides a claim URL for the buyer to initiate the claims process, alongside a distinct claim fulfillment that tracks its own lifecycle - separate from the policy fulfillment itself. |
| `/on_status` and further `/on_update` pushes | The insurer shares claim progress through the claim fulfillment's own state: INITIATED → PROCESSING → PROCESSED. |

A claim is modeled as its own fulfillment (type CLAIM), distinct from the policy fulfillment (type POLICY, which stays GRANTED throughout). Build the buyer app's claim tracker against the claim fulfillment's state, not the order or policy status.

## Issue and Grievance Management

Support and grievance handling for Health Insurance is addressed via the standard ONDC IGM framework - the same mechanism used across other ONDC domains, rather than a Health Insurance–specific process. <link> - category sub category
