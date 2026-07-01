---
title: Share Credential
sidebar_position: 2
---


# **Create and Share Credential** 

A document is a container that holds multiple credentials and represents an identity document (like a driver's license or passport). Credential is the actual cryptographic proof within a document that can be presented to verifiers.

We will discuss how to create a credential and bind it to the document created above.


### **Add Verifier Certificate**

The Holder app also needs to add the Verifier (Reader) certificate to its trust list. This ensures that the Holder can recognize and trust the Verifier during credential sharing. The Verifier's certificate can be downloaded from the Multipaz Verifier [website](https://verifier.multipaz.org/identityreaderbackend/).

In your Koin module (`MultipazModule.kt`), configure the `TrustManager` to add the Verifier certificates. The `TrustManager` is defined as a singleton and automatically adds all required certificates during initialization:

```kotlin
//TODO: define TrustManager in Koin module
single<TrustManager> {
    val trustManager = TrustManager(storage = get(), identifier = "reader")

    runBlocking {
        suspend fun addCertificateIfNotExists(
            certPath: String,
            displayName: String,
            privacyPolicyUrl: String
        ) {
            try {
                val certPem = Res.readBytes(certPath)
                    .decodeToString()
                    .trimIndent()
                    .trim()

                trustManager.addX509Cert(
                    certificate = X509Cert.fromPem(certPem),
                    metadata = TrustMetadata(
                        displayName = displayName,
                        displayIcon = null,
                        privacyPolicyUrl = privacyPolicyUrl
                    )
                )
                Logger.i("TrustManager", "Successfully added certificate: $displayName")
            } catch (e: TrustEntryAlreadyExistsException) {
                Logger.e(
                    "TrustManager",
                    "Certificate already exists: $displayName",
                    e
                )
            } catch (e: Exception) {
                Logger.e(
                    "TrustManager",
                    "Failed to add certificate: $displayName - ${e.message}",
                    e
                )
            }
        }

        // Add all required certificates
        addCertificateIfNotExists(
            certPath = "files/test_app_reader_root_certificate.pem",
            displayName = "OWF Multipaz Test App Reader",
            privacyPolicyUrl = "https://apps.multipaz.org"
        )

        addCertificateIfNotExists(
            certPath = "files/reader_root_certificate.pem",
            displayName = "Multipaz Identity Reader (Trusted Devices)",
            privacyPolicyUrl = "https://apps.multipaz.org"
        )

        addCertificateIfNotExists(
            certPath = "files/reader_root_certificate_for_untrust_device.pem",
            displayName = "Multipaz Identity Reader (UnTrusted Devices)",
            privacyPolicyUrl = "https://apps.multipaz.org"
        )

        addCertificateIfNotExists(
            certPath = "files/reader_root_cert_multipaz_web_verifier.pem",
            displayName = "Multipaz Web Verifier",
            privacyPolicyUrl = "https://verifier.multipaz.org",
        )

        trustManager
    }
}
```

**Key points:**

* The `TrustManager` is created using `TrustManagerLocal` with the `Storage` instance injected via Koin's `get()`.
* The helper function `addCertificateIfNotExists` handles certificate loading and error handling, preventing duplicate certificate errors.
* All three certificates are added during the Koin module initialization.
* The `TrustManager` instance is then available for injection throughout your app.


---

## **(Optional) How to Generate a Certificate**

In above step "Verifier (Reader) certificate" mentions certificate. This section shows how to generate your own iaca certificate and  iaca private key.

### Step 1: Add `multipazctl` to Your System Path

Follow the official instructions:  
👉 [Command-Line Tool Setup](https://github.com/openwallet-foundation-labs/identity-credential?tab=readme-ov-file#command-line-tool)

Once set up, you can run `multipazctl` like any other terminal command.

### Step 2: Generate the IACA Certificate and Private Key

Run the following command:

```bash
multipazctl generateIaca
```

This will generate:
- `iaca_certificate.pem` — the certificate (contains the public key)
- `iaca_private_key.pem` — private key


---

## **Share Credentials**


This section code is in the “Share Credential” folder. After creating credentials, users need to **share a verifiable credential (OpenID4VP, OpenID for Verifiable Presentations)**—by showing a **QR code** to a verifier (e.g., a scanner at a kiosk or a border checkpoint).

In this section, you'll learn how to:

* Enable a "Present via QR" button in your UI.  
* Dynamically generate a secure QR code representing your credential.  
* Use the **PresentmentModel** to handle BLE communication and verifier interaction.  
* Use NFC to share Credentials

We will use components just like below

* `PresentmentModel`	Orchestrates the flow of presenting credentials to verifiers.  
* `showQrButton()`	Launches the QR-based presentation mechanism.  
* `showQrCode()`	    Generates and displays the QR code with engagement info.  
* `MdocPresentmentMechanism`   Handles BLE communication and mdoc connection negotiation.  
* NdefService  		binds the NFC engagement mechanism.


### **Step 1: Configure PresentmentSource in Koin**

#### **1.1 Understanding DigitalCredentialsRegistrationManager**

The `DigitalCredentialsRegistrationManager` is a centralized class that handles W3C Digital Credentials API registration for Android. This fixes glitches where credentials weren't properly available for web and native verification after issuance.

**Key features:**

* **Thread-safe**: Uses a `Mutex` to prevent concurrent registration attempts
* **Conditional execution**: Only runs on Android (checked via `shouldRegisterDigitalCredentialsInCommonModule()`)
* **Error handling**: Catches and logs registration failures without crashing

#### **1.2 Configure Components in Koin**

In your Koin module (`MultipazModule.kt`), configure the `PresentmentSource` which handles credential presentation to verifiers. The `PresentmentSource` is responsible for managing the presentation flow and supporting different credential formats.

```kotlin
//TODO: define DigitalCredentialsRegistrationManager in Koin module
single<DigitalCredentialsRegistrationManager> {
    DigitalCredentialsRegistrationManager(
        documentStore = get(),
        documentTypeRepository = get(),
        settingsModel = get(),
    )
}
```

```kotlin
//TODO: define PresentmentSource in Koin module
single<PresentmentSource> {
    val settingsModel: AppSettingsModel = get()
    val requireAuthentication = settingsModel.presentmentRequireAuthentication.value
    val documentStore: DocumentStore = get()
    val documentTypeRepository: DocumentTypeRepository = get()

    // Keep an initial eager refresh here so existing startup behavior is preserved.
    if (shouldRegisterDigitalCredentialsInCommonModule()) {
        runBlocking { get<DigitalCredentialsRegistrationManager>().refresh("PresentmentSource init") }
    }

    SimplePresentmentSource(
        documentStore = get(),
        documentTypeRepository = get(),
        preferSignatureToKeyAgreement = true,
        // Match domains used when storing credentials via OpenID4VCI
        domainsMdocSignature = listOf(TestAppUtils.CREDENTIAL_DOMAIN_MDOC_USER_AUTH),
        domainsMdocKeyAgreement = listOf(TestAppUtils.CREDENTIAL_DOMAIN_MDOC_MAC_USER_AUTH),
        domainsKeylessSdJwt = listOf(TestAppUtils.CREDENTIAL_DOMAIN_SDJWT_KEYLESS),
        domainsKeyBoundSdJwt = listOf(TestAppUtils.CREDENTIAL_DOMAIN_SDJWT_USER_AUTH),
    )
}
```

**Key points:**

* `DigitalCredentialsRegistrationManager` is a centralized manager that handles W3C Digital Credentials API registration for Android. This ensures credentials are properly registered after issuance.
* `PresentmentSource` is configured as a singleton in the Koin module.
* The registration manager is called during `PresentmentSource` initialization, but the centralized manager allows for refreshes after credential issuance events.
* `SimplePresentmentSource` is created with all required dependencies injected via Koin's `get()` function:
  * `documentStore` - For accessing stored credentials
  * `documentTypeRepository` - For managing document types
* `preferSignatureToKeyAgreement = true` prioritizes signature-based authentication over key agreement.
* Domain configurations match those used during credential storage via OpenID4VCI to ensure proper credential binding:
  * `domainsMdocSignature` - List of domains for mDoc signature-based credentials
  * `domainsMdocKeyAgreement` - List of domains for mDoc MAC/key agreement credentials
  * `domainsKeylessSdJwt` - List of domains for keyless SD-JWT credentials
  * `domainsKeyBoundSdJwt` - List of domains for key-bound SD-JWT credentials

The `PresentmentModel` (which manages the presentation lifecycle and state transitions like `IDLE`, `CONNECTING`, `COMPLETED`, etc.) is also configured in the Koin module and can be injected wherever needed in your app.

### **Step 2: Add a QR Presentation Button**

In `AccountScreen.kt`, add a UI button that begins the QR-code based session. The `showQrButton()` composable sets up this functionality.
Internally, this function:

* Starts a BLE connection for a mobile document (mDoc).

* Creates a device engagement message.

* Shows the engagement as a QR code.

* Waits for a verifier to connect.

_AccountScreen.kt_

```kotlin
// TODO: show qr button when credentials are available
Button(onClick = {
    val connectionMethods = mutableListOf<MdocConnectionMethod>()
    val bleUuid = UUID.randomUUID()
    if (bleCentralClientEnabled) {
        connectionMethods.add(
            MdocConnectionMethodBle(
                supportsPeripheralServerMode = false,
                supportsCentralClientMode = true,
                peripheralServerModeUuid = null,
                centralClientModeUuid = bleUuid,
            ),
        )
    }
    if (blePeripheralServerEnabled) {
        connectionMethods.add(
            MdocConnectionMethodBle(
                supportsPeripheralServerMode = true,
                supportsCentralClientMode = false,
                peripheralServerModeUuid = bleUuid,
                centralClientModeUuid = null,
            ),
        )
    }
    if (nfcDataTransferEnabled) {
        connectionMethods.add(
            MdocConnectionMethodNfc(
                commandDataFieldMaxLength = 0xffff,
                responseDataFieldMaxLength = 0x10000,
            ),
        )
    }
    onGenerateQrCode(
        MdocProximityQrSettings(
            availableConnectionMethods = connectionMethods,
            createTransportOptions = MdocTransportOptions(
                bleUseL2CAP = bleL2CapEnabled,
                bleUseL2CAPInEngagement = bleL2CapInEngagementEnabled,
            ),
        ),
    )
}) {
    Text("Present mDL via QR")
}
Spacer(modifier = Modifier.height(16.dp))
Text(
    text = "The mDL is also available\n" +
            "via NFC engagement and W3C DC API\n" +
            "(Android-only right now)",
    textAlign = TextAlign.Center
)
```

When the user taps **Present mDL via QR**, the following sequence is triggered:

1. A **mutable list of connection methods** is created to dynamically configure available transports based on enabled settings.

2. A **shared BLE UUID** is generated for consistent device identification across connection methods.

3. **Connection methods are added conditionally** based on feature flags:
   * **BLE Central Client mode** (`bleCentralClientEnabled`) - Device acts as central client connecting to peripheral verifiers.
   * **BLE Peripheral Server mode** (`blePeripheralServerEnabled`) - Device acts as peripheral server accepting connections from central verifiers.
   * **NFC Data Transfer** (`nfcDataTransferEnabled`) - Enables NFC-based credential presentation with configurable data field lengths.

4. **`onGenerateQrCode()`** is called with `MdocProximityQrSettings` containing:
   * All configured `availableConnectionMethods`
   * `MdocTransportOptions` specifying L2CAP support settings (`bleL2CapEnabled`, `bleL2CapInEngagementEnabled`)

5. A new **ephemeral EC key** is generated to protect session identity and engagement.

6. A **DeviceEngagement object** is created, encoded, and presented as a QR code.

7. Verifiers can either:
   * **Scan the QR code** to get the engagement info and connect via the advertised BLE modes.
   * **Use NFC Data Transfer** if enabled, for direct credential exchange over NFC.

8. Once the verifier connects via the negotiated transport (BLE or NFC), a secure mdoc session is established.



### **Step 3: Generate and Show the QR Code**

In `AccountScreen.kt`, when `showQrButton()` triggers the connection, it calls `showQrCode()` to display a QR code representing the device engagement.

_AccountScreen.kt_

```kotlin
//TODO: show QR code
Image(
    modifier = Modifier.fillMaxWidth(),
    bitmap = qrCodeBitmap,
    contentDescription = null,
    contentScale = ContentScale.FillWidth
)

```


The QR code encodes the device's **payload**, which a verifier can scan to initiate a secure connection.



### **Step 4 (Android Only): Sharing Credentials via NFC**

In this section, you'll learn how to enable **NFC credential sharing** in your Utopia app. NFC (Near Field Communication) is a contactless mechanism allowing users to "tap" their phone to a verifier device to present credentials. This is especially useful for Android devices, offering fast and secure sharing without opening a UI manually.

These components live in the **Android-specific source set** (`composeApp/src/androidMain/`):

* `NdefService` – System-level service that binds the NFC engagement mechanism.  
* `AndroidManifest.xml` – Declares the NFC capabilities and configures the app’s NFC role.

This activity wakes the device if necessary and securely presents credentials when the phone is tapped against a verifier.

#### 1. Define `NdefService.kt` (Engagement Settings)

`NdefService` extends `MdocNdefService` (base class for implementing NFC engagement according to ISO/IEC 18013-5:2021).

In this service, you load the user's NFC-related settings via `AppSettingsModel` and configure the engagement behavior:

_`composeApp/src/androidMain/.../NdefService.kt`_

```kotlin
class NdefService : MdocNdefService() {
    private val presentmentSource: PresentmentSource by inject()
    private val settingsModel: AppSettingsModel by inject()

    override suspend fun getSettings(): Settings {
        // Reset the presentment model with the source's document store and repository
        PresentmentActivity.presentmentModel.reset(
            documentStore = presentmentSource.documentStore,
            documentTypeRepository = presentmentSource.documentTypeRepository,
            preselectedDocuments = emptyList(),
        )

        return Settings(
            source = presentmentSource,
            promptModel = PresentmentActivity.promptModel,
            presentmentModel = PresentmentActivity.presentmentModel,
            activityClass = PresentmentActivity::class.java,
            sessionEncryptionCurve = settingsModel.presentmentSessionEncryptionCurve.value,
            useNegotiatedHandover = settingsModel.presentmentUseNegotiatedHandover.value,
            negotiatedHandoverPreferredOrder = settingsModel.presentmentNegotiatedHandoverPreferredOrder.value,
            staticHandoverBleCentralClientModeEnabled = settingsModel.presentmentBleCentralClientModeEnabled.value,
            staticHandoverBlePeripheralServerModeEnabled =
                settingsModel.presentmentBlePeripheralServerModeEnabled.value,
            staticHandoverNfcDataTransferEnabled = settingsModel.presentmentNfcDataTransferEnabled.value,
            transportOptions =
                MdocTransportOptions(
                    bleUseL2CAP = settingsModel.presentmentBleL2CapEnabled.value,
                    bleUseL2CAPInEngagement = settingsModel.presentmentBleL2CapInEngagementEnabled.value,
                ),
        )
    }
}
```

`negotiatedHandoverPreferredOrder` is set to select BLE. In this case, NFC establishes the initial connection. No credential data is transferred at this stage. The NFC connection is used to negotiate which transport method to use. Since BLE is selected, a BLE connection is established, and credentials are shared over BLE.

Configure `AndroidManifest.xml`:Add NFC capabilities and link your `NfcActivity` and `NdefService` in `AndroidManifest.xml`

_`AndroidManifest.xml`_

```xml
<!-- TODO: Add this NdefService-->
<service
    android:name=".NdefService"
    android:exported="true"
    android:label="@string/nfc_ndef_service_description"
    android:permission="android.permission.BIND_NFC_SERVICE">
    <intent-filter>
        <action android:name="android.nfc.cardemulation.action.HOST_APDU_SERVICE" />
    </intent-filter>

    <meta-data
        android:name="android.nfc.cardemulation.host_apdu_service"
        android:resource="@xml/nfc_ndef_service" />
</service>

```

#### 2. Configure NFC AID Filter(nfc\_ndef\_service.xml)

Nfc\_ndef\_service.xml is under “res/xml”. To allow your Android device to act as an NFC Type 4 Tag and share credentials securely with a verifier, you must configure an AID (Application Identifier) filter. This is done in `nfc_ndef_service.xml`, which is referenced in your `AndroidManifest.xml`.

**Purpose of** `nfc_ndef_service.xml`

This XML file tells the Android system:

* What AID(s) your app responds to.

* Whether device unlock or screen-on is required.

* That your app supports NFC-based APDU communication (ISO/IEC 7816).

_nfc_ndef_service.xml_
```xml

<!--TODO: implement nfc_ndef_service xml-->
<aid-group android:description="@string/nfc_ndef_service_aid_group_description" android:category="other">
    <!-- NFC Type 4 Tag -->
    <aid-filter android:name="D2760000850101"/>
</aid-group>
```
---

In nfc_ndef_service.xml, the explanation of attributes:  
- `android:requireDeviceUnlock`: `false` — app can respond even when locked  
- `android:requireDeviceScreenOn`: `false` — screen can be off  
- `aid-filter`: Identifies the NFC Type 4 Tag
