---
title: 📡 Read a Credential over Proximity
---

import ThemedIframe from '../../../src/components/ThemedIframe';

The POS accepts an ISO/IEC 18013-5 engagement over NFC or by scanning an `mdoc:` QR code. Once it
has the engagement, it creates a session transcript, builds the request against that transcript,
and starts the reader exchange.

## Model the reader lifecycle

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/shared/src/commonMain/kotlin/org/multipaz/pos/proximity/ProximityReaderModel.kt#L76-L152"
/>

- `ProximityReaderModel` keeps the engagement, request, and result in a small state machine so the UI cannot start a transfer before it has both an endpoint and a request.
- `setConnectionEndpoint()` moves the model to `WAITING_FOR_DEVICE_REQUEST` state. At that point, create our request using the session transcript; then call `setDeviceRequest()` and start the exchange. This order prevents a request from being detached from the specific proximity session.

## Send the request and receive the response

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/shared/src/commonMain/kotlin/org/multipaz/pos/proximity/ProximityReaderFlow.kt#L15-L62"
/>

The above code block: 
- Opens an [`MdocTransport`](https://developer.multipaz.org/kdocs/multipaz/org.multipaz.mdoc.transport/index.html) request to the other peer.
- Sends the request through ISO/IEC 18013-5 [`SessionEncryption`](https://developer.multipaz.org/kdocs/multipaz/org.multipaz.mdoc.sessionencryption/index.html)
- And closes the transport whether the holder responds or not surfacing the outcomes

The flow returns an explicit outcome for no response, a non-zero device-response status, or a successful response. Surface those outcomes to the cashier; do not advance the sale until the authoritative settlement step succeeds.