---
title: Getting Started
description: Learn how to get started with Multipaz.
slug: /getting-started
sidebar_position: 2
pagination_label: Getting Started
hide_table_of_contents: false
---

import DocCardList from '@theme/DocCardList'

# Getting Started

Multipaz is an identity framework designed to handle secure, real-world credential issuance and verification. This guide helps developers to quickly get familiar with the APIs by walking you through the end-to-end identity flow -- from issuing a digital ID to verifying it across devices.

The guide follows the **Credential Lifecycle** – and the guidance to implement each of the steps
using Multipaz.

![Credential Lifecycle](/img/lifecycle.png#gh-light-mode-only)
![Credential Lifecycle](/img/lifecycle-dark.png#gh-dark-mode-only)

The "Credential Lifecycle" diagram illustrates the typical stages that a digital credential undergoes. It starts with Provisioning (Issuance), where the credential is created and issued. Next, the credential is stored by the holder. When needed, the holder can present the credential to a relying party (Presentation). The presented credential is then verified. Finally, there may be an optional step of Revocation & Status Checking, where the validity or status of the credential can be checked or revoked as needed.

![Credential Lifecycle](/img/roles.png#gh-light-mode-only)
![Credential Lifecycle](/img/roles-dark.png#gh-dark-mode-only)

We have split this guide into three parts. Each of which is split into the type of role you as a developer play in developing an app with Multipaz.

* Holder
    * On how to implement a digital wallet holder app.
    * This page covers the storage & presentation aspects of a digital identity lifecycle.
* Verifier
    * On how to implement a digital wallet verifier app.
    * This page covers how to request and validate verifiable credentials from users.
* Issuer
    * On how to deploy an issuance server.
    * This page focuses on how to issue verifiable credentials to users in a secure and standards-compliant way, following protocols like OpenID4VCI

The implementations used in this guide can be found [here](https://github.com/openmobilehub/multipaz-getting-started-sample). 

<div style={{
  background: "var(--ifm-background-surface-color)",
  padding: "2rem 1rem",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  marginTop: "2rem"
}}>
  <DocCardList />
</div>