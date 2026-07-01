---
title: Issue Credentials
sidebar_position: 3
---

# Issue Credentials

The Brewery checkout you'll build to later needs two things in the wallet: a **government ID** to
prove age, and a **payment credential** to pay. Utopia issues both. In this step you'll get an mDL
from the **DMV** and a payment card from the **Bank of Utopia**.

Both are OpenID4VCI issuers. The wallet drives the flow; the server's job is to publish a credential
offer, authorize the request, and mint the credential from the Registry's records.

## Issue an mDL from the DMV

1. On the device, open **`http://localhost:8100/dmv/`** (set up in
   [Run on a real Android device](./2-run-the-bundle.md#run-on-a-real-android-device)).
2. Select the **driver's license** credential.
3. Choose **credential offer using a custom URL scheme**. Because you're browsing on the device
   itself, this deep-links the offer straight into the wallet — no QR scan needed. Pick the
   **Multipaz wallet** if you're prompted to choose an app.
4. The wallet opens at the **authorization** step. Continue, then select the **identity** to issue
   the credential for.
5. The wallet completes the OpenID4VCI exchange — authorization, then credential request — and
   provisions an **mDL** (`org.iso.18013.5.1.mDL`) signed by Utopia's issuing authority.

When issuance completes, the server's `IssuerAssistant` hook fires. Watch the container logs and
you'll see the DMV record it:

```
DmvIssuerAssistant: Issued credential id=... format=mso_mdoc
```

That hook is the seam where a real DMV would push the event to an audit log or fraud pipeline. You'll
implement against it in **[Extend the Servers](./5-extend-the-servers.md)** section.

## Issue a payment card from the Bank of Utopia

Repeat the same flow against the bank:

1. Open **`http://localhost:8100/bank_of_utopia/`** on the device.
2. Select the **payment card** credential.
3. Choose **credential offer using a custom URL scheme** and pick your wallet app; you're redirected
   for **authorization**.
4. Select the **identity** and the **card type** to issue.
5. The wallet provisions a **payment credential** (`org.multipaz.payment.sca.1`) — the digital
   equivalent of a payment card, linked to a UPay account.

:::note Where the data comes from
Issuers don't invent identity data — they read it from a **system of records**. In Utopia that's the
**Registry**, browsable at `http://localhost:8100/registry/`. When the DMV mints your mDL or the Bank
mints your payment card, the field values (name, birth date, account reference) are drawn from a
Registry person record. In a real deployment this is the DMV's database or the bank's core banking
system.
:::

You now hold two credentials in your wallet, issued by two independent Utopia organizations. Next
you'll use them: the **Brewery** will verify your age and charge your payment credential in a single
OpenID4VP exchange using DCQL.