---
title: Verify and Pay
sidebar_position: 4
---

# Verify and Pay

The **Brewery** is where the ecosystem comes together. Buying a bottle requires proving you're 18+
**and** paying — and the Brewery does both in a **single OpenID4VP presentation**. This is the most
interesting server in Utopia, so we'll read its code.

## Try it

1. Open **`http://localhost:8100/brewery/`** on the device. Pick a product and go to checkout.
2. The page calls the Brewery's `/checkout` endpoint, gets back a DCQL query plus transaction data,
   and invokes the Digital Credentials API to ask your wallet for the matching credentials.
3. The wallet prompts you for the matching credentials. Present the **mDL** you issued from the DMV
   (it answers the age requirement) and the **payment credential** you issued from the Bank (to pay).
   Complete the consent prompt and biometric / password authentication.
4. The Brewery verifies the presentation, checks your age, runs the payment through UPay, and shows
   **approved** or **declined**.

:::note What you present in this codelab
The Brewery's DCQL accepts several ID types — mDL, ISO photo ID, EU PID, Aadhaar — but the **mDL** is
the only one you issued in this Universe, so that's what you present. The Utopia mDL carries an
`age_over_18` flag, which is exactly what the age check reads, so verification succeeds without ever
revealing your birth date. The `age_over_21` and other-ID fallbacks in the DCQL below exist for
generality.
:::

Now let's see how each piece works.

## Routing: a verifier plus one custom endpoint

The Brewery mounts all the standard Multipaz verifier endpoints, then adds its storefront's
`/checkout`:

```kotlin
fun Application.configureRouting(environment: Deferred<ServerEnvironment>) {
    routing {
        configureVerifier(environment)   // make_request, process_response, get_result, verify_credentials.js
        post("/checkout") {
            breweryCheckout(call)
        }
    }
}
```

`/checkout` takes `{productName, price}`, opens a transaction with the payment processor, and returns
the **DCQL query** and **transaction data** for the browser to hand straight to
`multipazVerifyCredentials()`.

## The DCQL query: one request, two purposes

The query asks for two things at once via `credential_sets`: an identity credential **and** a payment
credential.

```json
"credential_sets": [
  {
    "purpose": "Age verification for alcohol purchase",
    "options": [ ["photoid"], ["mdl"], ["eupid"], ["aadhaar"] ]
  },
  {
    "purpose": "Payment",
    "options": [ ["payment"] ]
  }
]
```

The age side accepts **any** of four ID types — an ISO photo ID, an mDL, an EU PID, or an Aadhaar
credential — so the Brewery works for holders from different ecosystems.

### `claim_sets`: ask for the least data that answers the question

Within each ID credential, `claim_sets` lists acceptable claim combinations **in priority order**.
For the mDL:

```json
"claim_sets": [
  ["age_over_18"],
  ["age_over_21"],
  ["age_in_years"],
  ["birth_date"]
]
```

The verifier prefers the boolean `age_over_18` flag — the most privacy-preserving answer, revealing
nothing but "yes, 18+." Only if the wallet can't satisfy that does it fall back to `age_over_21`,
then a numeric age, and finally the raw `birth_date`. This is data minimization expressed directly in
the query.

The `payment` credential has **no** `claim_sets` — all of its fields (`issuer_name`,
`payment_instrument_id`, `holder_name`, ...) are required for the payment check.

## The VerifierAssistant: business logic after verification

Multipaz verifies the cryptography (signatures, trust chain, freshness) for you. Your **business
logic** goes in a `VerifierAssistant`. The Brewery registers one in `Main`:

```kotlin
add(VerifierAssistant::class, BreweryVerifierAssistant())
```

Its `processResponse` runs once the presentation is cryptographically valid. It does three things:

**1. Find which ID was presented and check age.** Because the DCQL accepted four ID types, the
assistant looks for whichever one came back, then evaluates the age claims in the same priority order
the query expressed:

```kotlin
fun checkAge(claims: JsonObject): Boolean {
    // Definitive 18+ flags first
    claims["age_over_18"]?.jsonPrimitive?.booleanOrNull?.let { return it }
    claims["age_above18"]?.jsonPrimitive?.booleanOrNull?.let { return it }

    // age_over_21 == true implies 18+, but false does NOT imply under 18
    claims["age_over_21"]?.jsonPrimitive?.booleanOrNull?.let { if (it) return true }

    // Numeric age, then birth_date as a last resort
    claims["age_in_years"]?.jsonPrimitive?.intOrNull?.let { return it >= 18 }
    claims["birth_date"]?.jsonPrimitive?.contentOrNull?.let { /* compute age from date */ }

    return false
}
```

:::tip Why `age_over_21 == false` is not a rejection
A 20-year-old has `age_over_21 = false` yet is still over 18. The Brewery treats `age_over_21` as a
**positive-only** signal — useful when present and true, never used to reject. Getting this subtle
case right is exactly why age logic belongs in your `VerifierAssistant` and not in the query alone.
:::

**2. Validate the digital payment credential (DPC).** The `payment` entry is guaranteed by the DCQL
contract, so its absence is a programming error, not a user-facing one. The assistant pulls
`holder_name` and `issuer_name` and rejects only if they're missing.

**3. Commit the payment.** If age and payment both check out, it commits the transaction it opened
during `/checkout`, moving money to the Brewery's account through the payment processor:

```kotlin
withContext(RpcAuthClientSession()) {
    paymentProcessor.commitTransaction(presentment.presentmentRecord)
}
```

It returns a structured result the storefront renders:

```kotlin
return buildJsonObject {
    put("approved", true)
    put("holderName", holderName)
    put("issuerName", issuerName)
}
```

## What just happened

In one OpenID4VP exchange, the Brewery proved the customer is of age **and** collected payment,
talking to a separate **payment processor** (UPay) to settle — while the wallet revealed the minimum
data needed. That's the whole Utopia ecosystem cooperating: issuer, holder, verifier, and processor.

Next, you'll hook your own logic into these servers via the `IssuerAssistant` and `VerifierAssistant`
extension points.
