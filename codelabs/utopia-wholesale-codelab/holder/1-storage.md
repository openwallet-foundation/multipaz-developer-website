---
title: Storage
sidebar_position: 1
---

# Storage


### **Store document**

In this section (Storage folder), you'll set up the components needed to manage secure credentials using the multipaz SDK. The classes that handle the storage part of the identity include: 

* `Storage`: Local data storage that will hold the data items. Implementations for both Android and iOS are provided by Multipaz.

* `SecureArea`: An abstraction for cryptographic key handling. On Android, this uses the Keystore; on iOS, it uses the Secure Enclave.

* `SecureAreaRepository`: A registry of available `SecureArea` implementations, it controls "SecureArea" implementation 

* `DocumentStore`: A class for storing real-world identity documents.

* `DocumentTypeRepository`: A registry of supported document types (e.g., DrivingLicense, Loyalty) that your wallet can handle.

We'll guide you through configuring these components in your Koin dependency injection module. These components are defined in `MultipazModule.kt` and can be injected wherever needed in your app.

### **Step 1: Configure `Storage` in Koin**

In your Koin module (`MultipazModule.kt`), define the `Storage` instance. This ensures that the data is not backed up (we do not want our database to be backed-up as it is useless without private keys in the secure area, which are not and cannot be backed-up). This function ensures the database file is excluded from Android's backup system:

```kotlin
//TODO: define Storage in Koin module
single<Storage> { 
    Platform.nonBackedUpStorage 
}
```

### **Step 2: Configure `SecureArea` in Koin**

Define a `SecureArea` suitable for the platform to represent cryptographic key containers. For example, they can leverage the Android Keystore or use `SecureEnclaveSecureArea` in iOS. The `Platform.getSecureArea()` function returns platform-specific secure area implementations that use hardware-backed key storage: on Android it is the Android Keystore system, on iOS it is `SecureEnclaveSecureArea`.

```kotlin
//TODO: define SecureArea in Koin module
single<SecureArea> { 
    runBlocking { 
        Platform.getSecureArea() 
    } 
}
```

### **Step 3: Configure `SecureAreaRepository` in Koin**

Create a `SecureAreaRepository` that manages secure area implementations. This depends on the `SecureArea` defined in the previous step:

```kotlin
//TODO: define SecureAreaRepository in Koin module
single<SecureAreaRepository> {
    val secureArea: SecureArea = get()
    SecureAreaRepository
        .Builder()
        .add(secureArea)
        .build()
}
```

### **Step 4: Configure `DocumentStore` in Koin**

`DocumentStore` is the main API used to create, list, and manage verifiable documents. It connects your `Storage` and `SecureAreaRepository`. Both dependencies are automatically injected via Koin's `get()` function:

```kotlin
//TODO: define DocumentStore in Koin module
single<DocumentStore> {
    buildDocumentStore(
        storage = get(),
        secureAreaRepository = get(),
    ) {}
}
```

### **Step 5: Configure `DocumentTypeRepository` in Koin**

The `DocumentTypeRepository` registers supported document types that your wallet can handle. For this codelab, we'll register the `DrivingLicense` document type:

```kotlin
//TODO: define DocumentTypeRepository in Koin module
single<DocumentTypeRepository> {
    DocumentTypeRepository().apply {
        addDocumentType(DrivingLicense.getDocumentType())
    }
}
```

**Key points:**

* `DocumentTypeRepository` is configured as a singleton in the Koin module.
* Document types are registered using `addDocumentType()` for each supported credential type.
* The repository is used by `DocumentStore` and `PresentmentSource` to identify and handle different credential types.

### **Using the Components**

Once configured in your Koin module, you can inject these components anywhere in your app using Koin's dependency injection:

**In a ViewModel:**

You can create a ViewModel module and add the dependency in the constructor:

```kotlin
// Example: Injecting DocumentStore in a ViewModel
class MyViewModel(
    private val documentStore: DocumentStore
) : ViewModel() {
    // Use documentStore to interact with stored documents
}

// In your Koin module, define the ViewModel
val viewModelModule = module {
    viewModel { MyViewModel(documentStore = get()) }
}
```

**In a Composable function:**

Using `koin-compose`, you can inject dependencies directly in the Composable function:

```kotlin
@Composable
fun HomeScreen(
    documentStore: DocumentStore = koinInject(),
) {
    // Use documentStore here
}
```

Once initialized through Koin, you can start interacting with the store to create, delete, or retrieve documents.


