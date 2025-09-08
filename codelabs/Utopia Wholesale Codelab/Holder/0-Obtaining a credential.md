---
title: Obtaining a credential
sidebar_position: 0
---


## **Provisioning**

This codelab teaches you how to implement OpenID4VCI (OpenID Connect for Verifiable Credential Issuance) in a Kotlin Multiplatform mobile wallet application. You'll build a working wallet that can receive and store digital credentials like Utopia membership.

**Architecture Overview**

The credential provisioning process follows this sequence:

1\. Credential Offer Received → 2\. URL Processing →3 Input Identity Info \-\>4. Authorization → 5\. Credential Issuance → 6\. Storage

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

class ProvisioningSupport: OpenID4VCIBackend {  
    companion object Companion {  
      //TODO:  Add const val APP_LINK_SERVER = "https://apps.multipaz.org"

       const val CLIENT_ID = "urn:uuid:418745b8-78a3-4810-88df-7898aff3ffb4"  
    }  
      
      
}

```

ProvisioningSupport is a subclass of OpenID4VCIBackend, which is defined in the Multipaz library. ProvisioningSupport class is the bridge between your wallet and credential issuers. It handles authentication, authorization, and secure communication.

#### **1.3 Examine Key Methods**

**createJwtClientAssertion**:

```kotlin
@OptIn(ExperimentalTime::class)  
override suspend fun createJwtClientAssertion(tokenUrl: String): String {  
    val alg = localClientAssertionPrivateKey.curve.defaultSigningAlgorithmFullySpecified.joseAlgorithmIdentifier  
    //TODO implement head   
    
      
    // ... rest of implementation ...  
}
```

This method creates a JWT header with the signing algorithm and key ID.

**Wallet Attestation**

```kotlin
@OptIn(ExperimentalTime::class)  
override suspend fun createJwtWalletAttestation(keyAttestation: KeyAttestation): String {  
    val signatureAlgorithm = attestationPrivateKey.curve.defaultSigningAlgorithmFullySpecified  
    val head = buildJsonObject {  
        put("typ", "oauth-client-attestation+jwt")  
        put("alg", signatureAlgorithm.joseAlgorithmIdentifier)  
        put("x5c", buildJsonArray {  
            add(attestationCertificate.encodedCertificate.encodeBase64())  
        })  
    }.toString().encodeToByteArray().toBase64Url()  
      
    // ... rest of implementation ...  
}
```

This method includes the X.509 certificate in the JWT header to prove the wallet's authenticity. These JWTs are what convince the issuer that your wallet is legitimate and secure.

### **Step 2: Understanding URL Processing**

#### **2.1 Examine the URL Handler**

```kotlin
fun handleUrl(url: String) {  
    Logger.i(TAG, "handleUrl called with: $url")  
      
    if (url.startsWith(OID4VCI_CREDENTIAL_OFFER_URL_SCHEME) || url.startsWith(HAIP_URL_SCHEME)) {  
        // Handle credential offer URLs  
        Logger.i(TAG, "Starting OpenID4VCI provisioning with: $url")  
        CoroutineScope(Dispatchers.Default).launch {  
          //TODO:  credentialOffers.send(url)  
        }  
    } else if (url.startsWith(ProvisioningSupport.APP_LINK_BASE_URL)) {  
        // Handle app link invocations (OAuth callbacks)  
        Logger.i(TAG, "Processing app link invocation: $url")  
        CoroutineScope(Dispatchers.Default).launch {  
            try {  
            //TODO:    provisioningSupport.processAppLinkInvocation(url)  
            } catch (e: Exception) {  
                Logger.e(TAG, "Error processing app link: ${e.message}", e)  
            }  
        }  
    }  
}
```

**Credential Offer URLs**: Start with openid-credential-offer:// or haip://

### **Step 3: Understanding the User Interface**

#### **3.1 Provisioning Screen**

```kotlin
@Composable  
fun ProvisioningTestScreen(  
    app: App,  
    provisioningModel: ProvisioningModel,  
    provisioningSupport: ProvisioningSupport,  
    onNavigateToMain: () -> Unit  
) {  
    val provisioningState = provisioningModel.state.collectAsState(ProvisioningModel.Idle).value  
      
    Column {  
        // Navigation back button  
        Row(  
            modifier = Modifier.fillMaxWidth(),  
            horizontalArrangement = Arrangement.Start  
        ) {  
            Text(  
                modifier = Modifier  
                    .padding(16.dp)  
                    .clickable { onNavigateToMain() },  
                text = "← Back",  
                style = MaterialTheme.typography.bodyLarge,  
                color = MaterialTheme.colorScheme.primary  
            )  
        }  
          
        // Display different states  
        when (provisioningState) {  
            is ProvisioningModel.Authorizing -> {  
                Authorize(app, provisioningModel, provisioningState.authorizationChallenges, provisioningSupport)  
            }  
            is ProvisioningModel.Error -> {  
                Text("Error: ${provisioningState.err.message}")  
            }  
            else -> {  
/*TODO:   handle provisioningState */  
            }  
        }  
    }  
}
```

The UI observes the provisioning state using collectAsState()  
**State Flow Diagram**:

Idle → Initial → Connected → ProcessingAuthorization → Authorizing → Authorized → RequestingCredentials → CredentialsIssued

In the Connected  flow you will see some page like this one:

<img src="/img/provision.png" alt="Provisioning Flow" width="200" />

After connecting to the server, the client will open a browser link prompting you to enter your personal data to begin authentication, as shown below:

<img src="/img/verify.png" alt="Verification" width="200" />


This demo **does not perform actual verification**—it skips identity proofing and just lets you pick a credential. In a production setup, the server should verify the user’s identity (e.g., via a challenge) before allowing credential download.

<img src="/img/authorized.png" alt="Authorized" width="200" />


### **Step 4: Understanding Authorization**

#### **4.1 Authorization Handler**

```kotlin
@Composable  
private fun Authorize(  
    app: App,  
    provisioningModel: ProvisioningModel,  
    provisioningSupport: ProvisioningSupport,  
    challenges: List<AuthorizationChallenge>  
) {  
    Logger.i(EvidenceRequestWebView, "Authorize function called with ${challenges.size} challenges")  
    when (val challenge = challenges.first()) {  
        is AuthorizationChallenge.OAuth -> {  
            Logger.i(EvidenceRequestWebView, "Authorize: Rendering EvidenceRequestWebView for OAuth challenge") 
            //TODO: init  EvidenceRequestWebView
            
        }  
    }  
}
```

The function receives a list of authorization challenges ,handles OAuth challenges and Calls EvidenceRequestWebView for OAuth challenges

#### **4.2 OAuth Flow Handler**

```kotlin
@Composable  
fun EvidenceRequestWebView(  
    evidenceRequest: AuthorizationChallenge.OAuth,  
    provisioningModel: ProvisioningModel,  
    provisioningSupport: ProvisioningSupport  
) {  
    // Stabilize the evidenceRequest to prevent unnecessary re-compositions  
    val stableEvidenceRequest = remember(evidenceRequest.url, evidenceRequest.state) {  
        evidenceRequest  
    }  
      
    // Handle OAuth callback when user returns from browser  
    LaunchedEffect(stableEvidenceRequest.url) {  
        Logger.i(EvidenceRequestWebView, "Waiting for app link invocation with state: ${stableEvidenceRequest.state}")  
        val invokedUrl = provisioningSupport.waitForAppLinkInvocation(stableEvidenceRequest.state)  
        Logger.i(EvidenceRequestWebView, "App link invoked with URL: $invokedUrl")  
          
          //TODO: add provideAuthorizationResponse
        
    }  
      
    // Launch external browser for OAuth authentication  
    val uriHandler = LocalUriHandler.current  
    LaunchedEffect(stableEvidenceRequest.url) {  
        Logger.i(EvidenceRequestWebView, "About to open browser with URL: ${stableEvidenceRequest.url}")  
        // TODO: use Chrome Custom Tabs instead?  
        uriHandler.openUri(stableEvidenceRequest.url)  
        Logger.i(EvidenceRequestWebView, "Browser opened successfully")  
    }  
      
    // Show user message while browser is launching  
    Column {  
        Row(  
            modifier = Modifier.fillMaxWidth(),  
            horizontalArrangement = Arrangement.Center  
        ) {  
            Text(  
                text = "Launching browser, continue there",  
                textAlign = TextAlign.Center,  
                modifier = Modifier.padding(8.dp),  
                style = MaterialTheme.typography.bodyLarge  
            )  
        }  
    }  
}
```

\*\*What it do \*\*:

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

**App Info → Open by default → Add Link → select “apps.multipaz.org Opens in Multipaz Test App.”**

![][image4]

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

### **6 Set up your Own Credential Server(Optional)**

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
