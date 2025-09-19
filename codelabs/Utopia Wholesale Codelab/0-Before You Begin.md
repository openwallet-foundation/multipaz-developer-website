---
title: Before You Begin
sidebar_position: 0
---

Secure identity management is critical for building trustworthy digital applications. Traditional identity systems rely heavily on centralized databases, usernames, and passwords—making them vulnerable to breaches and phishing.

To address these limitations, the **OpenWallet Foundation Labs** created the **Multipaz SDK**. It enables decentralized identity issuance and verification, supporting standards like **OpenID for Verifiable Credential Issuance (OpenID4VCI)** and **OpenID for Verifiable Presentations (OpenID4VP)**.

This project provides:

* A Kotlin Multiplatform (KMP) library for mobile wallets to issue and present credentials.
* Server components for issuing & verifying credentials.

In this codelab, you’ll build a minimal end-to-end Verifiable Credential flow using the Multipaz SDK. You’ll create a Utopia Wholesale app that first issues a credential from the server, then securely stores it on the mobile device, and finally shares it with a verifier app via QR code or NFC for verification.

---

## **Prerequisites**

* Experience building Android apps using Android Studio
* Familiarity with authentication flows (OAuth2, OpenID Connect)
* Basic understanding of Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs)

---

## **What you’ll learn**

* How to integrate the `multipaz` library into a KMP project
* How to perform a **Credential Offer** and retrieve metadata from an issuance server
* How to request and store a **Verifiable Credential** on-device using the Multipaz SDK components
* How to present a credential to a verifier (using the OpenID4VP protocol)

---

## **What you’ll need**

* An Android device or emulator (API level 26 or higher)
* [Android Studio](https://developer.android.com/studio)
* Kotlin 1.8.10+
* XCode for Mac
* Internet access for network calls
* Setup XCode (for Mac only)
  * Open XCode
  * Open (`/Project/iosApp/iosApp.xcodeproj`)
  * Select iosApp on left Panel
  * Click Signing \& Capabilities tab
  * Under Team, select your Apple developer team

---

## **Libraries used in this Codelab**

| Module | Purpose |
| ----- | ----- |
| `multipaz` | Core SDK for issuing, storing, and presenting digital credentials |
| `multipaz-doctypes` | Sample document types |
| `multipaz-models` | Core data models (credential metadata, request, etc.) |
| `multipaz-compose` | Jetpack Compose UI helpers for rendering credential-related composables (optional) |

---

## **Project structure**

You’ll work with these components:

1. **Mobile Wallet App (Android/iOS):** Retrieves a credential offer from the issuance server, obtains the credential, stores it locally and presents it for verification.
2. **Verifier App (Verification):** Leverage the existing Multipaz Identity Reader App to perform credential verification.
3. **Issuance Server:** Issues credentials to wallet apps using the OpenID4VCI protocol.