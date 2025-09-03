---
title: BLE and Camera Permission
sidebar_position: 1
---



# BLE and Camera Permission

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
