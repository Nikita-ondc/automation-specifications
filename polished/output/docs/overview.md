# ONDC:RET15 1.2.5 — Overview

## Summary

ONDC:RET15 is the ONDC open-network domain for retail trade in home appliances. It defines a standardized set of interactions that lets consumers discover and purchase large household appliances — such as air conditioners, refrigerators, and washing machines — from electronics stores through any ONDC-compatible buyer app. Version 1.2.5 covers the complete purchase lifecycle, from product discovery through delivery, financing, returns, and grievance resolution.

## Sector & Purpose

**Sector:** Consumer electronics and home appliances retail.

The home appliances segment involves high-value, considered purchases where buyers compare models, check availability, and often need financing options or post-purchase service. Before open-network commerce, a consumer's ability to shop across multiple electronics retailers was limited to whichever platform each seller had individually integrated with. ONDC:RET15 solves this by providing a shared protocol that allows any electronics retailer to list appliance inventory once and make it accessible to buyers across all ONDC-connected buyer applications — widening reach for sellers and widening choice for consumers without requiring bilateral integrations.

## Real-World Actors

| Actor | Who They Are in Practice |
|---|---|
| **Buyer** | A household consumer shopping for a home appliance — for example, someone looking to replace a broken refrigerator or buy a new split AC before summer |
| **Buyer-side platform** | The consumer-facing shopping app or portal the buyer uses to search, compare, and place orders |
| **Electronics retailer / seller** | A local electronics store, a national appliance chain, or an authorised brand outlet that lists its inventory and fulfils orders |
| **Seller-side platform** | The backend system the electronics store uses to manage its catalog, accept orders, and coordinate delivery |
| **Logistics provider** | The party that physically delivers the appliance (often handled by the seller or a specialist large-item courier) |

## Use Cases

- **Appliance discovery** — a buyer searches for a specific appliance (e.g., a 1.5-ton inverter AC) and receives matching listings from multiple electronics retailers on the network
- **Full and incremental catalog publishing** — retailers publish their complete appliance catalog or push only new/updated listings so buyers always see current stock and pricing
- **Order placement and delivery** — end-to-end purchase flow from cart confirmation through scheduled delivery of the appliance to the buyer's home
- **Purchase financing** — buyers can opt for an EMI or buy-now-pay-later arrangement at checkout, enabling high-value appliance purchases without upfront payment
- **Out-of-stock handling** — the seller signals stock unavailability mid-order so the buyer can be notified and the order resolved gracefully, with or without an error code
- **Buyer-initiated cancellation** — the buyer cancels before or after dispatch
- **Seller-initiated and force cancellation** — the retailer or the network cancels the order (e.g., item no longer available, fulfilment failure)
- **Return flow** — the buyer initiates a return of a delivered appliance
- **Replacement flow** — a defective or wrong appliance is swapped for the correct one
- **Grievance management (IGM)** — buyers raise post-delivery issues; the flow supports resolution, rejection of the grievance, and no-action outcomes under the ONDC Issue and Grievance Management framework
- **Customization input** — capturing buyer-specified details (e.g., preferred installation date, colour variant) as free-text at order time
- **SNP payment collection** — scenarios where the seller-side participant collects payment directly rather than routing through the buyer-side platform
- **Catalog rejection** — the network signals back that a submitted catalog entry does not meet compliance requirements

## Key Concepts

- **Appliance catalog and incremental refresh** — retailers maintain a live product catalog on the network; integrators must handle both full-catalog pulls (initial sync) and incremental updates (price changes, stock changes, new SKUs) including pull-based refresh to keep listings accurate without full re-uploads
- **Order lifecycle management** — an appliance order passes through discovery, selection, quoting, confirmation, fulfilment, and post-fulfilment states; each state transition is a distinct protocol action, and integrators must handle all paths including mid-lifecycle cancellations and stock-outs
- **Post-purchase flows: returns and replacements** — large-appliance purchases carry a higher return and replacement rate than FMCG; integrators must implement both the return flow (item goes back, refund issued) and the replacement flow (item swapped) as separate, distinct message sequences
- **Purchase financing** — the domain supports an in-band financing option at checkout; seller-side integrators need to handle the financing confirmation step before order confirmation is finalised
- **Issue and Grievance Management (IGM)** — ONDC's structured grievance protocol overlays the delivery flow; integrators must handle three IGM outcomes: resolution accepted, grievance rejected by the seller, and no action taken — each has its own message sequence

## Example Scenario

A consumer wants to replace an ageing refrigerator before the summer. She opens her preferred shopping app (which is connected to the ONDC network), searches for a 300-litre double-door refrigerator, and sees listings from several electronics stores in her city — a local multi-brand outlet, a regional chain, and an authorised brand store — all surfaced through a single search.

She selects a model from the local electronics store, which has it in stock. The store's system has published a full catalog to the network, and recent price updates have already been pushed via an incremental catalog refresh, so she sees the current promotional price.

At checkout, she opts to pay in monthly instalments through the network's purchase financing flow. Once the financing is confirmed, the order is placed and the store schedules home delivery for the following Saturday.

On the day of delivery, the appliance arrives but the door seal is found to be damaged out of the box. The consumer raises a grievance through her buyer app under the IGM framework. The electronics store reviews the complaint and approves a replacement; the damaged unit is collected and an identical unit is dispatched within two days. The replacement flow completes, the grievance is marked resolved, and the order lifecycle closes.
