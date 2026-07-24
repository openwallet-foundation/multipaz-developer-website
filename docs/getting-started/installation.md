---
title: Installation
sidebar_position: 1
---


## Prerequisites

The steps below assume you’ve already set up a **Kotlin Multiplatform (KMP)** project. Multipaz supports both Android and iOS targets, and these instructions focus on configuring KMP to share business logic across platforms.

> 💡 You can quickly create a KMP project using the official [JetBrains wizard](https://kmp.jetbrains.com/?android=true&ios=true&iosui=compose&includeTests=true)

## Project Structure

The Getting Started Sample uses a **modularized architecture** with the following KMP modules. You'll create each module progressively as you follow the guide. Feature modules are added in the sections that need them.

| Module | Purpose | Created in |
|--------|---------|------------|
| `core` | Shared infrastructure: storage, document store, trust management, platform utils (`AppContainer`) | This guide |
| `feature/presentment` | QR code and BLE presentment UI | [Presentation](./holder/presentation) |
| `feature/provisioning` | OpenID4VCI credential provisioning | [Issuer](./issuer) |
| `feature/verification` | W3C Digital Credentials verification (native) | [Native Verification guide](/docs/guides/native-verification) |
| `feature/biometrics` | Face detection and matching | [Face Detection guide](/docs/guides/facenet) |
| `composeApp` | Main app shell, navigation, and composition of feature modules | This guide |

### Create the `:core` module

:::tip Module creation
To create a new module: **File → New → New Module → Kotlin Multiplatform Shared Module**. Name it as shown in the table above and configure the package name (e.g., `org.multipaz.getstarted.core` for `:core`).
:::

Also update the `composeApp/build.gradle.kts` to depend on `:core`:

```kotlin
// composeApp/build.gradle.kts
kotlin {
    sourceSets {
        commonMain.dependencies {
            // ... other dependencies
            implementation(project(":core"))
        }
    }
}
```

Refer to **[this composeApp build.gradle.kts code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/build.gradle.kts#L45)** for the complete example.

## Installation of Dependencies​

To get started with Multipaz, you need to add the necessary dependencies to your project.

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

Refer to **[this settings.gradle.kts code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/settings.gradle.kts#L4-L33)** for the complete example.

* Add the following dependencies to `libs.versions.toml`

```yml
[versions]
# update this line
android-minSdk = "29" # Multipaz requires minSdk >= 29

multipaz = "0.100.0" # latest version of Multipaz to use

coil = "3.3.0"
androidx-fragment = "1.8.6"

[libraries]
multipaz = { group = "org.multipaz", name = "multipaz", version.ref = "multipaz" }
multipaz-compose = { group = "org.multipaz", name = "multipaz-compose", version.ref = "multipaz" }
multipaz-doctypes = { group = "org.multipaz", name = "multipaz-doctypes", version.ref = "multipaz" }

coil-compose = { module = "io.coil-kt.coil3:coil-compose", version.ref = "coil" }
androidx-fragment = { group = "androidx.fragment", name = "fragment", version.ref = "androidx-fragment" }

[plugins]
# required for navigation
kotlinSerialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
```

Refer to **[this libs.versions.toml code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/gradle/libs.versions.toml#L1-L65)** for the complete example.

* Add the following to your module level `build.gradle.kts` files for the `composeApp` module & the `core` module:

```kotlin
// composeApp/build.gradle.kts
// core/build.gradle.kts
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
           
           implementation(libs.coil.compose)
       }
   }
}
```

* Update the project to use Java 17 / JVM 17:

```kotlin
// composeApp/build.gradle.kts
kotlin {
   jvmToolchain(17)

   androidTarget {
      @OptIn(ExperimentalKotlinGradlePluginApi::class)
      compilerOptions {
         jvmTarget.set(JvmTarget.JVM_17)
      }
   }

   android {
      compileOptions {
         sourceCompatibility = JavaVersion.VERSION_17
         targetCompatibility = JavaVersion.VERSION_17
      }
   }
}
```

```kotlin
// core/build.gradle.kts
plugins {
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
}
kotlin {
    jvmToolchain(17)

    androidLibrary {
        androidResources.enable = true // to enable Res

        @OptIn(ExperimentalKotlinGradlePluginApi::class)
        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_17)
        }
    }

    sourceSets {
       commonMain.dependencies {
           implementation(compose.components.resources)
       }
   }
}
```

Refer to **[this build.gradle.kts code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/build.gradle.kts#L13-L105)** for the complete example.

You might also want to check out other libraries in the Multipaz ecosystem, from Multipaz [here](https://mvnrepository.com/search?q=multipaz).

### Initialize `AppContainer`

`AppContainer` is the central interface (defined in the `core` module) that holds all shared infrastructure — storage, document management, trust management, and presentment source.

The `App` class in `composeApp` delegates to `AppContainer` for shared state and manages provisioning and navigation.

* To support secure prompts such as **biometric authentication**, **passphrases**, and **NFC dialogs** in a consistent and platform-specific way, we initialize `PromptDialogs` by passing `AppContainer.promptModel`.
* Multipaz provides a pre-initialized `promptModel` object available via `AppContainer.promptModel`.

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainer.kt
interface AppContainer {

    val isInitialized: Boolean

    suspend fun init()

    companion object {
        val promptModel: PromptModel = org.multipaz.util.Platform.promptModel

        private var instance: AppContainer? = null
        fun getInstance(): AppContainer {
            if (instance == null) {
                instance = AppContainerImpl()
            }
            return instance!!
        }
    }
}
```

Refer to **[this AppContainer code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainer.kt)** for the complete example.

`AppContainerImpl` provides the concrete implementation.

```kotlin
// core/src/commonMain/kotlin/.../core/AppContainerImpl.kt
class AppContainerImpl : AppContainer {

    override var isInitialized = false

    @OptIn(ExperimentalTime::class)
    override suspend fun init() {
        if (isInitialized) return

        isInitialized = true
    }
}
```

### Wire implementations using `App.kt` class

```kotlin
// composeApp/src/commonMain/kotlin/.../App.kt
class App {

    private val container = AppContainer.getInstance()

    var isInitialized = false

    suspend fun init() {
        if (isInitialized) return
        container.init()

        isInitialized = true
    }

    @Composable
    fun Content() {

        val navController = rememberNavController()
        val isInitialized = remember { mutableStateOf(false) }

        val colorScheme = if (isSystemInDarkTheme()) darkColorScheme() else lightColorScheme()

        if (!isInitialized.value) {
            CoroutineScope(Dispatchers.Main).launch {
                init()
                isInitialized.value = true
            }

            MaterialTheme(colorScheme = colorScheme) {
                Surface(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator()
                        Spacer(Modifier.height(16.dp))
                        Text(text = "Initializing…")
                    }
                }
            }
            return
        }

        MaterialTheme(colorScheme = colorScheme) {
            Surface {
                PromptDialogs(AppContainer.promptModel)

                NavHost(
                    navController = navController,
                    startDestination = Destination.HomeDestination,
                    modifier = Modifier.fillMaxSize().navigationBarsPadding(),
                ) {
                    composable<Destination.HomeDestination> {
                        HomeScreen(
                            container = container,
                            navController = navController,
                        )
                    }
                }
            }
        }
    }

    companion object {
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

**Note:** You would want to copy-paste [**the Navigation.kt** file](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/Navigation.kt) for the definition of the navigation targets.

Refer to **[this App.kt code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/App.kt)** and **[the AppContainerImpl.kt code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/core/src/commonMain/kotlin/org/multipaz/getstarted/core/AppContainerImpl.kt)** for the complete example.

### Define `HomeScreen.kt` Composable

`HomeScreen` is a composable function that handles the UI according to the app state - viz. handle permissions, displays buttons or QR codes, or show the issuance and presentation UI. You can use the following code in `HomeScreen.kt`. It currently only uses a placeholder `Text` composable.

```kotlin
@Composable
fun HomeScreen(
    container: AppContainer,
    navController: NavController,
    identityIssuer: String = "Multipaz Getting Started Sample"
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Welcome to Multipaz Getting Started Sample")
        // ... rest of your UI
    }
}
```

Refer to **[this HomeScreen code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/commonMain/kotlin/org/multipaz/getstarted/HomeScreen.kt#L72-L160)** for the complete example.

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

Refer to **[this MainActivity.kt code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/androidMain/kotlin/org/multipaz/getstarted/MainActivity.kt)** for the complete example.

### Update `iOSMain/MainViewController.kt`

Update `MainViewController` to reflect the changes from `App.kt`.

```kotlin
private val app = App.getInstance()

fun MainViewController() = ComposeUIViewController {
    app.Content()
}
```

Refer to **[this MainViewController.kt code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/composeApp/src/iosMain/kotlin/org/multipaz/getstarted/MainViewController.kt)** for the complete example.

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

Refer to **[this project.pbxproj code](https://github.com/openwallet-foundation/multipaz-samples/blob/e18a008b9fcb53ee27932470cfa18800df3b2c10/MultipazGettingStartedSample/iosApp/iosApp.xcodeproj/project.pbxproj)** for the complete example.