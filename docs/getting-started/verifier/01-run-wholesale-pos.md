---
title: ▶️ Run the Wholesale POS Demo
---

The [Multipaz Wholesale POS](https://github.com/openwallet-foundation/multipaz-samples/tree/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS) is the complete implementation behind this guide.

:::warning Demo, not a production deployment
The sample uses development configuration, including local HTTP and a development attestation
policy. A production terminal needs hardened device-attestation requirements, TLS, managed payment
keys, and a governed issuer-trust configuration.
:::

## Prerequisites

You need:

- A running [Multipaz Utopia](https://github.com/openwallet-foundation/multipaz-utopia/) records server with a payment-processor trust root, seeded payer and merchant accounts, and a trusted DPC issuer.
- A wallet with a DPC issued by that trusted issuer.
- An Android device or emulator with `adb` available.

## 1. Start Multipaz Utopia Server

Run the Utopia records server directly:

```bash
cd /path/to/multipaz-utopia
./gradlew run
```

- It starts the Utopia services, including the records server on `http://localhost:8004`, which matches the POS backend's default configuration.

Alternatively, build and run the Docker bundle:

```bash
cd /path/to/multipaz-utopia
./gradlew :deployment:buildDockerImage
docker run --rm -p 8100:8100 multipaz-utopia/server-bundle:latest
```

- It starts the bundled Utopia environment behind port `8100`; its Registry is available at `http://localhost:8100/registry/`.

## 2. Start the terminal backend

From the POS project directory, start the terminal backend. It starts the terminal backend on its configured port and makes the attested payment RPC endpoint available to the POS app. For a directly running records server:

```bash
./gradlew :terminalBackend:run
```

For the Docker bundle, you would want to point the backend at its proxied Registry instead to override the URL (the backend appends its
`/rpc` endpoint automatically.):

```bash
./gradlew :terminalBackend:run --args="-param records_server_url=http://localhost:8100/registry"
```

## 3. Install the POS terminal app

Install the Android terminal and route its localhost traffic to the backend:

```bash
./gradlew :androidApp:installDebug
adb reverse tcp:8110 tcp:8110
```

## 4. Issue a DPC from the Utopia Bank

Issue a DPC from the Utopia Bank to a wallet backed by a seeded payer account. The Registry trusts
only its enrolled issuer root, so a DPC issued under another root will be declined at settlement.

- Open the Utopia Bank page in your holder device (you might want to do `adb reverse` if the server is running locally)
- Issue the Payment Credential to your holder

## 5. Complete the POS settlement:

1. Open the POS app and enter an amount.
2. Select **CHECKOUT NOW**.
3. Present the wallet's DPC through NFC, or switch to QR and scan the wallet's `mdoc:` QR code.
4. Confirm that the POS reports **SETTLED / TRANSACTION VERIFIED** and that the merchant account
   shows the transaction in the records-server UI.

<!-- note to self - screenshots here -->

With the Docker bundle, inspect the merchant account (`Utopia Wholesale POS`, account `20000001`)
at `http://localhost:8100/registry/` to confirm the funds moved.

For Utopia startup, Docker deployment, DPC issuance, configuration values, and troubleshooting, use
the [POS README](https://github.com/openwallet-foundation/multipaz-samples/blob/b68116fb8b8f6b3f0dc41b6a80efa2a9e4a5d8a5/MultipazWholesalePOS/README.md).