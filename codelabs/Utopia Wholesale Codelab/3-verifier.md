---
title: Verifier
sidebar_position: 3
---

# Verifier


Multipaz Identity Verifier( Multipaz Identity Reader) allows you to request and display identity credentials from another person using QR codes, NFC, or Bluetooth Low Energy (BLE), in compliance with ISO/IEC 18013-5:2021. It works entirely offline, without requiring an Internet connection, and supports importing IACA certificates and VICALs.Click **[here](https://apps.multipaz.org/identityreader/identity-reader-0.3.0-pre.7.bdf1bce.apk)** to download the latest APK for sideloading.

The source code for the Multipaz Identity Reader is available **[here](https://github.com/davidz25/MpzIdentityReader)**.

When Holder app and Verifier app starts to communicate, they will  verify each other’s certificate to make sure they are in the trusted list.

In the holder app, we already talked about how to add Verifier’s certificate,here we will talk about Verifier app Holder:  turnning on ble ,verification mode and adding  certificate.

### BLE and Camera Permission

Before scanning a barcode, the user must grant both Bluetooth (BLE) and Camera permissions.

To request BLE permissions programmatically, use the RequestBluetoothPermission(blePermissionState) function. The following code snippet demonstrates how to check and request BLE permissions in SelectRequestScreen.kt:
```
if (!blePermissionState.isGranted) {
    RequestBluetoothPermission(blePermissionState)
}

```

Additionally, ensure that the necessary BLE permissions are declared in the AndroidManifest.xml file located at composeApp/src/androidMain/AndroidManifest.xml:

```
<!-- Bluetooth permissions for Android 12+ (API level >= 31) -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
    android:usesPermissionFlags="neverForLocation"
    tools:targetApi="s" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

<!-- Bluetooth permissions for Android 11 and lower (API level <= 30) -->
<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" android:maxSdkVersion="30" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
```


To request Camera permissions, invoke cameraPermissionState.launchPermissionRequest() in [ScanQrScreen.kt](http://ScanQrScreen.kt)
```
 cameraPermissionState.launchPermissionRequest() 
```

Also, declare the Camera permission in AndroidManifest.xml:
```
 <uses-permission android:name="android.permission.CAMERA"/> 
 ```


### Verification Modes

The application supports three types of verification modes:Age Over 18,Age Over 21,Identification.

Age Over 18  
This mode verifies if the individual is 18 years or older. It is designed for scenarios where only age verification is required, without revealing full personal identity information.

Age Over 21  
Functionally identical to "Age Over 18", this mode verifies whether the individual is 21 years or older. It is commonly used for alcohol purchases or entry to age-restricted venues.

Identification  
This mode requests the user's full identification details, including name, birthdate, document number, and portrait. It is used in scenarios where complete identity verification is required, such as account registration or employment verification.

Query Selection Implementation  
When a user selects a verification mode, a corresponding query is executed in ReaderQuery.kt as follows:


```
when (query) {
    ReaderQuery.AGE_OVER_18 -> {
        mdlNs.put("age_over_18", intentToRetain)
        mdlNs.put("portrait", intentToRetain)
    }
    ReaderQuery.AGE_OVER_21 -> {
        mdlNs.put("age_over_21", intentToRetain)
        mdlNs.put("portrait", intentToRetain)
    }
    ReaderQuery.IDENTIFICATION -> {
        mdlNs.put("given_name", intentToRetain)
        mdlNs.put("family_name", intentToRetain)
        // Additional identity attributes
        mdlNs.put("issue_date", intentToRetain)
        mdlNs.put("expiry_date", intentToRetain)
    }
}
```

Display Behavior  :
The Verifier app will display relevant fields based on the selected verification mode:
Age Over 18: Displays the person's portrait and a message like "This person is 18 or older."
Age Over 21: Displays the portrait with a message confirming the person is 21 or older.
Identification: Displays all identity data elements, such as "given\_name", "family\_name", "issue\_date", etc.

# How to Import a Certificate

The **Multipaz Identity Verifier** requires the issuer’s certificate to verify credentials. Follow these steps to import the certificate:

1. Open the **Holder** app project.
2. <a href="https://raw.githubusercontent.com/openmobilehub/multipaz-utopia-wholesale-codelab/feature/code-starter/Holder/composeApp/src/commonMain/composeResources/files/iaca_certificate.pem" target="_blank">Download the IACA certificate</a>

:::info Download Instructions
Long-press the link above and select **"Download link"** or **"Save link"** from the context menu.
:::

3. Copy `iaca_certificate.pem` to your phone.
4. On your phone, open the **Multipaz Identity Verifier** app.
4. Tap the **hamburger menu** (☰) in the top-left corner.
6. Navigate to: **Settings** → **Trusted Issuers**
7. Tap the **"+" button** (bottom right).
8. Choose **Import Certificate** and select the `iaca_certificate.pem` file.

 You’re now ready to use the Verifier app to scan a barcode from the Holder app.


### Certificate Trust and Document Verification

After importing a certificate, it must be added to the trust manager. The following code, located in TrustedIssuersScreen.kt, handles certificate import and trust management:

```
onResult = { files ->
    if (files.isNotEmpty()) {
        coroutineScope.launch {
            try {
                val cert = X509Cert.fromPem(pemEncoding = files[0].toByteArray().decodeToString())
                val entry = userTrustManager.addX509Cert(
                    certificate = cert,
                    metadata = TrustMetadata()
                )
                onTrustEntryClicked(TRUST_MANAGER_ID_USER, userTrustManager.getEntries().size - 1, true)
            } catch (_: TrustPointAlreadyExistsException) {
                showImportErrorDialog.value = "A certificate with this Subject Key Identifier already exists"
            } catch (e: Throwable) {
                showImportErrorDialog.value = "Importing certificate failed: $e"
            }
        }
    }
}

```

When the Verifier app receives a document, it verifies the document’s authenticity and trust chain. This process is implemented in ShowResultScreen.kt:


```
require(document.deviceSignedAuthenticated) { "Device Authentication failure" }
require(document.issuerSignedAuthenticated) { "Issuer Authentication failure" }
require(now >= document.validityInfoValidFrom && now <= document.validityInfoValidUntil) {
    "Document is not valid at this point"
}

val trustResult = issuerTrustManager.verify(document.issuerCertificateChain.certificates, now)
require(trustResult.isTrusted) { "Document issuer isn't trusted" }
```

This validation ensures:Device Signature Authentication is successful,Issuer Signature Authentication is valid,the issuer's certificate chain is verified against trusted certificates.
