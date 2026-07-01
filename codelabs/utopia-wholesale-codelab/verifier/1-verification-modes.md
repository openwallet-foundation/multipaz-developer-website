---
title: Verification Modes
sidebar_position: 2
---

import ThemedIframe from '../../../src/components/ThemedIframe';

# Verification Modes

LoyaltyReader only supports one type of verification mode: **Utopia Wholesale Membership**

This mode requests the following identification details from a Loyalty Credential:

- `family_name`: Last name, surname, or primary identifier, of the document holder
- `given_name`: First name(s), other name(s), or secondary identifier, of the document holder
- `portrait`: Photo of Holder
- `membership_number`: Person identifier of the Loyalty ID holder
- `tier`: Membership tier (basic, silver, gold, platinum, elite)
- `issue_date`: Date when document was issued
- `expiry_date`: Date when document expires

## Query Selection Implementation  

When a user performs a request, a corresponding query is executed in [`ReaderQuery.kt`](https://github.com/openwallet-foundation/multipaz-identity-reader/blob/deb29cfec63d507b1276f9ab12c74a414679db1a/libfrontend/src/commonMain/kotlin/org/multipaz/identityreader/ReaderQuery.kt) as shown below. The data elements listed above are addded to the request.

<ThemedIframe
  githubUrl="https://github.com/openwallet-foundation/multipaz-identity-reader/blob/deb29cfec63d507b1276f9ab12c74a414679db1a/libfrontend/src/commonMain/kotlin/org/multipaz/identityreader/ReaderQuery.kt#L127-L142"
/>

**Display Behavior:**

The Verifier app will display the relevant fields including the portrait, values of the requested parameters (viz name, membership number, tier, etc), whether test data or not, etc. if the request succeeds.