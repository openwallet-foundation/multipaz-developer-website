---
title: 🛡️ Reader Trust
sidebar_position: 6
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
lateinit var readerTrustManager: TrustManager

//. . .

// Initialize TrustManager

// Three certificates are configured to handle different verification scenarios:
// 1. OWF Multipaz TestApp - for testing with the Multipaz test application
// 2. Multipaz Identity Reader - for APK downloaded from https://apps.multipaz.org/ (production devices with secure boot)
//    Certificate available from: https://verifier.multipaz.org/identityreaderbackend/readerRootCert
// 3. Multipaz Identity Reader (Untrusted Devices) - for app compiled from source code at https://github.com/davidz25/MpzIdentityReader
//    Certificate available from: https://verifier.multipaz.org/identityreaderbackend/readerRootCertUntrustedDevices
readerTrustManager = TrustManagerLocal(storage = storage, identifier = "reader")

try {
    readerTrustManager.addX509Cert(
        certificate = X509Cert.fromPem(
            """
                    -----BEGIN CERTIFICATE-----
                    MIICUTCCAdegAwIBAgIQppKZHI1iPN290JKEA79OpzAKBggqhkjOPQQDAzArMSkwJwYDVQQDDCBP
                    V0YgTXVsdGlwYXogVGVzdEFwcCBSZWFkZXIgUm9vdDAeFw0yNDEyMDEwMDAwMDBaFw0zNDEyMDEw
                    MDAwMDBaMCsxKTAnBgNVBAMMIE9XRiBNdWx0aXBheiBUZXN0QXBwIFJlYWRlciBSb290MHYwEAYH
                    KoZIzj0CAQYFK4EEACIDYgAE+QDye70m2O0llPXMjVjxVZz3m5k6agT+wih+L79b7jyqUl99sbeU
                    npxaLD+cmB3HK3twkA7fmVJSobBc+9CDhkh3mx6n+YoH5RulaSWThWBfMyRjsfVODkosHLCDnbPV
                    o4G/MIG8MA4GA1UdDwEB/wQEAwIBBjASBgNVHRMBAf8ECDAGAQH/AgEAMFYGA1UdHwRPME0wS6BJ
                    oEeGRWh0dHBzOi8vZ2l0aHViLmNvbS9vcGVud2FsbGV0LWZvdW5kYXRpb24tbGFicy9pZGVudGl0
                    eS1jcmVkZW50aWFsL2NybDAdBgNVHQ4EFgQUq2Ub4FbCkFPx3X9s5Ie+aN5gyfUwHwYDVR0jBBgw
                    FoAUq2Ub4FbCkFPx3X9s5Ie+aN5gyfUwCgYIKoZIzj0EAwMDaAAwZQIxANN9WUvI1xtZQmAKS4/D
                    ZVwofqLNRZL/co94Owi1XH5LgyiBpS3E8xSxE9SDNlVVhgIwKtXNBEBHNA7FKeAxKAzu4+MUf4gz
                    8jvyFaE0EUVlS2F5tARYQkU6udFePucVdloi
                    -----END CERTIFICATE-----
                """.trimIndent().trim()
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
            """
                    -----BEGIN CERTIFICATE-----
                    MIICYTCCAeegAwIBAgIQOSV5JyesOLKHeDc+0qmtuTAKBggqhkjOPQQDAzAzMQswCQYDVQQGDAJV
                    UzEkMCIGA1UEAwwbTXVsdGlwYXogSWRlbnRpdHkgUmVhZGVyIENBMB4XDTI1MDcwNTEyMjAyMVoX
                    DTMwMDcwNTEyMjAyMVowMzELMAkGA1UEBgwCVVMxJDAiBgNVBAMMG011bHRpcGF6IElkZW50aXR5
                    IFJlYWRlciBDQTB2MBAGByqGSM49AgEGBSuBBAAiA2IABD4UX5jabDLuRojEp9rsZkAEbP8Icuj3
                    qN4wBUYq6UiOkoULMOLUb+78Ygonm+sJRwqyDJ9mxYTjlqliW8PpDfulQZejZo2QGqpB9JPInkrC
                    Bol5T+0TUs0ghkE5ZQBsVKOBvzCBvDAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIB
                    ADBWBgNVHR8ETzBNMEugSaBHhkVodHRwczovL2dpdGh1Yi5jb20vb3BlbndhbGxldC1mb3VuZGF0
                    aW9uLWxhYnMvaWRlbnRpdHktY3JlZGVudGlhbC9jcmwwHQYDVR0OBBYEFM+kr4eQcxKWLk16F2Rq
                    zBxFcZshMB8GA1UdIwQYMBaAFM+kr4eQcxKWLk16F2RqzBxFcZshMAoGCCqGSM49BAMDA2gAMGUC
                    MQCQ+4+BS8yH20KVfSK1TSC/RfRM4M9XNBZ+0n9ePg9ftXUFt5e4lBddK9mL8WznJuoCMFuk8ey4
                    lKnb4nubv5iPIzwuC7C0utqj7Fs+qdmcWNrSYSiks2OEnjJiap1cPOPk2g==
                    -----END CERTIFICATE-----
               """.trimIndent().trim()
        ),
        metadata = TrustMetadata(
            displayName = "Multipaz Identity Reader",
            privacyPolicyUrl = "https://verifier.multipaz.org/identityreaderbackend/"
        )
    )
} catch (e: TrustPointAlreadyExistsException) {
    e.printStackTrace()
}

