---
title: Share Credential
sidebar_position: 2
---


# **Create and Share Credential** 

A document is a container that holds multiple credentials and represents an identity document (like a driver's license or passport). Credential is the actual cryptographic proof within a document that can be presented to verifiers.

We will discuss how to create a credential and bind it to the document created above.


### **Add Verifier Certificate**


The Holder app also needs to add the Verifier (Reader) certificate to its trust list. This ensures that the Holder can recognize and trust the Verifier during credential sharing. The Verifier's certificate can be downloaded from the Multipaz Verifier [website](https://verifier.multipaz.org/identityreaderbackend/). Below is the code snippet demonstrating how to add the Verifier's certificate to the trust list,In App.kt:
```
//TODO: Add X509Cert
addX509Cert(
    certificate = X509Cert.fromPem(
        Res.readBytes("files/test_app_reader_root_certificate.pem")
            .decodeToString().trimIndent().trim()
    ),
    metadata = TrustMetadata(
        displayName = "OWF Multipaz Test App Reader",
        displayIcon = null,
        privacyPolicyUrl = "https://apps.multipaz.org"
    )
)
addX509Cert(
    certificate = X509Cert.fromPem(
        Res.readBytes("files/reader_root_certificate.pem").decodeToString()
            .trimIndent().trim(),
    ),
    metadata = TrustMetadata(
        displayName = "Multipaz Identity Reader (Trusted Devices)",
        displayIcon = null,
        privacyPolicyUrl = "https://apps.multipaz.org"
    )
)
addX509Cert(
    certificate = X509Cert.fromPem(
        Res.readBytes("files/reader_root_certificate_for_untrust_device.pem")
            .decodeToString().trimIndent().trim(),
    ),
    metadata = TrustMetadata(
        displayName = "Multipaz Identity Reader (UnTrusted Devices)",
        displayIcon = null,
        privacyPolicyUrl = "https://apps.multipaz.org"
    )
)
```


---

## **(Optional)How to Generate a Certificate**

In above step "Add the IACA certificate" mentions `iaca_private_key` (iaca private key)and `iaca_Cert`(iaca certificate)
This section shows how to generate your own iaca certificate and  iaca private key.

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
- `iaca_certificate.pem` — used by the Verifier (contains the public key)
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


### **Step 1: Initialize PresentmentModel**

In App.kt , initialize this model during app startup (if not already):

```kotlin
// TDDO: add provisioningModel
provisioningModel = ProvisioningModel(
    documentStore = documentStore,
    secureArea = Platform.getSecureArea(),
    httpClient = io.ktor.client.HttpClient() {
        followRedirects = false
    },
    promptModel = Platform.promptModel,
    documentMetadataInitializer = ::initializeDocumentMetadata
)
```
This model manages the credential presentation lifecycle, including state transitions like `IDLE`, `CONNECTING`, `COMPLETED`, etc.


### **Step 2: Add a QR Presentation Button**

The `showQrButton()` composable sets up a UI button that begins the QR-code based session.
Internally, this function:

* Starts a BLE connection for a mobile document (mDoc).

* Creates a device engagement message.

* Shows the engagement as a QR code.

* Waits for a verifier to connect.

```kotlin
// TODO: show qr button when credentials are available
Button(onClick = {
                 val connectionMethods = listOf(
                     MdocConnectionMethodBle(
                         supportsPeripheralServerMode = false,
                         supportsCentralClientMode = true,
                         peripheralServerModeUuid = null,
                         centralClientModeUuid = UUID.randomUUID(),
                     )
                 )
                 onQrButtonClicked(
                     MdocProximityQrSettings(
                         availableConnectionMethods = connectionMethods,
                         createTransportOptions = MdocTransportOptions(bleUseL2CAP = true)
                     )
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

1. **BLE is used to advertise available transport** using `MdocConnectionMethodBle`.

2. A new **ephemeral EC key** is generated to protect session identity and engagement.

3. The device broadcasts its support for NFC and BLE (as available).

4. A **DeviceEngagement object** is created by `EngagementGenerator`, encoded, and presented as a QR code.

5. Verifiers can either:

   * **Scan the QR code** to get the engagement info.

   * **Tap via NFC** (if supported) to receive the engagement via proximity.

6. Once the verifier connects via BLE, a secure mdoc session is established.
   MdocConnectionMethodBle is used for Ble connection



### **Step 3: Generate and Show the QR Code**

When `showQrButton()` triggers the connection, it calls `showQrCode()` to display a QR code representing the device engagement.

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



### **Step 4(Android Only): Sharing Credential Code by NFC**

In this section, you'll learn how to enable **NFC credential sharing** in your Utopia app. NFC (Near Field Communication) is a contactless mechanism allowing users to "tap" their phone to a verifier device to present credentials. This is especially useful for Android devices, offering fast and secure sharing without opening a UI manually.

* `NfcActivity`	Handles the credential presentation lifecycle triggered by NFC tap.  
* `NdefService`	System-level service that binds the NFC engagement mechanism.  
* `AndroidManifest.xml`	Declares the NFC capabilities and configures the app’s NFC role.

1. Define `NfcActivity.kt` (Presentation Flow)

NfcActivity extends from MdocNfcPresentmentActivity(this activity used for ISO/IEC 18013-5:2021 presentment when using NFC engagement.)

This activity launches when the device is tapped against a verifier. It initializes the SDK and returns the appropriate settings, in the settings it includes information like appname, appIcon, promptModel,etc:

_NfcActivity.kt_

```kotlin
//TODO: init app instance
app.init()
```

This activity wakes the device if necessary and securely presents credentials.


2. Define NdefService.kt (Engagement Settings)

NdefService extends from MdocNdefService(Base class for implementing NFC engagement according to ISO/IEC 18013-5:2021.)

In _NdefService.kt_ `negotiatedHandoverPreferredOrder` is set to select BLE. In this case, NFC establishes the initial connection. No credential data is transferred at this stage. The NFC connection is used to negotiate which transport method to use. Since BLE is selected, a BLE connection is established, and credentials are shared over BLE.

Configure AndroidManifest.xml:Add NFC capabilities and link your NfcActivity and NdefService in AndroidManifest.xml

_AndroidManifest.xml_
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

3. Configure NFC AID Filter(nfc\_ndef\_service.xml)

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

Explanation of attributes:  
- `android:requireDeviceUnlock`: `false` — app can respond even when locked  
- `android:requireDeviceScreenOn`: `false` — screen can be off  
- `aid-filter`: Identifies the NFC Type 4 Tag
