# Credential Presentation

## Use this when

- implementing wallet presentment
- building consent and presentment-source logic
- adding QR, BLE, browser, or Digital Credentials entry points

## Current-source discovery

Resolve public presentment APIs in [Multipaz KDoc](https://developer.multipaz.org/kdocs/index.html),
then use `rg` to locate current consent, URI-scheme, Digital Credentials, and
proximity-presentment samples or tests in the target checkout.

## Keep these distinctions clear

- OpenID4VP is a protocol, not a transport.
- DCQL is a query language, not a transport.
- QR and BLE are engagement or transport mechanisms depending on the flow.
- NFC credential presentation is currently Android-only in Multipaz.

## QR holder presentment

For a Compose holder, use the current KDoc and a current sample to select the
presentment API and its settings. Do not hand-build a device-engagement QR or
encode a credential in it. Confirm that the wallet contains a credential whose
format, document type, and claims satisfy the verifier request before starting
presentment.

## Validation

- Verify that the selected presentment mechanism exists in the current Multipaz version and sample set.
- For QR holder presentment, build and install the app, generate the QR code, scan it with a compatible mdoc verifier on another device, approve consent in the holder, and verify the reader receives and validates the credential. Treat this physical verifier pass as required; compilation and QR display alone are insufficient.
- Test cancellation while the QR is displayed or while waiting for the reader.
- For Android NFC, validate compile-time integration and note that runtime behavior usually needs physical hardware.
