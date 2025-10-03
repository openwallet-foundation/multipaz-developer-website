---
title: 📥 Import Issuer Certificate
sidebar_position: 2
---

import ThemedIframe from '../../../src/components/ThemedIframe';

To ensure your verifier app can validate the authenticity of documents from holders, configure the `TrustManager` with trusted issuer certificates. This enhances security and ensures compliance with digital credential standards.

## Steps to Import an IACA Certificate to the [MpzIdentityReader](https://github.com/davidz25/MpzIdentityReader) app

### Install the MpzIdentityReader app

* Download from [apps.multipaz.org](http://apps.multipaz.org/)
* Or build it yourself from the [source](https://github.com/davidz25/MpzIdentityReader).

### Download the IACA Certificate Multipaz Getting Started Sample uses

* Download the IACA Certificate we used to generate the credential to the reader device
    * [**iaca_certificate.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/iaca_certificate.pem)

### Import the PEM into MpzIdentityReader

* Open the navigation drawer
* Go to **Settings**
* Select **Trusted issuers**
* Tap the add floating button (bottom right)
* Click **import certificate**
* Select the PEM file you just downloaded

### Scan the document's QR code

* The app will trust the document if the issuer is recognized.

<ThemedIframe
  githubUrl="https://github.com/davidz25/MpzIdentityReader/blob/cdd2a4f05c2cb6e95014f66683b90986ce07a35d/composeApp/src/commonMain/kotlin/org/multipaz/identityreader/TrustedIssuersScreen.kt#L156-L160"
/>

The above section deals with the loading of the IACA certs to the TrustManager in the MpzIdentityReader app.