---
title: Storage
sidebar_position: 3
---

# Storage


### **Add the ability to store document**

In this section (Storage folder), you’ll set up the components needed to manage secure credentials using the multipaz SDK. The classes that handles the storage part of the identity includes: 

* `Storage`: Local data storage that will hold the data items. Implementations for both Android and iOS are provided by Multipaz.

* `SecureArea`: An abstraction for cryptographic key handling. On Android, this uses the Keystore; on iOS, it uses the Secure Enclave.

* `SecureAreaRepository`: A registry of available `SecureArea` implementations, it controls for “SecureArea” implementation 

* `DocumentStore`: ​​Class for storing real-world identity documents.

We’ll guide you through integrating and initializing these components in your KMP app.

---

### **Step 1: Initialize `Storage`**

In your UI code in App.kt, call the following to obtain a Storage instance suitable for the platform, ensuring that the data is not backed up(We do not want our database to be backed-up as it is useless without private keys,in the secure area (which are not, and cannot be backed-up),this function ensures the database file is excluded from Android's backup system:

```kotlin
//TODO : storage = Platform.nonBackedUpStorage
storage = Platform.nonBackedUpStorage()
```

---

### **Step 3: Create a `SecureArea`**

This code is in App.kt. SecureArea suitable for the platform to represent cryptographic key containers. For example, they can leverage the Android Keystore or use SecureEnclaveSecureArea in iOS.

```kotlin
//TODO: secureArea = Platform.getSecureArea()
secureArea = Platform.getSecureArea()
```
The Platform.getSecureArea() function returns platform-specific secure area implementations that use hardware-backed key storage:in android it is Android Keystore system, in iOS,it is SecureEnclaveSecureArea

---

### **Step 4: Register it in a `SecureAreaRepository`**

Create a secureAreaRepository that manages secure area implementations.This code is located in App.kt:

```kotlin

//TODO: secureAreaRepository = SecureAreaRepository.Builder().add(secureArea).build()

secureAreaRepository = SecureAreaRepository.Builder()
    .add(secureArea)
    .build()

```
---

### **Step 5: Initialize the `DocumentStore`**

In App.kt, DocumentStore is the main API used to create, list, and manage verifiable documents. It connects your Storage and SecureAreaRepository.

```kotlin

*//TODO: documentStore = buildDocumentStore(storage = storage, secureAreaRepository = secureAreaRepository) {}*

documentStore = buildDocumentStore(
    storage = storage, 
    secureAreaRepository = secureAreaRepository
) {}
```

Once initialized, you can start interacting with the store to create, delete, or retrieve documents.

---

### **Step 6: Create a new Document**

In App.kt,  You can create a simple `Document`  like this:
```kotlin

val profile = ByteString(

    getDrawableResourceBytes(

        getSystemResourceEnvironment(),

        Res.drawable.profile

    )

)

//TODO: document = documentStore.createDocument(*  
//                    displayName ="Tom Lee's Utopia Membership",
//                    typeDisplayName = "Membership Card",
//                    cardArt = profile,
//                    other = UtopiaMemberInfo().toJsonString().encodeToByteString(),
//                )

 document = documentStore.createDocument(  
   displayName ="Tom Lee's Utopia Membership",
   typeDisplayName = "Membership Card",
   cardArt = profile,
   other = UtopiaMemberInfo().toJsonString().encodeToByteString(),
)
```
“Res.drawable.proifle”: here add a profile.png in “/src/commonMain/composeResources/drawable” folder


---

### **Step 7: Fetch and Display Documents**

In App.kt, get documents IDs in the `DocumentStore`:

```kotlin
val listIDs = documentStore.listDocuments().
```
---

### **Create Credential** 

A document is a container that holds multiple credentials and represents an identity document (like a driver's license or passport). Credential is the actual cryptographic proof within a document that can be presented to verifiers.

We will discuss how to create a credential and bind it to the document created above.

In App.kt

### **Step 1: Establish validity times**
```kotlin
val now = Clock.System.now()

val signedAt = now

val validFrom = now

val validUntil = now + 365.days
```

now is captured from the system clock. The credential is considered signed at signedAt, becomes valid at validFrom, and remains valid for 365 days (validUntil).

### **Step 2: Generate the IACA certificate**

“generateIacaCertificate” creates a self‑signed Issuing Authority Certificate Authority (IACA) certificate.   
```kotlin
val iacaKey = Crypto.createEcPrivateKey(EcCurve.P256)
val iacaCert = MdocUtil.generateIacaCertificate(
    iacaKey = iacaKey,
    subject = X500Name.fromName(name = "CN=Test IACA Key"),
    serial = ASN1Integer.fromRandom(numBits = 128),
    validFrom = validFrom,
    validUntil = validUntil,  
    issuerAltNameUrl = "https://issuer.example.com",
    crlUrl = "https://issuer.example.com/crl"
)
```
### **Step 3: Generate the DS certificate**

“generateDsCertificate” issues a Document Signing (DS) certificate from the IACA key. Its parameters are:  
```kotlin
val dsKey = Crypto.createEcPrivateKey(EcCurve.P256)
val dsCert = MdocUtil.generateDsCertificate(
    iacaCert = iacaCert,
    iacaKey = iacaKey, 
    dsKey = dsKey.publicKey,
    subject = X500Name.fromName(name = "CN=Test DS Key"),
    serial = ASN1Integer.fromRandom(numBits = 128),
    validFrom = validFrom,
    validUntil = validUntil
)
```

### **Step 4: Create the credential with sample data**

“createMdocCredentialWithSampleData” adds an MdocCredential to the document using the specified secureArea.  
```kotlin
val mdocCredential =  
    DrivingLicense.getDocumentType().createMdocCredentialWithSampleData(  
        document = document,  
        secureArea = secureArea,  
        createKeySettings = CreateKeySettings(  
            algorithm = Algorithm.ESP256,  
            nonce = "Challenge".encodeToByteString(),  
            userAuthenticationRequired = true  
        ),  
        dsKey = dsKey,  
        dsCertChain = X509CertChain(listOf(dsCert)),  
        signedAt = signedAt,  
        validFrom = validFrom,  
        validUntil = validUntil,  
    )
```

### **Step 5: Start exporting credential**

Now the credentials exist in your documents, however, they won't be accessible through  Android/ios credential manager system. In order to be accessed by the credential manager system, you need to export the credentials

```kotlin
if (DigitalCredentials.Default.available) {  
//TODO:  DigitalCredentials.Default.startExportingCredentials(
//                    documentStore = documentStore,
//                    documentTypeRepository = documentTypeRepository*  
//                )

   DigitalCredentials.Default.startExportingCredentials(  
       documentStore = documentStore,  
       documentTypeRepository = documentTypeRepository  
   )  
}

```