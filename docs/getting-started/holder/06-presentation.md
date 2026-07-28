---
title: 🎁 Presentation
sidebar_position: 6
---

The presentation phase allows a user to present a credential (such as an mDL) to a verifier, typically using BLE, NFC, or QR code. This section covers runtime permissions, setting up presentment flows, and generating engagement QR codes.

## Create the `feature/presentment` module

:::tip Module creation
To create a new module: **File → New → New Module → Kotlin Multiplatform Shared Module**. Name it as shown in the table above and configure the package name (e.g., `org.multipaz.getstarted.presentment` for `feature:presentment`).
:::

Update the `build.gradle.kts` file for the module:


```kotlin
// feature/presentment/build.gradle.kts
plugins {
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinSerialization)
}
kotlin {
    jvmToolchain(17)

    androidLibrary {
        @OptIn(ExperimentalKotlinGradlePluginApi::class)
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }

    sourceSets {
       commonMain.dependencies {
            implementation(project(":core"))

            implementation(libs.multipaz)
            implementation(libs.multipaz.compose)
       }
   }
}
```

Refer to **[this presentment build.gradle.kts code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/feature/presentment/build.gradle.kts)** for the complete example.

Also add the dependency in `composeApp/build.gradle.kts`:

```kotlin
// composeApp/build.gradle.kts
kotlin {
    sourceSets {
        commonMain.dependencies {
            // ... other dependencies
            implementation(project(":feature:presentment"))
        }
    }
}
```

