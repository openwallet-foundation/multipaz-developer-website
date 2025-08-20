---
title: Holder
sidebar_position: 2
---

## Holder

This guide covers how to get started from the lenses of a holder app. i.e, the responsibilities include provisioning & storage of digital identities.

Initially we’ll cover the steps required to create an mDoc & store it in a secure area.

### **🔐 Storage**

Before working with identity documents in Multipaz, you need to initialize platform-specific secure storage and cryptographic infrastructure. This setup should happen early in your app lifecycle.

#### **Storage**

`Storage` is responsible for securely holding data items on the device.

Multipaz provides platform-specific implementations through the `Platform.nonBackedUpStorage` object:

* **Android**: uses local encrypted storage.
* **iOS**: wraps native secure storage.

#### **SecureArea**

A `SecureArea` represents a secure environment for creating and managing key material and other sensitive objects (e.g., for signing identity credentials).

Multipaz offers multiple `SecureArea` implementations:

* **AndroidKeystoreSecureArea:** Uses the[ Android Keystore](https://developer.android.com/privacy-and-security/keystore).

* **SecureEnclaveSecureArea:** Uses the[ Apple Secure Enclave](https://support.apple.com/en-in/guide/security/sec59b0b31ff/web) for iOS devices.

* **CloudSecureArea:** Delegates key management to a secure remote server.

* **SoftwareSecureArea:** Pure software-based secure area. Instantiate using `SoftwareSecureArea.create()`

#### **SecureAreaRepository**

A `SecureAreaRepository` manages a collection of `SecureArea` instances. This allows you to define which `SecureArea` to use for different keys or operations.

It provides fine-grained control and extensibility when your app needs to support multiple secure environments.


#### **Initialization**

You must initialize `Storage`, `SecureArea`, and `SecureAreaRepository` before using the `DocumentStore` or working with identity documents.

This setup should be done once, early in your app’s lifecycle (e.g., inside `App()`):

```kotlin
lateinit var storage: Storage
lateinit var secureArea: SecureArea
lateinit var secureAreaRepository: SecureAreaRepository
//. . .
storage = org.multipaz.util.Platform.nonBackedUpStorage
secureArea = org.multipaz.util.Platform.getSecureArea()
secureAreaRepository = SecureAreaRepository.Builder()
         .add(secureArea)
         .build()
```

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L91-L94) code for the implementation of the Storage section of this guide.

### **📄 DocumentStore**

Before you can create or manage real-world identity documents, you need to set up repositories and storage for document types and documents. This should be done after initializing your secure storage components.

#### **DocumentTypeRepository**

A `DocumentTypeRepository` manages the metadata for different document types your app understands and uses.

* **Standard Document Types:** Multipaz provides a set of standard document types through the `multipaz-knowntypes` package, such as:
    * `DrivingLicense`
    * `EUCertificateOfResidence`
    * `PhotoID`
    * `VaccinationDocument`
    * `VehicleRegistration`
* **Custom Document Types:** You can define your own document types using the `DocumentType.Builder` factory method.

#### **DocumentStore**

A `DocumentStore` is responsible for securely holding and managing real-world identity documents, such as Mobile Driving Licenses (mDL), in accordance with the ISO/IEC 18013-5:2021 specification.

* **Initialization:** Create a `DocumentStore` instance using either the `buildDocumentStore` function or the `DocumentStore.Builder` class.
* **Dependencies:** Pass the previously-initialized `storage` and `secureAreaRepository` to the `DocumentStore`.


#### **Implementation**


```kotlin
lateinit var documentTypeRepository: DocumentTypeRepository
lateinit var documentStore: DocumentStore
// . . .
documentTypeRepository = DocumentTypeRepository().apply {
addDocumentType(DrivingLicense.getDocumentType())
}
documentStore = buildDocumentStore(
    storage = storage,
    secureAreaRepository = secureAreaRepository
) {}
```

By clearly structuring the setup of `DocumentTypeRepository` and `DocumentStore`, you ensure your app is ready to manage identity documents securely and efficiently. Always perform this setup early in your app lifecycle, after initializing storage and secure areas. 

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L96-L103) part for the implementation of the DocumentStore section of this guide.

### **🆔 Creation of an mDoc**

After initializing your `DocumentStore` and related components, you can proceed to create an mDoc (mobile Document) credential. This section guides you through creating a Document and generating a standards-compliant mDoc credential.

