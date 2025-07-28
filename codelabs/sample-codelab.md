---
title: Sample Multipaz Codelab
sidebar_position: 10
description: A sample codelab demonstrating the phases of Issuance, Storage, Presentation, Verification, and Revocations using Multipaz.
---

# Sample Multipaz Codelab

Welcome to this sample codelab! This guide will walk you through the key phases of a digital credential lifecycle using Multipaz: Issuance, Storage, Presentation, Verification, and Revocations.

---

## 1. Issuance

Issues a digital identity credential to a user.

**Steps:**
- Follows the OpenID for Verifiable Credential Issuance (OpenID4VCI) protocol.
- Credentials are signed by a trusted issuer (e.g., government or institution).
- Delivered securely to the user’s device (holder app).

---

## 2. Storage

Stores the issued credentials securely on the holder’s device.

**Key Points:**
-Stored in a secure wallet app.
-Credentials can be encrypted and selectively retrieved.
-Supports multiple credentials from different issuers.

---

## 3. Share Credentials

Allows the user (holder) to share their credentials with a verifier.

**Key Points:**
- User selects a credential to present
- Multipaz formats the credential for sharing
- Uses QR code, NFC, or Bluetooth LE to transmit data.
- Adheres to ISO/IEC 18013-5:2021 for secure, offline credential sharing.
- Enables selective disclosure—only chosen fields are shared.
- No Internet required during sharing.

---

## 4. Verification

Verifies the authenticity and validity of received credentials.

**Key Points:**
- Validates the digital signature using IACA and DS certificates.
- Ensures the credential is untampered and issued by a trusted authority.
- Performed offline using the Multipaz Identity Reader.
- Displays the credential content to the verifier for inspection.

---

Congratulations! You have completed the sample codelab covering all major phases of the credential lifecycle in Multipaz. 