Refer to **[this composeApp build.gradle.kts code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/build.gradle.kts#L46)** for the complete example.

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
    val coroutineScope = rememberCoroutineScope { AppContainer.promptModel }
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

Refer to **[this presentation setup code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/feature/presentment/src/commonMain/kotlin/org/multipaz/getstarted/presentment/PresentmentHomeSection.kt#L43-L58)** for the complete example.

**AndroidManifest.xml: Required BLE Permissions**

```xml
<!-- composeApp/src/androidMain/AndroidManifest.xml -->

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

Refer to **[this AndroidManifest.xml code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L5-L28)** for the complete example.

**info.plist: Required BLE Permissions (iOS)**

Add the following to `iosApp/iosApp/info.plist` to enable BLE permission prompts.

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth permission is required for proximity presentations</string>
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```
Refer to **[this Info.plist code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/iosApp/iosApp/Info.plist#L5-L6)** for the complete example.

## Presentment using `MdocProximityQrPresentment`

`MdocProximityQrPresentment` composable can be used for presentment with QR engagement according to **ISO/IEC 18013-5:2021**. It uses a callback-based approach with the following phases:
- `prepareSettings` → shows initial UI (e.g., a button) and calls `generateQrCode(settings)` when the user is ready to present.
- `showQrCode` → displays the QR code for scanning. Receives a `reset` callback to return to the initial state.
- `showTransacting` → shows a transacting state while the credential transfer is in progress.
- `showCompleted` → displays the result (success or error) and provides a `reset` callback.

### 1. Implement the UI for presentment in `HomeScreen` Composable

In the modularized sample, the presentment logic is extracted into `PresentmentHomeSection` in the `feature/presentment` module. This composable handles BLE permissions, Bluetooth enablement, and the full QR presentment flow:

```kotlin
// feature/presentment/src/commonMain/kotlin/.../presentment/PresentmentHomeSection.kt
@Composable
fun PresentmentHomeSection(
    presentmentSource: PresentmentSource,
    promptModel: PromptModel,
    modifier: Modifier = Modifier
) {
    val blePermissionState = rememberBluetoothPermissionState()
    val bleEnabledState = rememberBluetoothEnabledState()
    val coroutineScope = rememberCoroutineScope { promptModel }

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
    } else if (!bleEnabledState.isEnabled) {
        Button(
            onClick = { coroutineScope.launch { bleEnabledState.enable() } }) {
            Text("Enable Bluetooth")
        }
    } else {
        MdocProximityQrPresentment(
            modifier = modifier,
            source = presentmentSource,
            promptModel = AppContainer.promptModel,
            prepareSettings = { generateQrCode ->
                val connectionMethods = mutableListOf<MdocConnectionMethod>()
                val bleUuid = UUID.randomUUID()
                connectionMethods.add(
                    MdocConnectionMethodBle(
                        supportsPeripheralServerMode = true,
                        supportsCentralClientMode = false,
                        peripheralServerModeUuid = bleUuid,
                        centralClientModeUuid = null,
                    )
                )

                Column(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Button(
                        onClick = {
                            generateQrCode(
                                MdocProximityQrSettings(
                                    availableConnectionMethods = connectionMethods,
                                    createTransportOptions = MdocTransportOptions(
                                        bleUseL2CAPInEngagement = true
                                    )
                                )
                            )
                        }
                    ) @Composable {
                        Text("Present mDoc via QR code")
                    }
                }
            },
            showTransacting = { reset ->
                Column(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    CircularProgressIndicator()
                    Text(
                        text = "Sharing your credential…",
                        style = MaterialTheme.typography.bodyLarge,
                    )
                    OutlinedButton(onClick = { reset() }) {
                        Text("Cancel")
                    }
                }
            },
            showQrCode = { uri, reset ->
                ShowQrCode(
                    uri,
                    onCancel = {
                        reset()
                    }
                )
            },
            showCompleted = { error, reset ->
                if (error is CancellationException) {
                    reset()
                } else {
                    Column(
                        modifier = Modifier.fillMaxSize().padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Text(
                            text = if (error != null) "Something went wrong" else "Credential shared",
                            style = MaterialTheme.typography.titleMedium,
                            color = if (error != null) {
                                MaterialTheme.colorScheme.error
                            } else {
                                MaterialTheme.colorScheme.primary
                            },
                        )
                        if (error != null) {
                            Text(
                                text = error.message ?: error.toString(),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                    LaunchedEffect(Unit) {
                        delay(1.5.seconds)
                        reset()
                    }
                }
            },
        )
    }
}
```

Then in `HomeScreen`, the presentment UI lives in its own `PresentmentSection` — a `SectionCard` that hosts `PresentmentHomeSection` (and, on Android, the W3C Digital Credentials button added in the native verification guide):

```kotlin
// composeApp/src/commonMain/kotlin/.../HomeScreen.kt
@Composable
fun HomeScreen(
    container: AppContainer,
    // ...
) {
    Scaffold(/* ... */) { innerPadding ->
        Column(/* ... */) {
            // DocumentSection(...) — added in the Lookup and Manage Documents guide

            PresentmentSection(container = container)
        }
    }
}

@Composable
private fun PresentmentSection(
    container: AppContainer,
) {
    SectionCard(
        title = "Share a credential",
        subtitle = "Present your mDoc to a nearby reader or to a website.",
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            PresentmentHomeSection(
                presentmentSource = container.presentmentSource,
                promptModel = AppContainer.promptModel,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}
```

Refer to **[this code from `HomeScreen.kt`](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L225-L307)** and **[the `PresentmentHomeSection` composable](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/feature/presentment/src/commonMain/kotlin/org/multipaz/getstarted/presentment/PresentmentHomeSection.kt#L33-L154)** for the full implementation

### 2. Wire in the PresentmentSource in `AppContainerImpl`

The `PresentmentSource` is initialized in `AppContainerImpl` (in the `core` module), using domain constants from `CredentialDomains`:

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainer.kt
interface AppContainer {
    // ... rest of the implementations

    val presentmentSource: PresentmentSource
}
```

Refer to **[this AppContainer code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainer.kt#L25)** for the complete example.

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainerImpl.kt
class AppContainerImpl : AppContainer {
    // ...
    override lateinit var presentmentSource: PresentmentSource

    override suspend fun init() {
        if (isInitialized) return

        // ... storage, document store, trust manager initialization

        presentmentSource = SimplePresentmentSource(
            documentStore = documentStore,
            documentTypeRepository = documentTypeRepository,
            resolveTrustFn = { requester ->
                requester.requesterIdentities.forEach { requesterIdentity ->
                    requesterIdentity.certChain.let { certChain ->
                        val trustResult = readerTrustManager.verify(certChain.certificates)
                        if (trustResult.isTrusted) {
                            return@SimplePresentmentSource TrustedRequesterIdentity(
                                requesterIdentity,
                                trustResult.trustPoints.first().metadata
                            )
                        }
                    }
                }
                null
            },
            preferSignatureToKeyAgreement = true,
            domainsMdocSignature = listOf(CredentialDomains.MDOC_USER_AUTH, CredentialDomains.MDOC_SOFTWARE),
            domainsMdocKeyAgreement = listOf(CredentialDomains.MDOC_MAC_USER_AUTH),
            domainsKeylessSdJwt = listOf(CredentialDomains.SDJWT_KEYLESS, CredentialDomains.SDJWT_SOFTWARE),
            domainsKeyBoundSdJwt = listOf(CredentialDomains.SDJWT_USER_AUTH, CredentialDomains.SDJWT_SOFTWARE),
        )

        // ...
        isInitialized = true
    }
}
```

Refer to the [**initialization code for PresentmentSource**](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L228-L260) for the complete example.

### 3. Displaying the QR Code

Use the following composable to display the QR code generated for presentment. You can generate QR codes using `org.multipaz.compose.qrcode:generateQrCode`.

**Example: QR Code Display**

```kotlin
// feature/presentment/src/commonMain/kotlin/.../presentment/QrCodeDisplay.kt
@Composable
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

Refer to **[this QR code display composable function code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/feature/presentment/src/commonMain/kotlin/org/multipaz/getstarted/presentment/QrCodeDisplay.kt#L51-L77)** for the complete example.

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
<!-- Service for NFC handover and APDU communication -->
<service
   android:name=".GetStartedNfcService"
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

Refer to **[this Android Manifest code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L142-L152)** for the complete example.

### **NFC Engagement Service**

The service registered in the manifest is a `CombinedNfcService`, which routes incoming APDUs to the appropriate `NfcApduService` based on the selected application. Register your `NdefService` against the NDEF application ID so it handles engagement requests.

```kotlin
// composeApp/../kotlin/GetStartedNfcService.kt
class GetStartedNfcService : CombinedNfcService() {
    override fun buildServices(): Map<ByteString, NfcApduService> {
        return mapOf(
            Nfc.NDEF_APPLICATION_ID to NdefService(this, ::sendResponseApdu),
        )
    }
}
```

Refer to **[this GetStartedNfcService code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/GetStartedNfcService.kt#L8-L14)** for the complete example.

To facilitate NFC engagement, extend `MdocNdefService` and configure the handover and transport preferences. The service receives the application `Context` and a `sendResponse` callback from the `CombinedNfcService` that hosts it. In this example, negotiated handover is enabled, with BLE selected as the preferred transport after initial NFC engagement.

* With this setup, the NFC connection is used to negotiate the preferred transport. Since BLE is selected here, the actual credential data is transferred over BLE after initial NFC engagement.

```kotlin
// composeApp/../kotlin/NdefService.kt
class NdefService(
    applicationContext: Context,
    sendResponse: (ByteArray) -> Unit
) : MdocNdefService(
    applicationContext,
    sendResponse
) {
    override suspend fun getSettings(): Settings {
        val container = AppContainer.getInstance()
        container.init()

        PresentmentActivity.presentmentModel.reset(
            source = container.presentmentSource,
            preselectedDocuments = emptyList()
        )

        return Settings(
            source = container.presentmentSource,
            promptModel = PresentmentActivity.promptModel,
            presentmentModel = PresentmentActivity.presentmentModel,
            activityClass = PresentmentActivity::class.java,
            transportOptions = MdocTransportOptions(bleUseL2CAP = true),
            sessionEncryptionCurve = EcCurve.P256,
            useNegotiatedHandover = true,
            negotiatedHandoverPreferredOrder = listOf(
                "ble:central_client_mode:",
                "ble:peripheral_server_mode:",
            ),
            staticHandoverBleCentralClientModeEnabled = false,
            staticHandoverBlePeripheralServerModeEnabled = false,
            staticHandoverNfcDataTransferEnabled = false,
        )
    }
}
```

Refer to **[this NdefService code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/NdefService.kt#L10-L43)** for the complete example.

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

Refer to **[this NFC service configuration](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/androidMain/res/xml/nfc_ndef_service.xml#L1-L21)** for the complete example.

### **String Resources**

Add the following resource strings to your `strings.xml`:

```xml
<string name="nfc_ndef_service_description">@string/app_name</string>
<string name="nfc_ndef_service_aid_group_description">ISO/IEC 18013-5:2021 NFC engagement</string>
```
Refer to **[this string resources code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/androidMain/res/values/strings.xml#L3-L4)** for the complete example.

By following these steps, you configure your Android app to support secure NFC-based mDoc presentment with Multipaz. The device uses NFC for initial engagement, negotiates the preferred transport (such as BLE), and then securely transfers credentials to the verifier.

### **Testing**

To test the NFC reader flow, we need two devices.

* One device with the the holder app we are currently working on (multipaz getting started sample)
* And another device with a verifier app installed; say, Multipaz Identity Reader or Multipaz TestApp (you can download them from https://apps.multipaz.org).

The reader flow includes the following steps:

* Tap the reader device with the verifier device once
* If multiple holder apps are installed, a bottom sheet appears to confirm which app to request the credentials from.
* Tap once again just like step one to share the credentials.