#### **Creating a Document**

A `Document` represents an individual item created and managed by the `DocumentStore`.

* Method: Use `DocumentStore#createDocument` to create a new document.

```kotlin
val document = documentStore.createDocument(
   displayName = "Erika's Driving License",
   typeDisplayName = "Utopia Driving License
)
```

#### **Creating an MdocCredential**

An `MdocCredential` represents a mobile credential, such as a Mobile Driving License (mDL), following the ISO/IEC 18013-5:2021 standard.

##### 1. Prepare Timestamps

Set up the credential’s validity period and signing time:

```kotlin
val now = Clock.System.now()
val signedAt = now
val validFrom = now
val validUntil = now + 365.days
```

##### 2. Generate IACA Certificate

The IACA (Issuing Authority Certificate Authority) certificate is required for signing the Document Signing (DS) certificate.

```kotlin
val iacaKey = Crypto.createEcPrivateKey(EcCurve.P256)
val iacaCert = MdocUtil.generateIacaCertificate(
   iacaKey = iacaKey,
   subject = X500Name.fromName(name = "CN=Test IACA Key"),
   serial = ASN1Integer.fromRandom(numBits = 128),
   validFrom = validFrom,
   validUntil = validUntil,
   issuerAltNameUrl = "https://issuer.example.com",
   crlUrl = "https://issuer.example.com/crl"
)
```

##### 3. Generate Document Signing (DS) Certificate

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

##### 4. Create the mDoc Credential

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

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L105-L161) part for the implementation of the Creating an MdocCredential section of this guide.

:::info Looking for a more realistic flow?
The example above uses helpful defaults for quick onboarding. If you're exploring how to construct credentials manually — including MSO creation, issuer namespaces, and authentication — check out this [advanced sample](https://github.com/dzuluaga/multipaz-getting-started-testing/blob/v1.1.0-age-verification/composeApp/src/commonMain/kotlin/org/example/project/App.kt#L539-L727) created by a core contributor.
:::

### **🔍 Lookup and Manage Documents**

Once your `DocumentStore` is initialized and populated, you can fetch, list, and manage documents within it.


#### **Listing and Fetching Documents**

You can retrieve all documents stored in the `DocumentStore` using `DocumentStore#listDocuments`. For each document ID retrieved, use `DocumentStore#lookupDocument` to get the corresponding document object.

**Example: Listing Documents**

```kotlin
val documents = mutableStateListOf<Document>()
for (documentId in documentStore.listDocuments()) {
    documentStore.lookupDocument(documentId).let { document ->
        if (document != null && !documents.contains(document))
            documents.add(document)
    }
}
```

#### **Deleting Documents**

To remove a document from the `DocumentStore`, use the `DocumentStore#deleteDocument` method and provide the document's identifier.

**Example: Deleting a Document**

```kotlin
documentStore.deleteDocument(document.identifier)
```

By following these steps, you can efficiently list, fetch, and delete documents managed by your `DocumentStore`, ensuring your application's document management remains clean and up-to-date.

### **🎁 Presentation**

The presentation phase allows a user to present a credential (such as an mDL) to a verifier, typically using BLE, NFC, or QR code. This section covers runtime permissions, setting up presentment flows, and generating engagement QR codes.

#### **Runtime Permissions**

Multipaz provides composable functions for requesting runtime permissions in your app. Typical permissions include Bluetooth, Camera, and Notifications.

* **Bluetooth Permission:** Use `rememberBluetoothPermissionState`
* **Camera Permission:** Use `rememberCameraPermissionState`
* **Notification Permission:** Use `rememberNotificationPermissionState`

**Example: Requesting BLE Permission**

```kotlin
val blePermissionState = rememberBluetoothPermissionState()

if (!blePermissionState.isGranted) {
   Button(
       onClick = {
           coroutineScope.launch {
               blePermissionState.launchPermissionRequest()
           }
       }
   ) {
       Text("Request BLE permissions")
   }
```

**AndroidManifest.xml: Required BLE Permissions**


