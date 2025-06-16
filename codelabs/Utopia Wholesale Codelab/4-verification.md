---
title: Verification
sidebar_position: 4
---

# Verification

In this phase, the verifier checks the authenticity and validity of the presented credential using Kotlin Multiplatform.

**Steps:**

1. **Receive the presentation**

   ```kotlin
   val receivedPresentation = presentationService.receivePresentation(presentationPayload)
   ```

2. **Verify the credential's authenticity and integrity**

   ```kotlin
   val isValid = verificationService.verifyPresentation(receivedPresentation)
   if (isValid) {
       println("Credential is valid and authentic.")
   } else {
       println("Credential verification failed.")
   }
   ```

3. **Check for revocation status**

   ```kotlin
   val isRevoked = verificationService.isCredentialRevoked(receivedPresentation.credentialId)
   if (isRevoked) {
       println("Credential has been revoked.")
   } else {
       println("Credential is active.")
   }
   ```

The verifier can now make an informed decision based on the verification results. 