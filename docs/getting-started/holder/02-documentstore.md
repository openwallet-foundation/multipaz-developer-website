---
title: 📄 DocumentStore
sidebar_position: 2
---

Before you can create or manage real-world identity documents, you need to set up repositories and storage for document types and documents. This should be done after initializing your secure storage components.

### DocumentTypeRepository

A `DocumentTypeRepository` manages the metadata for different document types your app understands and uses.

* **Standard Document Types:** Multipaz provides a set of standard document types through the `multipaz-knowntypes` package, such as:
    * `DrivingLicense`
    * `EUCertificateOfResidence`
    * `PhotoID`
    * `VaccinationDocument`
    * `VehicleRegistration`
* **Custom Document Types:** You can define your own document types using the `DocumentType.Builder` factory method.

### DocumentStore

A `DocumentStore` is responsible for securely holding and managing real-world identity documents, such as Mobile Driving Licenses (mDL), in accordance with the ISO/IEC 18013-5:2021 specification.

* **Initialization:** Create a `DocumentStore` instance using either the `buildDocumentStore` function or the `DocumentStore.Builder` class.
* **Dependencies:** Pass the previously-initialized `storage` and `secureAreaRepository` to the `DocumentStore`.

### Implementation

In the modularized sample, this is handled inside `AppContainerImpl` in the `core` module:

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainer.kt
interface AppContainer {
    
    val documentTypeRepository: DocumentTypeRepository
    val documentStore: DocumentStore

    // ... rest of the implementations
}
```

Refer to **[this AppContainer code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainer.kt#L22-L23)** for the complete example.

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainerImpl.kt
class AppContainerImpl : AppContainer {
    // ...
    
    override lateinit var documentTypeRepository: DocumentTypeRepository
    override lateinit var documentStore: DocumentStore

    override suspend fun init() {
        if (isInitialized) return

        // ... storage initialization

        // DocumentStore
        documentTypeRepository = DocumentTypeRepository().apply {
            addDocumentType(DrivingLicense.getDocumentType())
        }
        documentStore = buildDocumentStore(
            storage = storage,
            secureAreaRepository = secureAreaRepository
        ) {}

        // ...
        isInitialized = true
    }
}
```

By clearly structuring the setup of `DocumentTypeRepository` and `DocumentStore`, you ensure your app is ready to manage identity documents securely and efficiently. Always perform this setup early in your app lifecycle, after initializing storage and secure areas.

Refer to **[this DocumentStore code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L73-L80)** for the complete example.
