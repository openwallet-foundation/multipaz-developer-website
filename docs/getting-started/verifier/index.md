---
title: Verifier
---

import DocCardList from '@theme/DocCardList'

## **🕵️ Verifier**

Learn how to build a verifier from the merchant's point of view. This guide follows the
[Multipaz Wholesale POS](https://github.com/openwallet-foundation/multipaz-samples/tree/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS)
reference app.

Multipaz Wholesale POS is a point-of-sale terminal that accepts payments from a customer's Digital Payment Credential (DPC) presented over ISO 18013-5 proximity (NFC tap or QR + BLE), using Multipaz. It reads the customer's DPC, has the customer's device cryptographically authorize the exact amount (SCA payment transaction_data), and settles the payment on a ledger — moving funds from the customer's account to the merchant's account on a Multipaz records server (the "System of Record", or SoR). The POS app itself holds no signing key: it proves it is a genuine terminal build via device attestation to a small terminal backend, which holds the payment key.

The POS is deliberately split into an app and a terminal backend. The app reads the credential but
does not hold the payment signing key. It proves that it is a genuine terminal build through device
attestation; the backend holds the key and asks the records server to settle the transaction.

![POS](/img/pos.png#gh-light-mode-only)
![POS](/img/pos-dark.png#gh-dark-mode-only)
[<p align="center">Source (.excalidraw)</p>](/img/pos.excalidraw)

**What this diagram shows:** The holder shares a credential with the POS over proximity. The POS
creates a [DeviceRequest](https://developer.multipaz.org/kdocs/multipaz/org.multipaz.mdoc.request/index.html)
bound to the payment details, while the backend—not the app—holds the authority used to settle the
transaction.

Start with the runnable demo to see the complete experience, then work through the implementation
pages. Each contains a focused excerpt from the runnable POS source; use the source link below an
excerpt when you need the surrounding UI or plumbing.

<div style={{
  background: "var(--ifm-background-surface-color)",
  padding: "2rem 1rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginTop: "2rem"
}}>
  <DocCardList />
</div>