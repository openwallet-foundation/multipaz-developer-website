# W3C DC API Implementation

## **W3C Digital Credentials API Integration**

This codelab teaches you how to implement W3C Digital Credentials API (DC API) in a Kotlin Multiplatform mobile wallet application. You'll build a working wallet that can receive and present digital credentials through the standardized W3C DC API interface, enabling seamless integration with web verifiers and other credential consumers.

**Architecture Overview**

The screenshots below illustrate the W3C DC API integration process:

* Web verifier requests credentials using W3C DC API  
* Android system routes the request to your wallet app  
* User authorizes credential presentation  
* Wallet presents credentials via W3C DC API  
* Verifier receives and validates the credentials

**What is W3C Digital Credentials API?**

The W3C Digital Credentials API (DC API) is a standardized interface that allows web applications and other services to request and receive digital credentials from user wallets. This API enables:

1. **Standardized Interface**: Consistent way for verifiers to request credentials  
2. **User Control**: Users can choose which credentials to share and with whom  
3. **Security**: Secure credential presentation with user consent  
4. **Interoperability**: Works across different wallet implementations and platforms

## **Step-by-Step Implementation**

### **Step 1: Project Setup and Exploration**

#### **1.1 Explore the Project Structure**

First, ensure your project has the necessary Android manifest configuration for W3C DC API support.

**Look for these key files**:

* CredmanActivity.kt - Core W3C DC API implementation  
* privilegedUserAgents.json - Trusted browser/app allowlist  
* AndroidManifest.xml - Intent filter configuration
* PlatformDigitalCredentials.kt - Resolves the platform-specific Digital Credentials implementation

#### **1.2 Understand the CredmanActivity Class**

`CredmanActivity` lives in the `androidApp` module (for example, `androidApp/src/main/.../CredmanActivity.kt`) and is responsible for handling W3C DC API presentation requests.

```kotlin
class CredmanActivity : CredentialManagerPresentmentActivity() {
    private val presentmentSource: PresentmentSource by inject()

    override suspend fun getSettings(): Settings {
        return Settings(
            source = presentmentSource,
            privilegedAllowList = Res.readBytes("files/privilegedUserAgents.json").decodeToString(),
        )
    }
}
```

`CredmanActivity` extends `CredentialManagerPresentmentActivity` from `multipaz-dcapi-credman`. The base class receives the Android Credential Manager request, resolves the caller and its origin, asks the `PresentmentSource` which documents match the request, runs the consent and selection UI, and returns the response. The subclass supplies only the app-specific settings:

* `source`: the `PresentmentSource` from Koin, which provides the document store, document types, trust decisions, and consent behavior.
* `privilegedAllowList`: the JSON allowlist used to resolve the caller's web origin. The activity reads it from `privilegedUserAgents.json`.  

### **Step 2: Understanding Android Manifest Configuration**

#### **2.1 Intent Filter Setup**

The starter already registers `CredmanActivity` in `AndroidManifest.xml`:

```xml
<activity
    android:name="org.multipaz.samples.wallet.cmp.CredmanActivity"
    android:exported="true"
    android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|mnc|colorMode|density|fontScale|fontWeightAdjustment|keyboard|layoutDirection|locale|mcc|navigation|smallestScreenSize|touchscreen|uiMode"
    android:theme="@android:style/Theme.Translucent"
    android:launchMode="singleInstance"
    android:excludeFromRecents="true">
    <intent-filter>
        <action android:name="androidx.credentials.registry.provider.action.GET_CREDENTIAL" />
        <action android:name="androidx.identitycredentials.action.GET_CREDENTIALS" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
</activity>
```

**What each attribute does**:

* `android:exported="true"` — allows the system and browser to launch the activity from outside the app.
* `GET_CREDENTIAL` and `GET_CREDENTIALS` — the Credential Manager actions the activity responds to. `GET_CREDENTIAL` is used by the Android Credential Manager registry; `GET_CREDENTIALS` is used by Identity Credentials.
* `android:configChanges` — prevents the activity from being recreated while a request is in progress when the device rotates or changes configuration.
* `android:theme="@android:style/Theme.Translucent"` — renders the consent UI as a translucent overlay over the browser instead of a full-screen opaque activity.
* `android:launchMode="singleInstance"` — prevents multiple instances of the activity from handling the same request.
* `android:excludeFromRecents="true"` — keeps this short-lived provider activity out of the recents list.

Without this entry, the system has no component to launch, so DC API requests never reach the wallet.

### **Step 3: Understanding Privileged User Agents**

#### **3.1 Security Through Allowlisting**

The privilegedUserAgents.json file contains a list of trusted applications that can request credentials, if the applications are not in the list ,there will be a warning,depends on your requirements edit exception applications here:

```json
{
  "apps": [
    {
      "type": "android",
      "info": {
        "package_name": "com.android.chrome",
        "signatures": [
          {
            "build": "release",
            "cert_fingerprint_sha256": "F0:FD:6C:5B:41:0F:25:CB:25:C3:B5:33:46:C8:97:2F:AE:30:F8:EE:74:11:DF:91:04:80:AD:6B:2D:60:DB:83"
          }
        ]
      }
    }
  ]
}
```

**Security Features**:

