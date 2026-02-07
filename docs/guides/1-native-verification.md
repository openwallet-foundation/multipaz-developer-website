---
title: Native to Native Verification (W3C DC API)
sidebar_position: 2
---

# Native Digital Credentials Verification

The native W3C DC implementation allows your Android app to interact with verifiers through direct API calls, supporting secure and privacy-preserving credential presentment flows. To implement this using the Multipaz SDK, these steps are required:

* Implementing the core W3C DC request flow (shared code)
* Implementing the `getAppToAppOrigin()` function for Android
* Setting up cryptographic key management (shared code)
* Configuring reader trust management for verifiers (shared code)
* Integrating the flow into your UI

:::warning iOS Support Coming Soon
Native W3C DC implementation is currently **only supported on Android** since it uses platform-specific requirements. iOS support will be available soon.

- **Android**: Uses package name + certificate fingerprint for app identification
:::

# **Implementation Steps**

## **1. Dependencies**

The native credentials verification feature requires the Multipaz DC API library. Please make sure to add it, if not already.

`gradle/libs.versions.toml`
```toml
[versions]
multipaz = "0.96.0" # latest version of Multipaz Extras

[libraries]
multipaz-dcapi = { group = "org.multipaz", name = "multipaz-dcapi", version.ref = "multipaz" }
```

