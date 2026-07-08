---
title: CredentAgent SDK
description: The consent layer for AI agents — make an agent prove a verifiable credential from the user's wallet before it completes a consequential action.
sidebar_position: 1
pagination_label: CredentAgent SDK
hide_table_of_contents: false
---

# CredentAgent SDK

> **The consent layer for AI agents.** AI agents are learning to *act* — make them
> **ask first**.

Agents can now check out a cart, unlock age-restricted content, or grant access —
often with nothing standing between the request and the action. **CredentAgent**
puts a **human-in-the-loop credential check** in front of that moment: before a
consequential action completes, the agent must prove a **verifiable credential from
the user's phone wallet**.

The key idea: **identity leads, and payment is just one application.**
`age.over(21)`, a loyalty membership, a prescription, and `payment.in("usd")` are
all just credentials in the same policy — expressed the same way, enforced the same
way.

**Repository:** [openmobilehub/credentagent](https://github.com/openmobilehub/credentagent) ·
**Website:** [credentagent-website](https://openmobilehub.github.io/credentagent-website/#how)

:::note Design preview (v0.1)
The packages are real, tested, and `npm`-installable — extracted from the working
[Product Picker reference server](/docs/agentic/human-present). Today the gate
enforces credential **disclosure and binding** (WebAuthn / OpenID4VP wire crypto is
real), but not yet **issuer trust** — so treat it as a *flow demo*, not a production
safety control. Issuer-verified mdoc trust is on the roadmap.
:::

## How it works

CredentAgent enforces the check **server-side, on the completion path** — hiding a
button is not enforcement. The flow is three steps:

1. **The tool mints a link.** On a sensitive action (e.g. `checkout`), the tool
   returns a checkout link **plus** a serializable `requires` manifest describing
   which credentials are needed.
2. **The user proves it.** In their browser or wallet, the user presents the
   credential — a WebAuthn passkey for user-presence, or an OpenID4VP / W3C Digital
   Credentials presentation from a mobile wallet ([Multipaz](https://github.com/openwallet-foundation/multipaz)).
3. **The agent proceeds.** The agent polls and only completes once the server has
   verified the presentation. Payment settles **last**.

## The two packages

CredentAgent is two npm packages plus a reference demo. The **Gate** is
host-agnostic; the **Storefront** is a ready-made host that shows the Gate in a full
agentic-commerce flow.

| Package | What it does | Install |
| :-- | :-- | :-- |
| `@openmobilehub/credentagent-gate` | The **Gate** — `new CredentAgent()` + `credentagent.mount(app)` wires the wallet-ceremony rails and resolves a typed credential policy into a serializable `requires` manifest. Mounts on any Express-shaped app. | `npm install @openmobilehub/credentagent-gate` |
| `@openmobilehub/credentagent-storefront` | The **Storefront** — `createStorefront()` stands up a runnable MCP shopping server (nine tools + a widget) that the Gate mounts onto. Bring your own host, or start here. | `npm install @openmobilehub/credentagent-storefront @openmobilehub/credentagent-gate` |

Both are Apache-2.0, ESM, ship their own types, and target Node ≥ 20.

## Quickstart

A credential-gated agentic storefront in about 10 lines. `createStorefront()`
publishes the ceremony seams, `new CredentAgent().mount()` wires the real
`/credentagent/*` rails, and `store.gate()` resolves your policy on every `checkout`:

```ts
import { createStorefront } from "@openmobilehub/credentagent-storefront/server";
import { CredentAgent, age, membership, payment, required, optional } from "@openmobilehub/credentagent-gate";

const store = createStorefront();                  // the storefront — one line
const credentagent = new CredentAgent();           // zero-config (defaults to http://localhost:3000)
credentagent.mount(store.app);                     // wires the real /credentagent/* ceremony rails

store.gate((order) =>                              // resolved on every checkout
  credentagent.requirements(order, [
    required(age.over(21).when((order) => order.lines.some((l) => l.minimumAge != null))),
    optional(membership.discount(10)),             // 10% off if a loyalty credential is presented
    required(payment.in("usd")),                   // amount derived from the order; settles last
  ]),
);

const { url } = await store.listen(3005);          // → add http://localhost:3005/mcp to Claude / ChatGPT / Goose
```

Add the whiskey (21+) to the cart and check out → the tool returns the checkout link
**plus** a `requires` manifest → the buyer proves age (and optionally membership),
authorizes payment, and the widget shows the confirmation. Swap in the headphones
and the age gate drops — the `.when()` predicate receives the **order** and is false.
Custom gates beyond the built-ins are defined with `defineCredential()` / `dcql()`.

## Where it runs

- **Agent hosts** — Claude (native app, web, desktop), ChatGPT, Goose, and any other
  MCP host: add the storefront's `/mcp` URL as a custom connector.
- **Wallets** — Android & iOS via the Multipaz wallet for OpenID4VP credential
  presentation, plus WebAuthn passkeys in the browser.

For the full browse → cart → credential gate → checkout → settlement flow in action,
see [Human Present](/docs/agentic/human-present), the reference implementation these
packages were extracted from.

## Learn more

- **Repository:** [openmobilehub/credentagent](https://github.com/openmobilehub/credentagent)
- **Website & "how it works":** [credentagent-website](https://openmobilehub.github.io/credentagent-website/#how)
- **Reference demo:** [openmobilehub/mcp-apps-shopping-demo](https://github.com/openmobilehub/mcp-apps-shopping-demo)

CredentAgent is an [Open Mobile Hub](https://openmobilehub.org) project (a Linux
Foundation / OpenWallet Foundation effort), built in collaboration with the Multipaz
team.
