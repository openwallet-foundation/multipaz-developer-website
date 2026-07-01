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

#### **1.2 Understand the CredmanActivity Class**

`CredmanActivity` lives in the Android-specific source set (for example, `composeApp/src/androidMain/.../CredmanActivity.kt`) and is responsible for handling W3C DC API presentation requests.

```kotlin
class CredmanActivity : CredentialManagerPresentmentActivity() {

    private val promptModel: PromptModel by inject()
    private val documentTypeRepository: DocumentTypeRepository by inject()
    private val presentmentSource: PresentmentSource by inject()

    override suspend fun getSettings(): Settings {
        return Settings(
            appName = APP_NAME,                           // Display name for the wallet
            appIcon = appIcon,                            // Icon shown in credential requests
            promptModel = promptModel,                    // User interaction handling
            applicationTheme = @Composable { content -> MaterialTheme { content() } },
            documentTypeRepository = documentTypeRepository,  // Supported credential types
            presentmentSource = presentmentSource,            // Credential source
            imageLoader = ImageLoader.Builder(applicationContext)
                .components { /* network loader omitted */ }
                .build(),
            privilegedAllowList = Res.readBytes("files/privilegedUserAgents.json")
                .decodeToString()
        )
    }
}
```

`CredmanActivity` extends `CredentialManagerPresentmentActivity` from the Multipaz library, which provides the core W3C DC API functionality.  

### **Step 2: Understanding Android Manifest Configuration**

#### **2.1 Intent Filter Setup**

In AndroidManifest.xml:

//TODO: add CredmanActivity in AndroidManifest

```xml
<activity
    android:name=".CredmanActivity"
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

**What this does**:

1. **Exports the Activity**: Makes it available to other apps and the system  
2. **Handles Credential Requests**: Responds to GET_CREDENTIAL and GET_CREDENTIALS actions  
3. **System Integration**: Allows Android to route W3C DC API requests to your wallet

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
`
### **Step 4: Understanding W3C DC API Integration**

#### **4.1 DigitalCredentials.Default Integration**

The core W3C DC API integration happens in your App.kt initialization:

#### **4.1 W3C DC API Presentation Flow**

1. **Web Verifier Request**: A web application requests credentials using W3C DC API  
2. **Android System Routing**: Android routes the request to your CredmanActivity  
3. **Credential Discovery**: The system discovers available credentials through the registered document store  
4. **User Authorization**: User sees a prompt to authorize credential sharing  
5. **Credential Selection**: User chooses which credentials to share  
6. **Secure Presentation**: Credentials are securely presented to the verifier via W3C DC API

#### **4.2 Integration with Document Store and Registration Manager**

The W3C DC API integration leverages your existing credential infrastructure with proper registration refresh to fix verification glitches.

```kotlin
// TODO: Register DC API with documents from document store
digitalCredentials.register(
    documentStore = documentStore,
    documentTypeRepository = documentTypeRepository,
    selectedProtocols = settingsModel.dcApiProtocols.value,
)
```

**What this does:** Registers all documents in documentStore with the W3C Digital Credentials API provider for the platform.

For credentials to be available via W3C DC API, they must be registered with the Android system. This is handled by the `DigitalCredentialsRegistrationManager`.

The registration manager ensures credentials are refreshed:
* When the app starts
* After credential issuance
* When returning from the provisioning screen

### **Step 6: Testing the Implementation**

To test your W3C DC API implementation:

1. **Deploy Your App**: Install the wallet app on an Android device  
2. **Open Web Verifier**: Navigate to a W3C DC API compatible verifier (like [https://verifier.multipaz.org/](https://verifier.multipaz.org/))  
3. **Request Credentials**: The verifier will request credentials using W3C DC API  
4. **Authorize Presentation**: Your app will show a consent dialog  
5. **Verify Success**: Check that credentials are properly presented