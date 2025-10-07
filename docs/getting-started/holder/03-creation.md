---
title: 🆔 Creation of an mDoc
sidebar_position: 3
---

After initializing your `DocumentStore` and related components, you can proceed to create an mDoc (mobile Document) credential. This section guides you through creating a Document and generating a standards-compliant mDoc credential. The following code should go into the `suspend fun init()` in `App.kt`.

### Creating a Document

A `Document` represents an individual item created and managed by the `DocumentStore`.

* Method: Use `DocumentStore#createDocument` to create a new document.

```kotlin
val document = documentStore.createDocument(
   displayName = "Erika's Driving License",
   typeDisplayName = "Utopia Driving License"
)
```

### Creating an MdocCredential

An `MdocCredential` represents a mobile credential, such as a Mobile Driving License (mDL), following the ISO/IEC 18013-5:2021 standard.

#### 1. Prepare Timestamps

Set up the credential's validity period and signing time:

```kotlin
val now = Clock.System.now()
val signedAt = now
val validFrom = now
val validUntil = now + 365.days
```

#### 2. Generate IACA Certificate

The IACA (Issuing Authority Certificate Authority) certificate is required for signing the Document Signing (DS) certificate.

```kotlin
val iacaCert =
    X509Cert.fromPem(Res.readBytes("files/iaca_certificate.pem").decodeToString())

val iacaKey = EcPrivateKey.fromPem(
    Res.readBytes("files/iaca_private_key.pem").decodeToString(),
    iacaCert.ecPublicKey
)
```

These cerfiticate files can be downloaded from the following links. They should be placed inside `commonMain/composeResources/files`:

* [**iaca_certificate.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/iaca_certificate.pem)
* [**iaca_private_key.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/iaca_private_key.pem)

We are embedding IACA certificate & key into the app right now. In a production environment you'll them load from a sever.

You can use `multipazctl` to generate your own certificates & keys. Refer [here](https://github.com/openwallet-foundation-labs/identity-credential/?tab=readme-ov-file#command-line-tool) for the steps.

#### 3. Generate Document Signing (DS) Certificate

The DS certificate signs the mDoc credential.

```kotlin
val dsKey = Crypto.createEcPrivateKey(EcCurve.P256)
val dsCert = MdocUtil.generateDsCertificate(
   iacaCert = iacaCert,
   iacaKey = iacaKey,
   dsKey = dsKey.publicKey,
   subject = X500Name.fromName(name = "CN=Test DS Key"),
   serial = ASN1Integer.fromRandom(numBits = 128),
   validFrom = validFrom,
   validUntil = validUntil
)
```

#### 4. Create the mDoc Credential

Finally, use the document and generate certificates to create the mDoc credential.

```kotlin
val mdocCredential =
   DrivingLicense.getDocumentType().createMdocCredentialWithSampleData(
       document = document,
       secureArea = secureArea,
       createKeySettings = CreateKeySettings(
           algorithm = Algorithm.ESP256,
           nonce = "Challenge".encodeToByteString(),
           userAuthenticationRequired = true
       ),
       dsKey = dsKey,
       dsCertChain = X509CertChain(listOf(dsCert)),
       signedAt = signedAt,
       validFrom = validFrom,
       validUntil = validUntil,
   )
```

By following these steps, you can securely create and provision an mDoc credential, ready to be managed and used within your application.

Refer to **[this MdocCredential creation code](https://github.com/openwallet-foundation/multipaz-samples/blob/7988c38259d62972a93b10a5fc2f5c43e6a789d8/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L119-L173)** for the complete example.

:::info Looking for a more realistic flow?
The example above uses helpful defaults for quick onboarding. If you're exploring how to construct credentials manually — including MSO creation, issuer namespaces, and authentication — check out this [advanced sample](https://github.com/dzuluaga/multipaz-getting-started-testing/blob/v1.1.0-age-verification/composeApp/src/commonMain/kotlin/org/example/project/App.kt#L539-L727) created by a core contributor.
:::
