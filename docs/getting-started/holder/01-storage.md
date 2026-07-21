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

This setup should be done once, early in your app's lifecycle. In the modularized sample, this is handled inside `AppContainerImpl` in the `core` module:

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainer.kt
interface AppContainer {
    val storage: Storage
    val storageTable: StorageTable
    val secureArea: SecureArea
    val secureAreaRepository: SecureAreaRepository

    // ... rest of the implementations
}
```

Refer to **[this AppContainer code](https://github.com/openwallet-foundation/multipaz-samples/blob/36906be0fd4c686460a1cb5bfd3cc27868ba12b0/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainer.kt#L16-L19)** for the complete example.

* Now, override them in the implementation class

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainerImpl.kt
class AppContainerImpl : AppContainer {

    override lateinit var storage: Storage
    override lateinit var storageTable: StorageTable
    override lateinit var secureArea: SecureArea
    override lateinit var secureAreaRepository: SecureAreaRepository

    // ...

    override suspend fun init() {
        if (isInitialized) return

        // Storage
        storage = org.multipaz.util.Platform.nonBackedUpStorage
        storageTable = storage.getTable(CredentialDomains.storageTableSpec)
        secureArea = org.multipaz.util.Platform.getSecureArea()
        secureAreaRepository = SecureAreaRepository.Builder().add(secureArea).build()

        // ...
        isInitialized = true
    }
}
```

Before proceeding, create the `CredentialDomains` object in the `core` module. This file holds all shared constants used throughout the app — we define it once here so it's available for all later sections:

```kotlin
// core/src/commonMain/kotlin/.../core/CredentialDomains.kt
package org.multipaz.getstarted.core

import org.multipaz.storage.StorageTableSpec

object CredentialDomains {
    const val MDOC_USER_AUTH = "mdoc_user_auth"
    const val MDOC_SOFTWARE = "mdoc_software"

    const val MDOC_MAC_USER_AUTH = "mdoc_mac_user_auth"

    const val SDJWT_USER_AUTH = "sdjwt_user_auth"
    const val SDJWT_SOFTWARE = "sdjwt_software"
    const val SDJWT_KEYLESS = "sdjwt_keyless"

    const val STORAGE_TABLE_NAME = "TestAppKeys"
    val storageTableSpec = StorageTableSpec(
        name = STORAGE_TABLE_NAME,
        supportPartitions = false,
        supportExpiration = false
    )

    const val SAMPLE_DOCUMENT_DISPLAY_NAME = "Erika's Driving License"
    const val SAMPLE_DOCUMENT_TYPE_DISPLAY_NAME = "Utopia Driving License"
}
```

Refer to **[this storage code](https://github.com/openwallet-foundation/multipaz-samples/blob/36906be0fd4c686460a1cb5bfd3cc27868ba12b0/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt#L63-L67)** for the complete example.
