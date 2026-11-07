// This file is deliberately a review checklist, not a paste-ready implementation.
// A CombinedNfcService requires three version-matched service implementations and a
// host-APDU XML resource. Supplying only the combined service produces unusable code.
//
// Before implementing Android NFC:
// 1. Resolve the NFC service APIs in current Multipaz KDoc.
// 2. Use rg to find the current Android NFC services, APDU XML, manifest entries,
//    and tests in the target checkout.
// 3. Adapt its app initialization, PresentmentSource, prompt model, transport
//    options, and consent lifecycle to the target app; do not copy test-app globals.
// 4. Add a matching res/xml/combined_nfc_service.xml and manifest service entry.
// 5. Keep all resulting code in androidMain or the Android application module.
//
// Multipaz NFC credential presentation is currently Android-only.
