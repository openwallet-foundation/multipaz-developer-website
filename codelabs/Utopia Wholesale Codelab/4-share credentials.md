---
title: Share Credentials
sidebar_position: 3
---


# Share Credentials

### **Add the ability to Share Credential**

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

---

### **Step 1: Initialize PresentmentModel**

In App.kt , initialize this model during app startup (if not already):

```kotlin
// TODO: presentmentModel = PresentmentModel().apply { // setPromptModel(promptModel) }
presentmentModel = PresentmentModel().apply {
    setPromptModel(promptModel)
}
```


This model manages the credential presentation lifecycle, including state transitions like `IDLE`, `CONNECTING`, `COMPLETED`, etc.

---

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


---

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

---

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

---

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
