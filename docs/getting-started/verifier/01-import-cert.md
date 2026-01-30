---
title: 📥 Import Issuer Certificate
sidebar_position: 2
---

import ThemedIframe from '../../../src/components/ThemedIframe';

To ensure your verifier app can validate the authenticity of documents from holders, configure the `TrustManager` with trusted issuer certificates. This enhances security and ensures compliance with digital credential standards.

## Steps to Import an IACA Certificate to the [Mutipaz Identity Reader](https://github.com/openwallet-foundation/multipaz-identity-reader) app

### Install the Mutipaz Identity Reader app

* Download from [apps.multipaz.org](http://apps.multipaz.org/)
* Or build it yourself from the [source](https://github.com/openwallet-foundation/multipaz-identity-reader).

### Download the IACA Certificate Multipaz Getting Started Sample uses

* Download the IACA Certificate we used to generate the credential to the reader device
    * [**iaca_certificate.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/iaca_certificate.pem)

### Import the PEM into Mutipaz Identity Reader App

* Open the navigation drawer
* Go to **Settings**
* Select **Trusted issuers**
* Tap the add floating button (bottom right)
* Click **import certificate**
* Select the PEM file you just downloaded

### Scan the document's QR code

* The app will trust the document if the issuer is recognized.

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-identity-reader/blob/0565229028eeb06d349ccd27f4916aba679e201b/composeApp/src/commonMain/kotlin/org/multipaz/identityreader/TrustedIssuersScreen.kt#L157-L162"
/>

The above section deals with the loading of the IACA certs to the TrustManager in the Mutipaz Identity Reader app.