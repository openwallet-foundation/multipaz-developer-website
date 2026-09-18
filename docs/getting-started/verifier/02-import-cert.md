---
title: 🔐 Configure Terminal Trust
---

import ThemedIframe from '../../../src/components/ThemedIframe';

The POS terminal has two distinct trust boundaries:

![POS Trust](/img/pos-trust.png#gh-light-mode-only)
![POS Trust](/img/pos-trust-dark.png#gh-dark-mode-only)
[<p align="center">Source (.excalidraw)</p>](/img/pos-trust.excalidraw)

- The **terminal backend** authenticates the POS app using device attestation and the configured app
  package/signing-certificate digest.
- The **records server** verifies the payment credential's issuer chain and the holder's signature
  over the payment transaction data.

Keeping the payment-processor key on the terminal backend is essential: distributing it in every
POS application build would allow a compromised terminal to impersonate the merchant.

## Connect to the terminal backend

[`RpcAuthorizedDeviceClient`](https://developer.multipaz.org/kdocs/multipaz/org.multipaz.rpc.client/index.html)
establishes the authenticated app-to-backend connection. The backend validates the
[device attestation](https://developer.multipaz.org/kdocs/multipaz/org.multipaz.device/index.html)
before it exposes the payment RPC interface.

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/shared/src/commonMain/kotlin/org/multipaz/pos/payment/RpcPaymentSettler.kt#L22-L42"
/>

- Here we open an attested RPC session and retains the generated payment client only when registration succeeds. Put the backend URL and merchant account in configuration, rather than hard-coding them throughout UI code.
- The configruration is kept in the [default-configuration.json](https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/terminalBackend/src/main/resources/resources/default_configuration.json) file

## Keep the payment key out of the app

The backend forwards approved calls to the records server, signing as the payment processor. This
is where the money-moving key belongs.

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/terminalBackend/src/main/kotlin/org/multipaz/pos/terminal/TerminalPaymentProcessor.kt#L23-L62"
/>

- It accepts only calls authorized by the terminal backend, then forwards them to the records server using the backend's `PAYMENT_PROCESSOR` identity. The POS client never receives that identity's private key.

For production, require hardware-backed attestation, use TLS, store the processor key in managed
key storage or an HSM, and enroll the terminal with the records server's real trust hierarchy.