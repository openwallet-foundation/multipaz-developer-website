---
title: Presentation
sidebar_position: 3
---

# Presentation

In this phase, the user presents a credential to a verifier (e.g., a service or organization) using Kotlin Multiplatform.

**Steps:**

1. **Select a credential to present**

   ```kotlin
   val credentialToPresent = walletService.getCredential(userId, issuedCredential.id)
   ```

2. **Generate a presentation package**

   ```kotlin
   val presentation = presentationService.createPresentation(
       credential = credentialToPresent,
       audience = "Verifier Service",
       purpose = "Access to premium features"
   )
   ```

3. **Share the presentation with the verifier**

   ```kotlin
   presentationService.sendPresentation(presentation, verifierEndpoint)
   ```

The verifier will now be able to review the presented credential and proceed with verification. 