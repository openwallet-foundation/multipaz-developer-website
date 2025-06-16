---
title: Storage
sidebar_position: 2
---

# Storage

Now that the credential is issued, let's see how it is securely stored in the Multipaz wallet using Kotlin Multiplatform.

**Steps:**

1. **Store the credential in the user's wallet**

   ```kotlin
   walletService.addCredential(userId, issuedCredential)
   ```

2. **List all credentials in the wallet**

   ```kotlin
   val credentials = walletService.listCredentials(userId)
   credentials.forEach { println(it) }
   ```

3. **Check credential details**

   ```kotlin
   val storedCredential = walletService.getCredential(userId, issuedCredential.id)
   println(storedCredential)
   ```

Multipaz ensures that all credentials are encrypted and only accessible to the user, maintaining privacy and security. 