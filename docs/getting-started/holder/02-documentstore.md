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

```kotlin
class App {
    // ...
    
    lateinit var documentTypeRepository: DocumentTypeRepository
    lateinit var documentStore: DocumentStore

    suspend fun init() {
        // ...
        documentTypeRepository = DocumentTypeRepository().apply {
        addDocumentType(DrivingLicense.getDocumentType())
        }
        documentStore = buildDocumentStore(
            storage = storage,
            secureAreaRepository = secureAreaRepository
        ) {}
    }
}
```

By clearly structuring the setup of `DocumentTypeRepository` and `DocumentStore`, you ensure your app is ready to manage identity documents securely and efficiently. Always perform this setup early in your app lifecycle, after initializing storage and secure areas.

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L96-L103) part for the implementation of the DocumentStore section of this guide.
