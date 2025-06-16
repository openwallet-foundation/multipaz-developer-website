---
title: Revocations
sidebar_position: 5
---

# Revocations

In this phase, a credential may be revoked by the issuer, and Multipaz ensures all parties are updated. This example uses Kotlin Multiplatform.

**Steps:**

1. **Issuer revokes a credential**

   ```kotlin
   revocationService.revokeCredential(issuedCredential.id)
   ```

2. **Update the wallet to reflect revocation**

   ```kotlin
   val isRevoked = revocationService.isCredentialRevoked(issuedCredential.id)
   if (isRevoked) {
       println("Credential has been revoked and is no longer valid.")
   }
   ```

3. **Notify user and verifier**

   ```kotlin
   notificationService.notifyRevocation(issuedCredential.id, listOf(userId, verifierId))
   ```

Revocation ensures that credentials can be invalidated if needed, maintaining trust and security in the system. 