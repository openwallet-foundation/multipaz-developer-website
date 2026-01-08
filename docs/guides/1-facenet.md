---
title: Face Detection & Verification
sidebar_position: 2
---

This guide shows how to add on-device face detection and verification to the Multipaz Getting Started Sample using FaceNet. You'll enable camera permissions, capture a selfie, compute a FaceNet embedding, and then match it in real time against faces detected from the camera.

What you’ll build:

* A Selfie Check step to capture a face image
* FaceNet embedding generation using a TFLite model
* Live camera face detection and alignment
* Real-time similarity scoring

## **Dependencies**

Add the Multipaz Vision library for face detection, face matching, and camera APIs. Multipaz Vision library is published from the [Multipaz Extras](https://github.com/openwallet-foundation/multipaz-extras) repository that contains additional libraries and functionality not included in the main [Multipaz](https://github.com/openwallet-foundation/multipaz) repository.

`gradle/libs.versions.toml`
```toml
[versions]
multipaz-vision = "0.95.0" # latest version of Multipaz Extras

[libraries]
multipaz-vision = { group = "org.multipaz", name = "multipaz-vision", version.ref = "multipaz-vision" }
```

Refer to **[this code](https://github.com/openwallet-foundation/multipaz-samples/blob/72f4b28d448b8a049b1c392daf5cd3a9e2cbba63/MultipazGettingStartedSample/gradle/libs.versions.toml#L42)** for the complete example.

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

Refer to **[this code](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/build.gradle.kts#L54)** for the complete example.

## **Android Manifest: Camera Permissions**

Enable camera access on Android.

`composeApp/src/androidMain/AndroidManifest.xml`
```xml
<!-- For FaceNet -->
<uses-feature android:name="android.hardware.camera"/>
<uses-feature
    android:name="android.hardware.camera.autofocus"
    android:required="false" />
<uses-permission android:name="android.permission.CAMERA"/>
```

Refer to **[this AndroidManifest code](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L39-L43)** for the complete example.

iOS: Add camera usage descriptions to your Info.plist if you plan to run on iOS:

```plist
<key>NSCameraUsageDescription</key>
<string>Camera access is required for selfie capture and face verification.</string>
```

## **Model File**

Place the FaceNet TFLite model in common resources:

* Path: `composeApp/src/commonMain/resources/files/facenet_512.tflite`

This sample uses:

* Input image size: 160x160
* Embedding size: 512

You can [**download the model from this link**](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/facenet_512.tflite).

## **Initialization**

Create and store the FaceNet model in your `App` singleton during initialization.

```kotlin
class App {
    // ...

    lateinit var faceMatchLiteRtModel: FaceMatchLiteRtModel

    @OptIn(ExperimentalTime::class)
    suspend fun init() {
        // ... existing initializations ...

        // Load FaceNet model
        val modelData = ByteString(*Res.readBytes("files/facenet_512.tflite"))
        faceMatchLiteRtModel =
            FaceMatchLiteRtModel(modelData, imageSquareSize = 160, embeddingsArraySize = 512)
    }
}
```

* `FaceMatchLiteRtModel` is the data class for the platform independent LiteRT model handling.

Refer to **[this initialization code](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L297-L299)** for the complete example.

## **Runtime Permissions (Camera)**

Use Multipaz Compose permission helpers to request the camera permission at runtime. `rememberCameraPermissionState` can be used for the same.

```kotlin
class App {
    // ...

    @Composable
    fun Content() {
        val cameraPermissionState = rememberCameraPermissionState()

        // ... existing UI for presentation

        if (!cameraPermissionState.isGranted) {
            Button(
                onClick = {
                    coroutineScope.launch {
                        cameraPermissionState.launchPermissionRequest()
                    }
                }
            ) {
                Text("Grant Camera Permission for Selfie Check")
            }
            return
        } else {
          // ... facenet flow continues when the permission is granted
        }
    }
}
```

Refer to **[this permission request code](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L501-L509)** for the complete example.

## **Selfie Capture Flow (Enrollment)**

Use the built-in Selfie Check flow to capture a normalized face image for enrollment, then compute and store its FaceNet embedding.

```kotlin
class App {
    // ...

    @Composable
    fun Content() {
        // 1) Prepare ViewModel and state
        val identityIssuer = "Multipaz Getting Started Sample"
        val selfieCheckViewModel: SelfieCheckViewModel =
            remember { SelfieCheckViewModel(identityIssuer) }

        var showCamera by remember { mutableStateOf(false) }
        val faceCaptured = remember { mutableStateOf<FaceEmbedding?>(null) }

        if (!cameraPermissionState.isGranted) {
            // ... request camera permission button
        }
        // 2) Show "Selfie Check" button
        else if (faceCaptured.value == null) {
            if (!showCamera) {
                Button(onClick = { showCamera = true }) {
                    Text("Selfie Check")
                }
            } else {
                SelfieCheck(
                    modifier = Modifier.fillMaxWidth(),
                    onVerificationComplete = {
                        showCamera = false

                        // If a selfie image was captured, compute embeddings
                        if (selfieCheckViewModel.capturedFaceImage != null) {
                            faceCaptured.value = getFaceEmbeddings(
                                image = decodeImage(selfieCheckViewModel.capturedFaceImage!!.toByteArray()),
                                model = App.getInstance().faceMatchLiteRtModel
                            )
                        }

                        selfieCheckViewModel.resetForNewCheck()
                    },
                    viewModel = selfieCheckViewModel,
                    identityIssuer = identityIssuer
                )

                Button(onClick = {
                    showCamera = false
                    selfieCheckViewModel.resetForNewCheck()
                }) {
                    Text("Close")
                }
            }
        }
    }
}
```

* `SelfieCheck` composable helps guide the user to capture a face image after performing certain liveness checks viz look up to the sides, smile, squeeze eyes etc.
* `SelfieCheckViewModel `helps with the selfie check process – initialization, orchestration, and data exchange with UI.
* The `SelfieCheckViewModel` returns the `capturedFaceImage` as a `ByteString` which we convert to a `ByteArray`.
* This `ByteArray` is then passed to `decodeImage` function to decode it to an `ImageBitmap`.
* After completion, use `getFaceEmbeddings` function to compute the FaceNet embedding from the captured `ImageBitmap` in a normalized values array.

Refer to **[this selfie check code](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L510-L541)** for the complete example.

## **Live Face Matching**

Once an enrollment embedding exists, we open a live camera preview using the “Camera” composable, detect faces per frame, align and crop the face region, compute embeddings, and calculate the similarity with the embeddings of the image we captured during selfie check.

```kotlin
class App {
    // ...

    @Composable
    fun Content() {
        var showFaceMatching by remember { mutableStateOf(false) }
        var similarity by remember { mutableStateOf(0f) }

        if (!cameraPermissionState.isGranted) {
            // ... request camera permission button
        } else if (faceCaptured.value == null) {
            // ... show selfie check
        } else { // faceCaptured.value is not null (already completed the selfie check)
            if (!showFaceMatching) {
                Button(onClick = { showFaceMatching = true }) {
                    Text("Face Matching")
                }
            } else {
                Text("Similarity: ${(similarity * 100).roundToInt()}%")

                Camera(
                    modifier = Modifier
                        .fillMaxSize(0.5f)
                        .padding(64.dp),
                    cameraSelection = CameraSelection.DEFAULT_FRONT_CAMERA,
                    captureResolution = CameraCaptureResolution.MEDIUM,
                    showCameraPreview = true,
                ) { incomingVideoFrame: CameraFrame ->
                    val faces = detectFaces(incomingVideoFrame)

                    if (faces.isNullOrEmpty()) {
                        similarity = 0f
                    } else {
                        val model = App.getInstance().faceMatchLiteRtModel

                        // Assume one face for simplicity; production apps should handle multiple faces
                        val faceBitmap = extractFaceBitmap(
                            frameData = incomingVideoFrame,
                            face = faces[0],
                            targetSize = model.imageSquareSize
                        )

                        val liveFaceEmbedding = getFaceEmbeddings(faceBitmap, model)

                        if (liveFaceEmbedding != null && faceCaptured.value != null) {
                            similarity = faceCaptured.value!!.calculateSimilarity(liveFaceEmbedding)
                        }
                    }
                }

                Button(onClick = {
                    showFaceMatching = false
                    faceCaptured.value = null
                }) {
                    Text("Close")
                }
            }
        }
    }
}
```

* The `Camera` composable from Multipaz SDK takes care of the camera operations initialization and camera preview composition. This takes a callback (`onFrameCaptured`) to invoke when a frame is captured with the frame object.
* The `onFrameCaptured` function returns a `CameraFrame`. We then use `detectFaces` function to detect faces in the `CameraFrame` using MLKit. This function returns a list of `DetectedFace`s.
* Now, we use the `extractFaceBitmap` function to align and crop the detected face, convert it to `FaceEmbedding` using `getFaceEmbeddings` function and use `FaceEmbedding#calculateSimilarity` function to calculate the similarity with the image we captured from the selfie check.

Refer to **[this face matching code](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L541-L591)** for the complete example.

**Face Alignment and Cropping**

For best matching with FaceNet, align the face so the eyes are level and crop a square around the face. Use landmarks and simple geometry to rotate and crop the face region, then scale to the model input size. You can copy paste the `extractFaceBitmap` for the same.

```kotlin
class App {
    /**
     * Cut out the face square, rotate it to level eyes line, scale to the smaller size for face matching tasks.
     */
    private fun extractFaceBitmap(
        frameData: CameraFrame,
        face: DetectedFace,
        targetSize: Int
    ): ImageBitmap {
        val leftEye = face.landmarks.find { it.type == FaceLandmarkType.LEFT_EYE }
        val rightEye = face.landmarks.find { it.type == FaceLandmarkType.RIGHT_EYE }
        val mouthPosition = face.landmarks.find { it.type == FaceLandmarkType.MOUTH_BOTTOM }

        if (leftEye == null || rightEye == null || mouthPosition == null) {
            return frameData.cameraImage.toImageBitmap()
        }

        // Heuristic multipliers based on inter-eye distance
        val faceCropFactor = 4f
        val faceVerticalOffsetFactor = 0.25f

        var faceCenterX = (leftEye.position.x + rightEye.position.x) / 2
        var faceCenterY = (leftEye.position.y + rightEye.position.y) / 2
        val eyeOffsetX = leftEye.position.x - rightEye.position.x
        val eyeOffsetY = leftEye.position.y - rightEye.position.y
        val eyeDistance = sqrt(eyeOffsetX * eyeOffsetX + eyeOffsetY * eyeOffsetY)
        val faceWidth = eyeDistance * faceCropFactor
        val faceVerticalOffset = eyeDistance * faceVerticalOffsetFactor

        // Account for orientation (support upside-down detection)
        if (frameData.isLandscape) {
            faceCenterY += faceVerticalOffset * (if (leftEye.position.y < mouthPosition.position.y) 1 else -1)
        } else {
            faceCenterX -= faceVerticalOffset * (if (leftEye.position.x < mouthPosition.position.x) -1 else 1)
        }

        // Rotate to align eyes horizontally
        val eyesAngleRad = atan2(eyeOffsetY, eyeOffsetX)
        val eyesAngleDeg = eyesAngleRad * 180.0 / PI
        val totalRotationDegrees = 180 - eyesAngleDeg

        // Crop+rotate+scale to the model's expected square input
        return cropRotateScaleImage(
            frameData = frameData,
            cx = faceCenterX.toDouble(), // between eyes
            cy = faceCenterY.toDouble(), // between eyes
            angleDegrees = totalRotationDegrees,
            outputWidthPx = faceWidth.toInt(),
            outputHeightPx = faceWidth.toInt(),
            targetWidthPx = targetSize,
        )
    }
}
```

Refer to **[this function code](https://github.com/openwallet-foundation/multipaz-samples/blob/d5c525b213ef3a544cbb78519a46c27b5c07bcc7/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L713-L761)** for the complete example.

**Similarity Thresholds**

`FaceEmbedding.calculateSimilarity` returns a similarity score in [0.0, 1.0]. Common FaceNet-based verification thresholds range from 0.5 – 0.8 depending on lighting and device quality.

Guidance:

* Start with `0.7` as an acceptance threshold.
* Measure false accept/reject rates with your target devices and lighting.
* Consider collecting multiple enrollment images and averaging embeddings for robustness.

Example:
```
val isMatch = similarity >= 0.7f
```

## **Testing**

* Install the app
* Press the “selfie check” button
* Perform the selfie check
* Check the checkbox for consent
* Press send button, wait for a second for the “face matching button to appear
* Press the button
* A live feed opens – you can see the match percentage in the screen

By following this guide, you enable secure, on-device face detection and verification using FaceNet within the Multipaz Getting Started Sample — covering permission handling, enrollment via Selfie Check, live face matching, and robust face alignment for improved accuracy.
