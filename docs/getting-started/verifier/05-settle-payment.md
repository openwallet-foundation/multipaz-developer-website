---
title: ✅ Settle the Payment
---

import ThemedIframe from '../../../src/components/ThemedIframe';

After a successful proximity exchange, preserve the complete request, response, session transcript,
and reader key in an
[`Iso18013PresentmentRecord`](https://developer.multipaz.org/kdocs/multipaz/org.multipaz.verification/index.html).
Submit that record to the terminal backend; the records server is the authority that verifies it and
moves funds.

## Commit only a completed presentment

The POS converts a successful reader outcome into a presentment record. A missing response or a
non-zero status becomes an error path instead.

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/shared/src/commonMain/kotlin/org/multipaz/pos/proximity/VerificationProximityTransferScreen.kt#L331-L366"
/>

## Treat settlement as the decision point

The UI calls `commit()` only after it has a complete presentment record. It shows approval only
after the backend returns a transaction ID; transfer, cancellation, and settlement errors all become
a declined sale with a reason the cashier can act on.

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/shared/src/commonMain/kotlin/org/multipaz/pos/App.kt#L95-L134"
/>

- This code block commits the record, creates an approved receipt state only from the server's transaction ID, and maps cancellation, transfer, and server errors to a declined state.

Never settle based solely on claims extracted in the terminal UI. The server must verify the issuer
and device signatures, match the device-signed payment data to the reserved transaction, and ensure
the transaction has not already been committed.