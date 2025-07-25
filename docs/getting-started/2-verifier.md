---
title: Verifier
sidebar_position: 4
---

import ThemedIframe from '../../src/components/ThemedIframe';

## **🕵️ Verifier**

Learn how to implement a Verifier app using the Multipaz SDK to request and validate verifiable credentials from users, enabling secure and privacy-preserving identity verification.

**Note:**

This section of the Get Started guide is a work in progress. The reference implementation can be found in the [MpzIdentityReader](https://github.com/davidz25/MpzIdentityReader) sample app. A standalone module with a streamlined interface is coming soon. Until then, use the existing MpzIdentityReader app as your guide.

### **Adding a Trusted Issuer Certificate**

To ensure your verifier app can validate the authenticity of documents from holders, configure the `TrustManager` with trusted issuer certificates. This enhances security and ensures compliance with digital credential standards.

##### Steps to Import an IACA Certificate to the [MpzIdentityReader](https://github.com/davidz25/MpzIdentityReader) app

1. Install the MpzIdentityReader app
    1. Download from [apps.multipaz.org](http://apps.multipaz.org/)
    2. Or build it yourself from the [source](https://github.com/davidz25/MpzIdentityReader).

2. **Export the IACA certificate**
    1. Use the following in your app to print the PEM:
    
    ```kotlin
    println(iacaCert.toPem().toString()) 
    ```
3. **Import the PEM into MpzIdentityReader**
    1. Open the navigation drawer
    2. Go to **Settings**
    3. Select **Trusted issuers**
    4. Tap the add floating button (bottom right)
    5. Click **import certificate**
    6. Select the PEM file you just created
4. **Scan the document's QR code**
    1. The app will trust the document if the issuer is recognized.

<ThemedIframe
  githubUrl="https://github.com/davidz25/MpzIdentityReader/blob/cdd2a4f05c2cb6e95014f66683b90986ce07a35d/composeApp/src/commonMain/kotlin/org/multipaz/identityreader/TrustedIssuersScreen.kt#L156-L160"
/>

The above section deals with the loading of the IACA certs to the TrustManager in the MpzIdentityReader app.

## **🏢 Issuer Trust**

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
    * This was already handled in the holder/reader trust section (todo: link)

<ThemedIframe
  githubUrl="https://github.com/davidz25/MpzIdentityReader/blob/cdd2a4f05c2cb6e95014f66683b90986ce07a35d/composeApp/src/commonMain/kotlin/org/multipaz/identityreader/ShowResultsScreen.kt#L144-L210"
/>

The above section deals with the verification of trust of the received document in the MpzIdentityReader app.

## **📷 Read a QR Code**

The following section deals with the reading of a QR code in the MpzIdentityReader app.

<ThemedIframe
  githubUrl="https://github.com/davidz25/MpzIdentityReader/blob/cdd2a4f05c2cb6e95014f66683b90986ce07a35d/composeApp/src/commonMain/kotlin/org/multipaz/identityreader/ScanQrScreen.kt#L90-L103"
/>

By following these steps and using the MpzIdentityReader app as a reference, you can develop a robust verifier app that securely checks the authenticity and provenance of digital credentials.