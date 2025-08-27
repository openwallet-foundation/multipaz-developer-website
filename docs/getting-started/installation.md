---
title: Installation
sidebar_position: 1
---


## Prerequisites

The steps below assume you’ve already set up a **Kotlin Multiplatform (KMP)** project. Multipaz supports both Android and iOS targets, and these instructions focus on configuring KMP to share business logic across platforms.

> 💡 You can quickly create a KMP project using the official [JetBrains wizard](https://kmp.jetbrains.com/?android=true&ios=true&iosui=compose&includeTests=true)

## Installation of Dependencies[​](https://openmobilehub.github.io/developer-multipaz-website/overview/getting-started/#installation-of-dependencies)

To get started with Multipaz, you need to add the necessary dependencies to your project. This guide assumes you are using Gradle as your build system.

* Add the google repository to `settings.gradle.kts` file

```kotlin
pluginManagement {
   repositories {
       // ... other repositories
       google()
   }
}

dependencyResolutionManagement {
   repositories {
       // ... other repositories
       google()
   }
}
```

* Add the following dependencies to `libs.versions.toml`

```yml
[versions]
# update this line
android-minSdk = "26" # Multipaz requires minSdk >= 26 due to usage of Android 8.0+ APIs

multipaz = "0.93.0" # latest version of Multipaz to use

androidx-fragment = "1.8.6"

[libraries]
multipaz = { group = "org.multipaz", name = "multipaz", version.ref = "multipaz" }
multipaz-models = { group = "org.multipaz", name = "multipaz-models", version.ref = "multipaz" }
multipaz-compose = { group = "org.multipaz", name = "multipaz-compose", version.ref = "multipaz" }
multipaz-doctypes = { group = "org.multipaz", name = "multipaz-doctypes", version.ref = "multipaz" }

androidx-fragment = { group = "androidx.fragment", name = "fragment", version.ref = "androidx-fragment" }
```

* Add the following to your module level `build.gradle.kts` file (usually `app/build.gradle.kts`):

```kotlin
kotlin {
   sourceSets {
       androidMain.dependencies {
           // ... other dependencies
           implementation(libs.androidx.fragment)
       }
       commonMain.dependencies {
           // ... other dependencies
           implementation(libs.multipaz)
           implementation(libs.multipaz.models)
           implementation(libs.multipaz.compose)
           implementation(libs.multipaz.doctypes)
       }
   }
}
```

You might also want to check out other libraries in the Multipaz ecosystem, from Multipaz [here](https://mvnrepository.com/search?q=multipaz).

* Inside the `onCreate()` method, call the `initializeApplication(applicationContext)` function provided by the Multipaz library. This ensures the SDK has access to a valid application-level context, which is required for internal operations like secure storage and credential handling. Make sure this is done only once in the app lifecycle, ideally during app startup.

```kotlin
initializeApplication(this.applicationContext)
```

Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/commit/f467118149b55080edd2e4f8606a7cd7ad82c2cb) commit for a sample project initialization setup.

### UI Prompt Handling with `PromptModel`

To support secure prompts such as **biometric authentication**, **passphrases**, and **NFC dialogs** in a consistent and platform-specific way, we now pass a `PromptModel` into the `App()` function.

```kotlin
// commonMain/App.kt
fun App(promptModel: PromptModel) {
	MaterialTheme {
		// This ensures all prompts inherit the app's main style
		PromptDialogs(promptModel)
		// ... rest of your UI
	}
}
```

#### Platform Integration

Now, each platform must create and pass its own `PromptModel` implementation into` App()`:

> 📌 This change ensures that all prompt-related UI elements:
> - Are styled consistently with the app (through MaterialTheme)
> - Are driven by a shared abstraction (PromptModel), while still using platform-specific logic behind the scenes

```kotlin
// kotlin/MainActivity.kt
// IMPORTANT: Multipaz's PromptDialogs require the activity to be a FragmentActivity
// to support the BiometricPrompt and other platform features.
class MainActivity : FragmentActivity() { // use FragmentActivity
    val promptModel = AndroidPromptModel()
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        initializeApplication(this.applicationContext)
        setContent {
            App(promptModel)
        }
    }
}
```

```kotlin
// iosMain/MainViewController.kt
fun MainViewController() = ComposeUIViewController {
    App(IosPromptModel())
}
```

#### ⚠️ Some gotchas to be aware of:

For iOS, there are these required fixes:

1. Update `info.plist`

In `iosApp/iosApp/info.plist`, add the following keys to enable BLE permission prompts. Without this, the "Request BLE Permissions" feature will not work:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth permission is required for proximity presentations</string>
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

2. In `iosApp/iosApp/iosApp.xcodeproj/project.pbxproj`

Add the following flags to the `buildSettings` of each `XCBuildConfiguration` under the `iosApp` target in your `project.pbxproj` file:

```C
OTHER_LDFLAGS = (
   "$(inherited)",
   "-lsqlite3",
);
```
Refer to [this](https://github.com/openmobilehub/multipaz-getting-started-sample/commit/6fd2be0b1e039903c837f3d8894aca54bc7d6adf) commit for the changes to be done for the iOS builds.

