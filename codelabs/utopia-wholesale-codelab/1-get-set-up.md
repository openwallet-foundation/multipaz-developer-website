---
title: Get Set Up
sidebar_position: 1
---

# Get Set Up

## Clone the project

Clone the codelab starter code and open the `MultipazCodelab/Holder` directory in Android Studio.

```shell
git clone -b code-starter https://github.com/openwallet-foundation/multipaz-samples.git
```
The `MultipazCodelab` folder in the `code-starter` branch contains `Holder` and `Reader` directories.

The Holder folder contains the codelabs that guide you step by step through the programming process. It includes the Utopia Sample with TODO sections designed to help you understand and implement the Multipaz library.

The Reader folder contains the Reader code that can read credentials created in the codelab.

To view the completed version of the codelab, clone the main branch (MultipazCodelab folder) from the repository link below. The main branch contains the fully runnable code for the Utopia Sample.
```shell
git clone https://github.com/openwallet-foundation/multipaz-samples.git
```

## iOS Holder setup

Complete this section before building the Holder on iOS. The `code-starter` branch already includes the iOS build wiring; configure the supplied project rather than editing committed Xcode files.

### 1. Install CocoaPods dependencies

Install CocoaPods if it is not already available:

```shell
sudo gem install cocoapods
```

From `MultipazCodelab/Holder`, generate the framework stub CocoaPods needs, then install Pods:

```shell
./gradlew :composeApp:generateDummyFramework
pod install
```

### 2. Configure local signing and shared storage

Create a local configuration file from the supplied template:

```shell
cp iosApp/Configuration/DeveloperConfig.xcconfig.template \
   iosApp/Configuration/DeveloperConfig.xcconfig
```

Set the following values in `iosApp/Configuration/DeveloperConfig.xcconfig`:

```xcconfig
DEVELOPMENT_TEAM = YOUR_TEAM_ID
LOCAL_BUNDLE_ID = com.example.utopiawallet
APP_GROUP_ID = group.com.example.utopiawallet
```

Use values registered to your Apple Developer account. `LOCAL_BUNDLE_ID` is the app bundle ID; the document-provider extension automatically appends `.DocumentProviderExtension`. `APP_GROUP_ID` must be enabled for both targets and is used for the Holder's shared storage.

`DeveloperConfig.xcconfig` is ignored by Git. Keep personal signing values there and do not commit the file.

See the [starter configuration template](https://github.com/openwallet-foundation/multipaz-samples/blob/448e53661abdfca25c2964a45fe6cab3a40751b5/MultipazCodelab/Holder/iosApp/Configuration/DeveloperConfig.xcconfig.template#L1-L13) for the complete file.

### 3. Use the configured App Group for iOS storage

Update `composeApp/src/iosMain/kotlin/org/multipaz/samples/wallet/cmp/util/PlatformStorage.ios.kt` so storage reads the `AppGroupID` value supplied by the local Xcode configuration. Add the `NSBundle` import, remove the hard-coded `IOS_APP_GROUP_IDENTIFIER`, and use the following implementation:

```kotlin
import platform.Foundation.NSBundle

actual fun createWalletStorage(): Storage =
    IosStorage(
        storageFileUrl =
            NSFileManager.defaultManager
                .containerURLForSecurityApplicationGroupIdentifier(
                    groupIdentifier =
                        NSBundle.mainBundle.objectForInfoDictionaryKey("AppGroupID") as? String
                            ?: error("Missing AppGroupID in Info.plist"),
                )!!
                .URLByAppendingPathComponent("storageNoBackup.db")!!,
        excludeFromBackup = true,
    )
```

This connects the local `APP_GROUP_ID` value to the Holder's shared iOS storage at runtime.

This implementation matches the [Holder storage change in PR #133](https://github.com/openwallet-foundation/multipaz-samples/blob/b209696e474b59d407d51e42fb4412e7eb103ddc/MultipazCodelab/Holder/composeApp/src/iosMain/kotlin/org/multipaz/samples/wallet/cmp/util/PlatformStorage.ios.kt#L1-L19).

### 4. Enable the App Group

In the Apple Developer portal, create or select the App Group configured above and enable it for the app's App ID. In Xcode, add the same group in **Signing & Capabilities** for both `iosApp` and `IdentityDocumentProviderExtension`. See [iOS App Group ID Setup](./advanced-features/ios-app-group-id-setup) for the detailed walkthrough.

### 5. Build from the workspace

Open the workspace created by CocoaPods—not `iosApp.xcodeproj`:

```shell
open iosApp.xcworkspace
```

In Xcode, choose **Product → Clean Build Folder**, select a physical iOS device, then run the active scheme. The codelab's Gradle build already prepares Compose resources during the Xcode build; do not run `prepareComposeResourcesTaskForCommonMain` manually.

The [starter Gradle configuration](https://github.com/openwallet-foundation/multipaz-samples/blob/448e53661abdfca25c2964a45fe6cab3a40751b5/MultipazCodelab/Holder/composeApp/build.gradle.kts#L94-L103) defines the task ordering used by this build.

### iOS troubleshooting

| Issue | Resolution |
| --- | --- |
| `Missing AppGroupID in Info.plist` | Create `DeveloperConfig.xcconfig` from the template and set `APP_GROUP_ID`. |
| Signing fails | Verify `DEVELOPMENT_TEAM` and that `LOCAL_BUNDLE_ID` is unique in your Apple Developer account. |
| Shared storage is unavailable | Enable the same App Group for both targets in Apple Developer and Xcode. |
| Framework or resources are missing | Run `./gradlew :composeApp:generateDummyFramework`, then `pod install`; reopen the workspace, clean, and rebuild. |
