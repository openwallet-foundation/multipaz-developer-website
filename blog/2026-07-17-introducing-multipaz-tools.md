---
title: "Introducing Multipaz Tools: Private, In-Browser Identity Debugging"
description: "We are excited to launch tools.multipaz.org, a private-by-design suite of debugging tools built with Kotlin/JS."
date: 2026-07-17
---

_Written by [David Zeuthen](https://www.linkedin.com/in/davidz25/), Multipaz project leader._

We are excited to announce the launch of **[tools.multipaz.org](https://tools.multipaz.org)**, a web-based suite of tools designed to make working with digital identity payloads—such as **ISO 18013-5 mDocs, CBOR/COSE structures, and SD-JWT tokens**—easier than ever. This new application leverages the fact that the core **[Multipaz SDK](https://github.com/openwallet-foundation/multipaz)** is written in Kotlin Multiplatform. Because the codebase is multiplatform by design, compiling the SDK to Kotlin/JS was a natural step, allowing us to run the exact same cryptographic, parsing, and validation logic natively inside the browser that runs on Android, iOS, and server backends minting and verifying credentials.

<!-- truncate -->

A key design principle of Multipaz Tools is that **all data stays entirely in your browser**. Unlike many online decoders that send your inputs to a backend server for processing and analysis, all validation and decoding happen locally on your own machine. This local-only architecture is a massive advantage when dealing with digital credentials, which by their very nature contain highly sensitive Personally Identifiable Information (PII). By doing all processing client-side, developers can debug their payloads with peace of mind, knowing that no PII is ever transmitted, stored, or logged on a remote server.

These utility decoders address a critical need for developers integrating Multipaz across all three phases of the classic identity three-party model. Whether you are building holder wallets (verifying credential storage and engagement configurations), developing relying party/verifier endpoints (inspecting requested claims and presentations), or configuring issuer systems (ensuring signed documents conform to standard formats), having a quick, secure way to decode and analyze payloads in real-time streamlines the entire integration cycle.

Finally, we have a fun detail to share: the first version of this tools app (as seen in **[this Pull Request](https://github.com/openwallet-foundation/multipaz/pull/1815)**) was written entirely by **[Antigravity](https://antigravity.google/)**, in just a couple of hours. We believe this rapid implementation was in large part due to the excellent documentation, clear code structure, and clean API design of the Multipaz SDK itself, which makes it straightforward for both human developers and AI agents to understand and build upon. We invite you to head over to **[tools.multipaz.org](https://tools.multipaz.org)** and try it out!

---

### Multipaz Tools Interface

Here is a screenshot showing the Multipaz Tools interface in action:

![Screenshot of Multipaz Tools](/img/tools-screenshot.png)
