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
    lateinit var secureArea: SecureArea
    lateinit var secureAreaRepository: SecureAreaRepository

    // ...

    suspend fun init() {
        // ...

        storage = org.multipaz.util.Platform.nonBackedUpStorage
        secureArea = org.multipaz.util.Platform.getSecureArea()
        secureAreaRepository = SecureAreaRepository.Builder()
            .add(secureArea)
            .build()
    }
}
```

<!-- TODO: update link -->
Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/blob/7500a92ead53cdeca3c6131000c3f7ec07284349/composeApp/src/commonMain/kotlin/org/multipaz/get_started/App.kt#L91-L94) code for the implementation of the Storage section of this guide.
