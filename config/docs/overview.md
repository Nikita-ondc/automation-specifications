# ONDC:RET14 1.2.5 — Overview

## Summary

ONDC:RET14 is the retail domain specification for electronics transactions on the ONDC (Open Network for Digital Commerce) network. It enables consumers to discover, purchase, pay for, receive, and manage electronics products through any ONDC-compliant buyer app, while sellers operate independently via any ONDC-compliant seller app—breaking down walled gardens in electronics retail.

## Sector & Purpose  


**Sector:** Electronics retail (excluding large home appliances, which operate under a separate domain)

**Problem solved:** Traditionally, consumers shopping for electronics are locked into specific seller platforms or aggregator apps; sellers are fragmented across marketplaces. This domain creates an open, interoperable network where any consumer app can discover electronics from any seller app on equal terms. A consumer using one ONDC buyer app can access the same catalog as any other, and sellers aren't forced into proprietary integrations.

## Real-World Actors

- **Consumers**: End buyers searching for and purchasing electronics—phones, laptops, tablets, cameras, wearables, and similar categories.
- **Electronics retailers & brands**: Shops and manufacturers selling products directly via ONDC seller apps.
- **Buyer App Provider (BAP)**: The consumer-facing mobile or web application (e.g., a shopping app) through which a consumer discovers and buys. Multiple BAPs coexist on the network; each connects to the same seller base.
- **Seller App Provider (BPP)**: The retail system (e.g., a store's inventory and order management system) that lists products and processes transactions. Each seller operates one BPP; many BPPs run in parallel on the network.

## Use Cases

- **Discovery**: Consumer searches for electronics by category, brand, or model; apps return results from all sellers on the network.
- **Customization**: Buyer specifies options (color, storage capacity, warranty tier) before purchase.
- **Purchase & payment**: Consumer adds items to cart, checks out, and pays—seller receives order confirmation in real time.
- **Delivery management**: Logistics partner picks up order and delivers; buyer and seller track status together.
- **Cancellation**: Buyer or seller can cancel an order before shipment; refunds are processed automatically.
- **Returns & replacements**: Buyer initiates return (defect, wrong item, change of mind); seller approves and arranges pickup.
- **Installment finance**: Payment split into installments through ONDC-linked finance providers.
- **Issue resolution**: Disputes (wrong item, damage in transit, delayed delivery) are escalated to a neutral issue-management system (IGM) for investigation and settlement.

## Key Concepts

- **Catalog flows**: Sellers push full catalogs on demand or send incremental updates. Apps pull and sync periodically to stay current.
- **Order state machine**: Once a purchase completes, the order flows through confirm → pack → ship → deliver, with both parties notified at each step.
- **Cancellation & reversal**: Either party can cancel before goods ship. Refunds are automatic; no manual intervention needed.
- **Issue escalation**: Post-delivery disputes (damage, missing items, quality) are logged in an integrated issue-management system for third-party review, not handled by the seller alone.
- **Payment orchestration**: ONDC routes payments through registered payment gateways; sellers never hold consumer funds directly.

## Example Scenario

A consumer opens an ONDC buyer app (App A) and searches for "smartphone". The app queries the ONDC network and returns results from 20+ electronics retailers, including big chains and independent shops. The consumer finds a specific model at a competitive price from a local store, checks the battery warranty option (customization), and completes payment in two installments via a finance provider. The store's seller system (BPP) confirms the order immediately; the consumer receives a tracking link in App A and follows delivery in real time. When the phone arrives, the consumer opens it and discovers the screen is scratched. They file a return request in App A, which logs it in the ONDC issue-management system. An auditor reviews the damage claim, the seller agrees to replace it, and a new unit is shipped within two days. Throughout, neither the consumer nor the seller uses each other's proprietary app—they operate through ONDC alone, on equal footing with all other buyers and sellers in the electronics domain.
