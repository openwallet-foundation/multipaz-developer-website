---
title: Storage
sidebar_position: 1
---

# Storage

### **Store document**

In this section (Storage folder), you’ll set up the components needed to manage secure credentials using the Multipaz SDK. The classes that handles the storage part of the identity includes: 

* `Storage`: Local data storage wrapper that will hold the data items. Implementations for both Android and iOS are provided by Multipaz.
* `SecureArea`: An abstraction for cryptographic key handling. On Android, this uses the Keystore; on iOS, it uses the Secure Enclave.
* `SecureAreaRepository`: A registry of available `SecureArea` implementations, it controls for “SecureArea” implementations.
* `DocumentStore`: ​​Class for storing real-world identity documents.

We’ll guide you through integrating and initializing these components in your KMP app.

### **Step 1: Initialize `Storage`**

In your UI code in App.kt, call the following to obtain a Storage instance suitable for the platform, ensuring that the data is not backed up (we do not want our database to be backed-up as it is useless without private keys in the secure area -- which are not, and cannot be backed-up), this function ensures the database file is excluded from Android's backup system:

```kotlin
// TODO: initialize storage
storage = Platform.nonBackedUpStorage()
```

### **Step 2: Create a `SecureArea`**

This code is in App.kt. `SecureArea` suitable for the platform to represent cryptographic key containers. For example, they can leverage the Android Keystore or use SecureEnclaveSecureArea in iOS.

```kotlin
// TODO: create secure area
secureArea = Platform.getSecureArea()
        
```

The `Platform.getSecureArea()` function returns platform-specific secure area implementations that use hardware-backed key storage: in android it is Android Keystore system, in iOS, it uses SecureEnclaveSecureArea.

### **Step 3: Register it in a `SecureAreaRepository`**

Create a secureAreaRepository that manages secure area implementations.This code is located in App.kt:

```kotlin
// TODO: initialize secure area repository
secureAreaRepository = SecureAreaRepository.Builder()
    .add(secureArea)
    .build()
```

### **Step 4: Initialize the `DocumentStore`**

In App.kt, DocumentStore is the main API used to create, list, and manage verifiable documents. It connects your Storage and SecureAreaRepository.

```kotlin
// TODO: initialize the document store
documentStore = buildDocumentStore(
    storage = storage,
    secureAreaRepository = secureAreaRepository
    ) {}
```

Once initialized, you can start interacting with the document store to create, delete, or retrieve documents.

### **Step 5: Create a simple Document**

In App.kt, you can create a simple `Document` like this:

```kotlin
// TODO: create a simple document
val profile = ByteString(
    getDrawableResourceBytes(
        getSystemResourceEnvironment(),
        Res.drawable.profile
    )
)
document = documentStore.createDocument(  
   displayName ="Tom Lee's Utopia Membership",
   typeDisplayName = "Membership Card",
   cardArt = profile,
   other = UtopiaMemberInfo().toJsonString().encodeToByteString(),
)
```

`Res.drawable.profile`: here, we used the `profile.png` file `/src/commonMain/composeResources/drawable` directory. We have included this already to reduce the complexity of this guide.

### **Step 6: List and Fetch Documents**

You can use the following to list documents from the document store.

```kotlin
// TODO: fetch and list documents
val documents = mutableListOf<Document>()
documentStore.listDocuments().forEach { documentID ->
    val doc = documentStore.lookupDocument(documentID)
    if (doc != null)
        documents.add(doc)
}
```