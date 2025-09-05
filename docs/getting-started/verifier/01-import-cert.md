---
title: 📥 Import Issuer Certificate
sidebar_position: 2
---

import ThemedIframe from '../../../src/components/ThemedIframe';

To ensure your verifier app can validate the authenticity of documents from holders, configure the `TrustManager` with trusted issuer certificates. This enhances security and ensures compliance with digital credential standards.

##### Steps to Import an IACA Certificate to the [MpzIdentityReader](https://github.com/davidz25/MpzIdentityReader) app

1. Install the MpzIdentityReader app
    1. Download from [apps.multipaz.org](http://apps.multipaz.org/)
    2. Or build it yourself from the [source](https://github.com/davidz25/MpzIdentityReader).

2. **Export the IACA certificate**
    1. Use the following in your app to print the PEM:

    ```kotlin
    class App {
        // ...
        suspend fun init() {
            // ...
            val iacaCert = MdocUtil.generateIacaCertificate(
                // ...
            )
            println(iacaCert.toPem().toString()) // print the IACA certificate
        }
    }
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