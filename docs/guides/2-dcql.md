---
title: Request Multiple Credentials with DCQL
sidebar_position: 3
---

# Request Multiple Credentials with DCQL

This guide shows how to request multiple credentials (and fine‑grained claims) using the Digital Credentials Query Language (DCQL) when verifying with browsers and apps that implement the W3C Digital Credentials API. You’ll also learn how to demo this flow using the Multipaz web verifier.

If you’ve already completed the [Android → Web Verification](https://developer.multipaz.org/docs/guides/web-verification) guide, no additional client changes are required. DCQL lives on the verifier side; compatible wallets that support the W3C DC API will automatically handle these requests.

## What Is DCQL?

The Digital Credentials Query Language (DCQL) defines how a verifier describes the credentials and claims it needs from a holder. Instead of hard‑coding a single credential format or claim set, DCQL lets verifiers:

* Ask for one or more credentials in a single request
* Specify acceptable formats (e.g., `mDL`/`mDoc`, `SD‑JWT VC`, etc.)
* Declare which claims are required vs optional
* Request predicate proofs (e.g., “age over 21”) and selective disclosure (e.g., “portrait”)

DCQL is part of the OpenID for Verifiable Presentations (OpenID4VP) specification. See References for the normative text.

## Overview

The Digital Credentials Query Language (DCQL) is a JSON-encoded query language that allows the Verifier to request Verifiable Presentations that match the query. The Verifier MAY encode constraints on the combinations of credentials and claims that are requested. The Wallet evaluates the query against the Verifiable Credentials it holds and returns Verifiable Presentations matching the query.

With DCQL, the verifier constructs a request and passes it to the browser’s Digital Credentials interface. A compatible wallet app (like the Multipaz Getting Started Sample) receives the request through the W3C DC API and prompts the user to selectively disclose the requested claims across one or more credentials.

### High‑level user flow:

1. User opens the Web Verifier ([verifier.multipaz.org](https://verifier.multipaz.org) in our case)
2. User enters (or selects) the DCQL query
3. Verifier constructs a DCQL request (one or more credential queries)
4. Browser calls the W3C Digital Credentials API with that request
5. Available wallets in the device receives the request and displays the selection UI
6. User selects one, then performs necessary approvals
7. Wallet returns the presentation(s)
8. Verifier validates and shows the result

Because the wallet uses the Digital Credentials API, no additional app changes are needed to support new DCQL variations.

## Demo: Request mDL “age over 21” and “portrait”

You can try this with the Multipaz web verifier. This example demonstrates:

* A predicate proof: `age_over_21`
* A selectively disclosed attribute: `portrait`

**Prerequisites:**

* Complete the [“Android → Web Verification”](https://developer.multipaz.org/docs/guides/web-verification/) guide so your app will be registered as a credential provider on the device
* Have the valid mDoc(s) in your wallet that can satisfy the request

**Steps:**

1. Open the verifier in a supported browser on Android: [https://verifier.multipaz.org](https://verifier.multipaz.org/)
2. Select the DCQL button and select the option for `age_over_21` & `portrait`
3. When prompted by the system, select Multipaz Getting Started Sample App
4. Approve the request that asks for:
    * Predicate: `age_over_21`
    * Attribute: `portrait`
5. The verifier will validate the returned presentation and display the result

### Structure of a DCQL Request

Now we successfully demoed how to use a DCQL request using a web verifier, let’s break down the structure a bit.

Below is a representative example for DCQL requesting the `age_over_21` predicate, and the `portrait` attribute.

```json
{
  "credentials": [
    {
      "id": "mdoc",
      "format": "mso_mdoc",
      "meta": {
        "doctype_value": "org.iso.18013.5.1.mDL"
      },
      "claims": [
        {
          "path": [
            "org.iso.18013.5.1",
            "age_over_21"
          ]
        },
        {
          "path": [
            "org.iso.18013.5.1",
            "portrait"
          ]
        }
      ]
    }
  ]
}
```

## Requesting Multiple Credentials

DCQL can also bundle multiple credential queries into a single request. For example, a verifier could ask for:

* An mDL, and
* A separate credential (e.g., a PhotoID)

```json
{
  "credentials": [
    {
      "id": "mdl",
      "format": "mso_mdoc",
      "meta": {
        "doctype_value": "org.iso.18013.5.1.mDL"
      },
      "claims": [
        { "path": ["org.iso.18013.5.1", "family_name" ] },
        { "path": ["org.iso.18013.5.1", "given_name" ] },
        { "path": ["org.iso.18013.5.1", "birth_date" ] },
        { "path": ["org.iso.18013.5.1", "issue_date" ] },
        { "path": ["org.iso.18013.5.1", "expiry_date" ] },
        { "path": ["org.iso.18013.5.1", "issuing_country" ] },
        { "path": ["org.iso.18013.5.1", "issuing_authority" ] },
        { "path": ["org.iso.18013.5.1", "document_number" ] },
        { "path": ["org.iso.18013.5.1", "portrait" ] },
        { "path": ["org.iso.18013.5.1", "driving_privileges" ] },
        { "path": ["org.iso.18013.5.1", "un_distinguishing_sign" ] }
      ]
    },
    {
      "id": "pid",
      "format": "mso_mdoc",
      "meta": {
        "doctype_value": "eu.europa.ec.eudi.pid.1"
      },
      "claims": [
        { "path": ["eu.europa.ec.eudi.pid.1", "family_name" ] },
        { "path": ["eu.europa.ec.eudi.pid.1", "given_name" ] },
        { "path": ["eu.europa.ec.eudi.pid.1", "birth_date" ] },
        { "path": ["eu.europa.ec.eudi.pid.1", "birth_place" ] },
        { "path": ["eu.europa.ec.eudi.pid.1", "nationality" ] },
        { "path": ["eu.europa.ec.eudi.pid.1", "expiry_date" ] },
        { "path": ["eu.europa.ec.eudi.pid.1", "issuing_authority" ] },
        { "path": ["eu.europa.ec.eudi.pid.1", "issuing_country" ] }
      ]
    }
  ],
  "credential_sets": [
    {
      "options": [
        ["mdl", "pid"]
      ]
    }
  ]
}
```

## DCQL Syntax

* Top level
    * `credentials`: an array of credential descriptors the verifier is asking for or the wallet can present.
    * `credential_sets`: array of constraint groups (identified by `id` fields) that choose which credentials (or combos) must be presented.
* Per credential fields
    * `id` — local short identifier for this credential descriptor (e.g., `mdl`, `pid`).
    * `format` — transport/encoding hint (here "mso_mdoc" = mobile driving license mdoc).
    * `meta` — metadata used for filtering; here `meta.doctype_value` holds a canonical document type (e.g., `org.iso.18013.5.1.mDL`).
* claims (array)
    * Each entry lists a single requested claim (a claim selector).
    * `path` — an ordered array of path components that locate the claim inside the credential.
        * Example: `["org.iso.18013.5.1", "family_name"]` — first component is a claim namespace, second is the claim name.
    * Using an array for path makes it unambiguous and safe for names that contain dots or special characters.

### Combination of Credentials

`credential_sets` array is used to enforce the behaviour of credential combinations.

* Each `credential_set` has an options array.
* Each option is itself an array of credential ids (referencing descriptors in `credentials` array).

**Semantics:**

* For each `credential_set`, the wallet MUST pick exactly one option and present the credentials named in that option.
    * An option like `["mdl"]` means “present the mdl credential”.
    * An option like `["mdl", "pid"]` (two ids in one option) means “present both mdl AND pid together”.
    * When options contain multiple arrays (e.g., `[["mdl"],["pid"]]`) it means “present either mdl OR pid” (the verifier accepts either one).
* This lets verifiers express alternatives (OR) and combinations (AND) of descriptors.

## References

* OpenID for Verifiable Presentations 1.0 — Digital Credentials Query Language: [https://openid.net/specs/openid-4-verifiable-presentations-1_0-23.html#name-digital-credentials-query-l](https://openid.net/specs/openid-4-verifiable-presentations-1_0-23.html#name-digital-credentials-query-l)
* Multipaz Web Verifier: [https://verifier.multipaz.org](https://verifier.multipaz.org/)

By leveraging DCQL, you can compose flexible, privacy‑preserving requests that span multiple credentials and granular claims, without changing your client app once it supports the W3C DC API.
