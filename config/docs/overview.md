# ONDC:RET18 1.2.0 — Overview

## Summary

ONDC:RET18 is the domain specification for buying and selling health and wellness products—medicines, supplements, and related items—over the ONDC network. It enables consumers to discover, purchase, and return these products through a standardized protocol, while allowing sellers to list inventory, fulfill orders, and handle returns without building proprietary shopping platforms.

## Sector & Purpose

The health and wellness sector has historically relied on fragmented retail channels: brick-and-mortar pharmacies, specialized supplement shops, and direct-to-consumer websites. This domain solves a core problem: how to standardize the buying, selling, and fulfillment of medicines and supplements so that any buyer app and any seller can transact reliably together.

Rather than consumers being locked into a single retailer's app or website, ONDC:RET18 creates an open marketplace where consumers can search across sellers, place orders, track fulfillment, and handle cancellations or returns—all through their choice of buyer application, while sellers participate using their own point-of-sale systems integrated with ONDC.

## Real-World Actors

- **Consumers** purchase medicines, vitamins, supplements, and wellness products when they need them—either planned (recurring vitamin orders) or urgent (fever medication, allergy relief).
- **Sellers** are pharmacies, health retailers, supplement brands, and wellness stores that stock and ship these products. They use ONDC to reach customers beyond their physical location or existing customer base.
- **Buyer applications** (apps or websites consumers use) connect to the ONDC network to display available products and let users place orders.
- **The ONDC network** acts as the rails—it routes search queries to sellers, confirms orders, tracks fulfillment, and handles disputes—so buyer and seller apps don't need a direct integration.

## Use Cases

- **Product discovery**: Consumer searches for fish oil or blood pressure medication; ONDC surfaces matching products from available sellers, with prices and availability.
- **Order placement and fulfillment**: Consumer selects a product, completes payment, and the seller ships the order to delivery address.
- **Order cancellation**: Consumer changes their mind before the seller ships; they can cancel and receive a refund.
- **Return and refund**: Consumer receives the order but wants to return it (unopened/defective); they initiate a return, send the product back, and receive a refund.
- **Seller-initiated cancellation**: Seller discovers an item is out of stock after order confirmation and cancels the order, notifying the consumer.
- **Inventory refresh**: Sellers push updated product catalogs and stock levels to the network so buyer apps always show accurate availability.

## Key Concepts

- **Medicine and supplements** are the core product categories—anything from prescription alternatives and OTC medicines to vitamins, herbal remedies, and wellness supplements.
- **Standardized discovery and fulfillment**: All sellers expose inventory the same way, and all buyer apps search the same way, removing friction.
- **Order lifecycle management**: Beyond the simple purchase, this domain handles partial returns (customer ordered 10 bottles, returns 3), cancellations at different stages (before and after shipment), and out-of-stock errors.
- **Seller autonomy**: Sellers manage their own inventory, pricing, and fulfillment; ONDC is the communication layer, not the warehouse.
- **Trust and transparency**: Consumers know who the seller is, order tracking is real-time, and disputes are structured (return policies, refund timelines).

## Example Scenario

A consumer uses their preferred shopping app to search for "fish oil supplement." The app queries the ONDC network, which returns results from five nearby health retailers with stock. The consumer compares prices (₹499 vs. ₹525), selects the cheapest option from a trusted seller, and checks out. 

The ONDC network confirms the order with the seller. The seller picks the fish oil bottle from their shelf and ships it via courier, and ONDC relays tracking information back to the consumer's app in real time.

Three days later, the consumer receives the package. Everything is as described, and they keep it. Had the product arrived damaged or been the wrong variant, they would have initiated a return through their app, shipped it back, and received a refund—all coordinated through ONDC without needing to call the seller or navigate a separate website.
