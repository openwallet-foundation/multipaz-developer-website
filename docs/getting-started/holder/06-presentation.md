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

**Note:** Multipaz also provides `rememberBluetoothEnabledState` composable to keep track of enablement of bluetooth on the device.

**Example: Requesting BLE Permission**

```kotlin
@Composable
fun HomeScreen(
    // ...
) {
    val coroutineScope = rememberCoroutineScope { App.promptModel }
    val blePermissionState = rememberBluetoothPermissionState()
    val bleEnabledState = rememberBluetoothEnabledState()

    Column {
        // Bluetooth Permission
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
            // Bluetooth Enablement
        } else if (!bleEnabledState.isEnabled) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Button(onClick = { coroutineScope.launch { bleEnabledState.enable() } }) {
                    Text("Enable Bluetooth")
                }
            }
        } else {
            // ...
        }

        // ... document listing UI from previous guide
    }
}
```

Refer to **[this presentation setup code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L112-L126)** for the complete example.

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

Refer to **[this AndroidManifest.xml code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L5-L28)** for the complete example.

**info.plist: Required BLE Permissions (iOS)**

Add the following to `iosApp/iosApp/info.plist` to enable BLE permission prompts.

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth permission is required for proximity presentations</string>
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```
Refer to **[this Info.plist code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/iosApp/iosApp/Info.plist#L8-L11)** for the complete example.

## Presentmentation using `PresentmentModel`

`PresentmentModel` manages the entire UX/UI flow for credential presentation, providing a `state` variable to track the presentation process. Multipaz also offers a `Presentment` composable for embedding credential presentment UI.

`MdocProximityQrPresentment` composable can be used for presentment with QR engagement according to **ISO/IEC 18013-5:2021**. It displays different content based on `presentmentModel` state:
- `PresentmentModel.State.IDLE` → shows `showQrButton`. When clicked, transitions to `PresentmentModel.State.CONNECTING`.
- `PresentmentModel.State.CONNECTING` → shows `showQrCode` (QR code display). Once scanned, transitions to `PresentmentModel.State.WAITING_FOR_SOURCE` and further states.
- Other states → shows `Presentment` composable (including cconsent/authentication, etc.). When the reader disconnects, returns to `PresentmentModel.State.IDLE` and shows `showQrButton` again.

### 1. Implement the UI for presentment in `HomeScreen` Composable

```kotlin
@Composable
fun HomeScreen(
    // ... other parameters
    imageLoader: ImageLoader, // add image loader and cancel callbacks as a parameters
    onCancel: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope { App.promptModel }

    Column {
        // ...

        if (!blePermissionState.isGranted) {
            // ...
        } else if (!bleEnabledState.isEnabled) {
            // ...
        } else {
            MdocProximityQrPresentment(
                modifier = Modifier.weight(1f),
                appName = app.appName,
                appIconPainter = painterResource(app.appIcon),
                presentmentModel = app.presentmentModel,
                presentmentSource = app.presentmentSource,
                promptModel = App.promptModel,
                documentTypeRepository = app.documentTypeRepository,
                imageLoader = imageLoader,
                allowMultipleRequests = false,
                showQrButton = { onQrButtonClicked -> ShowQrButton(onQrButtonClicked) },
                showQrCode = { uri ->
                    ShowQrCode(
                        uri,
                        onCancel = onCancel
                    )
                }
            )
        }
    }
}
```

Refer to **[this code from `HomeScreen.kt`](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L128-L145)** for the full implementation

### 2. Wire in the implementation in `App.kt` class

```kotlin
class App {
    // ...
    lateinit var presentmentModel: PresentmentModel
    lateinit var presentmentSource: PresentmentSource

    companion object {
        // ...

        // Domains used for MdocCredential & SdJwtVcCredential
        private const val CREDENTIAL_DOMAIN_MDOC_USER_AUTH = "mdoc_user_auth"
        private const val CREDENTIAL_DOMAIN_MDOC_MAC_USER_AUTH = "mdoc_mac_user_auth"
        private const val CREDENTIAL_DOMAIN_SDJWT_USER_AUTH = "sdjwt_user_auth"
        private const val CREDENTIAL_DOMAIN_SDJWT_KEYLESS = "sdjwt_keyless"
    }

    suspend fun init() {
        if (!isAppInitialized) {
            // ...
            presentmentModel = PresentmentModel().apply { setPromptModel(org.multipaz.util.Platform.promptModel) }
            presentmentSource = SimplePresentmentSource(
                documentStore = documentStore,
                documentTypeRepository = documentTypeRepository,
                readerTrustManager = readerTrustManager,
                preferSignatureToKeyAgreement = true,
                domainMdocSignature = CREDENTIAL_DOMAIN_MDOC_USER_AUTH,
                domainMdocKeyAgreement = CREDENTIAL_DOMAIN_MDOC_MAC_USER_AUTH,
                domainKeylessSdJwt = CREDENTIAL_DOMAIN_SDJWT_KEYLESS,
                domainKeyBoundSdJwt = CREDENTIAL_DOMAIN_SDJWT_USER_AUTH
            )

            // ...
            isAppInitialized = true
        }
    }

