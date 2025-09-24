---
title: Obtaining a credential
sidebar_position: 0
---


## **Provisioning**

This codelab teaches you how to implement OpenID4VCI (OpenID Connect for Verifiable Credential Issuance) in a Kotlin Multiplatform mobile wallet application. You'll build a working wallet that can receive and store digital credentials like Utopia membership.

**Architecture Overview**


The screenshots below illustrate the provisioning process:

- In the app, click “Get Credentials from Issuer”

- The browser opens at issuer.multipaz.org → click “OpenID4VCI server”

- Select the “Utopia Wholesale” credential

- Click “Credential Offer using custom URL scheme”

- Complete the Provisioning step

- On the Verification Page, select the person

- The Credential is issued

- Back in the app, click “Present mDL via QR”

- The QR code is displayed
<div className="image-grid">
  <img src={require('@site/static/img/start.png').default} alt="Start" />
  <img src={require('@site/static/img/issuer.png').default} alt="Issuer" />
  <img src={require('@site/static/img/select_credential.png').default} alt="Select Credential" />
  <img src={require('@site/static/img/customize_scheme.png').default} alt="Customize Scheme" />
  <img src={require('@site/static/img/provision.png').default} alt="Provision" />
  <img src={require('@site/static/img/verify.png').default} alt="Verify" />
  <img src={require('@site/static/img/authorized.png').default} alt="Authorized" />
  <img src={require('@site/static/img/preesent_mdl.png').default} alt="Present MDL" />
  <img src={require('@site/static/img/dispaly_qr.png').default} alt="Display QR" />
</div>


**What is Identity Credential Provisioning?**

