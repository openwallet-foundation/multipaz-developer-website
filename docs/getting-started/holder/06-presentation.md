---
title: 🎁 Presentation
sidebar_position: 6
---

The presentation phase allows a user to present a credential (such as an mDL) to a verifier, typically using BLE, NFC, or QR code. This section covers runtime permissions, setting up presentment flows, and generating engagement QR codes.

## Runtime Permissions

Multipaz provides composable functions for requesting runtime permissions in your app. Typical permissions include Bluetooth, Camera, and Notifications.

* **Bluetooth Permission:** Use `rememberBluetoothPermissionState`
* **Camera Permission:** Use `rememberCameraPermissionState`
* **Notification Permission:** Use `rememberNotificationPermissionState`

**Example: Requesting BLE Permission**

```kotlin
fun Content() {
    // ...
    MaterialTheme {
        // ...
        Column {
            val coroutineScope = rememberCoroutineScope { promptModel }
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
            } else {
                // ...
            }
        }
    }
    // ...
}
```

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L340-L351) part for the implementation of this section.

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

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L5-L28) part for the implementation of this section.

**info.plist: Required BLE Permissions (iOS)**

Add the following to `iosApp/iosApp/info.plist` to enable BLE permission prompts.

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth permission is required for proximity presentations</string>
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```
Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/iosApp/iosApp/Info.plist#L8-L11) part for the implementation of this section.

## PresentmentModel

`PresentmentModel` manages the entire UX/UI flow for credential presentation, providing a `state` variable to track the presentation process. Multipaz also offers a `Presentment` composable for embedding credential presentment UI.

You can generate QR codes using `org.multipaz.compose.qrcode:generateQrCode`.

```kotlin
class App {
    // ...
    lateinit var presentmentModel: PresentmentModel
    lateinit var presentmentSource: PresentmentSource

    suspend fun init() {
        // ...
        presentmentModel = PresentmentModel().apply { setPromptModel(promptModel) }
        presentmentSource = SimplePresentmentSource(
            documentStore = documentStore,
            documentTypeRepository = documentTypeRepository,
            readerTrustManager = readerTrustManager,
            preferSignatureToKeyAgreement = true,
            domainMdocSignature = "mdoc",
        )
    }

    fun Content() {
        // ...
        MaterialTheme {
            // ...
            Column {
                if (!blePermissionState.isGranted) {
                    // ...
                } else {
                    val deviceEngagement = remember { mutableStateOf<ByteString?>(null) }
                    val state = presentmentModel.state.collectAsState()
                    val appIcon = painterResource(Res.drawable.compose_multiplatform)
                    when (state.value) {
                        PresentmentModel.State.IDLE -> {
                            ShowQrButton(deviceEngagement)
                        }
                        PresentmentModel.State.CONNECTING -> {
                            ShowQrCode(deviceEngagement)
                        }
                        PresentmentModel.State.WAITING_FOR_SOURCE,
                        PresentmentModel.State.PROCESSING,
                        PresentmentModel.State.WAITING_FOR_DOCUMENT_SELECTION,
                        PresentmentModel.State.WAITING_FOR_CONSENT,
                        PresentmentModel.State.COMPLETED -> {
                            Presentment(
                                appName = "Multipaz Getting Started Sample",
                                appIconPainter = appIcon,
                                presentmentModel = presentmentModel,
                                presentmentSource = presentmentSource,
                                documentTypeRepository = documentTypeRepository,
                                onPresentmentComplete = {
                                    presentmentModel.reset()
                                },
                            )
                        }
                    }
                }
            }
        }
        // ...
    }
}
```


The implementation code for the initialization of PresentmentModel can be found [here](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L288-L295) & for the UI updates can be found [here](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L352-L379).

## Starting Device Engagement

To start engagement for presentment (e.g., via BLE), use a connection method that extends `MdocConnectionMethod` (such as `MdocConnectionMethodBle` or `MdocConnectionMethodNfc`). The following example uses BLE:

**Example: BLE Engagement and QR Code**

```kotlin
class App {
    // ...
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
        }
    }
}
```

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L397-L451) part for the implementation of this section in this guide.

## Displaying the QR Code

Use the following composable to display the QR code generated for presentment.

**Example: QR Code Display**

```kotlin
class App {
    // ...
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
}
```

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L453-L479) part for the implementation of this section in this guide.

By following these steps, you can request necessary permissions, manage the credential presentment flow, and generate device engagement QR codes for verifiers.

## **Sharing mDoc via NFC (Android Only)**

This guide demonstrates how to implement NFC-based credential sharing with Multipaz. NFC (Near Field Communication) enables users to transfer data by tapping their phones. Follow these steps to set up NFC credential presentation.


### **Declare NFC Capabilities in AndroidManifest.xml**

Add the required NFC features and permissions in your `AndroidManifest.xml`. This ensures your app can advertise and respond to NFC engagements.


```xml
<!-- Declare NFC support (optional) -->
<uses-feature
   android:name="android.hardware.nfc"
   android:required="false" />
