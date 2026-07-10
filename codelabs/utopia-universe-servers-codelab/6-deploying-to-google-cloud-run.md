---
title: Deploying to Google Cloud Run
sidebar_position: 6
---

# Deploying to Google Cloud Run

So far you've run the Utopia Universe on your own machine. This page puts it on the public internet so
a wallet anywhere can reach it, using **Google Cloud Run**. The live
**[utopia.multipaz.org](https://utopia.multipaz.org)** instance is exactly this — a public deployment
of the bundle — so the steps below are how you'd stand up your own.

Utopia Universe is **one self-contained image**. Gradle already builds `multipaz-utopia/server-bundle` with all five services
plus the nginx proxy baked in — you build the image, push it, and deploy it once.

## How the bundle maps onto Cloud Run

A few things about the bundle shape your deployment, so it's worth being explicit:

- **One container, many processes.** The image runs five JVMs *and* nginx together. nginx listens on
  a hardcoded **port 8100** and proxies by path (`/dmv/`, `/bank_of_utopia/`, `/marketplace/`, ...). You
  tell Cloud Run to send traffic to 8100 with `--port 8100`.
- **Services find each other over `localhost`.** Because they're in the same container and discover
  one another on loopback, you must run **exactly one instance** (`--min-instances 1 --max-instances
  1`). Multiple instances would each get their own database and break cross-service enrollment.
- **Background work needs CPU.** The JVMs do work outside of request handling (startup, inter-service
  calls), so deploy with **CPU always allocated** (`--no-cpu-throttling`) and enough memory for five
  JVMs.
- **The filesystem is ephemeral — and that includes your keys.** The bundle stores its databases in
  SQLite under `/app/data`, and that's also where it keeps the certificate-authority root and each
  service's enrolled signing keys (see [Keys, trust, and data persistence](#keys-trust-and-data-persistence)).
  On Cloud Run the filesystem resets on restart, so for anything beyond a throwaway demo you must mount
  a persistent volume or those keys regenerate and previously issued credentials stop validating.

:::tip Prefer a VM for anything long-lived
Cloud Run is great for a public demo, but a single multi-process, single-instance container is really
a small VM in disguise. If you want durable data, a small **Compute Engine VM running `podman run`** is simpler.
This page covers Cloud Run because that's the managed, URL-in-one-command path.
:::

## Prerequisites

- A Google Cloud project with **billing enabled** and the **Cloud Run** and **Artifact Registry** APIs
  enabled.
- The **Google Cloud SDK** (`gcloud`) installed and authenticated (`gcloud auth login`).
- **Podman or Docker** and **Java 17+** locally, to build the image (as in
  [Run the Bundle](./2-run-the-bundle.md)).

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

## Step 1: Build the image for amd64

Cloud Run runs on x86_64, so build the amd64 variant from the repository root:

```bash
./gradlew :deployment:buildDockerImageAmd64
```

This produces a local image tagged `multipaz-utopia/server-bundle:latest-amd64`.

:::note
Use `buildDockerImageAmd64` even on an Apple Silicon Mac. The plain `buildDockerImage` task targets
your machine's native architecture, which might not run on Cloud Run.
:::

## Step 2: Push the image to Artifact Registry

Create a repository (once) and push the image you just built.

```bash
# Pick a region and reuse it everywhere below
REGION=us-central1
PROJECT_ID=$(gcloud config get-value project)

# Create an Artifact Registry Docker repo (one-time)
gcloud artifacts repositories create utopia \
  --repository-format=docker \
  --location=$REGION

# Let your container tool authenticate to Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev

# Tag the local image with its Artifact Registry name, then push
IMAGE=$REGION-docker.pkg.dev/$PROJECT_ID/utopia/server-bundle:latest
podman tag multipaz-utopia/server-bundle:latest-amd64 $IMAGE
podman push $IMAGE
```

Replace `podman` with `docker` if that's what you built with.

## Step 3: Deploy to Cloud Run

Deploy the image. Note `--port 8100` (the nginx port), the single-instance pinning, and the always-on
CPU:

```bash
gcloud run deploy multipaz-utopia \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --port 8100 \
  --memory 4Gi \
  --cpu 2 \
  --no-cpu-throttling \
  --min-instances 1 \
  --max-instances 1 \
  --allow-unauthenticated \
  --set-env-vars ADMIN_PASS=change-me,BASE_URL=https://placeholder
```

**Why these flags:**

- `--port 8100` — the port nginx listens on inside the container.
- `--memory 4Gi --cpu 2` — headroom for five JVMs plus nginx. Trim later if your logs show it's safe.
- `--no-cpu-throttling` — keeps CPU allocated between requests so background work and inter-service
  calls don't stall.
- `--min-instances 1 --max-instances 1` — the bundle is stateful and self-referential over
  `localhost`; never run more than one instance.
- `--allow-unauthenticated` — makes the demo publicly reachable. Drop it to require auth.
- `ADMIN_PASS` — **required** for any non-localhost deployment (the default password only applies to
  `http://localhost:8100`). `change-me` is shown only to keep the command runnable; use a real secret
  via Secret Manager instead — see [Keys, trust, and data persistence](#keys-trust-and-data-persistence).
- `BASE_URL=https://placeholder` — a throwaway value for the first deploy; you'll fix it in Step 4.

## Step 4: Set `BASE_URL` to the real service URL

`BASE_URL` is the single most important setting. OpenID4VCI credential offers and OpenID4VP
presentation requests embed **absolute URLs**, so the wallet must be told the exact public address it
should call back. You only learn that URL after the first deploy, so update it now:

```bash
SERVICE_URL=$(gcloud run services describe multipaz-utopia \
  --region $REGION --format='value(status.url)')

gcloud run services update multipaz-utopia \
  --region $REGION \
  --update-env-vars BASE_URL=$SERVICE_URL
```

:::caution
`BASE_URL` must be the **root** of the Cloud Run service URL (e.g. `https://multipaz-utopia-xxxxx.a.run.app`),
not a sub-path. The bundle's nginx already maps the issuer
`/.well-known/openid-credential-issuer/dmv` and `/.well-known/oauth-authorization-server/dmv` (and the
`bank_of_utopia` equivalents) at the domain root, so issuance works out of the box when `BASE_URL` is
the bare service URL. Deploying under a sub-path would require the extra nginx mappings described in
[`deployment/README.md`](https://github.com/openwallet-foundation/multipaz-utopia/blob/main/deployment/README.md).
:::

## Step 5: Verify

Open the service URL in a browser:

- `https://YOUR-SERVICE-URL/` — the Utopia landing page with links to every organization.
- `https://YOUR-SERVICE-URL/health` — returns `{"status":"ok"}` from nginx.
- `https://YOUR-SERVICE-URL/dmv/` and `/bank_of_utopia/` — issuer pages; scan a credential offer with
  a real wallet to confirm the full OpenID4VCI round-trip works against the public URL.
- `https://YOUR-SERVICE-URL/marketplace/` — run a checkout end to end.

## Keys, trust, and data persistence

### How trust is established (automatically)

- The **Registry acts as the certificate authority.** On first startup it creates a
  `CREDENTIAL_SIGNING` root certificate — the IACA root that wallets ultimately trust.
- Every other service **enrolls with the Registry** at startup. The `start-servers.sh` entrypoint
  passes `enrollment_server_url`, `ca_allow_enrollment`, and `ca_trust_servers` derived from your
  `BASE_URL`, so the DMV and Bank get credential-signing identities and UPay/Marketplace get a
  `PAYMENT_PROCESSOR` identity — all signed by the Registry root. No manual key exchange.
- The root certificate and each service's enrolled private keys are written to the **SQLite databases
  under `/app/data`** (`registry.db`, `dmv.db`, `bank_of_utopia.db`, ...).

### Why you must persist `/app/data`

Because those keys live on disk and Cloud Run's filesystem is ephemeral, a restart with no persistent
volume **regenerates the entire trust chain**: a new IACA root, new issuer keys. Credentials issued
before the restart will no longer validate against the new root, and wallets that pinned the old root
will reject the issuers. For anything past a throwaway demo, mount a Cloud Storage volume so the keys
(and data) survive (Cloud Run gen2):

```bash
gcloud run services update multipaz-utopia \
  --region $REGION \
  --add-volume name=utopia-data,type=cloud-storage,bucket=YOUR-BUCKET \
  --add-volume-mount volume=utopia-data,mount-path=/app/data
```

This mirrors the local `-v /your/db:/app/data` mount from the deployment README. Add a second volume
for `/app/logs` if you want logs to survive too.

:::tip Keep the seed records, too
On a fresh `/app/data` the Registry loads its seed identities from `/app/init/records.json`; once the
volume persists, it skips re-seeding. If you change seed data, start from an empty bucket so it
reloads.
:::

### Set `ADMIN_PASS` from Secret Manager

`ADMIN_PASS` protects the Registry's admin endpoints and the issuers' admin operations, and is
**required** off-localhost. Don't bake it into `--set-env-vars`. Store it in Secret Manager and mount
it:

```bash
# Create the secret once
printf 'a-strong-password' | gcloud secrets create utopia-admin-pass --data-file=-

# Grant the Cloud Run service account access, then wire it in as the ADMIN_PASS env var
gcloud run services update multipaz-utopia \
  --region $REGION \
  --update-secrets ADMIN_PASS=utopia-admin-pass:latest
```

### Optional: accept a custom wallet client

Each issuer's `default_configuration.json` (under `organizations/dmv/...` and
`organizations/bank_of_utopia/...`) carries a `trusted_client_assertions` block — the **public** keys
of wallet clients the issuer trusts for OAuth client authentication. The checked-in defaults already
trust the standard Multipaz wallet, so most deployments change nothing here. If you issue to a
**custom wallet**, add that client's public JWK (its `kid` as the map key, `kty`/`crv`/`x`/`y`, no
private `d`) to this block and rebuild the image.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Container fails to start / "failed to listen on PORT" | Make sure you deployed with `--port 8100`; nginx listens there, not on 8080. |
| Wallet can't complete issuance / redirects to `localhost` | `BASE_URL` is wrong. Re-run Step 4 so it equals the exact public service URL. |
| Issuance fails only for `.well-known` lookups | You deployed under a sub-path. Use the bare service URL, or add the nginx `.well-known` mappings from `deployment/README.md`. |
| Enrollment / cross-service errors after scaling | More than one instance is running. Enforce `--min-instances 1 --max-instances 1`. |
| Sluggish or stalled background calls | Add `--no-cpu-throttling` and/or raise `--cpu`. |
| Wallets reject the issuer / old credentials stop validating after a restart | `/app/data` wasn't persisted, so the IACA root regenerated. Mount the Cloud Storage volume, then re-issue. |
| Data gone after a redeploy | Expected on Cloud Run without a volume — set up the Cloud Storage mount above, or deploy to a Compute Engine VM. |

## Summary

You built the Utopia Universe as a single amd64 image, pushed it to Artifact Registry, and deployed it
to Cloud Run as a one-instance, always-on service on port 8100 — then pointed `BASE_URL` at its public
URL so wallets can complete issuance and presentation against it. You also handled the things a real
deployment needs: an `ADMIN_PASS` from Secret Manager, and a persistent `/app/data` volume so the
auto-enrolled CA root and issuer keys survive restarts. The entire ecosystem — issuers, verifier,
registry, and payment processor — is now reachable at one HTTPS address.
