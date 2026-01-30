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

Refer to **[this settings.gradle.kts code](https://github.com/openwallet-foundation/multipaz-samples/blob/f9df00536049832fb5db632e49978ae149957274/MultipazGettingStartedSample/settings.gradle.kts#L4-L33)** for the complete example.

* Add the following dependencies to `libs.versions.toml`

```yml
[versions]
# update this line
android-minSdk = "26" # Multipaz requires minSdk >= 26 due to usage of Android 8.0+ APIs

multipaz = "0.96.0" # latest version of Multipaz to use

coil = "3.3.0"
androidx-fragment = "1.8.6"

[libraries]
multipaz = { group = "org.multipaz", name = "multipaz", version.ref = "multipaz" }
multipaz-compose = { group = "org.multipaz", name = "multipaz-compose", version.ref = "multipaz" }
multipaz-doctypes = { group = "org.multipaz", name = "multipaz-doctypes", version.ref = "multipaz" }
multipaz-dcapi = { group = "org.multipaz", name = "multipaz-dcapi", version.ref = "multipaz" }

coil-compose = { module = "io.coil-kt.coil3:coil-compose", version.ref = "coil" }
androidx-fragment = { group = "androidx.fragment", name = "fragment", version.ref = "androidx-fragment" }

[plugins]
# required for navigation
kotlinSerialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
```

Refer to **[this libs.versions.toml code](https://github.com/openwallet-foundation/multipaz-samples/blob/f9df00536049832fb5db632e49978ae149957274/MultipazGettingStartedSample/gradle/libs.versions.toml#L41-L48)** for the complete example.

* Add the following to your module level `build.gradle.kts` file (usually `composeApp/build.gradle.kts`):

```kotlin
plugins {
    // ...
    alias(libs.plugins.kotlinSerialization)
}

kotlin {
   sourceSets {
       androidMain.dependencies {
           // ... other dependencies
           implementation(libs.androidx.fragment)
       }
       commonMain.dependencies {
           // ... other dependencies
           implementation(libs.multipaz)
           implementation(libs.multipaz.compose)
           implementation(libs.multipaz.doctypes)
           implementation(libs.multipaz.dcapi)
           
           implementation(libs.coil.compose)
       }
   }
}
```
Refer to **[this build.gradle.kts code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/build.gradle.kts#L36-L64)** for the complete example.

You might also want to check out other libraries in the Multipaz ecosystem, from Multipaz [here](https://mvnrepository.com/search?q=multipaz).

### Initialize `App.kt`

App Class is the main class that holds all the core logic and state for the app.

We are splitting `App.kt` into multiple sections for ease of use wit multiple Multipaz components.

- **Properties**: Variables for storage, document management, trust management, and presentment.
- **Initialization**: Sets up storage, document types, creates a sample document, configures trusted certificates, and initializes different model classes.
    - `suspend fun init()`
- **UI**: A Composable function that builds the app’s user interface using Jepack Compose components. It shows initialization status, and hosts a the `NavHost` for composables for different screens.
    - `@Composable fun Content()`
- **Companion Object**: Provides a singleton instance of App and holds shared models.
    - `fun getInstance(): App`

* To support secure prompts such as **biometric authentication**, **passphrases**, and **NFC dialogs** in a consistent and platform-specific way, we now initialize `PromptDialogs` by passing a `PromptModel`.
* Multipaz provides a pre-initialized `promptModel` object that can be imported from `org.multipaz.util.Platform.promptModel`.

```kotlin
// commonMain/App.kt
class App {

    val appName = "Multipaz Getting Started Sample"
    val appIcon = Res.drawable.compose_multiplatform

    var isAppInitialized = false

    suspend fun init() {
        if (!isAppInitialized) {
            isAppInitialized = true
        }
    }

    @Composable
    @Preview
    fun Content() {

        val navController = rememberNavController()
        val isUIInitialized = remember { mutableStateOf(false) }

        if (!isUIInitialized.value) {
            CoroutineScope(Dispatchers.Main).launch {
                init()
                isUIInitialized.value = true
            }

            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "Initializing...")
            }
            return
        }

        MaterialTheme {
            // This ensures all prompts inherit the app's main style
            PromptDialogs(promptModel)

            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                NavHost(
                    navController = navController,
                    startDestination = Destination.HomeDestination,
                    modifier = Modifier.fillMaxSize().navigationBarsPadding(),
                ) {
                    composable<Destination.HomeDestination> {
                        HomeScreen(
                            app = this@App,
                            navController = navController,
                        )
                    }
                }

            }
        }
    }

    companion object {
        val promptModel = org.multipaz.util.Platform.promptModel

        private var app: App? = null
        fun getInstance(): App {
            if (app == null) {
                app = App()
            }
            return app!!
        }
    }
}
```

**Note:** You would want to copy-paste [**the Navigation.kt** file](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/Navigation.kt) for the definition of the navigation targets.

Refer to **[this App.kt code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt)** for the complete example.

#### Define `HomeScreen.kt` Composable

`HomeScreen` is a composable function that handles the UI according to the app state - viz. handle permissions, displays buttons or QR codes, or show the issuance and presentation UI. You can use the following code in `HomeScreen.kt`. It currently only uses a placeholder `Text` composable.

```kotlin
@Composable
fun HomeScreen(
    app: App,
    navController: NavController,
    identityIssuer: String = "Multipaz Getting Started Sample"
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .scrollable(
                scrollState,
                Orientation.Vertical
            ),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Welcome to Multipaz Getting Started Sample")
        // ... rest of your UI
    }
}
```

### Update `MainActivity.kt`

Update `MainActivity` to reflect the changes from `App.kt`, along with the following additions for the Multipaz library.

* Inside the `onCreate()` method in `kotlin/MainActivity` class, call the `initializeApplication(applicationContext)` function provided by the Multipaz library.
    * This ensures the SDK has access to a valid application-level context, which is required for internal operations like secure storage and credential handling. Make sure this is done only once in the app lifecycle, ideally during app startup.
* Modify update `MainActivity` to extend `FragmentActivity`.
    * Multipaz's `PromptDialogs` require the activity to be a `FragmentActivity` to support the `BiometricPrompt` and other platform features.

```kotlin
// kotlin/MainActivity.kt
// IMPORTANT: Multipaz's PromptDialogs require the activity to be a FragmentActivity
// to support the BiometricPrompt and other platform features.
class MainActivity : FragmentActivity() { // use FragmentActivity
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        initializeApplication(this.applicationContext) // initialize Multipaz

        lifecycle.coroutineScope.launch {
            val app = App.getInstance()
            app.init()
            setContent {
                app.Content()
            }
        }
    }
}
```

Refer to **[this MainActivity.kt code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/MainActivity.kt)** for the complete example.

### Update `iOSMain/MainViewController.kt`

Update `MainViewController` to reflect the changes from `App.kt`.

```kotlin
private val app = App.getInstance()

fun MainViewController() = ComposeUIViewController {
    app.Content()
}
```

Refer to **[this MainViewController.kt code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/composeApp/src/iosMain/kotlin/org/multipaz/getstarted/MainViewController.kt)** for the complete example.

#### ⚠️ Some gotchas to be aware of (iOS only):

For iOS, there are these required fixes:

1. In `iosApp/iosApp.xcodeproj/project.pbxproj`

Add the following flags to the `buildSettings` of **each** `XCBuildConfiguration` under the `iosApp` target in your `project.pbxproj` file:

```C
OTHER_LDFLAGS = (
   "$(inherited)",
   "-lsqlite3",
);
```

Refer to **[this project.pbxproj code](https://github.com/openwallet-foundation/multipaz-samples/blob/5143fd7e31e7c61bebffd38b6e496c0cde855d1f/MultipazGettingStartedSample/iosApp/iosApp.xcodeproj/project.pbxproj)** for the complete example.