// Certificate for app compiled from source code at https://github.com/davidz25/MpzIdentityReader
// This should be used for development/testing devices or devices with unlocked bootloaders
// Certificate source: https://verifier.multipaz.org/identityreaderbackend/readerRootCertUntrustedDevices
try {
    readerTrustManager.addX509Cert(
        certificate = X509Cert.fromPem(
            """
                    -----BEGIN CERTIFICATE-----
                    MIICiTCCAg+gAwIBAgIQQd/7PXEzsmI+U14J2cO1bjAKBggqhkjOPQQDAzBHMQswCQYDVQQGDAJV
                    UzE4MDYGA1UEAwwvTXVsdGlwYXogSWRlbnRpdHkgUmVhZGVyIENBIChVbnRydXN0ZWQgRGV2aWNl
                    cykwHhcNMjUwNzE5MjMwODE0WhcNMzAwNzE5MjMwODE0WjBHMQswCQYDVQQGDAJVUzE4MDYGA1UE
                    AwwvTXVsdGlwYXogSWRlbnRpdHkgUmVhZGVyIENBIChVbnRydXN0ZWQgRGV2aWNlcykwdjAQBgcq
                    hkjOPQIBBgUrgQQAIgNiAATqihOe05W3nIdyVf7yE4mHJiz7tsofcmiNTonwYsPKBbJwRTHa7AME
                    +ToAfNhPMaEZ83lBUTBggsTUNShVp1L5xzPS+jK0tGJkR2ny9+UygPGtUZxEOulGK5I8ZId+35Gj
                    gb8wgbwwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwVgYDVR0fBE8wTTBLoEmg
                    R4ZFaHR0cHM6Ly9naXRodWIuY29tL29wZW53YWxsZXQtZm91bmRhdGlvbi1sYWJzL2lkZW50aXR5
                    LWNyZWRlbnRpYWwvY3JsMB0GA1UdDgQWBBSbz9r9IFmXjiGGnH3Siq90geurxTAfBgNVHSMEGDAW
                    gBSbz9r9IFmXjiGGnH3Siq90geurxTAKBggqhkjOPQQDAwNoADBlAjEAomqjfJe2k162S5Way3sE
                    BTcj7+DPvaLJcsloEsj/HaThIsKWqQlQKxgNu1rE/XryAjB/Gq6UErgWKlspp+KpzuAAWaKk+bMj
                    cM4aKOKOU3itmB+9jXTQ290Dc8MnWVwQBs4=
                    -----END CERTIFICATE-----
               """.trimIndent().trim()
        ),
        metadata = TrustMetadata(
            displayName = "Multipaz Identity Reader (Untrusted Devices)",
            privacyPolicyUrl = "https://verifier.multipaz.org/identityreaderbackend/"
        )
    )
} catch (e: TrustPointAlreadyExistsException) {
    e.printStackTrace()
}
```

With this setup, your holder app will trust the following Multipaz applications as valid readers:
- **OWF Multipaz TestApp** (https://apps.multipaz.org) - For testing and development
- **Multipaz Identity Reader** (https://apps.multipaz.org) - For production devices with secure boot
- **Multipaz Identity Reader (Untrusted Devices & Apps)** (https://github.com/davidz25/MpzIdentityReader) - For apps compiled directly from the MpzIdentityReader for development purposes or devices with unlocked bootloaders

Add additional trusted readers as needed by importing their certificates.
By configuring TrustManager with trusted reader certificates, you ensure that only authorized verifier apps can access user credentials during presentment. Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/aeb4b2a80935a97e66dc38529331c70fcd922d99/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L195-L293) commit for the implementation of the reader trust in the app.