Identity credential provisioning is the process of securely issuing digital credentials (like driver's licenses, passports, or other identity documents) to a user's digital wallet. This process involves:

1. **Authentication**: Verifying the user's identity  
2. **Authorization**: Determining what credentials the user is eligible to receive  
3. **Issuance**: Securely transferring the credentials to the user's wallet  
4. **Storage**: Safely storing the credentials in the wallet's secure storage

## **Step-by-Step Implementation**

### **Step 1: Project Setup and Exploration**

#### **1.1 Explore the Project Structure**

First, set your project’s **“android:launchMode="singleInstance"** to prevent unnecessary recompositions, which may otherwise break the issuance process.

**Look for these key files**:

* ProvisioningSupport.kt \- Core backend implementation  
* App.kt \- Main application class  
* ProvisioningTestScreen.kt \- UI for provisioning

#### **1.2 Understand the ProvisioningSupport Class**
```kotlin
//TODO: implement OpenID4VCI_CLIENT_PREFERENCES
val OPENID4VCI_CLIENT_PREFERENCES = OpenID4VCIClientPreferences(
    clientId = CLIENT_ID,
    redirectUrl = APP_LINK_BASE_URL,
    locales = listOf("en-US"),
    signingAlgorithms = listOf(Algorithm.ESP256, Algorithm.ESP384, Algorithm.ESP512)
    )

```

ProvisioningSupport is a subclass of OpenID4VCIBackend, which is defined in the Multipaz library. ProvisioningSupport class is the bridge between your wallet and credential issuers. It handles authentication, authorization, and secure communication.

#### **1.3 Examine Key Methods**

In ProvisioningSupport.kt 

**createJwtClientAssertion**:

```kotlin
//TODO: implement head 
val head = buildJsonObject {
            put("typ", "JWT")
            put("alg", alg)
            put("kid", localClientAssertionKeyId)
        }.toString().encodeToByteArray().toBase64Url()

```

This method creates a JWT header with the signing algorithm and key ID.


```kotlin
//TODO: implement OpenID4VCI_CLIENT_PREFERENCES
val OPENID4VCI_CLIENT_PREFERENCES = OpenID4VCIClientPreferences(
            clientId = CLIENT_ID,
            redirectUrl = APP_LINK_BASE_URL,
            locales = listOf("en-US"),
            signingAlgorithms = listOf(Algorithm.ESP256, Algorithm.ESP384, Algorithm.ESP512)
        )
```
Here creates an OPENID4VCI_CLIENT_PREFERENCES object, which defines configuration parameters such as clientId, redirectUrl, locals, and signingAlgorithms. The OPENID4VCI_CLIENT_PREFERENCES is then used when calling launchOpenID4VCIProvisioning.

### **Step 2: Understanding URL Processing**

#### **Examine the URL Handler**
In App.kt file

```kotlin
//TODO:    call processAppLinkInvocation(url)
provisioningSupport.processAppLinkInvocation(url)
```
**Credential Offer URLs**: Start with openid-credential-offer:// or haip://

During provisioning, the app receives a URL from the server, and the client must perform specific processing based on that URL.

### **Step 3: Understanding the User Interface**

#### **Provisioning Screen**

```kotlin   
//TODO: update text depends on provisioningState
val text = when (provisioningState) {
             ProvisioningModel.Idle -> "Initializing..."
             ProvisioningModel.Idle -> "Starting provisioning..."
             ProvisioningModel.Connected -> "Connected to the back-end"
             ProvisioningModel.ProcessingAuthorization -> "Processing authorization..."
             ProvisioningModel.ProcessingAuthorization -> "Authorized"
             ProvisioningModel.RequestingCredentials -> "Requesting credentials..."
             ProvisioningModel.CredentialsIssued -> "Credentials issued"
             is ProvisioningModel.Error -> throw IllegalStateException()
             is ProvisioningModel.Authorizing -> throw IllegalStateException()
         }
         Text(
             modifier = Modifier
                 .align(Alignment.CenterHorizontally)
                 .padding(8.dp),
             style = MaterialTheme.typography.titleLarge,
             text = text
         )
    
```
The provisioning flow progresses through the following states: Idle, Connected, ProcessingAuthorization, RequestingCredentials,CredentialsIssued, etc. Your application should monitor the current provisioning state and display a notification that corresponds to it.

### **Step 4: Understanding Authorization**

#### **4.1 Authorization Handler**

In ProvisioningTestScreen.kt

```kotlin
//TODO: init  EvidenceRequestWebView
EvidenceRequestWebView(
    evidenceRequest = challenge,
    provisioningModel = provisioningModel,
    provisioningSupport = provisioningSupport
)
```

EvidenceRequestWebView is called inside Authorize function. The Authorize function receives a list of authorization challenges ,handles OAuth challenges and Calls EvidenceRequestWebView for OAuth challenges

#### **4.2 OAuth Flow Handler**

```kotlin  
//TODO: add provideAuthorizationResponse
 provisioningModel.provideAuthorizationResponse(
            AuthorizationResponse.OAuth(stableEvidenceRequest.id, invokedUrl)
        )
```

**What it do**:

1. **OAuth Challenge Handling**: Receives an OAuth authorization challenge from the issuer  
2. **External Browser Launch**: Opens the user's default browser with the OAuth URL  
3. **Callback Management**: Waits for the user to complete authentication and return via app links  
4. **Response Processing**: Handles the OAuth callback and provides the response to the provisioning model

It launches the external browser instead and manages the OAuth flow through app links.

### **Step 5 (Optional): APP\_LINK\_SERVER Configuration and OAuth Callback Handling**

| Info: This section explains an optional configuration. The Wholesale Codelab uses custom schemes by default, so the app should work without applying these steps, since custom intents do not require verification. |
| :---- |

The APP\_LINK\_SERVER is a critical component that enables OAuth callback handling through Android App Links. This section explains how it works and how to configure it properly.

#### **5.1 What is APP\_LINK\_SERVER?**

The APP\_LINK\_SERVER serves as the **OAuth callback endpoint** for your credential provisioning flow. It's the URL where the external browser redirects after the user completes OAuth authentication.

```kotlin
companion object Companion {  
        // Default custom scheme (enabled in AndroidManifest.xml)  
        const val APP_LINK_SERVER = "wholesale-test-app"  
        const val APP_LINK_BASE_URL = "${APP_LINK_SERVER}://landing/"

        // Alternative HTTP App Links (more secure). See AndroidManifest.xml Option #2  
        /*const val APP_LINK_SERVER = "https://apps.multipaz.org"  
        const val APP_LINK_BASE_URL = "$APP_LINK_SERVER/landing/"*/

}
```

By default, since your app’s fingerprint has not been uploaded to apps.multipaz.org, app links from the website cannot be handled by the app and will instead open in the browser. To enable the app to handle these links, follow these steps:

**App Info → Open by default → Add Link → select “apps.multipaz.org Opens in Multipaz Test App.”(Different devices may display different)**

If your app’s fingerprint is not registered on the Multipaz server and you haven’t completed the above steps, you will see the error message: **“The request URL was not found on the server.”**

##### Default Configuration in `AndroidManifest.xml`

```xml
<!-- Option #1 - Custom URI Scheme (default) -->  
<!-- Must match ApplicationSupportLocal.APP_LINK_SERVER -->  
<intent-filter>  
    <action android:name="android.intent.action.VIEW" />  
    <category android:name="android.intent.category.DEFAULT" />  
    <category android:name="android.intent.category.BROWSABLE" />  
    <data android:scheme="wholesale-test-app"/>  
    <data android:host="landing"/>  
</intent-filter>
```

**If you prefer to use HTTP App Links (more secure), see Option #2 in AndroidManifest.xml and complete the verification steps.**

#### **5.2 Android Manifest Configuration**

The codelab enables custom URI schemes out of the box. This intent filter matches the default configuration (wholesale-test-app://landing):

```xml
<!-- Option #1 - Custom URI Scheme (default) -->  
<!-- Must match ApplicationSupportLocal.APP_LINK_SERVER -->  
<intent-filter>  
    <action android:name="android.intent.action.VIEW" />  
    <category android:name="android.intent.category.DEFAULT" />  
    <category android:name="android.intent.category.BROWSABLE" />  
    <data android:scheme="wholesale-test-app"/>  
    <data android:host="landing"/>  
</intent-filter>

<!-- Option #2 - HTTPS App Links - Requires .well-known/assetlinks.json -->  
            <!-- Examples: https://apps.multipaz.org/landing/ -->  
            <!-- Must match ApplicationSupportLocal.APP_LINK_SERVER -->  
            <!--<intent-filter android:autoVerify="true">  
                <action android:name="android.intent.action.VIEW" />  
                <category android:name="android.intent.category.DEFAULT" />  
                <category android:name="android.intent.category.BROWSABLE" />

                <!--  
                Do not include other schemes, only https. If domain is changed here, it  
                also MUST be changed in ApplicationSupportLocal class.  
                 -->  
                <data  
                    android:scheme="https"  
                    android:host="apps.multipaz.org"  
                    android:pathPattern="/landing/.*"/>  
            </intent-filter>-->
```

**If you prefer to use HTTP App Links (more secure), see Option #2 in AndroidManifest.xml and complete the verification steps.**

### **Step 6 (Optional)Set up your Own Credential Server**

If you are setting up your own Credential server, the steps below will guide you through adding your app’s fingerprint.

#### **6.1 App Link Verification and Trust**

Android verifies that your app is trusted to handle URLs from the specified domain. This prevents malicious apps from intercepting OAuth callbacks.

**App link  (High Security):**

* Requires .well-known/assetlinks.json on the server  
* Must include your app's signing certificate fingerprint  
* Android automatically verifies the trust relationship

**Customize URI (Low Security):**

* No verification required  
* Works immediately for testing  
* Less secure but easier to set up

#### **6.2 app fingerprint add in server**

If you want to use your own server instead of [apps.multipaz.org](http://apps.multipaz.org):

##### **In client you should change below constants** 

```kotlin
const val APP_LINK_SERVER = "https://your-server.com"  
const val APP_LINK_BASE_URL = "$APP_LINK_SERVER/landing/"
```

##### **In client side you should update AndroidManifest.xml**

```xml
<intent-filter android:autoVerify="true">  
    <action android:name="android.intent.action.VIEW" />  
    <category android:name="android.intent.category.DEFAULT" />  
    <category android:name="android.intent.category.BROWSABLE" />  
    <data  
        android:scheme="https"  
        android:host="your-server.com"  
        android:pathPattern="/landing/.*"/>  
</intent-filter>
```

##### **Create assetlinks.json which contains app’s fingerprint and update it in server side**

Upload this file to https://your-server.com/.well-known/assetlinks.json:

```json
[  
    {  
        "relation": [  
            "delegate_permission/common.handle_all_urls"  
        ],  
        "target": {  
            "namespace": "android_app",  
            "package_name": "org.multipaz.samples.wallet.cmp",  
            "sha256_cert_fingerprints": [  
                "YOUR_APP_SIGNING_CERTIFICATE_FINGERPRINT"  
            ]  
        }  
    }  
]
```

### **Security Features**

```kotlin
private val attestationCertificate by lazy {  
            runBlocking {  
                X509Cert.fromPem(  
                    Res.readBytes("files/attestationCertificate.pem").decodeToString().trimIndent()  
                )  
            }  
        }

private val attestationPrivateKey =  
            runBlocking {  
                EcPrivateKey.fromPem(Res.readBytes("files/attestationPrivateKey.pem").decodeToString().trimIndent().trimIndent(),  
                    attestationCertificate.ecPublicKey  
                )  
            }
```

#### **What are Attestation Certificate and Private Key?**

**Attestation Certificate (attestationCertificate):**

* An X.509 digital certificate that proves the wallet's identity and security properties  
* Contains the wallet's public key and metadata (issuer, validity period, etc.)  
* Acts as a "digital passport" that issuers can trust  
* In this implementation, it's embedded in the app for testing purposes

**Attestation Private Key (attestationPrivateKey):**

* The corresponding private key used to sign attestation tokens  
* Must be kept secret and secure  
* Used to prove that the wallet actually controls the certificate
