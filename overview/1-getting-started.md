# Getting Started

Multipaz is an identity framework designed to handle secure, real-world credential issuance and
verification. This guide helps developers to quickly get familiar with the APIs by walking you
through the end-to-end identity flow -- from issuing a digital ID to verifying it across devices.

The guide follows the **Credential Lifecycle** – and the guidance to implement each of the steps
using Multipaz.

![Credential Lifecycle](https://github.com/user-attachments/assets/878890c1-bf5e-49b6-b739-039a0bfd888e)

## Installation of Dependencies

To get started with Multipaz, you need to add the necessary dependencies to your project. This guide
assumes you are using Gradle as your build system.

- Add the `google` repository to `settings.gradle.kts` file

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

- Add the following dependencies to libs.versions.toml

```toml
[versions]
multipaz = "0.91.0" # Version of Multipaz to use

[libraries]
multipaz = { group = "org.multipaz", name = "multipaz", version.ref = "multipaz" }
multipaz-models = { group = "org.multipaz", name = "multipaz-models", version.ref = "multipaz" }
multipaz-compose = { group = "org.multipaz", name = "multipaz-compose", version.ref = "multipaz" }
multipaz-doctypes = { group = "org.multipaz", name = "multipaz-doctypes", version.ref = "multipaz" }
```

- Add the following to your module level `build.gradle.kts` file (usually `app/build.gradle.kts`):

```kotlin
kotlin {
    sourceSets {
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

You might also want to check out other libraries in the Multipaz ecosystem, from
Multipaz [here](https://mvnrepository.com/search?q=multipaz)

<details>

<summary>Some gotchas to be aware of:</summary>

<ul>

<li>
    Multipaz only supports projects with minSdk >=26. Hence, `android-minSdk` has to be changed to 26 or above on `libs.versions.toml` file.
</li>

<li>
    You might want to add `"META-INF/versions/9/OSGI-INF/MANIFEST.MF"` to the `packaging.resources.excludes` in your `build.gradle.kts` file to avoid packaging issues. 

```kotlin
android {
    packaging {
        resources {
            excludes += listOf(
                "META-INF/versions/9/OSGI-INF/MANIFEST.MF"
                //... other excludes if necessary
            )
        }
    }
}
```
</li>

</ul>

</details>