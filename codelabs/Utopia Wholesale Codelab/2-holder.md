---
title: Holder
sidebar_position: 2
---

# Holder

The Holder app stores credentials and allows sharing them with the Verifier app (Reader). In this section, we’ll discuss how to implement credential storage and sharing.

---
# Storage


### **Store document**

In this section (Storage folder), you’ll set up the components needed to manage secure credentials using the multipaz SDK. The classes that handles the storage part of the identity includes: 

* `Storage`: Local data storage that will hold the data items. Implementations for both Android and iOS are provided by Multipaz.

* `SecureArea`: An abstraction for cryptographic key handling. On Android, this uses the Keystore; on iOS, it uses the Secure Enclave.

* `SecureAreaRepository`: A registry of available `SecureArea` implementations, it controls for “SecureArea” implementation 

* `DocumentStore`: ​​Class for storing real-world identity documents.

We’ll guide you through integrating and initializing these components in your KMP app.


### **Step 1: Initialize `Storage`**

In your UI code in App.kt, call the following to obtain a Storage instance suitable for the platform, ensuring that the data is not backed up(We do not want our database to be backed-up as it is useless without private keys,in the secure area (which are not, and cannot be backed-up),this function ensures the database file is excluded from Android's backup system:

```kotlin
//TODO : storage = Platform.nonBackedUpStorage
storage = Platform.nonBackedUpStorage()
```



### **Step 2: Create a `SecureArea`**

This code is in App.kt. SecureArea suitable for the platform to represent cryptographic key containers. For example, they can leverage the Android Keystore or use SecureEnclaveSecureArea in iOS.

```kotlin
//TODO: secureArea = Platform.getSecureArea()
secureArea = Platform.getSecureArea()
```
The Platform.getSecureArea() function returns platform-specific secure area implementations that use hardware-backed key storage:in android it is Android Keystore system, in iOS,it is SecureEnclaveSecureArea



### **Step 3: Register it in a `SecureAreaRepository`**

Create a secureAreaRepository that manages secure area implementations.This code is located in App.kt:

```kotlin

//TODO: secureAreaRepository = SecureAreaRepository.Builder().add(secureArea).build()

secureAreaRepository = SecureAreaRepository.Builder()
    .add(secureArea)
    .build()

```


### **Step 4: Initialize the `DocumentStore`**

In App.kt, DocumentStore is the main API used to create, list, and manage verifiable documents. It connects your Storage and SecureAreaRepository.

```kotlin

*//TODO: documentStore = buildDocumentStore(storage = storage, secureAreaRepository = secureAreaRepository) {}*

documentStore = buildDocumentStore(
    storage = storage, 
    secureAreaRepository = secureAreaRepository
) {}
```

Once initialized, you can start interacting with the store to create, delete, or retrieve documents.



### **Step 5: Create a new Document**

In App.kt,  You can create a simple `Document`  like this:
```kotlin

val profile = ByteString(

    getDrawableResourceBytes(

        getSystemResourceEnvironment(),

        Res.drawable.profile

    )

)

//TODO: document = documentStore.createDocument(*  
//                    displayName ="Tom Lee's Utopia Membership",
//                    typeDisplayName = "Membership Card",
//                    cardArt = profile,
//                    other = UtopiaMemberInfo().toJsonString().encodeToByteString(),
//                )

 document = documentStore.createDocument(  
   displayName ="Tom Lee's Utopia Membership",
   typeDisplayName = "Membership Card",
   cardArt = profile,
   other = UtopiaMemberInfo().toJsonString().encodeToByteString(),
)
```
“Res.drawable.proifle”: here add a profile.png in “/src/commonMain/composeResources/drawable” folder




### **Step 6: Fetch and Display Documents**

In App.kt, get documents IDs in the `DocumentStore`:

```kotlin
val listIDs = documentStore.listDocuments().
```

---

### **Create Credential** 

A document is a container that holds multiple credentials and represents an identity document (like a driver's license or passport). Credential is the actual cryptographic proof within a document that can be presented to verifiers.

We will discuss how to create a credential and bind it to the document created above.

In App.kt

### **Step 1: Establish validity times**
```kotlin
val now = Clock.System.now()

val signedAt = now

val validFrom = now

val validUntil = now + 365.days
```

now is captured from the system clock. The credential is considered signed at signedAt, becomes valid at validFrom, and remains valid for 365 days (validUntil).

### **Step 2: Add the IACA certificate**

Get pre-generated Authority Certificate Authority (IACA) certificate and private_key ,the certificate will be shared to Verifier so holder will be in Verifier's issuer trust list
```kotlin
val iacaCert = X509Cert.fromPem(
    Res.readBytes("files/iaca_certificate.pem").decodeToString().trimIndent().trim()
)
Logger.i(appName, iacaCert.toPem())
val iacaKey = EcPrivateKey.fromPem(
   Res.readBytes("files/iaca_private_key.pem").decodeToString().trimIndent().trim(),
   iacaCert.ecPublicKey
)

```
### **Step 3: Generate the DS certificate**

“generateDsCertificate” issues a Document Signing (DS) certificate from the IACA key. Its parameters are:  
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

### **Step 4: Create the credential with sample data**

“createMdocCredentialWithSampleData” adds an MdocCredential to the document using the specified secureArea.  
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

### **Step 5: Start exporting credential**

Now the credentials exist in your documents, however, they won't be accessible through  Android/ios credential manager system. In order to be accessed by the credential manager system, you need to export the credentials

```kotlin
if (DigitalCredentials.Default.available) {  
//TODO:  DigitalCredentials.Default.startExportingCredentials(
//                    documentStore = documentStore,
//                    documentTypeRepository = documentTypeRepository*  
//                )

   DigitalCredentials.Default.startExportingCredentials(  
       documentStore = documentStore,  
       documentTypeRepository = documentTypeRepository  
   )  
}

```


### **Step 6: Add Verifier Certificate**


The Holder app also needs to add the Verifier (Reader) certificate to its trust list. This ensures that the Holder can recognize and trust the Verifier during credential sharing. The Verifier's certificate can be downloaded from the Multipaz Verifier [website](https://verifier.multipaz.org/identityreaderbackend/). Below is the code snippet demonstrating how to add the Verifier's certificate to the trust list:
```
    try {
            readerTrustManager.apply{
                addX509Cert(
                    certificate = X509Cert.fromPem(
                        Res.readBytes("files/test_app_reader_root_certificate.pem").decodeToString().trimIndent().trim()
                    ),
                    metadata = TrustMetadata(
                        displayName = "OWF Multipaz Test App Reader",
                        displayIcon = null,
                        privacyPolicyUrl = "https://apps.multipaz.org"
                    )
                )
                addX509Cert(
                    certificate = X509Cert.fromPem(
                        Res.readBytes("files/reader_root_certificate.pem").decodeToString().trimIndent().trim(),
                    ),
                    metadata = TrustMetadata(
                        displayName = "Multipaz Identity Reader (Trusted Devices)",
                        displayIcon = null,
                        privacyPolicyUrl = "https://apps.multipaz.org"
                    )
                )
                addX509Cert(
                    certificate = X509Cert.fromPem(
                        Res.readBytes("files/reader_root_certificate_for_untrust_device.pem").decodeToString().trimIndent().trim(),
                    ),
                    metadata = TrustMetadata(
                        displayName = "Multipaz Identity Reader (UnTrusted Devices)",
                        displayIcon = null,
                        privacyPolicyUrl = "https://apps.multipaz.org"
                    )
                )
            }
        } catch (e: TrustPointAlreadyExistsException) {
            e.printStackTrace()
        }
```


---

# How to Generate a Certificate (Optional)
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

# Share Credentials


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
// TODO: presentmentModel = PresentmentModel().apply { // setPromptModel(promptModel) }
presentmentModel = PresentmentModel().apply {
    setPromptModel(promptModel)
}
```


This model manages the credential presentation lifecycle, including state transitions like `IDLE`, `CONNECTING`, `COMPLETED`, etc.


### **Step 2: Add a QR Presentation Button**

The `showQrButton()` composable sets up a UI button that begins the QR-code based session.

```kotlin
private fun showQrButton(showQrCode: MutableState<ByteString?>) {
    Button(onClick = {
        presentmentModel.reset()
        presentmentModel.setConnecting()
        presentmentModel.presentmentScope.launch() {
            ...
        }
    }) {
        Text("Present mDL via QR")
    }
}
```


Internally, this function:

* Starts a BLE connection for a mobile document (mDoc).

* Creates a device engagement message.

* Shows the engagement as a QR code.

* Waits for a verifier to connect.




### **Step 3: Generate and Show the QR Code**

When `showQrButton()` triggers the connection, it calls `showQrCode()` to display a QR code representing the device engagement.

```kotlin
private fun showQrCode(deviceEngagement: MutableState<ByteString?>) {
    if (deviceEngagement.value != null) {
        // TODO: val mdocUrl = "mdoc:" + deviceEngagement.value!!.toByteArray().toBase64Url()
        val mdocUrl = "mdoc:" + deviceEngagement.value!!.toByteArray().toBase64Url()

        // TODO: qrCodeBitmap = remember { generateQrCode(mdocUrl) }
        qrCodeBitmap = remember { generateQrCode(mdocUrl) }
    }
}
```


The QR code encodes the device's **payload**, which a verifier can scan to initiate a secure connection.


### **Step 4: Sharing Credential Code by QR and Bluetooth**

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


```kotlin
val connectionMethods = listOf(
    MdocConnectionMethodBle(
        supportsPeripheralServerMode = false,
        supportsCentralClientMode = true,
        peripheralServerModeUuid = null,
        centralClientModeUuid = UUID.randomUUID(),
    )
)
```

This BLE transport is then advertised:

```kotlin
// TODO: advertisedTransports = connectionMethods.advertise(
//                         role = MdocRole.MDOC,
//                         transportFactory = MdocTransportFactory.Default,
//                         options = MdocTransportOptions(bleUseL2CAP = true),
//                     )

val advertisedTransports = connectionMethods.advertise(
    role = MdocRole.MDOC,
    transportFactory = MdocTransportFactory.Default,
    options = MdocTransportOptions(bleUseL2CAP = true),
)
```

The device engagement includes connection methods for BLE/NFC and is shared as:

```kotlin
val engagementGenerator = EngagementGenerator(
    eSenderKey = eDeviceKey.publicKey,
    version = "1.0"
)

engagementGenerator.addConnectionMethods(advertisedTransports.map {
    it.connectionMethod
})
```



### **Step 5: Sharing Credential Code by NFC (Android Only)**

In this section, you'll learn how to enable **NFC credential sharing** in your Utopia app. NFC (Near Field Communication) is a contactless mechanism allowing users to "tap" their phone to a verifier device to present credentials. This is especially useful for Android devices, offering fast and secure sharing without opening a UI manually.

* `NfcActivity`	Handles the credential presentation lifecycle triggered by NFC tap.  
* `NdefService`	System-level service that binds the NFC engagement mechanism.  
* `AndroidManifest.xml`	Declares the NFC capabilities and configures the app’s NFC role.

1. Define `NfcActivity.kt` (Presentation Flow)

NfcActivity extends from MdocNfcPresentmentActivity(this activity used for ISO/IEC 18013-5:2021 presentment when using NFC engagement.)

This activity launches when the device is tapped against a verifier. It initializes the SDK and returns the appropriate settings, in the settings it includes information like appname, appIcon, promptModel,etc:

_NfcActivity.kt_

```kotlin
override fun ApplicationTheme(content: @Composable (() -> Unit)) {
    content()
}

override suspend fun getSettings(): Settings {
    val app = App.getInstance()
    app.init()
    return Settings(
        appName = app.appName,
        appIcon = app.appIcon,
        promptModel = App.promptModel,
        documentTypeRepository = app.documentTypeRepository,
        presentmentSource = app.presentmentSource
    )
}
```

This activity wakes the device if necessary and securely presents credentials.


2. Define NdefService.kt (Engagement Settings)

NdefService extends from MdocNdefService(Base class for implementing NFC engagement according to ISO/IEC 18013-5:2021.)

_NdefService.kt_
```kotlin
class NdefService : MdocNdefService() {
    override suspend fun getSettings(): Settings {
        return Settings(
            sessionEncryptionCurve = EcCurve.P256,
            allowMultipleRequests = false,
            useNegotiatedHandover = true,
            negotiatedHandoverPreferredOrder = listOf(
                "ble:central_client_mode:",
                "ble:peripheral_server_mode:"
            ),
            transportOptions = MdocTransportOptions(bleUseL2CAP = true),
            promptModel = App.promptModel,
            presentmentActivityClass = NfcActivity::class.java
        )
    }
}
```

`negotiatedHandoverPreferredOrder` is set to select BLE. In this case, NFC establishes the initial connection. No credential data is transferred at this stage. The NFC connection is used to negotiate which transport method to use. Since BLE is selected, a BLE connection is established, and credentials are shared over BLE.

3. Configure AndroidManifest.xml:Add NFC capabilities and link your NfcActivity and NdefService in AndroidManifest.xml

_AndroidManifest.xml_
```xml
<activity
    android:name=".NfcActivity"
    android:showWhenLocked="true"
    android:turnScreenOn="true"
    android:exported="true"
    android:launchMode="singleInstance"
    android:theme="@android:style/Theme.Translucent.NoTitleBar.Fullscreen" />

<!-- TODO: Add this service
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
-->

<service
    android:name=".NdefService"
    android:exported="true"
    android:permission="android.permission.BIND_NFC_SERVICE">
    <intent-filter>
        <action android:name="android.nfc.cardemulation.action.HOST_APDU_SERVICE" />
    </intent-filter>
    <meta-data
        android:name="android.nfc.cardemulation.host_apdu_service"
        android:resource="@xml/nfc_ndef_service" />
</service>

```

4. Configure NFC AID Filter(nfc\_ndef\_service.xml)

Nfc\_ndef\_service.xml is under “res/xml”. To allow your Android device to act as an NFC Type 4 Tag and share credentials securely with a verifier, you must configure an AID (Application Identifier) filter. This is done in `nfc_ndef_service.xml`, which is referenced in your `AndroidManifest.xml`.

**Purpose of** `nfc_ndef_service.xml`

This XML file tells the Android system:

* What AID(s) your app responds to.

* Whether device unlock or screen-on is required.

* That your app supports NFC-based APDU communication (ISO/IEC 7816).

_nfc_ndef_service.xml_
```xml
<?xml version="1.0" encoding="utf-8"?>
<host-apdu-service xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:description="@string/nfc_ndef_service_description"
    android:requireDeviceUnlock="false"
    android:requireDeviceScreenOn="false"
    tools:ignore="UnusedAttribute">

    <aid-group android:description="@string/nfc_ndef_service_aid_group_description"
        android:category="other">
        <!-- NFC Type 4 Tag - matches ISO 18013-5 mDL standard -->
        <aid-filter android:name="D2760000850101"/>
    </aid-group>
</host-apdu-service>
```

---

Explanation of attributes:  
- `android:requireDeviceUnlock`: `false` — app can respond even when locked  
- `android:requireDeviceScreenOn`: `false` — screen can be off  
- `aid-filter`: Identifies the NFC Type 4 Tag
