---
title: Installation
sidebar_position: 1
---

# Installation of Dependencies

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