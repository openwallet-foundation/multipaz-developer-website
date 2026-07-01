---
title: Extend the Servers
sidebar_position: 5
---

# Extend the Servers

The Utopia servers are built to be customized. Two interfaces are the seams where your own logic
plugs in: `IssuerAssistant` on the issuance side, and `VerifierAssistant` on the verification side.
Both keep your business rules separate from the protocol machinery Multipaz handles for you.

## `IssuerAssistant` — react to issuance

Every issuer registers an `IssuerAssistant`. Its `onIssuance` hook fires **after** a credential is
minted and delivered to the wallet — the place to record an audit event or notify a fraud pipeline:

```kotlin
interface IssuerAssistant {
    suspend fun onIssuance(
        systemOfRecordData: DataItem,
        credentialId: CredentialId,
        format: CredentialFormat,
    )

    object NoOp : IssuerAssistant { /* does nothing */ }
}
```

The DMV's implementation just logs, so the wiring is observable:

```kotlin
class DmvIssuerAssistant : IssuerAssistant {
    override suspend fun onIssuance(
        systemOfRecordData: DataItem,
        credentialId: CredentialId,
        format: CredentialFormat,
    ) {
        Logger.i(TAG, "Issued credential id=$credentialId format=${format.formatId}")
    }
}
```

**Try it:** open `organizations/dmv/backend/.../DmvIssuerAssistant.kt`, add a line that writes the
`credentialId` and a timestamp to a file or external endpoint, rebuild, and issue an mDL again. You've
added an audit trail without touching any OpenID4VCI code.

:::note
Because issuance has already completed when `onIssuance` fires, throwing here does **not** revoke the
credential — failures are logged, not surfaced to the wallet. Treat it as a notification hook, not a
gate.
:::

## `VerifierAssistant` — decide what a presentation means

You met this in the Brewery. A `VerifierAssistant` has two hooks:

- `processRequest` — adjust the outgoing request before it's sent (return `null` to leave it
  unchanged).
- `processResponse` — run your business logic **after** the presentation is cryptographically
  verified, and return the result.

```kotlin
class BreweryVerifierAssistant : VerifierAssistant {
    override suspend fun processRequest(request: JsonObject): JsonObject? = null

    override suspend fun processResponse(presentment: VerifierPresentment): JsonObject {
        // find the ID credential, check age, validate payment, commit the transaction,
        // and return { approved, holderName, issuerName } (or an error)
    }
}
```

This is the right home for policy: *what counts as old enough*, *which credential types you accept*,
*when to settle payment*. Multipaz guarantees the response is authentic; your assistant decides what
to do about it.

**Try it:** see the decline path. The reliable way to watch a rejection is to temporarily force the age check to fail: make `checkAge` return `false`, rebuild, and run a checkout. The Brewery shows **declined** and never settles the payment.
Revert when you're done.

## Where to go next

- **Build an organization.** Each org under `organizations/` is a small Ktor server registered in
  `settings.gradle.kts` and wired into the `deployment` module. Copy the Brewery as a template for a
  new verifier, or the DMV for a new issuer.
- **Deploy the bundle.** The same image runs in the cloud — follow
  [Deploying to Google Cloud Run](./6-deploying-to-google-cloud-run.md) to put the whole
  Utopia Universe behind a public HTTPS URL.

You've now run a complete digital-identity economy locally and seen where to extend it — issuers,
verifiers, a records registry, and a payment processor, all cooperating through Multipaz.
