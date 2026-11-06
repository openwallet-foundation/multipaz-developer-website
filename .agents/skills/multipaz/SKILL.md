---
name: multipaz
license: Apache-2.0
compatibility: Resolve public APIs from the current Multipaz KDoc and integration details from the target checkout's current samples and tests. Do not treat this skill as an API reference.
metadata:
  version: "1.0.0"
description: Use this skill for Multipaz, ISO mdoc or mDL, OpenID4VCI, OpenID4VP, DCQL, W3C Digital Credentials API, credential holder, verifier, issuer, QR presentation, BLE presentation, Android NFC credential presentation, Kotlin Multiplatform wallet, or Swift and Compose integration work built on the Multipaz repository or released modules. Apply it when a task needs module selection, version-aware implementation, project inspection, platform integration, troubleshooting, or migration for Multipaz. Do not use it for unrelated Kotlin work. Never claim that Multipaz NFC credential presentation works on iOS.
---

# Multipaz

Use this skill when the task is about integrating, upgrading, debugging, or validating Multipaz in a Kotlin Multiplatform, Android, iOS, SwiftUI, Compose Multiplatform, server, issuer, holder, or verifier project.

## Rules

- Treat the target repository as the primary source of truth. Resolve every public type, constructor, property, and function from the [current Multipaz KDoc](https://developer.multipaz.org/kdocs/index.html) before generating code. Inspect the target checkout's current code, tests, samples, and build files for integration details.
- Inspect the target project before editing it: read its build configuration, dependency declarations, source sets, and relevant platform entry points. Use [references/project-inspection.md](references/project-inspection.md) to guide the inspection; keep purely explanatory work scoped to the files needed to answer the question.
- Check version compatibility before generating code. Do not silently upgrade Multipaz or unrelated dependencies.
- Keep Android-only code in `androidMain` or Android app modules. Keep iOS-only code in `iosMain` or native Swift code. Keep shared logic in `commonMain` only when the APIs are actually multiplatform.
- Multipaz NFC credential presentation is currently Android-only. Never generate iOS NFC presentation code, never claim feature parity, and never tell the user to add iOS NFC entitlements for a Multipaz NFC presentment flow. Do not over-correct into "no NFC on iOS": upstream ships CoreNFC-backed tag *reading* for the verifier role under `multipaz/src/iosMain`, which does not change the presentment boundary. See [references/ios-platform.md](references/ios-platform.md).
- Prefer minimal dependency changes and reuse project conventions such as version catalogs, convention plugins, included builds, or direct dependency style already present in the target project.
- Do not invent APIs, Maven coordinates, Gradle modules, package names, or platform requirements. KDoc describes public APIs; source, samples, and build files establish implementation wiring and dependencies.
- Any type names, paths, or module names in the reference files are discovery
  hints only. Confirm them with current KDoc and `rg`; do not copy them as API
  or build guidance.
- Apply security-sensitive workflows conservatively. Do not hardcode production secrets, commit private keys, disable TLS validation, log complete credentials, or treat parsing success as trust.

## Workflow

1. Inspect the project.
   Read [references/project-inspection.md](references/project-inspection.md) and [references/dependency-guide.md](references/dependency-guide.md). Locate and read the target project files directly, using `rg` or equivalent search tools to identify modules, versions, dependencies, and platform wiring.
2. Classify the work.
   Decide whether the task is setup, issuance, storage, presentment, verification, verifier request construction, server integration, migration, or troubleshooting.
3. Load only the relevant references.
   Use the routing list below instead of loading everything.
4. Select modules and samples.
   Match the requested workflow to the target project's current modules, samples, and tests. Resolve public APIs in current KDoc; do not copy a signature, dependency, or platform requirement from this skill.
5. Respect source-set and platform boundaries.
   Shared document logic can live in `commonMain`; Android NFC services and manifest wiring must stay Android-specific; iOS wallet or Digital Credentials work must follow the supported Swift or `iosMain` paths.
6. Implement with validation in mind.
   Add the smallest necessary dependency and code change, re-check dependency alignment and source-set boundaries, then run the affected modules' existing build and test tasks. See Validation below.
7. For OpenID4VCI holder work, verify the complete platform handoff.
   Do not stop at parsing an offer. Confirm app initialization, transport, trusted wallet attestation, OAuth/browser authorization, redirect capture, and document-store insertion. Read [references/openid4vci.md](references/openid4vci.md).
8. For iOS browser-launched OpenID4VCI offers, verify both URL scheme registration and the SwiftUI/UIKit URL callback into shared code.
   Read [references/ios-platform.md](references/ios-platform.md).
9. Report completion.
   State the Multipaz version evidence you used, modules changed, platform capability boundaries, validation run, and any unsupported or deferred work.

## Reference Routing

- Current API and source discovery: [references/upstream-source.md](references/upstream-source.md)
- Architecture and module discovery: [references/architecture.md](references/architecture.md)
- Project inspection and dependency style: [references/project-inspection.md](references/project-inspection.md), [references/dependency-guide.md](references/dependency-guide.md)
- Credential formats and document modeling: [references/credential-model.md](references/credential-model.md)
- Issuance and provisioning: [references/credential-issuance.md](references/credential-issuance.md), [references/openid4vci.md](references/openid4vci.md)
- Presentment: [references/credential-presentation.md](references/credential-presentation.md), [references/proximity-presentation.md](references/proximity-presentation.md), [references/openid4vp.md](references/openid4vp.md), [references/digital-credentials-api.md](references/digital-credentials-api.md)
- Verifier requests and request design: [references/verifier-workflows.md](references/verifier-workflows.md), [references/dcql.md](references/dcql.md)
- Trust, certificates, and secure storage: [references/trust-and-certificates.md](references/trust-and-certificates.md)
- Platform specifics: [references/android-platform.md](references/android-platform.md), [references/ios-platform.md](references/ios-platform.md)
- Upgrades and breakage analysis: [references/migration-guide.md](references/migration-guide.md)
- Failure analysis: [references/troubleshooting.md](references/troubleshooting.md)

## Implementation Guardrails

- For Android NFC, locate the current NFC services, manifest entries, and tests in the target checkout before writing code. Do not rely on a path or class name from this skill.
- For iOS, use supported alternatives such as QR presentment, BLE-backed proximity, browser or URI-scheme flows, or Identity Document / Digital Credentials integration only after verifying the requested path in the selected version.
- When the user asks for cross-platform NFC, explain the platform split clearly: Android supported, iOS not currently supported for Multipaz NFC credential presentation.
- For Android OpenID4VCI, initialize Multipaz with the Android application context before using `Platform` storage or secure areas, add network permission for real issuers, and wire both the credential-offer scheme and the OAuth redirect scheme.
- For iOS OpenID4VCI links from Safari or an issuer website, register the offer and redirect schemes in `Info.plist`, forward opened URLs through `.onOpenURL` or an equivalent UIKit callback, and wire OAuth challenges so `Issue from offer` opens the authorization URL and resumes provisioning from the redirect matched by `state`.
- For public/demo issuers, do not assume locally generated attestation keys are trusted. Use version-matched sample test keys only for demos, a registered wallet backend for real integrations, or a local issuer configured to trust test keys.
- Keep upgrade work separate from feature work unless the user explicitly asked for both.

## Validation

- Re-read changed dependency declarations and follow version-catalog aliases or convention plugins to their definitions. Check each public API against current KDoc, and cite the actual source, sample, or test files supporting integration conclusions.
- Select targeted build and test tasks from the project's build files or documented commands. If task names are unclear, inspect `./gradlew :<module>:tasks --all` for an actual module.
- A task listing or Gradle `--dry-run` checks task selection, not compilation or tests. Report unavailable checks and tasks with no test sources accurately.
- For OpenID4VCI or other holder flows that construct `HttpClient`, verify platform Ktor client engines are declared and, when possible, run an Android or iOS launch smoke test. Compile can pass while `HttpClient()` still fails at runtime without an engine.
- For Android OpenID4VCI real-issuer testing, verify the offer fills the app, tapping issue opens browser authorization when required, the issuer redirects back into the app, and the issued credential appears in the document store.
- For Android NFC work, note that runtime validation usually requires physical hardware.
- Do not attempt to validate an iOS Multipaz NFC implementation because that workflow is currently unsupported.

## Completion Report

Always include:

- the KDoc symbols and current source evidence inspected
- the modules and source sets used
- the samples or tests used as implementation anchors
- the platform-support matrix for the requested workflow
- the validation commands run and what they proved
- any unsupported requests, especially iOS NFC presentment
