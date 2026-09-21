---
title: 💳 Create a Payment Request
---

import ThemedIframe from '../../../src/components/ThemedIframe';

Before asking a holder to present a payment credential, the POS reserves a pending transaction with
the terminal backend. It then builds an ISO/IEC 18013-5
[`DeviceRequest`](https://developer.multipaz.org/kdocs/multipaz/org.multipaz.mdoc.request/index.html)
that asks for only the claims needed for the receipt and includes `transaction_data` containing the
exact payment details.

The holder device signs this transaction data as part of the response. That binds the customer's
authorization to the transaction ID, amount, currency, and payee—not merely to a generic request.

## Reserve and bind the transaction

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/shared/src/commonMain/kotlin/org/multipaz/pos/proximity/VerificationProximityTransferScreen.kt#L277-L328"
/>

Here, the following operations are performed:
- Reserve a server-side transaction
- Serialize the ISO/IEC 18013 request data payload that contains the amount, payee and other details
- Create a device request with this payload embedded in the transaction-data element

Adapt these values for your merchant:

- `CARD_DOCTYPE` and namespace — the credential type your terminal accepts.
- Requested claims — request the minimum data required for the payment and receipt.
- `TERMINAL_PAYEE_NAME`, `TERMINAL_PAYEE_ID`, and currency — values the holder should see and authorize.
- `payeeAccount` — the account that the authoritative payment service credits.

Do not treat the returned data as sufficient proof by itself. The records server must verify issuer
trust, the device signature, and that the signed transaction matches the reservation before it
settles the payment.