```xml
<!-- For BLE -->
<uses-feature
   android:name="android.hardware.bluetooth_le"
   android:required="true" />
<uses-permission
   android:name="android.permission.BLUETOOTH_SCAN"
   android:usesPermissionFlags="neverForLocation"
   tools:targetApi="s" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<!-- Request legacy Bluetooth permissions on older devices. -->
<uses-permission
   android:name="android.permission.BLUETOOTH"
   android:maxSdkVersion="30" />
<uses-permission
   android:name="android.permission.BLUETOOTH_ADMIN"
   android:maxSdkVersion="30" />
<uses-permission
   android:name="android.permission.ACCESS_COARSE_LOCATION"
   android:maxSdkVersion="30" />
<uses-permission
   android:name="android.permission.ACCESS_FINE_LOCATION"
   android:maxSdkVersion="30" />
```

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L186-L196) part for the implementation of the permissions section of this guide.

### **🛡️ Reader Trust**

The reader trust mechanism ensures that the holder app can check whether the verifier (reader) apps that request the credentials can be trusted. Multipaz uses the `TrustManager` interface to manage and validate trust relationships.

#### **TrustManager Implementations**

Multipaz provides several implementations for managing trust:

* **LocalTrustManager:** Backs trust with local files.
* **VicalTrustManager:** Uses VICAL, following `ISO/IEC 18013-5`.
* **CompositeTrustManager:** Allows stacking multiple trust managers.

#### **Types of Trust**

There are two main types of trust in Multipaz:

* **Issuer trust:** Used by verifier apps to check the authenticity of credentials received from holder devices. See the verifier/issuer trust section (todo: link) for more details.
* **Reader trust:** Used by holder apps to verify the trustworthiness of verifier (reader) apps requesting credentials. This section focuses on reader trust.

