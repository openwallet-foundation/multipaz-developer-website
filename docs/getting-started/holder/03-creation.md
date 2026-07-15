---
title: 🆔 Creation of an mDoc
sidebar_position: 3
---

After initializing your `DocumentStore` and related components, you can proceed to create an mDoc (mobile Document) credential. This section guides you through creating a Document and generating a standards-compliant mDoc credential.

**Note:** The following code should go into the `suspend fun init()` in `AppContainerImpl.kt` (in the `core` module).

### Creating an MdocCredential

An `MdocCredential` represents a mobile credential, such as a Mobile Driving License (mDL), following the ISO/IEC 18013-5:2021 standard.

#### 1. Prepare Timestamps

Set up the credential's validity period and signing time:

```kotlin
val now = Instant.fromEpochSeconds(Clock.System.now().epochSeconds)
val signedAt = now
val validFrom = now
val validUntil = now + 365.days
```

Refer to **[this timestamp code](https://github.com/openwallet-foundation/multipaz-samples/blob/36906be0fd4c686460a1cb5bfd3cc27868ba12b0/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L81-L85)** for the complete example.

#### 2. Generate IACA Certificate

The IACA (Issuing Authority Certificate Authority) certificate is required for signing the Document Signing (DS) certificate.

```kotlin
val iacaCert =
    X509Cert.fromPem(Res.readBytes("files/iaca_certificate.pem").decodeToString())
```

These certificate files can be downloaded from the following links. They should be placed inside `core/src/commonMain/composeResources/files`:

* [**iaca_certificate.pem**](https://raw.githubusercontent.com/openwallet-foundation/multipaz-samples/36906be0fd4c686460a1cb5bfd3cc27868ba12b0/MultipazGettingStartedSample/core/src/commonMain/composeResources/files/iaca_certificate.pem)

We are embedding IACA certificate into the app right now. In a production environment you'll them load from a server.

You can use `multipazctl` to generate your own certificates & keys. Refer [here](https://github.com/openwallet-foundation-labs/identity-credential/?tab=readme-ov-file#command-line-tool) for the steps.

#### 3. Generate Document Signing (DS) Certificate

The DS certificate signs the mDoc credential.

```kotlin
val dsKey = Crypto.createEcPrivateKey(EcCurve.P256)
val dsCert = MdocUtil.generateDsCertificate(
   iacaKey = AsymmetricKey.X509CertifiedExplicit(
       certChain = X509CertChain(certificates = listOf(iacaCert)),
       privateKey = dsKey,
   ),
   dsKey = dsKey.publicKey,
   subject = X500Name.fromName(name = "CN=Test DS Key"),
   serial = ASN1Integer.fromRandom(numBits = 128),
   validFrom = validFrom,
   validUntil = validUntil
)
```

Refer to **[this DS certificate code](https://github.com/openwallet-foundation/multipaz-samples/blob/36906be0fd4c686460a1cb5bfd3cc27868ba12b0/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L87-L100)** for the complete example.

#### 4. Creating a Document

A `Document` represents an individual item created and managed by the `DocumentStore`. Here we only create a new document only if `DocumentStore` is empty to prevent proliferation.

Method: Use `DocumentStore#createDocument` to create a new document.

```kotlin
if (documentStore.listDocuments().isEmpty()) {
    val document = documentStore.createDocument(
        displayName = CredentialDomains.SAMPLE_DOCUMENT_DISPLAY_NAME,
        typeDisplayName = CredentialDomains.SAMPLE_DOCUMENT_TYPE_DISPLAY_NAME,
    )
}
```

Refer to **[this document creation code](https://github.com/openwallet-foundation/multipaz-samples/blob/36906be0fd4c686460a1cb5bfd3cc27868ba12b0/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L102-L125)** for the complete example.

#### 5. Create the mDoc Credential

Finally, use the document and generate certificates to create the mDoc credential.

```kotlin
if (documentStore.listDocuments().isEmpty()) {
    // create document

    val mdocCredential =
       DrivingLicense.getDocumentType().createMdocCredentialWithSampleData(
           document = document,
           secureArea = secureArea,
           createKeySettings = CreateKeySettings(
               algorithm = Algorithm.ESP256,
               nonce = "Challenge".encodeToByteString(),
               userAuthenticationRequired = true
           ),
           dsKey = AsymmetricKey.X509CertifiedExplicit(
               certChain = X509CertChain(certificates = listOf(dsCert)),
               privateKey = dsKey,
           ),
           signedAt = signedAt,
           validFrom = validFrom,
           validUntil = validUntil,
           domain = CredentialDomains.MDOC_USER_AUTH
       )
}
```

By following these steps, you can securely create and provision an mDoc credential, ready to be managed and used within your application.

Refer to **[this MdocCredential creation code](https://github.com/openwallet-foundation/multipaz-samples/blob/36906be0fd4c686460a1cb5bfd3cc27868ba12b0/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L78-L125)** for the complete example.

:::info Looking for a more realistic flow?
The example above uses helpful defaults for quick onboarding. If you're exploring how to construct credentials manually — including MSO creation, issuer namespaces, and authentication — check out this [advanced sample](https://github.com/dzuluaga/multipaz-getting-started-testing/blob/v1.1.0-age-verification/composeApp/src/commonMain/kotlin/org/example/project/App.kt#L539-L727) created by a core contributor.
:::
