# OpenID4VCI Integration Checklist

Reference: [references/openid4vci.md](../../../references/openid4vci.md)
Current API and source discovery: [references/upstream-source.md](../../../references/upstream-source.md)

- Confirm whether the task is wallet-side provisioning, a local test backend, or a real issuer integration.
- Resolve holder and issuer public APIs in current KDoc before writing code.
- Locate the current holder sample and server-side implementation with `rg`.
- Do not embed production assertion or attestation keys in app code.
- Keep redirect handling, deep links, and app links version-matched to the target project.
- Re-run dependency inspection after edits.
