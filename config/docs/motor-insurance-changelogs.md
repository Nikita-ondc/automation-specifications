### Change Logs: Insurance API specs

##### Motor Insurance

**14th July 2025**

- Created enum values for form headings
  - VEHICLE_DETAILS
  - MANUAL_REVIEW
  - PAN_DOB
  - KYC
  - VEHICLE_NOMINEE_DETAILS
  - PERSONAL_INFO
  - CIS
- Added new CIS form after Personal Info form
- Shifted payment link to on_confirm call from on_init call.
- Changed payment type to PRE-FULFILLMENT
- Added unsolicated on_update call for payment & documents confirmation

**25th August 2025**
- Introduced the `BAP_INPUT` & `INFO` tags at add_ons level

**23rd Oct 2025**
- Added missing tags in the tags section

**20th Feb 2026**
  - Added State Code dropdown and implemented Nominee Relationship dropdown selection in the forms.

**20th Mar 2026**
  - Updated incorrect quote price.
  - Added missing fulfillment state in on_confirm call.

**27th Mar 2026**
  - Added Payment Failure flows for both pre-fulfillment and pre-order stages.
  - Added id field in payments object.

**29th May 2026**
  - Updated GENERAL_INFO tag group with below tags
    ```
      PREMIUM, OWN_DAMAGE_PREMIUM, THIRD_PARTY_PREMIUM, NCB_DISCOUNT_PERCENTAGE, NCB_DISCOUNT_AMOUNT, OD_DISCOUNT_PERCENTAGE, OD_DISCOUNT_AMOUNT
    ```

**14th July 2026**
  - Updated the `SETTLEMENT_TERMS` tag group with `STATIC_TERMS` and `OFFLINE_CONTRACT` only.
  - Added flow `Motor Insurance Application(PRE-ORDER, without CIS)`

**5th August 2026**
  - Updated TLC terms by replacing BUYER_FINDER_FEES and SETTLEMENT_TERMS with BAP_TERMS and BPP_TERMS

**21st August 2026**
  - Removed the extra update/on_update calls from the Motor Insurance Application flow.
