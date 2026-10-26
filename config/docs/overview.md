# Mutual Fund Investments

## Overview

A mutual fund pools money from many investors into a scheme run by an AMC (Asset Management Company), and prices each unit by its NAV (Net Asset Value) - the per-unit price, recalculated daily off the fund's underlying holdings. An investor puts money in either as a Lumpsum (a one-time amount) or a SIP (Systematic Investment Plan) - a fixed amount debited automatically on a chosen date each period. Every investment sits inside a Folio, the investor's account number with a specific AMC, and every distributor selling funds needs an ARN (AMFI Registration Number) - the license, issued by AMFI after a NISM certification, that makes fund distribution legal in India.

Buying a mutual fund isn't new - what ONDC changes is how an investor reaches it. Today, a distributor typically integrates separately with each AMC, RTA, or MF aggregation platform whose funds it wants to sell, and an investor comparing funds across providers is really comparing across separately-built apps and processes. On ONDC, a buyer app broadcasts one search across every participating seller at once, compares schemes side by side, and carries the investor through KYC, folio creation, and payment - without the investor ever leaving that app. The fund itself, and everything about managing it, remains entirely the AMC's own, ONDC standardizes the discovery, application, and servicing layer sitting in front of it.

Phase 1 of this protocol covers Indian residents with a valid Aadhaar, investing from a bank account they solely own, via SIP or Lumpsum, with payment collected in real time only - scheduled future-dated investments beyond a standard SIP aren't in scope yet.

This guide explains the Mutual Fund Investments use case and end-to-end journey from a business and product perspective, before covering the corresponding technical specifications and API flows. Network interactions in this guide reference the ONDC:FIS14 domain, version 2.1.0 (release-FIS14-2.1.0).

## Participants

| Participant | What This Means |
|-------------|-----------------|
| Buyer App | An AMFI-certified distributor or SEBI-registered Investment Adviser - the application through which the investor searches, selects, and invests. Its ARN is presented on every search. |
| Seller App | The manufacturer of the mutual fund product (the AMC) or an MF aggregation platform representing multiple AMCs - including RTAs, stock exchanges, and MFU. |
| Investor | An Indian resident with a valid Aadhaar ID, investing from a single-owner bank account. |
| KYC & Identity Providers | UIDAI and DigiLocker for Aadhaar eKYC. |

## The User Journey

The Mutual Fund journey enables an investor to discover schemes, choose how to invest, complete KYC, and have units allocated to a folio. The journey consists of the following stages:

### 1. Fund Discovery

The investor searches for schemes by type (equity, debt, hybrid), risk appetite, historical returns, and similar criteria. The buyer app shares these critical search parameters with seller apps - either in real time, or by caching a periodically-refreshed catalogue.

Network interaction:

| API | Description |
|-----|-------------|
| `/search` | The buyer app queries the network - either a Full Pull (the complete scheme catalogue) or an Incremental Pull (only what's changed since a given timestamp). |
| `/on_search` | Each seller returns scheme information meeting the criteria: AMC, fund type, historical returns, expense ratio, AUM, and lock-in period, alongside other SEBI-mandated disclosures. |

The buyer app can request a full catalogue, a timestamped delta, or a scheduled pull, and cache accordingly - treat this as a refreshable dataset rather than a live query on every investor session, the same way lender catalogues work for the lending products.

### 2. Fund and Investment Type Selection

The investor picks a scheme and chooses Lumpsum (entering an amount) or SIP (entering amount, frequency, and date).

Network interaction:

| API | Description |
|-----|-------------|
| `/select` | The buyer app sends the chosen scheme and investment type. |
| `/on_select` | The seller acknowledges the selection and requests PAN and other identifying details needed to determine the investor's category. |

The investor falls into one of three categories, and the workflow branches accordingly: a first-time MF investor, an existing MF investor but new to this AMC, or an existing customer of this AMC. Which category applies changes how much of KYC and folio setup can be skipped - don't build a single linear flow that assumes every investor starts from zero.

### 3. KYC and Folio Setup

Where the investor's KRA (KYC Registration Agency) record doesn't already exist for their PAN, they're redirected to complete KYC digitally - Aadhaar eKYC or video eKYC - creating a Registration Number with the seller. The investor is then prompted to register a bank account, which the seller validates via a penny-drop check (a token credit/debit used to confirm the account is real and matches the investor's name).

Network interaction:

| API | Description |
|-----|-------------|
| `/select` | The buyer app submits the KYC form. |
| `/on_select` | The seller pushes form status, then requests the bank account details form. |
| `/select` | The buyer app submits the bank account form. |
| `/on_select` | The seller confirms, and returns the folio choice - an existing folio (via KRA/CAN) or the option to create a new one. |

If the investor is themself a Registered Investment Adviser (RIA) or stockbroker who wants to run their own KYC rather than the seller's, the seller app can instead share a redirection link for that - worth designing for as an explicit branch, not an edge case to special-case later.

