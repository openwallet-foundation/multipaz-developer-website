---
title: Face Detection & Verification
sidebar_position: 4
---

This guide shows how to add on-device face detection and verification to the Multipaz Getting Started Sample using FaceNet for **both Android and iOS platforms**. You'll enable camera permissions, capture a selfie, compute a FaceNet embedding, and then match it in real time against faces detected from the camera.

What you'll build:

* A Selfie Check step to capture a face image
* FaceNet embedding generation using a TFLite model
* Live camera face detection and alignment
* Real-time similarity scoring

## **Dependencies**

Add the Multipaz Vision library for face detection, face matching, and camera APIs. Multipaz Vision library is published from the [Multipaz Extras](https://github.com/openwallet-foundation/multipaz-extras) repository that contains additional libraries and functionality not included in the main [Multipaz](https://github.com/openwallet-foundation/multipaz) repository.

### Common Dependencies (Kotlin Multiplatform)

`gradle/libs.versions.toml`
```toml
[versions]
multipaz-vision = "0.95.0" # latest version of Multipaz Extras

[libraries]
multipaz-vision = { group = "org.multipaz", name = "multipaz-vision", version.ref = "multipaz-vision" }
```

Refer to **[this code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/gradle/libs.versions.toml#L42)** for the complete example.

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

Refer to **[this code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/build.gradle.kts#L57)** for the complete example.

### iOS-Specific Dependencies (CocoaPods)

For iOS, you need to configure native dependencies using CocoaPods. If you're an Android developer new to iOS, CocoaPods is similar to Gradle dependencies but for iOS/macOS projects.

#### What is CocoaPods?

CocoaPods is a dependency manager for iOS/macOS projects (similar to Gradle for Android). It uses:
- **Podfile**: Defines your dependencies (like `build.gradle.kts`)
- **Podfile.lock**: Locks dependency versions (like `gradle.lockfile`)
- **Pods/**: Directory where dependencies are installed (like Gradle's cache)
- **`.podspec` files**: Specification files that define pod metadata, dependencies, and build configuration (like Gradle module descriptors)

#### CocoaPods Configuration (Already Set Up)

This `Podfile` configuration **[here in the repository](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/Podfile)** has CocoaPods configured with all necessary dependencies. This `Podfile` includes:

Podfile

**Key dependencies (already configured):**
- **`GoogleMLKit/FaceDetection`**: Provides face detection capabilities (equivalent to Android's ML Kit)
- **`GoogleMLKit/BarcodeScanning`**: For QR code scanning functionality
- **`TensorFlowLiteObjC`**: Runs TensorFlow Lite models on iOS
  - `CoreML`: Apple's ML framework integration for better performance
  - `Metal`: Apple's GPU acceleration framework

#### Understanding composeApp.podspec

The `composeApp.podspec` file is a CocoaPods specification that integrates your Kotlin Multiplatform Compose code into the iOS app. This file acts as a bridge between your Kotlin framework and the iOS native build system.

**What composeApp.podspec does:**

- **Defines the pod**: Specifies the pod name, version, and native dependencies (such as GoogleMLKit and TensorFlowLite)
- **Locates the framework**: Points to the compiled Kotlin framework at `build/cocoapods/framework/ComposeApp.framework`
- **Configures build scripts**:
  - **Before compile**: Builds the Kotlin framework and prepares Compose resources for iOS
  - **After compile**: Copies Compose resources and required files (like PEM certificates) into the iOS app bundle
- **Configures Xcode settings**: Disables script sandboxing and sets the Kotlin project path for proper integration

This allows your Kotlin Multiplatform code to be seamlessly integrated into the iOS build process, making Compose UI and shared business logic available to your iOS app.

#### What You Need to Do

1. **Install CocoaPods** (if not already installed on your Mac):

```bash
sudo gem install cocoapods
```

2. **Install the dependencies**:

```bash
# Navigate to your project root
cd /path/to/MultipazGettingStartedSample

# Install pods
pod install
```

This command will:
- Download and install all specified dependencies
- Generate an `.xcworkspace` file
- Create/update the `Pods/` directory

**Important**: After running `pod install`, always open the `.xcworkspace` file (not the `.xcodeproj` file) in Xcode:

```bash
open iosApp.xcworkspace
```

## **Platform Permissions**

Both Android and iOS require runtime permissions for camera access. Here's how to configure them for each platform:

### Android: Camera Permissions

Enable camera access on Android by adding permissions to your manifest.

`composeApp/src/androidMain/AndroidManifest.xml`
```xml
<!-- Camera hardware features -->
<uses-feature android:name="android.hardware.camera"/>
<uses-feature
    android:name="android.hardware.camera.autofocus"
    android:required="false" />

<!-- Camera runtime permission -->
<uses-permission android:name="android.permission.CAMERA"/>
```

Refer to **[this AndroidManifest code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/AndroidManifest.xml#L39-L43)** for the complete example.

### iOS: Camera Permissions

iOS requires a **usage description** that explains to users why your app needs camera access. This is mandatory and your app will crash without it.

`iosApp/iosApp/Info.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Your other existing keys... -->

    <!-- Camera permission description (required by Apple) -->
    <key>NSCameraUsageDescription</key>
    <string>Camera access is required for selfie capture and face verification.</string>
</dict>
</plist>
```

**Important for Android developers:**
- The `Info.plist` file in iOS is similar to `AndroidManifest.xml`
- The usage description string is what users see in the permission dialog
- Without this key, your app will crash when trying to access the camera
- Make the description clear and user-friendly - Apple reviews these

**How to edit Info.plist:**

**Option 1: Using Xcode (Recommended)**
1. Open `iosApp.xcworkspace` in Xcode
2. Navigate to the `iosApp` target
3. Select the "Info" tab
4. Click the "+" button to add a new key
5. Type "Privacy - Camera Usage Description" (it will auto-complete)
6. Enter your description in the value field

**Option 2: Direct XML editing**
- Open `iosApp/iosApp/Info.plist` in any text editor
- Add the `NSCameraUsageDescription` key as shown above

## **Model File**

Place the FaceNet TFLite model in common resources so both platforms can access it:

**Path**: `composeApp/src/commonMain/composeResources/files/facenet_512.tflite`

This sample uses:

* Input image size: 160x160
* Embedding size: 512

You can [**download the model from this link**](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/composeResources/files/facenet_512.tflite).

## **Initialization**

Create and store the FaceNet model in your `App` singleton during initialization. This code is platform-independent and works on both Android and iOS.

```kotlin
class App {
    // ...

    lateinit var faceMatchLiteRtModel: FaceMatchLiteRtModel

    @OptIn(ExperimentalTime::class)
    suspend fun init() {
        if (!isAppInitialized) {
            // ... existing initializations ...

            // Load FaceNet model from common resources
            val modelData = ByteString(*Res.readBytes("files/facenet_512.tflite"))
            faceMatchLiteRtModel =
                FaceMatchLiteRtModel(modelData, imageSquareSize = 160, embeddingsArraySize = 512)

            // ...
            isAppInitialized = true
        }
    }
}
```

* `FaceMatchLiteRtModel` is the platform-independent data class for LiteRT model handling.
* The model loading works identically on both platforms thanks to Compose Multiplatform's resource system.

Refer to **[this initialization code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L287-L289)** for the complete example.

## **Runtime Permissions (Camera)**

Use Multipaz Compose permission helpers to request the camera permission at runtime. This works cross-platform with platform-specific implementations under the hood.

```kotlin
@Composable
fun HomeScreen(
    // ... 
) {
    val cameraPermissionState = rememberCameraPermissionState()

    Column {

        // ... existing UI for presentation

        when {
            !cameraPermissionState.isGranted -> {
                Button(
                    onClick = {
                        coroutineScope.launch {
                            cameraPermissionState.launchPermissionRequest()
                        }
                    }
                ) {
                    Text("Grant Camera Permission for Selfie Check")
                }
            }
            // ... facenet flow continues when the permission is granted
        }
    }
}
```

**Platform-specific behavior:**
- **Android**: Shows standard Android permission dialog. User can grant/deny/deny permanently.
- **iOS**: Shows native alert with your `NSCameraUsageDescription` text. First request only - iOS remembers the choice.

**Testing permissions:**
- **Android**: Can reset in Settings → Apps → Your App → Permissions
- **iOS**: Can reset in Settings → Your App → Camera, or by uninstalling and reinstalling the app

Refer to **[this permission request code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L248-L258)** for the complete example.

## **Selfie Capture Flow (Enrollment)**

Use the built-in Selfie Check flow to capture a normalized face image for enrollment, then compute and store its FaceNet embedding. This entire flow works identically on both platforms.

```kotlin
@Composable
fun HomeScreen(
    // ... 
) {
    // 1) Prepare ViewModel and state
    val selfieCheckViewModel: SelfieCheckViewModel =
        remember { SelfieCheckViewModel(identityIssuer) }

    var showCamera by remember { mutableStateOf(false) }
    val faceCaptured = remember { mutableStateOf<FaceEmbedding?>(null) }

    Column {
        when {
            !cameraPermissionState.isGranted -> {
                // ...  request camera permission button
            }

            faceCaptured.value == null -> {
                SelfieCheckFlow(
                    showCamera = showCamera,
                    onShowCameraChange = { showCamera = it },
                    selfieCheckViewModel = selfieCheckViewModel,
                    identityIssuer = identityIssuer,
                    onFaceCaptured = { embedding ->
                        faceCaptured.value = embedding
                    },
                    app = app
                )
            }

            else -> {
                // Face matching flow (covered in next section)
            }
        }
    }
}
```

Refer to **[this selfie check code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L260-L271)** for the complete example.

### Selfie Check Flow Composable

The selfie check logic is extracted into a separate composable for better organization:

```kotlin
@Composable
private fun SelfieCheckFlow(
    showCamera: Boolean,
    onShowCameraChange: (Boolean) -> Unit,
    selfieCheckViewModel: SelfieCheckViewModel,
    identityIssuer: String,
    onFaceCaptured: (FaceEmbedding?) -> Unit,
    app: App
) {
    if (!showCamera) {
        Button(onClick = { onShowCameraChange(true) }) {
            Text("Selfie Check")
        }
    } else {
        SelfieCheck(
            modifier = Modifier.fillMaxWidth(),
            onVerificationComplete = {
                onShowCameraChange(false)
                if (selfieCheckViewModel.capturedFaceImage != null) {
                    val embedding = getFaceEmbeddings(
                        image = decodeImage(selfieCheckViewModel.capturedFaceImage!!.toByteArray()),
                        model = app.faceMatchLiteRtModel
                    )
                    onFaceCaptured(embedding)
                }
                selfieCheckViewModel.resetForNewCheck()
            },
            viewModel = selfieCheckViewModel,
            identityIssuer = identityIssuer
        )

        Button(
            onClick = {
                onShowCameraChange(false)
                selfieCheckViewModel.resetForNewCheck()
            }
        ) {
            Text("Close")
        }
    }
}
```

**How it works (cross-platform):**
* `SelfieCheck` composable guides the user to capture a face image after performing liveness checks (look to the sides, smile, squeeze eyes, etc.)
* `SelfieCheckViewModel` manages the selfie check process – initialization, orchestration, and data exchange with UI
* The `SelfieCheckViewModel` returns the `capturedFaceImage` as a `ByteString` which we convert to a `ByteArray`
* This `ByteArray` is passed to `decodeImage` function to decode it to an `ImageBitmap`
* After completion, use `getFaceEmbeddings` function to compute the FaceNet embedding from the captured `ImageBitmap` in a normalized values array

**Platform implementation details:**
- **Android**: Uses Camera2 API under the hood with ML Kit for face detection
- **iOS**: Uses AVFoundation (native camera framework) with ML Kit iOS for face detection
- Both platforms produce identical embedding vectors, ensuring consistency

Refer to **[this selfie check flow composable code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L287-L327)** for the complete example.

## **Live Face Matching**

Once an enrollment embedding exists, we open a live camera preview using the "Camera" composable, detect faces per frame, align and crop the face region, compute embeddings, and calculate the similarity with the embeddings of the image we captured during selfie check.

```kotlin
@Composable
fun HomeScreen(
    // ... 
) {
    var showFaceMatching by remember { mutableStateOf(false) }
    var similarity by remember { mutableStateOf(0f) }

    Column {
        when {
            !cameraPermissionState.isGranted -> {
                // ... request camera permission button
            }

            faceCaptured.value == null -> {
                // ... show selfie check
            }

            else -> {
                FaceMatchingFlow(
                    showFaceMatching = showFaceMatching,
                    onShowFaceMatchingChange = { showFaceMatching = it },
                    similarity = similarity,
                    onSimilarityChange = { similarity = it },
                    faceCaptured = faceCaptured,
                    app = app
                )
            }
        }
    }
}
```

Refer to **[live face matching flow](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L273-L282)** for the complete example.

### Face Matching Flow Composable

The selfie check logic is extracted into a separate composable for better organization:

```kotlin
@Composable
private fun FaceMatchingFlow(
    showFaceMatching:  Boolean,
    onShowFaceMatchingChange: (Boolean) -> Unit,
    similarity: Float,
    onSimilarityChange: (Float) -> Unit,
    faceCaptured: MutableState<FaceEmbedding?>,
    app: App
) {
    if (!showFaceMatching) {
        Button(onClick = { onShowFaceMatchingChange(true) }) {
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
        ) { incomingVideoFrame:  CameraFrame ->
            val faces = detectFaces(incomingVideoFrame)

            when {
                faces.isNullOrEmpty() -> {
                    onSimilarityChange(0f)
                }

                faceCaptured.value != null -> {
                    val faceImage = app.extractFaceBitmap(
                        incomingVideoFrame,
                        faces[0], // assuming only one face exists for simplicity
                        app. faceMatchLiteRtModel.imageSquareSize
                    )

                    val faceEmbedding = getFaceEmbeddings(faceImage, app.faceMatchLiteRtModel)

                    if (faceEmbedding != null) {
                        val newSimilarity = faceCaptured.value!!.calculateSimilarity(faceEmbedding)
                        onSimilarityChange(newSimilarity)
                    }
                }
            }
        }

        Button(
            onClick = {
                onShowFaceMatchingChange(false)
                faceCaptured.value = null
            }
        ) {
            Text("Close")
        }
    }
}
```

**How it works (cross-platform):**
* The `Camera` composable provided by the Multipaz SDK handles camera initialization and preview rendering for both platforms
* The `onFrameCaptured` callback is invoked for each camera frame with a `CameraFrame` object
* Use `detectFaces` function to detect faces in the `CameraFrame` - internally uses Google ML Kit on both platforms
* `extractFaceBitmap` aligns and crops the detected face
* `getFaceEmbeddings` converts the face to a `FaceEmbedding`
* `FaceEmbedding#calculateSimilarity` calculates cosine similarity with the enrolled face

**Performance considerations:**
- **Android**: Typically processes 15-30 FPS depending on device
- **iOS**: Generally faster on newer devices with CoreML acceleration (20-60 FPS)
- Both platforms support Metal/GPU acceleration for the TensorFlow Lite model

Refer to **[this face matching flow composable code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L329-L386)** for the complete example.

## **Face Alignment and Cropping**

For best matching with FaceNet, align the face so the eyes are level and crop a square around the face. Use landmarks and simple geometry to rotate and crop the face region, then scale to the model input size. You can copy-paste the `extractFaceBitmap` function below.

```kotlin
class App {
    /**
     * Cut out the face square, rotate it to level eyes line, scale to the smaller size for face matching tasks.
     */
    fun extractFaceBitmap(
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

Refer to **[this function code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L505-L553)** for the complete example.

## **Similarity Thresholds**

`FaceEmbedding.calculateSimilarity` returns a similarity score in [0.0, 1.0]. Common FaceNet-based verification thresholds range from 0.5 – 0.8 depending on lighting and device quality.

Guidance:

* Start with `0.7` as an acceptance threshold.
* Measure false accept/reject rates with your target devices and lighting.
* Consider collecting multiple enrollment images and averaging embeddings for robustness.

Example:
```
val isMatch = similarity >= 0.7f
```

**Platform-specific considerations:**
- **Android**: Threshold may vary by device manufacturer (camera quality differences)
- **iOS**: Generally more consistent across devices due to Apple's controlled hardware
- Test on both low-end Android devices and older iPhones to find a balanced threshold

## **Building and Running**

### Android Build

Standard Android build process:

```bash
# From Android Studio
# Click "Run" or use Shift+F10

# Or from command line
./gradlew :composeApp:installDebug
```

### iOS Build

:::note Version Compatibility
Different Xcode and CocoaPods versions may cause build issues. This guide was tested with:
- **Xcode**: 16.0
- **CocoaPods**: 1.16.2

If you encounter build issues, try matching these versions or check the project's compatibility requirements.
:::

iOS requires additional setup for CocoaPods integration. Follow these steps in order:

#### **Step 1: Gradle Preparation**

Run these Gradle tasks to prepare the Kotlin framework and resources:

```bash
# Clean previous builds
./gradlew :composeApp:clean

# Generate the Kotlin framework for iOS
./gradlew :composeApp:generateDummyFramework

# Prepare Compose resources for common main
./gradlew :composeApp:prepareComposeResourcesTaskForCommonMain
```

#### **Step 2: CocoaPods Setup**

Install CocoaPods dependencies:

```bash
# Install CocoaPods dependencies
pod install
```

**Important**: After running `pod install`, always open the `.xcworkspace` file (not the `.xcodeproj` file) in Xcode.

#### **Step 3: Xcode Build**

1. **Open the workspace**:
   ```bash
   # Always open the workspace, not the project file
   open iosApp.xcworkspace
   ```

2. **Configure project settings**:
   - Set up your **Team** in project settings (Signing & Capabilities tab)
   - Configure your **Bundle Identifier** in project settings

3. **Clean build folder**:
   - In Xcode: **Product → Clean Build Folder** (⇧⌘K)

4. **Build and run**:
   - Select a simulator or connected device from the scheme selector
   - Click **Product → Run** (⌘+R) or the "Play" button

**Common iOS build issues for Android developers:**

| Issue | Solution |
|-------|----------|
| "Framework not found" | Run `./gradlew :composeApp:generateDummyFramework` then `pod install` |
| "CocoaPods not installed" | Run `sudo gem install cocoapods` |
| "Building for iOS Simulator, but linking in dylib built for iOS" | This is normal for arm64 Macs, the app still runs |
| Info.plist missing camera key | Add `NSCameraUsageDescription` as shown in the permissions section |
| Resources not found at runtime | Clean build folder in Xcode (⌘+Shift+K) and rebuild |

**Tips for Android developers:**
- Xcode's "Scheme" = Gradle's build variant (Debug/Release)
- Xcode's "Target" = Gradle's module/subproject
- `.xcworkspace` = workspace with all projects (yours + CocoaPods)
- `.xcodeproj` = single project (don't open this when using CocoaPods)

## **Testing**

### Testing on Both Platforms

1. **Install the app** on both Android and iOS devices/emulators
2. **Press the "selfie check" button**
3. **Perform the selfie check** - follow on-screen liveness instructions
4. **Check the checkbox** for consent
5. **Press send button** - wait for a second for the "face matching" button to appear
6. **Press the "Face Matching" button**
7. **View live feed** - you can see the match percentage on the screen

### Platform-Specific Testing Tips

**Android:**
- Test on multiple device manufacturers (Samsung, Pixel, OnePlus) - camera quality varies
- Test in both portrait and landscape orientations
- Use Android Studio's Device Manager for emulator testing (has virtual camera)

**iOS:**
- Test on both physical devices and simulators
- iOS Simulator has limited camera support - use "Choose Photo" feature or test on real device
- Test on different iPhone models - Face ID devices (iPhone X+) vs Touch ID devices
- Use Xcode's "Take Screenshot" feature to debug face detection visually

**Camera Testing Matrix:**

| Scenario | Android | iOS |
|----------|---------|-----|
| Front camera selfie | ✅ | ✅ |
| Low light conditions | Test on physical device | Test on physical device |
| Glasses/accessories | ✅ | ✅ |
| Multiple faces in frame | Should detect all | Should detect all |
| Face at angle | May need better alignment | May need better alignment |

### Debugging Face Detection

If face detection isn't working:

1. **Check permissions**: Make sure camera permission is granted
2. **Check model loading**: Add logs in the `init()` function to confirm model loads
3. **Check face detection**: Add logs in `detectFaces()` to see if faces are being detected
4. **Check lighting**: Poor lighting significantly affects detection quality
5. **Check distance**: Face should be 20-50cm from camera for best results

**Android-specific debugging:**
```kotlin
Log.d("FaceNet", "Faces detected: ${faces.size}")
Log.d("FaceNet", "Similarity: $similarity")
```

**iOS-specific debugging (in Xcode console)**:
- Open "Debug Area" in Xcode (⌘+Shift+Y)
- Print statements from Kotlin code appear in the console
- Use Xcode's debugger for native code issues

## **Summary**

By following this guide, you enable secure, on-device face detection and verification using FaceNet within the Multipaz Getting Started Sample on **both Android and iOS platforms**. 

**What you've learned:**
- ✅ Setting up Kotlin Multiplatform with platform-specific dependencies
- ✅ Configuring CocoaPods for iOS (essential for Android developers)
- ✅ Handling camera permissions on both platforms
- ✅ Using shared Kotlin code for face detection and verification
- ✅ Platform-specific considerations and debugging tips

**Key differences between platforms:**

| Aspect | Android | iOS |
|--------|---------|-----|
| **Dependency Manager** | Gradle | CocoaPods |
| **Permissions** | AndroidManifest.xml | Info.plist |
| **Camera API** | Camera2 (under the hood) | AVFoundation (under the hood) |
| **ML Framework** | ML Kit + TFLite | ML Kit + TFLite with CoreML |
| **Build Tool** | Gradle | Xcode + Gradle (KMP) |
| **Package Format** | APK/AAB | IPA |

Despite these platform differences, the Multipaz Vision library abstracts away the complexity, allowing you to write **99% of your face verification code once in Kotlin** and have it work on both platforms!