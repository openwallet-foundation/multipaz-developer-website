---
title: Storage
sidebar_position: 1
---

# Storage


### **Store document**

In this section (Storage folder), you’ll set up the components needed to manage secure credentials using the multipaz SDK. The classes that handles the storage part of the identity includes: 

* `Storage`: Local data storage that will hold the data items. Implementations for both Android and iOS are provided by Multipaz.

* `SecureArea`: An abstraction for cryptographic key handling. On Android, this uses the Keystore; on iOS, it uses the Secure Enclave.

* `SecureAreaRepository`: A registry of available `SecureArea` implementations, it controls for “SecureArea” implementation 

* `DocumentStore`: ​​Class for storing real-world identity documents.

We’ll guide you through integrating and initializing these components in your KMP app.


### **Step 1: Initialize `Storage`**

In your UI code in App.kt, call the following to obtain a Storage instance suitable for the platform, ensuring that the data is not backed up (We do not want our database to be backed-up as it is useless without private keys,in the secure area (which are not, and cannot be backed-up),this function ensures the database file is excluded from Android's backup system:

```kotlin
//TODO: initialize storage
storage = Platform.nonBackedUpStorage

```



### **Step 2: Create a `SecureArea`**

This code is in App.kt. SecureArea suitable for the platform to represent cryptographic key containers. For example, they can leverage the Android Keystore or use SecureEnclaveSecureArea in iOS.

```kotlin
//TODO: initialize secureArea
secureArea = Platform.getSecureArea()
        
```
The Platform.getSecureArea() function returns platform-specific secure area implementations that use hardware-backed key storage:in android it is Android Keystore system, in iOS,it is SecureEnclaveSecureArea



### **Step 3: Register it in a `SecureAreaRepository`**

Create a secureAreaRepository that manages secure area implementations.This code is located in App.kt:

```kotlin
 //TODO: initialize secureAreaRepository
 secureAreaRepository = SecureAreaRepository.Builder().add(secureArea).build()

```


### **Step 4: Initialize the `DocumentStore`**

In App.kt, DocumentStore is the main API used to create, list, and manage verifiable documents. It connects your Storage and SecureAreaRepository.

```kotlin
//TODO: initialize documentStore
documentStore = buildDocumentStore(
    storage = storage,
    secureAreaRepository = secureAreaRepository
    ) {}
```

Once initialized, you can start interacting with the store to create, delete, or retrieve documents.


