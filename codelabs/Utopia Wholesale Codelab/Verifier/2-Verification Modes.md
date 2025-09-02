---
title: Verification Modes
sidebar_position: 2
---



# Verification Modes

The application supports three types of verification modes:Age Over 18,Age Over 21,Identification.

Age Over 18  
This mode verifies if the individual is 18 years or older. It is designed for scenarios where only age verification is required, without revealing full personal identity information.

Age Over 21  
Functionally identical to "Age Over 18", this mode verifies whether the individual is 21 years or older. It is commonly used for alcohol purchases or entry to age-restricted venues.

Identification  
This mode requests the user's full identification details, including name, birthdate, document number, and portrait. It is used in scenarios where complete identity verification is required, such as account registration or employment verification.

Query Selection Implementation  
When a user selects a verification mode, a corresponding query is executed in ReaderQuery.kt as follows:


```
when (query) {
    ReaderQuery.AGE_OVER_18 -> {
        mdlNs.put("age_over_18", intentToRetain)
        mdlNs.put("portrait", intentToRetain)
    }
    ReaderQuery.AGE_OVER_21 -> {
        mdlNs.put("age_over_21", intentToRetain)
        mdlNs.put("portrait", intentToRetain)
    }
    ReaderQuery.IDENTIFICATION -> {
        mdlNs.put("given_name", intentToRetain)
        mdlNs.put("family_name", intentToRetain)
        // Additional identity attributes
        mdlNs.put("issue_date", intentToRetain)
        mdlNs.put("expiry_date", intentToRetain)
    }
}
```

Display Behavior  :
The Verifier app will display relevant fields based on the selected verification mode:
Age Over 18: Displays the person's portrait and a message like "This person is 18 or older."
Age Over 21: Displays the portrait with a message confirming the person is 21 or older.
Identification: Displays all identity data elements, such as "given\_name", "family\_name", "issue\_date", etc.