1. **Package Name Verification**: Ensures only specific apps can request credentials  
2. **Signature Verification**: Validates app signatures to prevent spoofing  
3. **Build Type Support**: Supports both release and debug builds  
4. **Multiple Browsers**: Includes Chrome, Firefox, Edge, and other trusted browsers

#### **3.2 Supported Applications**

The allowlist includes:

* **Chrome variants**: com.android.chrome, com.chrome.beta, com.chrome.dev, com.chrome.canary  
* **Firefox variants**: org.mozilla.firefox, org.mozilla.firefox_beta, org.mozilla.focus  
* **Edge variants**: com.microsoft.emmx, com.microsoft.emmx.beta, com.microsoft.emmx.dev  
* **Other browsers**: Brave, Vivaldi, Yandex, DuckDuckGo, Samsung Internet  
* **System apps**: Google Play Services, Android Browser

### **Step 4: Understanding W3C DC API Integration**

Digital Credentials API support is provided by platform-specific Multipaz modules: `multipaz-dcapi-credman` on Android and `multipaz-dcapi-ios` on iOS. Shared code obtains the correct `DigitalCredentials` implementation through a small expect/actual function, and each platform creates its own instance.

Steps 4.1 and 4.2 describe wiring that is already present in the starter. Only Step 4.3 contains a TODO.

#### **4.1 Platform DC API dependencies**

The starter already declares the two platform artifacts and adds them where they are needed:

| File | What is already configured |
| --- | --- |
| `gradle/libs.versions.toml` | `multipaz-dcapi-credman` and `multipaz-dcapi-ios` aliases |
| `androidApp/build.gradle.kts` | `implementation(libs.multipaz.dcapi.credman)` because `CredmanActivity` lives in `androidApp` |
| `composeApp/build.gradle.kts` | `androidMain` uses `multipaz-dcapi-credman`; `iosMain` uses `multipaz-dcapi-ios` |

Both platforms implement the shared `DigitalCredentials` interface from `commonMain`, but the implementations are different:

* **Android** registers credentials through the Android Credential Manager provider. `CredmanActivity` handles presentment requests.
* **iOS** registers credentials through the Identity Document provider extension. Presentment is handled by the system, not by an Android-style activity.

Keeping the platform artifacts in the matching source sets lets shared code depend on `DigitalCredentials` without depending on Android- or iOS-only classes.

#### **4.2 Resolve the platform implementation**

The starter already contains the resolver in `PlatformDigitalCredentials.kt`:

```kotlin
expect fun shouldRegisterDigitalCredentialsInCommonModule(): Boolean

expect suspend fun getDigitalCredentials(): DigitalCredentials
```

The Android actual returns `true` and creates a `DigitalCredentialsCredman`; the iOS actual returns `false` and creates a `DigitalCredentialsIos`.

`getDigitalCredentials()` keeps platform construction out of shared code. `shouldRegisterDigitalCredentialsInCommonModule()` gates the shared registration path:

* On Android it returns `true`, so `DigitalCredentialsRegistrationManager.refresh()` runs the shared registration code.
* On iOS it returns `false`, because the iOS Identity Document provider extension owns registration. The shared refresh must not run there.

The starter already has the `expect` declaration and both `actual` implementations. You do not need to add them.

#### **4.3 Register documents with Digital Credentials**

`DigitalCredentialsRegistrationManager.refresh()` obtains the platform implementation with `getDigitalCredentials()` and checks `registerAvailable`. Replace the TODO inside its `try` block with the registration call:

_`composeApp/src/commonMain/.../util/DigitalCredentialsRegistrationManager.kt`_

```kotlin
// TODO: Register DC API with documents from document store
digitalCredentials.register(
    documentStore = documentStore,
    documentTypeRepository = documentTypeRepository,
    selectedProtocols = settingsModel.dcApiProtocols.value,
)
```

`register()` publishes every document in `documentStore` and removes registrations for documents that are no longer present. `documentTypeRepository` supplies the credential metadata, and `selectedProtocols` must be a subset of the provider's `supportedProtocols`. By default, the call is skipped when nothing changed.

The surrounding `try`/`catch` already logs successful refreshes and registration failures.

**What this does:** Registers all documents in `documentStore` with the platform's W3C Digital Credentials provider.

For credentials to be available via the W3C DC API, they must be registered with the platform. This is handled by the `DigitalCredentialsRegistrationManager`.

The registration manager ensures credentials are refreshed:
* When the app starts
* After credential issuance
* When returning from the provisioning screen

#### **4.4 W3C DC API Presentation Flow**

1. **Web Verifier Request**: A web application requests credentials using W3C DC API
2. **Android System Routing**: Android routes the request to your CredmanActivity
3. **Credential Discovery**: The system discovers available credentials through the registered document store
4. **User Authorization**: User sees a prompt to authorize credential sharing
5. **Credential Selection**: User chooses which credentials to share
6. **Secure Presentation**: Credentials are securely presented to the verifier via W3C DC API

### **Step 5: Testing the Implementation**

To test your W3C DC API implementation:

1. **Deploy Your App**: Install the wallet app on an Android device  
2. **Open Web Verifier**: Navigate to a W3C DC API compatible verifier (like [https://verifier.multipaz.org/](https://verifier.multipaz.org/))  
3. **Request Credentials**: The verifier will request credentials using W3C DC API  
4. **Authorize Presentation**: Your app will show a consent dialog  
5. **Verify Success**: Check that credentials are properly presented