Refer to **[this code](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/gradle/libs.versions.toml#L45)** for the complete example.

`composeApp/build.gradle.kts`
```kotlin
kotlin {
    sourceSets {
        commonMain.dependencies {
            // ...
            implementation(libs.multipaz.vision)
        }
    }
}
```

Refer to **[this code](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/build.gradle.kts#L58)** for the complete example.

## **2. Implement Core W3C DC Request Flow**

The W3C Digital Credentials flow involves several cryptographic operations and network requests. Here's the concrete implementation:

All the helper functions for this feature is implemented in a seperate file called `W3CDCCredentialsRequestButton.kt` inside a `w3cdc` package in the get started sample.

```kotlin
// w3cdc/W3CDCCredentialsRequestButton.kt
@OptIn(ExperimentalTime::class)
private suspend fun doDcRequestFlow(
    appReaderKey: AsymmetricKey.X509Compatible,
    request: DocumentCannedRequest,
    showResponse: (
        vpToken: JsonObject?,
        deviceResponse: DataItem?,
        sessionTranscript: DataItem,
        nonce: ByteString?,
        eReaderKey: EcPrivateKey?,
        metadata: ShowResponseMetadata
    ) -> Unit
) {
    require(request.mdocRequest != null) { "No ISO mdoc format in request" }

    // Step 1: Generate cryptographic materials
    // Random nonce for request/response correlation (prevents replay attacks)
    val nonce = ByteString(Random.Default.nextBytes(NONCE_SIZE_BYTES))
    
    // Ephemeral key for encrypting the response (ensures confidentiality)
    val responseEncryptionKey = Crypto.createEcPrivateKey(RESPONSE_ENCRYPTION_CURVE)

    // Step 2: Get platform-specific app origin
    val origin = getAppToAppOrigin()
    // Note: "web-origin" is the W3C DC specification format identifier
    val clientId = "web-origin:$origin"

    // Step 3: Configure protocol
    val protocolDisplayName = "OpenID4VP 1.0"
    val exchangeProtocolNames = listOf("openid4vp-v1-signed")

    // Step 4: Build list of requested claims
    val claims = mutableListOf<MdocRequestedClaim>()
    request.mdocRequest!!.namespacesToRequest.forEach { namespaceRequest ->
        namespaceRequest.dataElementsToRequest.forEach { (mdocDataElement, intentToRetain) ->
            claims.add(
                MdocRequestedClaim(
                    namespaceName = namespaceRequest.namespace,
                    dataElementName = mdocDataElement.attribute.identifier,
                    intentToRetain = intentToRetain
                )
            )
        }
    }

    // Step 5: Build the W3C DC request object
    val dcRequestObject = VerificationUtil.generateDcRequestMdoc(
        exchangeProtocols = exchangeProtocolNames,
        docType = request.mdocRequest!!.docType,
        claims = claims,
        nonce = nonce,
        origin = origin,
        clientId = clientId,
        responseEncryptionKey = responseEncryptionKey.publicKey,
        readerAuthenticationKey = appReaderKey,  // Sign request to prove verifier identity
        zkSystemSpecs = emptyList()
    )

    // Step 6: Send request via W3C DC API and measure response time
    val t0 = Clock.System.now()
    val dcResponseObject = DigitalCredentials.Default.request(dcRequestObject)

    // Step 7: Decrypt and parse response
    val dcResponse = VerificationUtil.decryptDcResponse(
        response = dcResponseObject,
        nonce = nonce,
        origin = origin,
        responseEncryptionKey = AsymmetricKey.anonymous(
            privateKey = responseEncryptionKey,
            algorithm = responseEncryptionKey.curve.defaultKeyAgreementAlgorithm
        )
    )

    // Step 8: Create metadata for analytics/logging
    val metadata = ShowResponseMetadata(
        engagementType = METADATA_ENGAGEMENT_TYPE,
        transferProtocol = "$METADATA_TRANSFER_PROTOCOL_PREFIX ($protocolDisplayName)",
        requestSize = Json.encodeToString(dcRequestObject).length.toLong(),
        responseSize = Json.encodeToString(dcResponseObject).length.toLong(),
        durationMsecNfcTapToEngagement = null,
        durationMsecEngagementReceivedToRequestSent = null,
        durationMsecRequestSentToResponseReceived = (Clock.System.now() - t0).inWholeMilliseconds
    )

    // Step 9: Handle response based on protocol format
    when (dcResponse) {
        is MdocApiDcResponse -> {
            // ISO 18013-7 mDoc format response
            showResponse(
                null, 
                dcResponse.deviceResponse, 
                dcResponse.sessionTranscript, 
                nonce, 
                null, 
                metadata
            )
        }

        is OpenID4VPDcResponse -> {
            // OpenID4VP format response
            showResponse(
                dcResponse.vpToken, 
                null, 
                dcResponse.sessionTranscript, 
                nonce, 
                null, 
                metadata
            )
        }
    }
}
```

**What does this do?**

* **Step 1**: Generates a random nonce (prevents replay attacks) and creates an ephemeral encryption key for the response
* **Step 2**: Gets the platform-specific app identifier (Android: package + certificate fingerprint)
* **Step 3**: Configures the exchange protocol (OpenID4VP in this example)
* **Step 4**: Extracts the specific data elements (claims) being requested from the credential
* **Step 5**: Builds the W3C DC request object with all necessary parameters including reader authentication
* **Step 6**: Sends the request via W3C DC API and measures response time
* **Step 7**: Decrypts the response using the ephemeral key and validates it
* **Step 8**: Creates metadata for tracking request/response sizes and timing
* **Step 9**: Handles the response based on format (mDoc API or OpenID4VP)

See the **[DC Request Flow Function Code](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/W3CDCCredentialsRequestButton.kt#L393-L552)** for the complete implementation.

## **3. Define Constants and Model Classes**

### Constants File

All the required constants for the native verification feature are defined in `w3cdc/W3CDCConstants.kt`.

```kotlin
class W3CDCConstants {
    companion object {
        const val NONCE_SIZE_BYTES = 16
        val RESPONSE_ENCRYPTION_CURVE = EcCurve.P256
        const val METADATA_ENGAGEMENT_TYPE = "OS-provided CredentialManager API"
        const val METADATA_TRANSFER_PROTOCOL_PREFIX = "W3C Digital Credentials"
    }
}
```

**Note:** Copy the entire **[`w3cdc/W3CDCConstants.kt` file](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/W3CDCConstants.kt)** to reference all constants used by this feature.

### Model Classes

The data model classes required for the native verification feature are defined in `w3cdc/W3CDCModels.kt`.

```kotlin
// w3cdc/W3CDCModels.kt

/* Models used for W3C DC Native Flow */

@CborSerializable
data class ShowResponseMetadata(
    val engagementType: String,
    val transferProtocol: String,
    val requestSize: Long,
    val responseSize: Long,
    val durationMsecNfcTapToEngagement: Long?,
    val durationMsecEngagementReceivedToRequestSent: Long?,
    val durationMsecRequestSentToResponseReceived: Long
)

data class RequestEntry(
    val displayName: String,
    val documentType: DocumentType,
    val sampleRequest: DocumentCannedRequest
)

/* Helper functions used for W3C DC Native Flow */

fun ShowResponseMetadata.toDataItem(): DataItem {
    val builder = CborMap.builder()
    builder.put("engagementType", Tstr(this.engagementType))
    builder.put("transferProtocol", Tstr(this.transferProtocol))
    builder.put("requestSize", this.requestSize.toDataItem())
    builder.put("responseSize", this.responseSize.toDataItem())
    val durationMsecNfcTapToEngagement = this.durationMsecNfcTapToEngagement
    if (durationMsecNfcTapToEngagement != null) {
        builder.put("durationMsecNfcTapToEngagement", durationMsecNfcTapToEngagement.toDataItem())
    }
    val durationMsecEngagementReceivedToRequestSent =
        this.durationMsecEngagementReceivedToRequestSent
    if (durationMsecEngagementReceivedToRequestSent != null) {
        builder.put(
            "durationMsecEngagementReceivedToRequestSent",
            durationMsecEngagementReceivedToRequestSent.toDataItem()
        )
    }
    builder.put(
        "durationMsecRequestSentToResponseReceived",
        this.durationMsecRequestSentToResponseReceived.toDataItem()
    )
    return builder.end().build()
}

fun buildShowResponseDestination(
    vpToken: JsonObject?,
    deviceResponse: DataItem?,
    sessionTranscript: DataItem,
    nonce: ByteString?,
    eReaderKey: EcPrivateKey?,
    metadata: ShowResponseMetadata
): Destination.ShowResponseDestination {

    fun JsonObject?.jsonBase64() =
        this?.let { Json.encodeToString(it).encodeToByteArray().toBase64Url() }

    fun DataItem?.cborBase64() =
        this?.let { Cbor.encode(it).toBase64Url() }

    fun DataItem.cborBase64Required() =
        Cbor.encode(this).toBase64Url()

    fun ByteString?.base64() =
        this?.toByteArray()?.toBase64Url()

    fun EcPrivateKey?.coseKeyBase64() =
        this
            ?.toCoseKey()
            ?.toDataItem()
            ?.let { Cbor.encode(it).toBase64Url() }

    return Destination.ShowResponseDestination(
        vpResponse = vpToken.jsonBase64(),
        deviceResponse = deviceResponse.cborBase64(),
        sessionTranscript = sessionTranscript.cborBase64Required(),
        nonce = nonce.base64(),
        eReaderKey = eReaderKey.coseKeyBase64(),
        metadata = metadata.toDataItem().cborBase64Required()
    )
}
```
- **`ShowResponseMetadata`:** Represents performance and transport metadata associated with a W3C Digital Credentials (DC) Native Flow.
- **`RequestEntry`:** Represents a predefined request option that can be presented to the user or used in demos/tests.
- **`ShowResponseMetadata.toDataItem()`:** Converts a `ShowResponseMetadata` instance into a CBOR map (`DataItem`).
- **`buildShowResponseDestination(...)`:** Constructs a fully-formed `Destination.ShowResponseDestination` instance, encoding all inputs into the formats required by the W3C DC Native Flow.

You can refer to the **[`w3cdc/W3CDCModels.kt` File](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/W3CDCModels.kt)** for the complete implementation.

### Document Value Sealed Class

A sealed class representing a renderable value within a document - either textual content or image content.

```kotlin
// w3cdc/DocumentValue.kt
sealed class DocumentValue {
     data class ValueText(
        val title: String,
        val value: String
    ): DocumentValue()

    data class ValueImage(
        val image: ImageBitmap
    ): DocumentValue()
}
```

You can refer to the **[`w3cdc/DocumentValue.kt` File](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/DocumentValue.kt)** for the complete implementation.


## **4. Implement `getAppToAppOrigin()` Function**

The `getAppToAppOrigin()` function provides a unique identifier for the app as required by the W3C Digital Credentials specification. This is used in the `clientId` field of credential requests.

On Android, the app origin combines the package name with the SHA-256 fingerprint of the app's signing certificate. This prevents package name spoofing multiple apps can't share the same package + cert combination. This function can be implemented in the `Platform.kt` file (we are also adding another helper function here for convenience).

```kotlin
// commonMain/Platform.kt
expect fun getAppToAppOrigin(): String
expect fun isAndroid(): Boolean
```

See the [**`commonMain/Platform.kt`**](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/Platform.kt) file for the complete implementation.

#### Android Implementation

```kotlin
// androidMain/Platform.kt
actual fun getAppToAppOrigin(): String {
    val packageInfo = applicationContext.packageManager
        .getPackageInfo(applicationContext.packageName, PackageManager.GET_SIGNATURES)

    val signatures = packageInfo.signatures
    if (signatures.isNullOrEmpty()) {
        throw IllegalStateException("No signatures found for package ${applicationContext.packageName}")
    }
    return getAppOrigin(signatures[0].toByteArray())
}

actual fun isAndroid(): Boolean = true
```

See the [**`androidMain/Platform.kt`**](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/Platform.kt) file for the complete implementation.

#### iOS Implementation

```kotlin
// iosMain/Platform.kt
actual fun getAppToAppOrigin(): String {
    // On iOS, use the bundle identifier as the app origin
    // This uniquely identifies the app and is the iOS equivalent
    // of using the signing certificate on Android
    return NSBundle.mainBundle.bundleIdentifier ?: "unknown.bundle.id"
}

actual fun isAndroid(): Boolean = false
```

:::note iOS Support Coming Soon
iOS support for `getAppToAppOrigin()` is not yet available but will be coming soon. This implementation is currently Android-only.
:::

See the [**`iosMain/Platform.kt`**](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/iosMain/kotlin/org/multipaz/getstarted/Platform.kt) file for the complete implementation.

**How it works:**

- Retrieves the app's signing certificate from the package manager
- Extracts the certificate's SHA-256 fingerprint
- Uses the Multipaz `getAppOrigin()` utility to format it properly
- Results in a unique identifier based on both package name and certificate

## **4. Implement the Request Button Composable**

The `W3CDCCredentialsRequestButton` Composable function handles the end-to-end flow for requesting credentials using the W3C Digital Credentials API. It handles

- Initializing cryptographic keys and certificates
- Requesting credentials from the OS credential manager
- Processing and logging/displaying the response

```kotlin
// w3cdc/W3CDCCredentialsRequestButton.kt
const val TAG = "W3CDCCredentialsRequestButton"

@Composable
fun W3CDCCredentialsRequestButton(
    storageTable: StorageTable,
    promptModel: PromptModel,
    text: String = "W3CDC Credentials Request",
    showResponse: (
        vpToken: JsonObject?,
        deviceResponse: DataItem?,
        sessionTranscript: DataItem,
        nonce: ByteString?,
        eReaderKey: EcPrivateKey?,
        metadata: ShowResponseMetadata
    ) -> Unit
) {
    val requestOptions = mutableListOf<RequestEntry>()
    val coroutineScope = rememberUiBoundCoroutineScope { promptModel }

    // Prepare request options from available document types
    LaunchedEffect(Unit) {
        val documentType = DrivingLicense.getDocumentType()
        documentType.cannedRequests.forEach { sampleRequest ->
            requestOptions.add(
                RequestEntry(
                    displayName = "${documentType.displayName}: ${sampleRequest.displayName}",
                    documentType = documentType,
                    sampleRequest = sampleRequest
                )
            )
        }
    }

    Button(onClick = {
        coroutineScope.launch {
            // Parse certificate validity dates from constants
            val certsValidFrom = LocalDate.parse(CERT_VALID_FROM_DATE).atStartOfDayIn(TimeZone.UTC)
            val certsValidUntil =
                LocalDate.parse(CERT_VALID_UNTIL_DATE).atStartOfDayIn(TimeZone.UTC)

            // Initialize the reader root key and certificate
            // This is the "root of trust" for your verifier application
            val readerRootKey = readerRootInit(
                keyStorage = storageTable,
                certsValidFrom = certsValidFrom,
                certsValidUntil = certsValidUntil
            )

            // Initialize the reader key and certificate
            // This is the operational key used to sign credential requests
            val readerKey = readerInit(
                keyStorage = storageTable,
                readerRootKey = readerRootKey,
                certsValidFrom = certsValidFrom,
                certsValidUntil = certsValidUntil
            )

            try {
                // Execute the credential request flow
                doDcRequestFlow(
                    appReaderKey = readerKey,
                    request = requestOptions.first().sampleRequest,
                    showResponse = showResponse
                )
            } catch (error: Throwable) {
                Logger.e(TAG, "Error requesting credentials", error)
            }
        }
    }) {
        Text(text = text)
    }
}
```

You can refer to this [**`W3CDCCredentialsRequestButton` Composable Code**](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/W3CDCCredentialsRequestButton.kt#L63-L154) for the complete implementation.

## **5. Set Up Reader Certificates**

We need to initialize the reader certificates that authenticate the app as a verifier.

### **Initialize Reader Root Certificate and Key**

This function creates (or retrieves if already created) the root certificate authority for the reader/verifier. This is the "root of trust" that signs all other reader certificates.

**Root Certificate vs Reader Certificate:**
- **Root Cert:** Top of trust chain, self-signed, long-lived
- **Reader Cert:** Operational cert, signed by root, can be rotated

```kotlin
private suspend fun readerRootInit(
    keyStorage: StorageTable,
    certsValidFrom: Instant,
    certsValidUntil: Instant
): AsymmetricKey.X509CertifiedExplicit {
    val readerRootKey = loadBundledReaderRootKey()

    // Try to retrieve existing root private key
    // If not found, use the bundled key
    val readerRootPrivateKey = keyStorage.get(STORAGE_KEY_READER_ROOT_PRIVATE_KEY)
        ?.let { EcPrivateKey.fromDataItem(Cbor.decode(it.toByteArray())) }
        ?: run {
            // Store bundled key for future use
            keyStorage.insert(
                STORAGE_KEY_READER_ROOT_PRIVATE_KEY,
                ByteString(Cbor.encode(readerRootKey.toDataItem()))
            )
            readerRootKey
        }

    // Try to retrieve existing root certificate
    // If not found, generate self-signed root certificate
    val readerRootCert = keyStorage.get(STORAGE_KEY_READER_ROOT_CERT)
        ?.let { X509Cert.fromDataItem(Cbor.decode(it.toByteArray())) }
        ?: run {
            // Generate self-signed root certificate
            val bundledReaderRootCert = MdocUtil.generateReaderRootCertificate(
                readerRootKey = AsymmetricKey.anonymous(readerRootKey),
                subject = X500Name.fromName(CERT_SUBJECT_COMMON_NAME),
                serial = ASN1Integer.fromRandom(numBits = CERT_SERIAL_NUMBER_BITS),
                validFrom = certsValidFrom,
                validUntil = certsValidUntil,
                crlUrl = CERT_CRL_URL
            )
            // Persist root certificate
            keyStorage.insert(
                STORAGE_KEY_READER_ROOT_CERT,
                ByteString(Cbor.encode(bundledReaderRootCert.toDataItem()))
            )
            bundledReaderRootCert
        }

    println("readerRootCert: ${readerRootCert.toPem()}")

    return AsymmetricKey.X509CertifiedExplicit(
        certChain = X509CertChain(listOf(readerRootCert)),
        privateKey = readerRootPrivateKey
    )
}

private suspend fun loadBundledReaderRootKey(): EcPrivateKey {
    val publicKeyPem = Res.readBytes("files/reader_root_key_public.pem").decodeToString()
    val privateKeyPem = Res.readBytes("files/reader_root_key_private.pem").decodeToString()

    val readerRootKeyPub = EcPublicKey.fromPem(
        publicKeyPem,
        READER_ROOT_KEY_CURVE
    )

    return EcPrivateKey.fromPem(
        privateKeyPem,
        readerRootKeyPub
    )
}
```

You can refer to this [**Reader Root Initialization Code**](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/W3CDCCredentialsRequestButton.kt#L234-L348) for the complete implementation.

### **Initialize Reader Certificate and Key**

This function creates (or retrieves) the reader's operational key pair and certificate. This key is used to authenticate the verifier app when requesting credentials.

**Certificate Chain:**
- Reader Cert (this function) → Reader Root Cert (previous function) → Trust
- The reader cert is signed by the reader root cert

```kotlin
private suspend fun readerInit(
    keyStorage: StorageTable,
    readerRootKey: AsymmetricKey.X509CertifiedExplicit,
    certsValidFrom: Instant,
    certsValidUntil: Instant
): AsymmetricKey.X509Certified {
    // Try to retrieve existing reader private key from storage
    // If not found, generate a new one
    val readerPrivateKey = keyStorage.get(STORAGE_KEY_READER_PRIVATE_KEY)
        ?.let { EcPrivateKey.fromDataItem(Cbor.decode(it.toByteArray())) }
        ?: run {
            // Generate new P-256 private key
            val key = Crypto.createEcPrivateKey(READER_KEY_CURVE)
            // Persist to storage using CBOR encoding
            keyStorage.insert(
                STORAGE_KEY_READER_PRIVATE_KEY,
                ByteString(Cbor.encode(key.toDataItem()))
            )
            key
        }

    // Try to retrieve existing reader certificate from storage
    // If not found, generate a new one signed by the root key
    val readerCert = keyStorage.get(STORAGE_KEY_READER_CERT)?.let {
        X509Cert.fromDataItem(Cbor.decode(it.toByteArray()))
    }
        ?: run {
            // Generate reader certificate signed by reader root
            val cert = MdocUtil.generateReaderCertificate(
                readerRootKey = readerRootKey,
                readerKey = readerPrivateKey.publicKey,
                subject = X500Name.fromName(CERT_SUBJECT_COMMON_NAME),
                serial = ASN1Integer.fromRandom(numBits = CERT_SERIAL_NUMBER_BITS),
                validFrom = certsValidFrom,
                validUntil = certsValidUntil,
            )
            // Persist certificate to storage
            keyStorage.insert(
                STORAGE_KEY_READER_CERT,
                ByteString(Cbor.encode(cert.toDataItem()))
            )
            cert
        }

    // Return the complete certificate chain: [Reader Cert, Reader Root Cert]
    return AsymmetricKey.X509CertifiedExplicit(
        certChain = X509CertChain(listOf(readerCert) + readerRootKey.certChain.certificates),
        privateKey = readerPrivateKey
    )
}
```

You can refer to this [**Reader Initialization Code**](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/W3CDCCredentialsRequestButton.kt#L183-L232) for the complete implementation.

**What does this do?**

* Creates or retrieves reader certificates from persistent storage
* Reader root certificate acts as a self-signed CA (Certificate Authority)
* Reader certificate is signed by the root and used for actual credential requests
* Certificates are cached to avoid regenerating on every request
* Uses P-256 for operational keys and P-384 for root keys

**Key Concepts:**

* **Reader Root Certificate**: The "root of trust" for your verifier app (like a CA)
* **Reader Certificate**: The operational certificate used to sign credential requests
* **Certificate Chain**: Links your reader cert back to the root cert for validation
* **Persistent Storage**: Keys are stored using CBOR encoding so they persist across app sessions
* **Bundled Keys**: This sample uses pre-generated keys from resources for demonstration

## **7. Integrate Into Your UI**

Now that you have completed the core implementation, we can integrate it into the app's UI.

### Display the Request Button Composable in `HomeScreen`

```kotlin
@Composable
fun HomeScreen(
    // ...
) {

    Column {
        // existing UI for presentment

        // W3C Digital Credentials API is currently only available on Android
        if (isAndroid() && documents.isNotEmpty()) {
            W3CDCCredentialsRequestButton(
                promptModel = App.promptModel,
                storageTable = app.storageTable,
                showResponse = { vpToken: JsonObject?,
                                 deviceResponse: DataItem?,
                                 sessionTranscript: DataItem,
                                 nonce: ByteString?,
                                 eReaderKey: EcPrivateKey?,
                                 metadata: ShowResponseMetadata ->
                    navController.navigate(
                        buildShowResponseDestination(
                            vpToken = vpToken,
                            deviceResponse = deviceResponse,
                            sessionTranscript = sessionTranscript,
                            nonce = nonce,
                            eReaderKey = eReaderKey,
                            metadata = metadata,
                        )
                    )
                }
            )
        }

        // existing UI for facenet
    }
}
```

Refer to **[this code from `HomeScreen.kt`](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L201-L224)** for the full implementation

### Wire in the implementation in `App.kt` class

```kotlin
class App {
    // ...

    @Composable
    fun Content() {
        MaterialTheme {
            Column {
                NavHost {
                    composable<Destination.HomeDestination> {
                        /* HomeScreen() invocation*/
                    }

                    composable<Destination.ProvisioningDestination> {
                        /* ProvisioningScreen() invocation*/
                    }

                    composable<Destination.ShowResponseDestination> { backStackEntry ->
                        val response =
                            backStackEntry.toRoute<Destination.ShowResponseDestination>()

                        ShowResponseScreen(
                            response = response,
                            documentTypeRepository = documentTypeRepository,
                            goBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                }
            }
        }
    }
}
```

Refer to the [**updates to the Navigation code**](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L405-L416) for the complete example.

### Add the Response Display Screen

After receiving the credential response, we need to display the data to the user. This is implemented using the `` Composable that verifies the cryptographic integrity of the response, extracts the credential data, and displays it.

```kotlin
// w3cdc/ShowResponseScreen.kt
@Composable
fun ShowResponseScreen(
    response: Destination.ShowResponseDestination,
    documentTypeRepository: DocumentTypeRepository?,
    goBack: () -> Unit
) {
    val vpToken = response.vpResponse?.let { vpResponse ->
        Json.decodeFromString<JsonObject>(
            vpResponse.fromBase64Url().decodeToString()
        )
    }

    val sessionTranscript = response.sessionTranscript?.let {
        Cbor.decode(it.fromBase64Url())
    }

    val nonce = response.nonce?.let { ByteString(it.fromBase64Url()) }

    val verificationResult =
        remember { mutableStateOf<VerificationResult>(VerificationResult.Loading) }
    val verificationResultValue = verificationResult.value

    LaunchedEffect(Unit) {
        val now = Clock.System.now()
        if (sessionTranscript == null) {
            verificationResult.value = VerificationResult.Error("Session transcript is null")
            return@LaunchedEffect
        }
        try {
            verificationResult.value = parseResponse(
                now = now,
                vpToken = vpToken,
                sessionTranscript = sessionTranscript,
                nonce = nonce,
                documentTypeRepository = documentTypeRepository,
            )
        } catch (e: Throwable) {
            Logger.e(TAG, "Error parsing response", e)
            verificationResult.value = VerificationResult.Error("Error parsing response")
        }
    }

    when (verificationResultValue) {
        is VerificationResult.Error -> Box(
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "Error: ${verificationResultValue.errorMessage}",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.error
            )
        }

        is VerificationResult.Loading -> Box(
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator()
        }

        is VerificationResult.Success -> SuccessScreen(
            values = verificationResultValue.documentValues,
            goBack = goBack
        )
    }
}
```

**What this does:**

* **Step 1**: Decodes the response data from base64url encoding
* **Step 2**: Verifies the cryptographic signatures using `verifyOpenID4VPResponse()` function from the Multipaz SDK
* **Step 3**: Validates the session transcript binding between request and response
* **Step 4**: Verifies the nonce matches to prevent replay attacks
* **Step 5**: Extracts and parses individual claims (data elements) from the credential
* **Step 6**: Separates image data (portraits) from text data (names, dates, etc.)
* **Step 7**: Displays the verified credential data in a user-friendly UI

**Key Security Features:**

* **Cryptographic Verification**: All signatures are verified before displaying data
* **Session Binding**: The session transcript ensures the response matches the request
* **Nonce Validation**: Prevents replay attacks by verifying the nonce
* **Type Safety**: Uses sealed classes to handle loading, success, and error states
* **Error Handling**: Gracefully handles verification failures

**Note:** You would want to copy-paste [**the ShowResponseScreen.kt** file](https://github.com/openwallet-foundation/multipaz-samples/blob/39d218923dba24e78be0d8e681672e17cc5f57ff/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/w3cdc/ShowResponseScreen.kt) for the complete implementation.

#### **Demo Screenshots**

<div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px'}}>
  <div style={{width: '22%', minWidth: 120, textAlign: 'center'}}>
    <img src="/img/dc_native_1.png" alt="Step 1: Credential Request in Browser" style={{width: '100%', borderRadius: 6}} />
    <div style={{fontSize: '0.9em', marginTop: 4}}>Step 1</div>
  </div>
  <div style={{width: '22%', minWidth: 120, textAlign: 'center'}}>
    <img src="/img/dc_native_2.png" alt="Step 2: Credential Selection in App" style={{width: '100%', borderRadius: 6}} />
    <div style={{fontSize: '0.9em', marginTop: 4}}>Step 2</div>
  </div>
  <div style={{width: '22%', minWidth: 120, textAlign: 'center'}}>
    <img src="/img/dc_native_3.png" alt="Step 3: Credential Sent to Verifier" style={{width: '100%', borderRadius: 6}} />
    <div style={{fontSize: '0.9em', marginTop: 4}}>Step 3</div>
  </div>
</div>