### 4. Order Initiation

The buyer app asks the investor to choose the folio (new or existing) the investment should go into.

Network interaction:

| API | Description |
|-----|-------------|
| `/init` | The buyer app initiates the order with all required details, including the chosen folio. |
| `/on_init` | The seller validates all order details. |

### 5. Agreement Signing and Payment

The buyer app redirects the investor to an order confirmation page for agreement signing, then to a payment page.

Network interaction:

| API | Description |
|-----|-------------|
| `/confirm` | The investor accepts the terms via clickwrap OTP consent. |
| `/on_confirm` | The seller sends confirmation, and - for SIPs - shares the existing mandate or sets up a new one, for a Lumpsum, it shares net banking/UPI payment options. |
| form - Payment | The buyer app redirects the investor to complete the payment. A payment gateway link is only generated for a new mandate registration, where an existing mandate already covers the investment, no separate PG redirection is needed. |

### 6. Unit Allocation and NAV Update

Network interaction:

| API | Description |
|-----|-------------|
| `/on_status` | The seller informs the buyer app once payment is confirmed. |
| `/on_update` | MF units are allocated to the investor's folio (mapped to their Registration Number), and the seller shares the status of the payment and the updated NAV. |

## Additional Scenarios

### 1. Recurring SIP Instalments

Once a SIP is set up, the AMC withdraws funds from the registered mandate on each due date and buys units automatically - no fresh select/init/confirm per instalment.

Network interaction:

| API | Description |
|-----|-------------|
| `/on_update` → `/on_confirm` → `/on_update` (with payment details) → `/on_status` → `/on_update` (unsolicited, throughout) | The seller pushes the instalment's progress end to end: due, payment attempted, payment status, and final outcome - units allocated on success, or a failure status if the mandate debit didn't go through. |

Model instalment failure as its own status, not a generic error - a missed SIP instalment doesn't cancel the SIP, it's a single skipped cycle the investor may need to make up manually.

### 2. Pausing or Cancelling a SIP

Network interaction:

| API | Description |
|-----|-------------|
| `/update` | The buyer app requests a pause or cancellation, on the investor's behalf. |
| `/on_update` | The seller confirms the pause or cancellation, effective from the next investment cycle - not retroactively. |

### 3. Redemption

An investor can withdraw partial or full amounts from a fund into their registered bank account, subject to any lock-in period (a minimum holding duration before redemption is allowed - relevant for products like ELSS). The buyer app should be able to show the investor's lock-in status, sourced from RTA mail-backs or a service like MF Central.

Network interaction:

| API | Description |
|-----|-------------|
| `/select` | The buyer app requests redemption for a specific folio and scheme - by amount, by number of units, or as a full redeem-all (useful since unit holdings often allocate in decimals rather than whole numbers). |
| `/on_select` | The seller returns the redemption payout account details. |
| `/init` / `/on_init` | The redemption order is initialized and validated. |
| `/confirm` / `/on_confirm` | The redemption is confirmed. |
| `/on_update` | The seller sends the redemption outcome and status. |

The three redemption modes (amount, units, all) share the identical select → init → confirm skeleton - they differ only in what the select payload specifies. Don't build three separate flows for what's one flow with a parameter.

### 4. Switch, STP, and SWP

Three more transaction types share that same select → init → confirm skeleton, each just a different instruction against a folio:

- **Switch** - move an existing holding from one scheme to another, within the same AMC or across AMCs, in a single transaction rather than a redemption followed by a fresh purchase.
- **STP (Systematic Transfer Plan)** - a systematic, recurring version of a switch, moving a fixed amount from one scheme to another on a schedule.
- **SWP (Systematic Withdrawal Plan)** - the mirror image of a SIP: a fixed amount withdrawn systematically, on a schedule, rather than invested.

### 5. Cart Investments

A distributor recommending goal-based, diversified investing can let the investor pay once while that single payment is split across multiple schemes - across the same AMC or different AMCs, and across SIP or Lumpsum.

Network interaction:

Cart investments follow the same select → init → confirm shape as a single Lumpsum or SIP order, with the cart's constituent schemes carried together in the one order rather than as separate transactions - so a single on_update sequence reflects unit allocation across every scheme in the cart, not just one.

### 6. Additional Investment into an Existing Folio

An investor can invest further into a fund they already hold by selecting the existing investment, uniquely identified by its Registration Number and Folio. Two paths apply depending on the transaction type:

- **SIP-based** - modifying an existing SIP, or setting up an additional SIP against the same folio.
- **Lumpsum** - a fresh one-time investment into the same folio.

The investor can also view a consolidated portfolio across their investments through RTA mail-backs relayed to the buyer app, or by integrating with a third-party portfolio service.

## Issue and Grievance Management

Customers can raise complaints or queries via the buyer app, the seller app provides a standard API structure to raise a ticket with the relevant seller and confirm once it's closed.
