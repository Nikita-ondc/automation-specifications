# ONDC:RET11 1.2.5 — Overview

## Summary

ONDC:RET11 is the Food & Beverages retail domain on the ONDC network, version 1.2.5. It enables consumers to discover, order, and receive food and beverages from restaurants, food carts, and other F&B outlets through any ONDC-compatible buyer application. The domain standardises the entire transactional lifecycle — from menu browsing to delivery and post-order resolution — so that any buyer app can interoperate with any seller platform on the network.

## Sector & Purpose

**Sector:** Food & Beverages (F&B) retail

The fragmented nature of food ordering in India means that restaurants and food carts are often locked into proprietary platforms, and consumers must juggle multiple apps to access different outlets. ONDC:RET11 solves this by providing an open, interoperable protocol layer specifically for F&B transactions. Any restaurant or cart registered on the ONDC network — regardless of which seller-side platform they use — becomes discoverable and orderable through any buyer-side application that implements this domain. This breaks platform dependency for both sellers and consumers, and lowers the barrier for small food businesses (such as street-side carts) to participate in digital commerce.

## Real-World Actors

- **Consumers** — individuals who want to order food or beverages for home delivery, scheduled delivery, or self-pickup from a nearby outlet
- **Restaurants** — brick-and-mortar F&B establishments with a menu, kitchen, and defined service area (e.g., Katani Restaurant)
- **Food Carts & Street Vendors** — smaller, often informal sellers operating from a fixed or semi-fixed location, offering a limited menu (e.g., a paratha cart)
- **Buyer App Operators** — the digital platforms through which consumers browse and place orders (analogous to what a consumer-facing food ordering app does today)
- **Seller App Operators / Logistics Providers** — platforms that onboard restaurants and carts, manage their catalogues, and coordinate fulfillment or delivery

## Use Cases

- **Menu discovery** — browsing a full or incrementally updated catalogue of food items, prices, variants, and offers from nearby F&B outlets
- **Placing an order** — selecting items, applying offers or discounts, confirming delivery address and instructions, and checking out
- **Scheduled / slotted delivery** — choosing a specific delivery time slot for the order to arrive
- **Self-pickup** — consumer opts to collect the order directly from the outlet rather than requesting delivery
- **Multi-option fulfillment** — selecting from multiple available delivery or pickup options at order time
- **Buyer-initiated cancellation** — consumer cancels an order before or after confirmation
- **Force cancellation** — system or seller-side cancellation when fulfillment is not possible
- **Out-of-stock handling** — graceful communication to the buyer when an ordered item is unavailable, with or without an error code
- **Return flow** — raising a return or liquidation request for a delivered order
- **RTO + partial cancellation** — handling a Return to Origin event alongside a partial item cancellation
- **Grievance management (IGM)** — raising, responding to, and resolving post-order issues using the ONDC Issue & Grievance Management framework (v1.0.0 and v2.0.0)
- **Offers flow** — applying and validating promotional offers during checkout
- **Commercial model flows** — managing buyer network participant (BNP) and seller network participant (SNP) commercial arrangements

## Key Concepts

- **Catalogue (Full & Incremental)** — The seller publishes its menu as a structured catalogue. A *full catalogue* sync sends the entire menu; an *incremental catalogue* sync pushes only the changes (new items, price updates, stock changes). Integrators must handle both modes to keep the buyer's view of the menu accurate.
- **Fulfillment Types** — An order can be fulfilled via home delivery (standard or slotted), self-pickup, or multi-option fulfillment. Each type carries different state machines and logistics coordination requirements.
- **Order Lifecycle States** — An F&B order moves through well-defined states (search → select → init → confirm → fulfillment updates → completion or cancellation). Understanding these state transitions is essential for building a compliant integration.
- **IGM (Issue & Grievance Management)** — Post-order complaints (wrong item, missing delivery, quality issues) are handled through a structured IGM flow. Two versions (v1.0.0 and v2.0.0) are supported; v2.0.0 adds rejection and no-action resolution paths.
- **BNP / SNP Commercial Model** — The network distinguishes between the Buyer Network Participant (the platform the consumer uses) and the Seller Network Participant (the platform the restaurant or cart uses). Commercial terms — such as convenience fees and commissions — are negotiated and communicated through a dedicated protocol flow, not out-of-band.

## Example Scenario

A consumer opens their preferred ONDC-compatible food ordering app and searches for breakfast options near their location. The app queries the network and surfaces **Katani Restaurant**, a local eatery that has onboarded via a seller platform.

The consumer browses Katani's menu — delivered as a full catalogue response — and selects an **aloo paratha** with a side of pickle. They confirm their delivery address, add a note requesting extra butter (buyer instruction), and choose standard home delivery. The order is confirmed on the network.

Katani's kitchen prepares the paratha. As the order moves through fulfillment, status updates flow back to the consumer's app in real time. The delivery agent picks up the order and delivers it to the consumer's door.

Later, the consumer notices the pickle was missing. They raise a grievance through the IGM flow. The seller platform acknowledges the complaint, investigates, and closes the issue with a resolution — all tracked on-network, with no need for off-platform calls or emails.

Every step of this journey — discovery, ordering, delivery, and grievance resolution — is handled by the 20 flows and 21 actions defined in ONDC:RET11 1.2.5.