    @Composable
    fun Content() {

        val context = LocalPlatformContext.current
        val imageLoader = remember {
            ImageLoader.Builder(context).components { /* network loader omitted */ }.build()
        }

        MaterialTheme {
            Column {
                NavHost {
                    composable<Destination.HomeDestination> {
                        HomeScreen(
                            app = this@App,
                            navController = navController,
                            documents = documents,
                            onDeleteDocument = {
                                documents.remove(it)
                            },
                            // assign the new parameters
                            imageLoader = imageLoader,
                            onCancel = {
                                presentmentModel.reset()
                            }
                        )
                    }
                }
            }
        }
    }
}
```

Refer to the [**initialization code for PresentmentModel**](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L274-L285) & [**these updates to the HomeScreen invocation**](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L393-L405) for the complete example.

### 3. Starting Device Engagement

To start engagement for presentment (e.g., via BLE), use a connection method that extends `MdocConnectionMethod` (such as `MdocConnectionMethodBle` or `MdocConnectionMethodNfc`). The following example uses BLE:

**Example: BLE Engagement and QR Code**

```kotlin
// HomeScreen.kt file
@Composable
fun ShowQrButton(onQrButtonClicked: (settings: MdocProximityQrSettings) -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
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
            Text("Present mDL via QR Code")
        }
    }
}
```

Refer to **[the show QR button composable function code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L388-L414)** for the complete example.

### 4. Displaying the QR Code

Use the following composable to display the QR code generated for presentment. You can generate QR codes using `org.multipaz.compose.qrcode:generateQrCode`.

**Example: QR Code Display**

```kotlin
// HomeScreen.kt file
fun ShowQrCode(
    uri: String,
    onCancel: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        val qrCodeBitmap = remember { generateQrCode(uri) }
        Text(text = "Present QR code to mdoc reader")
        Image(
            modifier = Modifier.fillMaxWidth(),
            bitmap = qrCodeBitmap,
            contentDescription = null,
            contentScale = ContentScale.FillWidth
        )
        Button(
            onClick = {
                onCancel()
            }
        ) {
            Text("Cancel")
        }
    }
}
```

Refer to **[this QR code display composable function code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L416-L442)** for the complete example.

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

Refer to **[this Android Manifest code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L134-L152)** for the complete example.

### **Implement NfcActivity**

Multipaz provides `MdocNfcPresentmentActivity`, which manages the entire lifecycle for ISO/IEC 18013-5:2021 NFC engagement. Extend this class to handle NFC-triggered credential presentment securely.

* This activity launches automatically upon NFC tap, initializes the SDK, and prepares your app for credential presentment.

```kotlin
// kotlin/NfcActivity.kt
// make sure to paste this inside the kotlin directory (since this is an android-only feature)
class NfcActivity : MdocNfcPresentmentActivity() {
    override suspend fun getSettings(): Settings {
        val app = App.getInstance()
        app.init()
        return Settings(
            appName = app.appName,
            appIcon = app.appIcon,
            promptModel = App.promptModel,
            applicationTheme = @Composable { content -> MaterialTheme { content() } },
            documentTypeRepository = app.documentTypeRepository,
            presentmentSource = app.presentmentSource,
            imageLoader = ImageLoader.Builder(applicationContext)
                .components { /* network loader omitted */ }.build(),
        )
    }
}
```

Refer to **[this NfcActivity code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/NfcActivity.kt)** for the complete example.

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

Refer to **[this NdefService code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/NdefService.kt)** for the complete example.

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

Refer to **[this NFC service configuration](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/res/xml/nfc_ndef_service.xml)** for the complete example.

### **String Resources**

Add the following resource strings to your `strings.xml`:

```xml
<string name="nfc_ndef_service_description">@string/app_name</string>
<string name="nfc_ndef_service_aid_group_description">ISO/IEC 18013-5:2021 NFC engagement</string>
```
Refer to **[this string resources code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/res/values/strings.xml#L3-L4)** for the complete example.

By following these steps, you configure your Android app to support secure NFC-based mDoc presentment with Multipaz. The device uses NFC for initial engagement, negotiates the preferred transport (such as BLE), and then securely transfers credentials to the verifier.

### **Testing**

To test the NFC reader flow, we need two devices.

* One device with the the holder app we are currently working on (multipaz getting started sample)
* And another device with a verifier app installed; say, Mutipaz Identity Reader or Multipaz TestApp (you can download them from https://apps.multipaz.org).

The reader flow includes the following steps:

* Tap the reader device with the verifier device once
* If multiple holder apps are installed, a bottom sheet appears to confirm which app to request the credentials from.
* Tap once again just like step one to share the credentials.