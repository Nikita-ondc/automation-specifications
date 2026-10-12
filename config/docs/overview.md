# ONDC:NTS10 1.0.0 — Overview

## Summary
ONDC:NTS10 carries the Reconciliation and Settlement Framework (RSF 1.0) between network participants. After the collector has moved funds to the receiver's bank account directly, the collector shares the order book and settlement details with the receiver, and the receiver responds with a confirmation or the deviations it found.

## Real-World Actors
- **Collector** (e.g. buyer app): collects the payment for orders and settles the receiver's share.
- **Receiver** (e.g. seller app): receives its share and reconciles it against its orders and bank statement.

## APIs in scope
- `receiver_recon` — collector → receiver: order book with UTR / settlement reference.
- `on_receiver_recon` — receiver → collector: confirmation or deviations. Optional; orders not responded to are deemed settled.

## Use Cases
- RSF
- Paid appropriately
- Underpaid / overpaid with a correction settlement
- Unsolicited on_receiver_recon for orders that were not paid
