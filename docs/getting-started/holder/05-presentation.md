---
title: 🎁 Presentation
sidebar_position: 5
---

The presentation phase allows a user to present a credential (such as an mDL) to a verifier, typically using BLE, NFC, or QR code. This section covers runtime permissions, setting up presentment flows, and generating engagement QR codes.

### Runtime Permissions

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

### PresentmentModel

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

### Starting Device Engagement

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
   }
}
```

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L230-L284) part for the implementation of this section in this guide.

### Displaying the QR Code

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
