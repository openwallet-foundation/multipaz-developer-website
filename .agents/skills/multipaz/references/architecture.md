# Architecture

## Discover the current module layout

Do not use this skill as a module map. Inspect the target checkout before
selecting a module:

1. Read `settings.gradle.kts` and included build configuration.
2. Search current Gradle files for the feature area and its dependencies.
3. Use [Multipaz KDoc](https://developer.multipaz.org/kdocs/index.html) to
   confirm the public API belongs to the selected module.
4. Locate a current sample or test with `rg` before copying integration wiring.

## Source-set pattern

- Shared business logic typically lives in `commonMain`.
- Android-specific app integration, manifests, permissions, and NFC services live in `androidMain`.
- iOS Kotlin interop code lives in `iosMain`.
- Keep native Swift and SwiftUI integration in the iOS application or extension
  target identified by the current project layout.

## How to use this reference

- Read this file first when you need to decide where a change belongs.
- Follow with [dependency-guide.md](dependency-guide.md) for dependency selection and [android-platform.md](android-platform.md) or [ios-platform.md](ios-platform.md) for platform wiring.
