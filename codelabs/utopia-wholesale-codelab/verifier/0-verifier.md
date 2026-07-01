---
title: Introduction
sidebar_position: 0
---

# Verifier

We will be using [Loyalty Reader](https://github.com/openwallet-foundation/multipaz-identity-reader/tree/loyalty) for verification of the Loyalty Credential we created in this codelab. You can build the APK from the source for testing.

LoyaltyReader lets you request and display identity credentials from another person using NFC or QR codes (with Bluetooth Low Energy for data transfer), in compliance with ISO/IEC 18013-5:2021. It works fully offline and does not require an Internet connection.

LoyaltyReader is a modified version of the [Multipaz Identity Reader](https://github.com/openwallet-foundation/multipaz-identity-reader) that supports multiple types of credentials, including mDL and PhotoID.

When the holder app and the verifier app starts to communicate, both apps verifies each other's certificate chains to make sure that they are in the trusted list.

In the holder app, we already talked about how to add the certificate of the verifier app, here we will talk about the verifier app in detail.