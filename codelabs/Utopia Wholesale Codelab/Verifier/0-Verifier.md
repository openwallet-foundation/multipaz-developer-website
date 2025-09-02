---
title: Introduction
sidebar_position: 0
---

# Verifier


Multipaz Identity Verifier( Multipaz Identity Reader) allows you to request and display identity credentials from another person using QR codes, NFC, or Bluetooth Low Energy (BLE), in compliance with ISO/IEC 18013-5:2021. It works entirely offline, without requiring an Internet connection, and supports importing IACA certificates and VICALs.Click **[here](https://apps.multipaz.org/identityreader/identity-reader-0.3.0-pre.7.bdf1bce.apk)** to download the latest APK for sideloading.

The source code for the Multipaz Identity Reader is available **[here](https://github.com/davidz25/MpzIdentityReader)**.

When Holder app and Verifier app starts to communicate, they will  verify each other’s certificate to make sure they are in the trusted list.

In the holder app, we already talked about how to add Verifier’s certificate,here we will talk about Verifier app Holder:  turnning on ble ,verification mode and adding  certificate.