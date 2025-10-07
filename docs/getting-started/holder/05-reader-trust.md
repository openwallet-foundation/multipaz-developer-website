---
title: 🛡️ Reader Trust
sidebar_position: 5
---

The reader trust mechanism ensures that the holder app can check whether the verifier (reader) apps that request the credentials can be trusted. Multipaz uses the `TrustManager` interface to manage and validate trust relationships.

### TrustManager Implementations

Multipaz provides several implementations for managing trust:

* **LocalTrustManager:** Backs trust with local files.
* **VicalTrustManager:** Uses VICAL, following `ISO/IEC 18013-5`.
* **CompositeTrustManager:** Allows stacking multiple trust managers.

### Types of Trust

There are two main types of trust in Multipaz:

* **Issuer trust:** Used by verifier apps to check the authenticity of credentials received from holder devices. See the verifier/issuer trust section (todo: link) for more details.
* **Reader trust:** Used by holder apps to verify the trustworthiness of verifier (reader) apps requesting credentials. This section focuses on reader trust.

### Setting Up Reader Trust

To establish reader trust, add trusted verifier app certificates to your trust manager. When a verifier app requests credentials, the associated key is checked against the trusted keys.

**Example: Adding Trusted Reader Certificates**

```kotlin
class App {
    // ...
    lateinit var readerTrustManager: TrustManagerLocal

    //. . .
    suspend fun init() {
        //. . .

        // Initialize TrustManager
        // Three certificates are configured to handle different verification scenarios:
        // 1. OWF Multipaz TestApp - for testing with the Multipaz test application
        // 2. Multipaz Identity Reader - for APK downloaded from https://apps.multipaz.org/ (production devices with secure boot)
        //    Certificate available from: https://verifier.multipaz.org/identityreaderbackend/readerRootCert
        // 3. Multipaz Identity Reader (Untrusted Devices) - for app compiled from source code at https://github.com/openwallet-foundation/multipaz-identity-reader
        //    Certificate available from: https://verifier.multipaz.org/identityreaderbackend/readerRootCertUntrustedDevices
        // 4. Multipaz Web Verifier - for requesting and verifying mDocs from the web via https://verifier.multipaz.org/
        readerTrustManager = TrustManagerLocal(storage = storage, identifier = "reader")

        try {
            readerTrustManager.addX509Cert(
                certificate = X509Cert.fromPem(
                    Res.readBytes("files/reader_root_cert_multipaz_testapp.pem")
                        .decodeToString()
                ),
                metadata = TrustMetadata(
                    displayName = "OWF Multipaz TestApp",
                    privacyPolicyUrl = "https://apps.multipaz.org"
                )
            )
        } catch (e: TrustPointAlreadyExistsException) {
            e.printStackTrace()
        }

        // Certificate for APK downloaded from https://apps.multipaz.org/
        // This should be used for production devices with secure boot (GREEN state)
        // Certificate source: https://verifier.multipaz.org/identityreaderbackend/readerRootCert
        try {
            readerTrustManager.addX509Cert(
                certificate = X509Cert.fromPem(
                    Res.readBytes("files/reader_root_cert_multipaz_identity_reader.pem")
                        .decodeToString()
                ),
                metadata = TrustMetadata(
                    displayName = "Multipaz Identity Reader",
                    privacyPolicyUrl = "https://verifier.multipaz.org/identityreaderbackend/"
                )
            )
        } catch (e: TrustPointAlreadyExistsException) {
            e.printStackTrace()
        }

        // Certificate for app compiled from source code at https://github.com/openwallet-foundation/multipaz-identity-reader
        // This should be used for development/testing devices or devices with unlocked bootloaders
        // Certificate source: https://verifier.multipaz.org/identityreaderbackend/readerRootCertUntrustedDevices
        try {
            readerTrustManager.addX509Cert(
                certificate = X509Cert.fromPem(
                    Res.readBytes("files/reader_root_cert_multipaz_identity_reader_untrusted.pem")
                        .decodeToString()
                ),
                metadata = TrustMetadata(
                    displayName = "Multipaz Identity Reader (Untrusted Devices)",
                    privacyPolicyUrl = "https://verifier.multipaz.org/identityreaderbackend/"
                )
            )
        } catch (e: TrustPointAlreadyExistsException) {
            e.printStackTrace()
        }

        // This is for https://verifier.multipaz.org website.
        // Certificate source: https://verifier.multipaz.org/verifier/readerRootCert
        try {
            readerTrustManager.addX509Cert(
                certificate = X509Cert.fromPem(
                    Res.readBytes("files/reader_root_cert_multipaz_web_verifier.pem")
                        .decodeToString()
                ),
                metadata = TrustMetadata(
                    displayName = "Multipaz Verifier",
                    privacyPolicyUrl = "https://verifier.multipaz.org"
                )
            )
        } catch (e: TrustPointAlreadyExistsException) {
            e.printStackTrace()
        }
    }
}
```
These cerfiticate files can be downloaded from the following links. They should be placed inside `commonMain/composeResources/files`:

* [**reader_root_cert_multipaz_testapp.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/reader_root_cert_multipaz_testapp.pem)
* [**reader_root_cert_multipaz_identity_reader.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/reader_root_cert_multipaz_identity_reader.pem)
* [**reader_root_cert_multipaz_identity_reader_untrusted.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/iacareader_root_cert_multipaz_identity_reader_untrusted_certificate.pem)
* [**reader_root_cert_multipaz_web_verifier.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/reader_root_cert_multipaz_web_verifier.pem)

With this setup, your holder app will trust the following Multipaz applications as valid readers:
- **OWF Multipaz TestApp** (https://apps.multipaz.org) - For testing and development
- **Multipaz Identity Reader** (https://apps.multipaz.org) - For production devices with secure boot
- **Multipaz Identity Reader (Untrusted Devices & Apps)** (https://github.com/openwallet-foundation/multipaz-identity-reader) - For apps compiled directly from the Mutipaz Identity Reader for development purposes or devices with unlocked bootloaders
- **Multipaz Web Verifier** (https://verifier.multipaz.org/) - For requesting and verifying mDocs from the web

Add additional trusted readers as needed by importing their certificates.
By configuring TrustManager with trusted reader certificates, you ensure that only authorized verifier apps can access user credentials during presentment.

Refer to **[this reader trust code](https://github.com/openwallet-foundation/multipaz-samples/blob/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L175-L233)** for the complete example.
