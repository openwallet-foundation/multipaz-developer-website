---
title: Before You Begin
sidebar_position: 0
---

# Before You Begin


## **Before you begin**

Secure identity management is critical for building trustworthy digital applications. Traditional identity systems rely heavily on centralized databases, usernames, and passwords—making them vulnerable to breaches and phishing.

To address these limitations, the **OpenWallet Foundation Labs** created the **Identity Credential** project. It enables decentralized identity issuance and verification, supporting standards like **OpenID for Verifiable Credential Issuance (OpenID4VCI)** and **OpenID for Verifiable Presentations (OpenID4VP)**.

This project provides:

* A Kotlin/Android library for mobile wallets to issue and present credentials.

* A server library for issuing credentials.

In this codelab, you’ll build a minimal end-to-end Verifiable Credential flow using Identity Credential components. You’ll create a Utopia app that first issues a credential from the server, then securely stores it on the mobile device, and finally shares it with a verifier app via QR code or NFC for verification.

---

## **Prerequisites**

* Experience building Android apps in Android Studio

* Familiarity with authentication flows (OAuth2, OpenID Connect)

* Basic understanding of Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs)

---

## **What you’ll learn**

* How to integrate the `multipaz` library in an kmp project

* How to perform a **Credential Offer** and retrieve metadata

* How to request and store a **Verifiable Credential** on-device

* How to present a credential to a verifier (using OpenID4VP)

---

## **What you’ll need**

* An Android device or emulator (API level 26 or higher)

* [Android Studio Hedgehog (2023.1.1)+](https://developer.android.com/studio)

* Kotlin 1.8.10+

* XCode for Mac   
* Internet access for network calls   
* Setup Xcode(for mac only)  
  * Open Xcode  
  * Open (/Project/iosApp/iosApp.xcodeproj)   
  * Select iosApp on left Panel  
  * Click Signing\&Capabilities tab  
  * Under Team, select your Apple developer team

---

## **Libraries in this Codelab**

| Module | Purpose |
| ----- | ----- |
| `identity-credential` | Core SDK for issuing, storing, and presenting credentials |
| `multipaz-doctypes` | Sample document types (CBOR serializable) |
| `multipaz-models` | Core data models (credential metadata, request, etc.) |
| `multipaz-compose` | UI helpers for rendering credential-related composables (optional) |

---

## **Project structure**

You’ll work with these components:

1. **Mobile Wallet App (Android/iOS)**  
    Retrieves credential offer, obtains credential, and stores locally and verification  
2. **Verifier App(Verification)**  
   Leverage the existing Verifier App to perform credential verification.

3. **Issuer Server**  
    Issues credentials using OpenID4VCI.