#### **Setting Up Reader Trust**

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
// 3. Multipaz Identity Reader (Untrusted Devices) - for app compiled from source code at https://github.com/davidzMpzIdentityReader
//    Certificate available from: https://verifier.multipaz.org/identityreaderbackend/readerRootCertUntrustedDevices
readerTrustManager = TrustManagerLocal(storage = storage, identifier = "reader
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

// Certificate for APK downloaded from https://apps.multipaz.org/
// This should be used for production devices with secure boot (GREEN state)
// Certificate source: https://verifier.multipaz.org/identityreaderbackend/readerRootCert
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

// Certificate for app compiled from source code at https://github.com/davidz25/MpzIdentityReader
// This should be used for development/testing devices or devices with unlocked bootloaders
// Certificate source: https://verifier.multipaz.org/identityreaderbackend/readerRootCertUntrustedDevices
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
```

With this setup, your holder app will trust the following Multipaz applications as valid readers:
- **OWF Multipaz TestApp** (https://apps.multipaz.org) - For testing and development
- **Multipaz Identity Reader** (https://apps.multipaz.org) - For production devices with secure boot
- **Multipaz Identity Reader (Untrusted Devices & Apps)** (https://github.com/davidz25/MpzIdentityReader) - For apps compiled directly from the MpzIdentityReader for development purposes or devices with unlocked bootloaders

Add additional trusted readers as needed by importing their certificates.
By configuring TrustManager with trusted reader certificates, you ensure that only authorized verifier apps can access user credentials during presentment. Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/4d33941929892849b53afbd89653b374cd708a81/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L196-L282) commit for the implementation of the reader trust in the app.

#### **PresentmentModel**

`PresentmentModel` manages the entire UX/UI flow for credential presentation, providing a `state` variable to track the presentation process. Multipaz also offers a `Presentment` composable for embedding credential presentment UI.

You can generate QR codes using `org.multipaz.compose.qrcode:generateQrCode`.

```kotlin
lateinit var presentmentModel: PresentmentModel
lateinit var presentmentSource: PresentmentSource
// . . .
presentmentModel = PresentmentModel().apply { setPromptModel(promptModel) }
presentmentSource = SimplePresentmentSource(
   documentStore = documentStore,
   documentTypeRepository = documentTypeRepository,
   readerTrustManager = readerTrustManager,
   preferSignatureToKeyAgreement = true,
   domainMdocSignature = "mdoc",
)

val deviceEngagement = remember { mutableStateOf<ByteString?>(null) }
val state = presentmentModel.state.collectAsState()
when (state.value) {
   PresentmentModel.State.IDLE -> {
       showQrButton(deviceEngagement)
   }

   PresentmentModel.State.CONNECTING -> {
       showQrCode(deviceEngagement)
   }

   PresentmentModel.State.WAITING_FOR_SOURCE,
   PresentmentModel.State.PROCESSING,
   PresentmentModel.State.WAITING_FOR_DOCUMENT_SELECTION,
   PresentmentModel.State.WAITING_FOR_CONSENT,
   PresentmentModel.State.COMPLETED -> {
       Presentment(
           appName = "Multipaz Getting Started Sample",
           appIconPainter = painterResource(Res.drawable.compose_multiplatform),
           presentmentModel = presentmentModel,
           presentmentSource = presentmentSource,
           documentTypeRepository = documentTypeRepository,
           onPresentmentComplete = {
               presentmentModel.reset()
           },
       )
   }
}
```

Refer to this part for the implementation of this section in this guide.

#### Starting Device Engagement

To start engagement for presentment (e.g., via BLE), use a connection method that extends `MdocConnectionMethod` (such as `MdocConnectionMethodBle` or `MdocConnectionMethodNfc`). The following example uses BLE:

**Example: BLE Engagement and QR Code**

```kotlin
@Composable
private fun showQrButton(showQrCode: MutableState<ByteString?>) {
   Column(
       modifier = Modifier.fillMaxSize(),
       verticalArrangement = Arrangement.Center,
       horizontalAlignment = Alignment.CenterHorizontally
   ) {
       Button(onClick = {
           presentmentModel.reset()
           presentmentModel.setConnecting()
           presentmentModel.presentmentScope.launch() {
               val connectionMethods = listOf(
                   MdocConnectionMethodBle(
                       supportsPeripheralServerMode = false,
                       supportsCentralClientMode = true,
                       peripheralServerModeUuid = null,
                       centralClientModeUuid = UUID.randomUUID(),
                   )
               )
               val eDeviceKey = Crypto.createEcPrivateKey(EcCurve.P256)
               val advertisedTransports = connectionMethods.advertise(
                   role = MdocRole.MDOC,
                   transportFactory = MdocTransportFactory.Default,
                   options = MdocTransportOptions(bleUseL2CAP = true),
               )
               val engagementGenerator = EngagementGenerator(
                   eSenderKey = eDeviceKey.publicKey,
                   version = "1.0"
               )
               engagementGenerator.addConnectionMethods(advertisedTransports.map {
                   it.connectionMethod
               })
               val encodedDeviceEngagement = ByteString(engagementGenerator.generate())
               showQrCode.value = encodedDeviceEngagement
               val transport = advertisedTransports.waitForConnection(
                   eSenderKey = eDeviceKey.publicKey,
                   coroutineScope = presentmentModel.presentmentScope
               )
               presentmentModel.setMechanism(
                   MdocPresentmentMechanism(
                       transport = transport,
                       eDeviceKey = eDeviceKey,
                       encodedDeviceEngagement = encodedDeviceEngagement,
                       handover = Simple.NULL,
                       engagementDuration = null,
                       allowMultipleRequests = false
                   )
               )
               showQrCode.value = null
           }
       }) {
           Text("Present mDL via QR")
       }
       )
   }
}
```

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L230-L284) part for the implementation of this section in this guide.

#### **Displaying the QR Code**

Use the following composable to display the QR code generated for presentment.

**Example: QR Code Display**

```kotlin

@Composable
private fun showQrCode(deviceEngagement: MutableState<ByteString?>) {
   Column(
       modifier = Modifier.fillMaxSize().padding(16.dp),
       verticalArrangement = Arrangement.Center,
       horizontalAlignment = Alignment.CenterHorizontally,
   ) {
       if (deviceEngagement.value != null) {
           val mdocUrl = "mdoc:" + deviceEngagement.value!!.toByteArray().toBase64Url()
           val qrCodeBitmap = remember { generateQrCode(mdocUrl) }
           Text(text = "Present QR code to mdoc reader")
           Image(
               modifier = Modifier.fillMaxWidth(),
               bitmap = qrCodeBitmap,
               contentDescription = null,
               contentScale = ContentScale.FillWidth
           )
           Button(
               onClick = {
                   presentmentModel.reset()
               }
           ) {
               Text("Cancel")
           }
       }
   }
}
```
Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L286-L312) part for the implementation of this section in this guide.

By following these steps, you can request necessary permissions, manage the credential presentment flow, and generate device engagement QR codes for verifiers.