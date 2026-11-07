// Deliberately not a copyable implementation.
//
// Before creating a URI-scheme presentment activity:
// 1. Look up the activity base type and required override in current Multipaz KDoc.
// 2. Find the current URI-scheme sample and manifest entry with rg in the target
//    checkout.
// 3. Verify the selected Ktor engine and presentment source against the target's
//    dependencies and source sets.
// 4. Keep Android activity and manifest wiring out of commonMain.
