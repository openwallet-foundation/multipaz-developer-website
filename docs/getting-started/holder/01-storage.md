---
title: 🔐 Storage
sidebar_position: 1
---


Before working with identity documents in Multipaz, you need to initialize secure storage and cryptographic infrastructure. This setup should happen early in your app lifecycle.

### Storage

`Storage` is responsible for securely holding data items on the device.

Multipaz provides platform-specific implementations through the `Platform.nonBackedUpStorage` object:

* **Android**: uses local encrypted storage.
* **iOS**: wraps native secure storage.

### StorageTable

`StorageTable` is a storage unit that holds a collection of data items. Each item in a `StorageTable` is a `ByteString` indexed by a unique key. `StorageTable` supports partitioning and expiration for data items.

### SecureArea

A `SecureArea` represents a secure environment for creating and managing key material and other sensitive objects (e.g., for signing identity credentials).

Multipaz offers multiple `SecureArea` implementations:

* **AndroidKeystoreSecureArea:** Uses the [Android Keystore](https://developer.android.com/privacy-and-security/keystore).
* **SecureEnclaveSecureArea:** Uses the [Apple Secure Enclave](https://support.apple.com/en-in/guide/security/sec59b0b31ff/web) for iOS devices.
* **CloudSecureArea:** Delegates key management to a secure remote server.
* **SoftwareSecureArea:** Pure software-based secure area. Instantiate using `SoftwareSecureArea.create()`

### SecureAreaRepository

A `SecureAreaRepository` manages a collection of `SecureArea` instances. This allows you to define which `SecureArea` to use for different keys or operations.

It provides fine-grained control and extensibility when your app needs to support multiple secure environments.

### Initialization

You must initialize `Storage`, `SecureArea`, and `SecureAreaRepository` before using the `DocumentStore` or working with identity documents.

This setup should be done once, early in your app's lifecycle (e.g., inside `App()`):

```kotlin
class App {
    lateinit var storage: Storage
    lateinit var storageTable: StorageTable
    lateinit var secureArea: SecureArea
    lateinit var secureAreaRepository: SecureAreaRepository

    // ...

    suspend fun init() {
        if (!isAppInitialized) {
            // ...

            storage = org.multipaz.util.Platform.nonBackedUpStorage
            storageTable = storage.getTable(
                StorageTableSpec(
                    name = STORAGE_TABLE_NAME,
                    supportPartitions = false,  // Simple key-value storage
                    supportExpiration = false    // Keys don't auto-expire
                )
            )
            secureArea = org.multipaz.util.Platform.getSecureArea()
            secureAreaRepository = SecureAreaRepository.Builder().add(secureArea).build()

            // ...
            isAppInitialized = true
        }
    }

    companion object {
        private const val STORAGE_TABLE_NAME = "TestAppKeys"
    }
}
```

Refer to **[this storage code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt#L120-L130)** for the complete example.
