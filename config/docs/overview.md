# Business Loans 



- [Overview](#overview)
- [Participants](#participants)
- [The User Journey](#the-user-journey)
  - [1. Product Discovery](#1-product-discovery)
  - [2. Data Collection & Consent](#2-data-collection--consent)
  - [3. Application Broadcast & Underwriting](#3-application-broadcast--underwriting)
  - [4. Offer Generation](#4-offer-generation)
  - [5. Offer Selection, KYC & Verification](#5-offer-selection-kyc--verification)
  - [6. Loan Finalisation & Disbursal Setup](#6-loan-finalisation--disbursal-setup)
- [Additional Scenarios](#additional-scenarios)
  - [1. Loan & Limit Visibility](#1-loan--limit-visibility)
  - [2. Utilisation & Drawdown (Credit Lines)](#2-utilisation--drawdown-credit-lines)
  - [3. Repayment, Prepayment & Missed-Payment Servicing](#3-repayment-prepayment--missed-payment-servicing)
  - [4. Foreclosure](#4-foreclosure)
  - [5. Credit Line Cancellation](#5-credit-line-cancellation)
  - [6. Loan Closure & Lifecycle Events](#6-loan-closure--lifecycle-events)
- [Issue and Grievance Management](#issue-and-grievance-management)

---

## Overview

Business Loans cover unsecured business credit — term loans and lines of credit / working capital facilities, either invoice-linked or overdraft-style — for Sole Proprietors, Partnerships, Private Limited Companies, and other registered MSMEs. The protocol spans the full lifecycle: digital application, underwriting and offer generation, KYC and sanction, disbursal, and post-disbursal servicing through to closure.

Each lender independently manages its own BL products, underwriting, pricing, and servicing. ONDC enables these lenders and lending apps to connect through a common, open protocol instead of building separate integrations with each other. A lending app integrates with the ONDC network as a Loan Service Provider (LSP) and can discover and offer BL products from participating lenders. Lenders integrate once with the network to make their BL products available to participating lending apps.

**Out of Scope**: Explicitly out of scope are secured loans, consumer/personal loans, and anchor-led supply chain finance. Any product falling into these categories belongs to a different protocol/spec, not an extension of this one.

This guide explains the BL use case and end-to-end journey from a business and product perspective, before covering the corresponding technical specifications and API flows. Network interactions in this guide reference the `ONDC:FIS12:BL` domain, version 2.3.0 (`draft-FIS12-2.3.0-BL`).

---

## Participants

| Participant | What This Means |
|---|---|
| **Lender** | An RBI-regulated lending institution — Scheduled Commercial Bank, NBFC, Co-operative Bank, or Regional Rural Bank. Responsible for its BL catalogue, underwriting, KYC/PD/FV, mandate and eSign execution, disbursal or limit assignment, and servicing. |
| **Lending App (Loan Service Provider)** | A buyer application that offers BL products to its users by connecting with participating lenders through the ONDC network. The LSP handles discovery, consent capture, data collection (banking and GST), offer aggregation, and redirects the borrower into the lender's environment for KYC, mandate, and agreement steps. |
| **Borrower (MSME Entity)** | A sole proprietor, partnership firm, private limited company, or other MSME entity applying for a term loan or line of credit. KYC complexity scales with entity type — a private limited company brings director-level KYC and shareholding-pattern requirements that a sole proprietorship does not. |
| **Account Aggregator (AA) & GST Suvidha Provider (GSP)** | Supporting data rails, not core network participants. AA (available for sole proprietors) shares banking data with borrower consent under the DEPA framework; a GSP fetches GSTN profile, GSTR-1, GSTR-2A, and GSTR-3B summaries. Both are stated dual/required paths alongside manual bank-statement upload — the LSP should support them, not treat either as optional. |

---

## The User Journey

The BL journey enables a borrower to discover lenders, get evaluated by multiple lenders simultaneously, select an offer, complete KYC and sanction, and receive the loan or have a credit line assigned. The journey consists of the following stages:

### 1. Product Discovery

The LSP initiates a search to identify live lenders and the BL products they currently offer, including the documents required per product. Discovery results should be cached and periodically refreshed rather than re-queried on every borrower session, since catalogues and document requirements change far less often than borrower session volume.

**Network interaction:**

- **`/search`**: The LSP queries the network for available BL products.
- **`/on_search`**: Each lender returns its current BL catalogue and associated document checklist (GST details, Udyam number, etc.) per product.

> **Design Note**: Design for partial results — not every lender responds in the same window, so the LSP should render "what's currently known" rather than blocking on the slowest responder. A lender going offline mid-catalogue-refresh shouldn't surface stale or half-updated product data, and products that are paused (not accepting new applications) should be distinguishable from products that are discontinued.

### 2. Data Collection & Consent

Before retrieving or sharing any financial information, the LSP captures explicit borrower consent — auditable and timestamped independently for each data category (AA, GST, statement upload), since regulatory review may ask for proof of consent per source, not just one blanket event. The LSP then collects:

- **Banking data** via both supported paths: Account Aggregator consent (sole proprietors) and manual upload of the last twelve months of bank statements — this is a stated dual requirement, not a choice of one.
- **GST data** via a GSP integration: GSTN profile, GSTR-1, GSTR-2A, and GSTR-3B summaries. Where a borrower holds multiple GSTINs under one PAN, these are collected one GSTIN at a time, not as a bulk multi-select.
- **Entity-specific documents** based on entity type: financial statements and provisions for the latest financial year, shareholding pattern, list of directors, tax audit report and ITR, and UDYAM number, as applicable.

Because two banking-data paths exist, the underwriting payload sent to lenders should normalize both into a consistent representation, and retain provenance metadata — which path a given data point came from — for audit and dispute resolution.

### 3. Application Broadcast & Underwriting

Once collected, this data is broadcast to every participating lender simultaneously, and each lender begins underwriting using bureau data, banking information, GST returns, and entity details.

**Network interaction:**

- This stage runs on the same `/search` (or, for credit-line products, a follow-up `/search` / `/on_search` round carrying business and financial details) used for discovery — the borrower's full application payload rides on it rather than a separate broadcast action.
- Each lender acknowledges receipt and creates an internal application record promptly, even before a full underwriting decision is ready — this acknowledgment is what lets the LSP confirm the application actually reached each lender, and evaluation itself proceeds asynchronously from there.

A lender that doesn't serve the borrower's entity type or geography should decline early with a clear reason, rather than silently timing out. Duplicate-broadcast protection matters too: a retried broadcast from the LSP side (due to network issues) shouldn't create duplicate application records on the lender's side.

### 4. Offer Generation

Each lender decides product fit — term loan or credit line — and computes the sanctioned amount or limit, tenure, pricing, fees, and utilisation rules, returning a complete offer with all KFS-mandated disclosures and a stated validity window.

**Network interaction:**

- **`/on_search`**: Each lender returns its offer as part of the catalogue response described above, including product type, pricing, and KFS terms.

The LSP aggregates offers as they arrive and clearly labels them by type — term loan vs. credit line, invoice-linked vs. direct LOC — so borrowers compare like-for-like where possible and are aware of structural differences where not.

Offer validity windows differ by lender — the LSP should track expiry per offer and reflect stale/expired offers in the UI rather than letting a borrower select one that's lapsed. Since underwriting response times vary by lender, the aggregation view should update incrementally as offers arrive, not wait for every lender to respond.

### 5. Offer Selection, KYC & Verification

The borrower selects exactly one offer. From here, KYC runs for the entity itself, its directors, and any co-applicants — in online or offline mode as required — plus Personal Discussion (PD) or Field Verification (FV) where the lender's policy requires it.

**Network interaction:**

- **`/select`**: The LSP notifies the chosen lender of the selection.
- **`/on_select`**: The lender responds with the applicable quote and, for credit-line products, the next KYC form required — individual KYC first, then a further `/select` round carrying entity KYC once individual KYC clears. The lender pushes completion status for each round via `/on_status`.

> **Product-Type Branching**: For credit lines, offer selection and KYC collection share the same `/select` / `/on_select` action across multiple rounds. For term loans, KYC instead happens inside the `/init` / `/on_init` cycle in the next stage. Don't assume a single fixed action carries KYC across both product types.

Once an offer is selected, the other lenders' offers on that application are implicitly declined — they should be notified so they can close out the application on their side rather than holding it open. PD/FV can introduce multi-day latency, so the LSP's status messaging should reflect "in verification" as distinct from "under review." KYC failure at the director or co-applicant level should be surfaced with enough specificity that the borrower knows what to remedy.

### 6. Loan Finalisation & Disbursal Setup

With KYC and verification cleared, the LSP collects the borrower's disbursement account details, facilitates eNACH/standing-instruction mandate creation, and presents the loan agreement for eSign — all rendered within the LSP experience via the lender's forms.

**Network interaction:**

- **`/init`**: The LSP submits the mandate-setup form to the lender.
- **`/on_init`**: The lender shares the e-mandate/payment link details, then — once that's complete — the loan-agreement form, with `/on_status` pushes marking completion of each sub-step in between.
- **`/confirm`**: The LSP submits the signed agreement and confirms.
- **`/on_confirm`**: The lender confirms the booking. For a term loan, funds are disbursed to the borrower's account. For a credit line, the final limit is assigned — available for drawdown, not transferred upfront.

Mandate and eSign completion are hard gates — disbursal shouldn't proceed on an incomplete mandate or unsigned agreement, even under pressure to move faster. Because term loans and credit lines resolve differently here, the "loan finalised" confirmation messaging should branch accordingly rather than showing one generic "funds disbursed" message for both.

---

## Additional Scenarios

### 1. Loan & Limit Visibility

The LSP maintains a dashboard of all active and closed loans — repayment schedule, EMIs, and dues for term loans; sanctioned limit, utilised amount, available limit, and drawdown history for credit lines — kept current via lender-provided APIs rather than point-in-time snapshots.

**Network interaction:**

- **`/status`**: The LSP requests current loan or credit-line state.
- **`/on_status`**: The lender returns real-time status, usage, repayment, and overdue information, and proactively pushes state changes — part-payments, reversals, drawdowns — rather than requiring the LSP to poll for every change.

Credit-line state changes more frequently than term-loan state and should be modeled with a higher expected update frequency. Overdue status should be a first-class field distinct from "amount due," since it affects both borrower messaging and downstream credit bureau reporting.

### 2. Utilisation & Drawdown (Credit Lines)

Applicable only to credit-line products, where the borrower draws funds against a sanctioned limit rather than receiving a lump sum upfront. For invoice-linked lines, the borrower views or uploads GST invoices/POs to trigger utilisation; for OD-style lines, the borrower submits a direct drawdown request.

**Network interaction:**

- **`/init` — drawdown request** (using the sanctioned line's reference ID): The borrower initiates a drawdown.
- **`/on_init` — invoice upload form** (invoice-linked only), then disbursement and repayment details: For invoice-linked lines, the lender first requests invoice upload; once submitted, it shares disbursement and repayment details for the drawdown. For OD-style lines without an invoice requirement, this step goes straight to disbursement and repayment details.
- **`/confirm`**: Borrower provides the OTP shared in the confirm request. The borrower consents to disbursal.
- **`/on_confirm`**: The lender acknowledges the borrower's consent.
- **`/on_update` (unsolicited)**: Disbursal completed, then base transaction updated. The lender confirms disbursal completion on this specific drawdown (the child order), then separately updates the base credit-line order's utilisation to reflect the new draw.

The LSP should check the line's remaining availability before submitting a utilisation request, so an over-limit request is caught before submission, not after rejection. Invoice de-duplication should be robust to partial matches (same invoice number, slightly different amount or vendor formatting), since GST invoice data isn't always perfectly normalized at the source. A drawdown request that arrives after the remaining limit has changed since the LSP's last sync (e.g., a concurrent draw by another authorized user) should be rejected cleanly with an updated-limit response, not silently partially fulfilled.

### 3. Repayment, Prepayment & Missed-Payment Servicing

Borrowers can track upcoming repayments, make part-prepayments, or catch up on a missed EMI — where the lender supports each, since this is lender-dependent and the LSP should reflect what's actually available per loan.

**Network interaction — part-prepayment:**

- **`/update`**: The borrower requests a part-prepayment (on the drawdown child order for credit lines, or directly on the loan for term loans).
- **`/on_update`**: Payment details $\rightarrow$ payment success $\rightarrow$ quotation updated on the base order. The lender returns the applicable amount and charges; once paid, confirms success and updates the base-order quotation.

**Network interaction — missed EMI:**

- **`/update`**: The borrower requests missed-EMI payment details.
- **`/on_update`**: Payment details $\rightarrow$ payment success on drawdown $\rightarrow$ base transaction quotation updated. Same three-step pattern as part-prepayment, scoped to the missed instalment.

Prepayment charges, if any, should be computed and disclosed before the payment is confirmed, not after — this ties back to the KFS disclosure obligations established at offer stage. Failed mandate collections (e.g., insufficient funds) should be distinguishable in the state model from a borrower-initiated missed payment, since they may trigger different retry and communication flows.

### 4. Foreclosure

**Network interaction:**

- **`/update`**: The borrower requests foreclosure of a drawdown (credit lines) or the loan (term loans).
- **`/on_update`**: Foreclosure payment details $\rightarrow$ payment success $\rightarrow$ base transaction quotation updated. The lender returns the foreclosure amount and charges; once paid, confirms success and updates the base order.

### 5. Credit Line Cancellation

Distinct from foreclosing a single drawdown — this closes the entire credit line.

**Network interaction:**

- **`/cancel`**: The borrower initiates cancellation of the credit line.
- **`/on_cancel`**: The lender shares the current outstanding position.
- **`/on_update` (unsolicited)**: The lender confirms the credit line cancellation once settled.

### 6. Loan Closure & Lifecycle Events

Once all dues are settled, the lender closes the loan or credit line, updates internal systems and credit bureau reporting, and sends closure confirmation to the LSP, which shows the borrower a closure confirmation and, where available, a final statement.

Closure should be treated as a terminal state only after bureau reporting is confirmed updated, not immediately on dues clearing — a premature "closed" status shown ahead of bureau updates can create disputes if the borrower's credit report doesn't reflect it yet. Credit-line closure should also distinguish "closed with zero utilisation" from "closed with outstanding settled to zero," since these may carry different implications for future reapplication with the same lender.

---

## Issue and Grievance Management

IGM handling is standardized across FIS12, so an LSP or lender that has already implemented IGM for another FIS12 lending product (Personal Loans, LAMF) should be able to reuse that implementation for Business Loans rather than building a separate grievance pipeline. A borrower raises a grievance through the LSP, which routes it to the relevant lender via the network's common grievance mechanism; the lender investigates and communicates status and resolution back to the LSP, which relays it to the borrower.
