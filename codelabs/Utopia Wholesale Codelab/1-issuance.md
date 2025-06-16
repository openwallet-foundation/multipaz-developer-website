---
title: Issuance
sidebar_position: 1
---

# Issuance

In this step, you'll issue a digital credential to a user using Multipaz in Kotlin Multiplatform.

**Steps:**

1. **Register a new user**

   ```kotlin
   val user = User(
       name = "Alice",
       email = "alice@example.com"
   )
   val userId = userService.registerUser(user)
   ```

2. **Create a credential payload**

   ```kotlin
   val credential = Credential(
       type = "ProofOfMembership",
       issuedTo = userId,
       issuedBy = "Multipaz Club",
       issuedAt = Clock.System.now(),
       attributes = mapOf("membershipLevel" to "Gold")
   )
   ```

3. **Issue the credential**

   ```kotlin
   val issuedCredential = credentialService.issueCredential(credential)
   ```

4. **Save the credential to the user's wallet**

   ```kotlin
   walletService.addCredential(userId, issuedCredential)
   ```

You have now issued a digital credential and stored it in the user's Multipaz wallet. 