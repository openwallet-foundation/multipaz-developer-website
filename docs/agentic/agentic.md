---
title: Agentic
description: How AI agents and LLMs interact with digital credentials using Multipaz.
slug: /agentic
sidebar_position: 5
pagination_label: Agentic
hide_table_of_contents: false
---

import DocCardList from '@theme/DocCardList'

# Agentic

:::info Work in Progress
This section is under active development. New topics and guides will be added as
the work lands.
:::

AI agents and large language models (LLMs) are increasingly able to act **on a
user's behalf** — browsing catalogs, filling carts, booking, and paying through
tools exposed over the [Model Context Protocol (MCP)](https://modelcontextprotocol.io).
As soon as an agent touches a real-world transaction, it runs into **identity**:
proving age, applying a loyalty membership, or authorizing a payment. These steps
can't be hallucinated — they need verifiable, cryptographically-backed claims.

This is where Multipaz fits into the agentic stack. Instead of the agent
asserting "the user is over 21," the flow **requests a digital credential** and
the user presents it from their wallet (selective disclosure, bound per request).
The agent orchestrates the conversation; the credential layer provides the proof.
The result is agentic experiences that can transact while keeping the human in
control of their identity and money.

## The CredentAgent SDK

[**CredentAgent**](/docs/agentic/credentagent) is the **consent layer for AI
agents** — the SDK that puts a credential check in front of an agent's
consequential actions. Before an agent completes a payment, an age gate, or an
access grant, CredentAgent makes it **prove a verifiable credential from the
user's wallet**, enforced server-side. Its guiding principle: *identity leads, and
payment is just one application* — age, membership, and payment are all just
credentials in the same typed policy. It ships as two npm packages (a host-agnostic
**Gate** and a ready-made **Storefront**) and runs across Claude, ChatGPT, and Goose.

## Interaction models

How a person participates in the flow defines the interaction model:

* **Human Present** — a person is in the loop to approve the sensitive steps:
  presenting a credential from their wallet and authorizing payment (for example
  with a passkey / biometric). This is available today, demonstrated by the
  [Product Picker reference app](/docs/agentic/human-present).

More interaction models will be documented here as they mature.

<div style={{
  background: "var(--ifm-background-surface-color)",
  padding: "2rem 1rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginTop: "2rem"
}}>
  <DocCardList />
</div>
