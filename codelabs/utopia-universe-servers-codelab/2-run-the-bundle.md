---
title: Run the Bundle
sidebar_position: 2
---

# Run the Bundle

All five organizations are packaged into a **single container image** that runs them behind an nginx
proxy. One build, one run, and the whole Utopia Universe is online.

## Build the image

From the repository root:

```shell
# Build for your machine's architecture (fastest)
./gradlew :deployment:buildDockerImage
```

This collects each server's thin JAR plus shared dependencies, builds the Registry web frontend
(Kotlin/JS), and bakes them into an image tagged `multipaz-utopia/server-bundle:latest`.

To target a specific architecture (for deploying to a server later):

```shell
./gradlew :deployment:buildDockerImageAmd64   # x86_64 cloud VMs
./gradlew :deployment:buildDockerImageArm64   # Apple Silicon, AWS Graviton
```

Confirm the image exists:

```shell
podman images
```

```
REPOSITORY                               TAG       IMAGE ID      SIZE
localhost/multipaz-utopia/server-bundle  latest    d08ca1918001  581 MB
```

## Run it locally

:::tip Just want to see it? It's already live
A public instance of the whole Utopia Universe runs at
**[utopia.multipaz.org](https://utopia.multipaz.org)**. If you'd rather not build and run the bundle
yourself, issuing, verifying, and paying all work against the hosted instance too.
:::

```shell
podman run --rm -p 8100:8100 multipaz-utopia/server-bundle:latest
```

Then open **http://localhost:8100** in your browser. You'll see the Utopia landing page linking to
each organization. All services are reachable through the proxy on port `8100`:

| Service        | URL                                     |
| -------------- | --------------------------------------- |
| Web frontend   | `http://localhost:8100/`                |
| Registry       | `http://localhost:8100/registry/`       |
| Utopia DMV     | `http://localhost:8100/dmv/`            |
| Bank of Utopia | `http://localhost:8100/bank_of_utopia/` |
| UPay           | `http://localhost:8100/upay/`           |
| Brewery        | `http://localhost:8100/brewery/`        |

Press `Ctrl+C` from the terminal to stop.

## Configuration

The bundle is configured through environment variables passed to `podman run` with `-e`:

| Variable     | Default                 | Description                                                                     |
| ------------ | ----------------------- | ------------------------------------------------------------------------------- |
| `BASE_URL`   | `http://localhost:8100` | Base URL embedded in protocol messages (credential offers, presentation requests) |
| `MODE`       | `proxy`                 | `proxy` for nginx routing, `direct` for port-only access to individual services |
| `ADMIN_PASS` | `multipaz`              | Admin password; the default is only safe for localhost                          |

:::caution
`BASE_URL` matters more than it looks. OpenID4VCI and OpenID4VP embed absolute URLs in the offers and
requests a wallet scans. If you reach the bundle at anything other than `http://localhost:8100`
(for example from a phone on your LAN, or behind a tunnel), set `BASE_URL` to that exact externally
reachable address, or the wallet won't be able to call back.
:::

## Running a single service (optional)

You don't need the container to iterate on one organization. Each backend has a Gradle `run` task,
which is handy when you're editing its code:

```shell
./gradlew :organizations:brewery:backend:run
```

Note that this is not a complete service independently. Since brewery depends on registry and upay,
you won't be able to complete settlement whilst running like this.

## Run on a real Android device

To use the bundle from a physical phone, the wallet has to reach your computer. The cleanest way is
**`adb reverse`**, which tunnels the Android device's own `localhost` back to your machine — so you don't have
to expose the bundle on your LAN or change `BASE_URL` at all. Because the device sees the bundle at
exactly `http://localhost:8100`, the absolute URLs embedded in credential offers and presentation
requests keep resolving correctly.

1. Connect the device over USB and enable **USB debugging** (Settings → Developer options → USB
   debugging). Approve the "Allow USB debugging?" prompt on the phone.
2. Confirm your machine sees it:

   ```shell
   adb devices
   ```

3. Forward the bundle's proxy port (`8100`) from the device to your machine:

   ```shell
   adb reverse tcp:8100 tcp:8100
   ```

4. On the device, open **http://localhost:8100** — you'll get the same Utopia landing page, now
   reachable by the wallet for scanning credential offers and running a checkout.

:::note
Use port `8100` (the nginx proxy that fronts every service), not an individual service port like
`8010` — issuance lives at `/dmv/` and `/bank_of_utopia/`, which are only reachable through the proxy.
Re-run `adb reverse` after reconnecting the device.
:::

With the bundle running and reachable from your wallet, move on to **Issue Credentials** to mint an
mDL and a payment card.