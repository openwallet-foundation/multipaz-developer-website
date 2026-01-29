---
title: 🏢 Issuer Trust
sidebar_position: 3
---

import ThemedIframe from '../../../src/components/ThemedIframe';

Issuer trust ensures that credentials presented by a holder app are authentic and issued by trusted authorities. This is critical for verifier apps, which must validate the provenance of documents received from other devices.

### **TrustManager Implementations**

Multipaz uses the `TrustManager` interface to manage trust relationships. The following implementations are available:

* **LocalTrustManager:** Uses locally stored files to back trust.
* **VicalTrustManager:** Implements trust using VICAL, in compliance with ISO/IEC 18013-5.
* **CompositeTrustManager:** Allows you to stack multiple trust managers for flexible trust verification.

#### **Types of Trust**

Multipaz distinguishes between two types of trust:

* **Issuer Trust:**
    * Used by verifier apps.
    * Verifies the credentials of documents received from holder apps on other devices.
    * Relies on trusted issuer certificates (PEMs).
* **Reader Trust:**
    * Used by holder apps.
    * Verifies the identity of verifier (reader) apps requesting credentials.
    * This was already handled in the [holder/reader-trust section](../holder/reader-trust)

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-identity-reader/blob/0565229028eeb06d349ccd27f4916aba679e201b/composeApp/src/commonMain/kotlin/org/multipaz/identityreader/ShowResultsScreen.kt#L154-L216"
/>

The above section deals with the verification of trust of the received document in the Mutipaz Identity Reader app.