<!-- NFC and vibration permissions -->
<uses-permission android:name="android.permission.NFC" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Inside <application> ... -->
<!-- Activity for NFC tap engagement -->
<activity
   android:name=".NfcActivity"
   android:exported="true"
   android:launchMode="singleInstance"
   android:showWhenLocked="true"
   android:theme="@android:style/Theme.Translucent.NoTitleBar.Fullscreen"
   android:turnScreenOn="true" />
<!-- Service for NFC handover and APDU communication -->
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

<!-- </application> -->
```

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L30-L75) part for the implementation of this section in this guide.

### **Implement NfcActivity**

Multipaz provides `MdocNfcPresentmentActivity`, which manages the entire lifecycle for ISO/IEC 18013-5:2021 NFC engagement. Extend this class to handle NFC-triggered credential presentment securely.


* This activity launches automatically upon NFC tap, initializes the SDK, and prepares your app for credential presentment.

```kotlin
// kotlin/NfcActivity.kt
class NfcActivity : MdocNfcPresentmentActivity() {
    @Composable
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
}
```

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/NfcActivity.kt) part for the implementation of this section in this guide.

### **NFC Engagement Service**

To facilitate NFC engagement, extend `MdocNdefService` and configure the handover and transport preferences. In this example, negotiated handover is enabled, with BLE selected as the preferred transport after initial NFC engagement.

* With this setup, the NFC connection is used to negotiate the preferred transport. Since BLE is selected here, the actual credential data is transferred over BLE after initial NFC engagement.

```kotlin
// kotlin/NdefService.kt
class NdefService : MdocNdefService() {
    override suspend fun getSettings(): Settings {
        return Settings(
            sessionEncryptionCurve = EcCurve.P256,
            allowMultipleRequests = false,
            useNegotiatedHandover = true,
            negotiatedHandoverPreferredOrder = listOf(
                "ble:central_client_mode:",
                "ble:peripheral_server_mode:",
            ),
            staticHandoverBleCentralClientModeEnabled = false,
            staticHandoverBlePeripheralServerModeEnabled = false,
            staticHandoverNfcDataTransferEnabled = false,
            transportOptions = MdocTransportOptions(bleUseL2CAP = true),
            promptModel = App.promptModel,
            presentmentActivityClass = NfcActivity::class.java,
        )
    }
}
```

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/NdefService.kt) part for the implementation of this section in this guide.

### **NFC NDEF Service Configuration**

Configure the AID (Application Identifier) filter in `res/xml/nfc_ndef_service.xml`. This informs Android to act as an NFC Type 4 Tag and share credentials securely with a verifier.

* `android:requireDeviceUnlock="false"`: Allows engagement even if the device is locked.
* `android:requireDeviceScreenOn="false"`: Allows engagement even if the screen is off.
* `<aid-filter>`: Identifies to verifiers that your app supports **ISO/IEC 18013-5** NFC mDL presentation.

```xml
<?xml version="1.0" encoding="utf-8"?>
<host-apdu-service xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:description="@string/nfc_ndef_service_description"
    android:requireDeviceScreenOn="false"
    android:requireDeviceUnlock="false"
    tools:ignore="UnusedAttribute">

    <aid-group
        android:category="other"
        android:description="@string/nfc_ndef_service_aid_group_description">
        <!-- NFC Type 4 Tag - matches ISO 18013-5 mDL standard -->
        <aid-filter android:name="D2760000850101" />
    </aid-group>
</host-apdu-service>
```

Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/androidMain/res/xml/nfc_ndef_service.xml) part for the implementation of this section in this guide.

### **String Resources**

Add the following resource strings to your `strings.xml`:


```xml
<string name="nfc_ndef_service_description">@string/app_name</string>
<string name="nfc_ndef_service_aid_group_description">ISO/IEC 18013-5:2021 NFC engagement</string>
```
Refer to [this](https://github.com/openwallet-foundation/multipaz-samples/blob/9708cb36f44040ff51b5e0b3b7922175e47462d2/MultipazGettingStartedSample/composeApp/src/androidMain/res/values/strings.xml#L3-L4) part for the implementation of this section in this guide.

By following these steps, you configure your Android app to support secure NFC-based mDoc presentment with Multipaz. The device uses NFC for initial engagement, negotiates the preferred transport (such as BLE), and then securely transfers credentials to the verifier.

### **Testing**

To test the NFC reader flow, we need two devices.

* One device with the the holder app we are currently working on (multipaz getting started sample)
* And another device with a verifier app installed; say, MpzIdentityReader or Multipaz TestApp (you can download them from https://apps.multipaz.org).

The reader flow includes the following steps:

* Tap the reader device with the verifier device once
* If multiple holder apps are installed, a bottom sheet appears to confirm which app to request the credentials from.
* Tap once again just like step one to share the credentials.