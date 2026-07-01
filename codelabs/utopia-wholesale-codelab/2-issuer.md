---
title: Issuer
sidebar_position: 2
---

# (Optional) Loyalty Credential Implementation Tutorial

## Overview

This tutorial demonstrates how to implement a **Loyalty credential** in the Multipaz framework. The Loyalty credential represents a digital loyalty membership card that combines personal identification data with membership-specific information. You can check source code from [here](https://github.com/openwallet-foundation/multipaz/tree/main/multipaz-doctypes).

## What is Loyalty Credential?

The Loyalty credential is a digital identity document that serves as both a personal identification and loyalty membership card. It includes:

* **Personal Data**: Name,  portrait flags  
* **Membership Data**: Membership number, issue date, expiry date, tier  
* **Security Features**: Cryptographic signatures

## Architecture Overview

The Loyalty implementation consists of several key components:

1. **Document Type Definition** (Loyalty.kt) - Defines the credential structure and data elements  
2. **Credential Factory** (CredentialFactoryUtopiaLoyalty.kt) - Handles credential issuance  
3. **Server Integration** - Backend services for issuing and verifying credentials  
4. **Client Integration** - Wallet application support

## Implementation Details

### Step 1: Document Type Definition

The Loyalty.kt file defines the credential structure:

```kotlin
object Loyalty {
    const val LOYALTY_DOCTYPE = "org.multipaz.loyalty.1"
    const val LOYALTY_NAMESPACE = "org.multipaz.loyalty.1"

    fun getDocumentType(): DocumentType {
        return DocumentType.Builder("Loyalty")
            .addMdocDocumentType(LOYALTY_DOCTYPE)
            // Personal identification data
            .addMdocAttribute(
                DocumentAttributeType.String,
                "family_name",
                "Family Name",
                "Last name, surname, or primary identifier",
                true,
                LOYALTY_NAMESPACE,
                Icon.PERSON,
                SampleData.FAMILY_NAME.toDataItem()
            )
            // ... additional attributes
            .build()
    }
}
```

**Key Data Elements:**

* **Personal Data**: family_name, given_name, portrait
* **Membership Data**: membership_number, issue_date, expiry_date, tier

### Step 2: Credential Factory Implementation

The CredentialFactoryUtopiaLoyalty.kt handles the credential issuance process:

```kotlin
internal class CredentialFactoryUtopiaLoyalty : CredentialFactoryBase() {
    override val offerId: String = "utopia_wholesale"
    override val scope: String = "wholesale"
    override val format: Openid4VciFormat = openId4VciFormatLoyalty
    override val name: String = "Utopia Wholesale Loyalty ID"
    override val logo: String = "card_utopia_wholesale.png"

    override suspend fun makeCredential(
        data: DataItem,
        authenticationKey: EcPublicKey?
    ): String {
        val now = Clock.System.now()

        val resources = BackendEnvironment.getInterface(Resources::class)!!

        val coreData = data["core"]
        val portrait = if (coreData.hasKey("portrait")) {
            coreData["portrait"].asBstr
        } else {
            resources.getRawResource("female.jpg")!!.toByteArray()
        }

        // Create AuthKeys and MSOs, make sure they're valid for 30 days
        val timeSigned = Instant.fromEpochSeconds(now.epochSeconds, 0)
        val validFrom = Instant.fromEpochSeconds(now.epochSeconds, 0)
        val validUntil = validFrom + 30.days

        // Generate an MSO and issuer-signed data for this authentication key.
        val docType = Loyalty.LOYALTY_DOCTYPE
        val msoGenerator = MobileSecurityObjectGenerator(
            Algorithm.SHA256,
            docType,
            authenticationKey!!
        )
        msoGenerator.setValidityInfo(timeSigned, validFrom, validUntil, null)

        val records = data["records"]
        if (!records.hasKey("wholesale")) {
            throw IllegalArgumentException("No wholesale membership card is issued to this person")
        }
        val loyaltyIDData = records["wholesale"].asMap.values.firstOrNull() ?: buildCborMap { }
        val membershipId = if (loyaltyIDData.hasKey("membership_number")) {
            loyaltyIDData["membership_number"].asTstr
        } else {
            (1000000 + Random.nextInt(9000000)).toString()
        }
        val tier = if (loyaltyIDData.hasKey("tier")) {
            loyaltyIDData["tier"].asTstr
        } else {
            "basic"
        }
        val issueDate = if (loyaltyIDData.hasKey("issue_date")) {
            loyaltyIDData["issue_date"].asDateString
        } else {
            LocalDate.parse("2024-04-01")
        }
        val expiryDate = if (loyaltyIDData.hasKey("expiry_date")) {
            loyaltyIDData["expiry_date"].asDateString
        } else {
            LocalDate.parse("2034-04-01")
        }

        val issuerNamespaces = buildIssuerNamespaces {
            // Combined LoyaltyID namespace (all data elements)
            addNamespace(Loyalty.LOYALTY_NAMESPACE) {
                // Core personal data
                addDataElement("family_name", coreData["family_name"])
                addDataElement("given_name", coreData["given_name"])
                addDataElement("portrait", Bstr(portrait))

                // LoyaltyID specific data
                addDataElement("membership_number", Tstr(membershipId))
                addDataElement("tier", Tstr(tier))
                addDataElement("issue_date", issueDate.toDataItemFullDate())
                addDataElement("expiry_date", expiryDate.toDataItemFullDate())
            }
        }

        msoGenerator.addValueDigests(issuerNamespaces)

        val mso = msoGenerator.generate()
        val taggedEncodedMso = Cbor.encode(Tagged(24, Bstr(mso)))

        // IssuerAuth is a COSE_Sign1 where payload is MobileSecurityObjectBytes
        val protectedHeaders = mapOf<CoseLabel, DataItem>(
            Pair(
                CoseNumberLabel(Cose.COSE_LABEL_ALG),
                Algorithm.ES256.coseAlgorithmIdentifier!!.toDataItem()
            )
        )
        val unprotectedHeaders = mapOf<CoseLabel, DataItem>(
            Pair(
                CoseNumberLabel(Cose.COSE_LABEL_X5CHAIN),
                signingCertificateChain.toDataItem()
            )
        )
        val encodedIssuerAuth = Cbor.encode(
            Cose.coseSign1Sign(
                signingKey,
                taggedEncodedMso,
                true,
                protectedHeaders,
                unprotectedHeaders
            ).toDataItem()
        )
        val issuerProvidedAuthenticationData = Cbor.encode(
            buildCborMap {
                put("nameSpaces", issuerNamespaces.toDataItem())
                put("issuerAuth", RawCbor(encodedIssuerAuth))
            }
        )

        return issuerProvidedAuthenticationData.toBase64Url()
    }
}
```

### Step 3: Server Integration

#### Credential Factory Registration

The credential factory is registered in CredentialFactory.kt:

```kotlin
internal interface CredentialFactory {
    companion object {
        private fun initializeFactories(): List<CredentialFactory> {
            return listOf(
                CredentialFactoryUtopiaNaturatization(),
                CredentialFactoryUtopiaMovieTicket(),
                CredentialFactoryAgeVerification(),
                CredentialFactoryUtopiaLoyalty(), // New Loyalty factory
            )
        }
    }
}

internal val openId4VciFormatLoyalty = Openid4VciFormatMdoc(Loyalty.LOYALTY_DOCTYPE)
```

#### Provisioning Support

The provisioning system is updated in Openid4VciIssuingAuthorityState.kt:

```kotlin
class Openid4VciIssuingAuthorityState {
    private fun initializeDocumentTypes() {
        documentTypeRepository.apply {
            addDocumentType(UtopiaNaturalization.getDocumentType())
            addDocumentType(UtopiaMovieTicket.getDocumentType())
            addDocumentType(AgeVerification.getDocumentType())
            addDocumentType(Loyalty.getDocumentType()) // Add Loyalty support
        }
    }
}
```

#### Records Server Integration

The records server is a backend service that contains a database which stores personal information and credential information for users. It serves as the central repository for all user data that can be used to issue credentials.

**Key Functions of the Records Server:**

1. **Personal Data Storage**: Stores core personal information such as names, birth dates, portraits, and demographic data  
2. **Membership Data Management**: Maintains loyalty program memberships, membership numbers, issue dates, and expiry dates  
3. **Data Validation**: Ensures data integrity and validates user eligibility for specific credentials
4**Access Control**: Manages permissions for different types of data access

When a user requests a Loyalty credential, the records server:

* Retrieves the user's personal information from the core database  
* Fetches their wholesale membership data  
* Validates their eligibility for the requested credential  
* Provides the necessary data to the credential factory for issuance

The records server is updated in recordTypes.kt to support wholesale membership data:

```kotlin
val recordTypes = RecordType.buildMap {
    addComplex("wholesale") {
        displayName = "Utopia Wholesale Loyalty ID"
        addString(
            identifier = "membership_number",
            displayName = "Membership ID",
            description = "Person identifier of the Loyalty ID holder",
            icon = Icon.NUMBERS,
        )
        // ... additional attributes
    }
}
```

## Sample Requests

The Loyalty credential supports several sample request types:

### 1. All Data Elements

```kotlin
.addSampleRequest(
    id = "full",
    displayName ="All Data Elements",
    mdocDataElements = mapOf(
        LOYALTY_NAMESPACE to mapOf()
    )
)
```

### 2. Mandatory Data Elements

```kotlin
.addSampleRequest(
    id = "mandatory",
    displayName = "Mandatory Data Elements",
    mdocDataElements = mapOf(
        LOYALTY_NAMESPACE to mapOf(
            "family_name" to false,
            "given_name" to false,
            "portrait" to false,
            "membership_number" to false,
            "tier" to false,
            "issue_date" to false,
            "expiry_date" to false,
        )
    )
)

```

## Security Features

### Cryptographic Signatures

The Loyalty credential implements robust cryptographic signatures using industry-standard algorithms and certificates.

#### ES256 Algorithm Implementation

**File**: CredentialFactoryUtopiaLoyalty.kt 

```kotlin
val protectedHeaders = mapOf<CoseLabel, DataItem>(
    Pair(
        CoseNumberLabel(Cose.COSE_LABEL_ALG),
        Algorithm.ES256.coseAlgorithmIdentifier!!.toDataItem()
    )
)
```

## Conclusion

The Loyalty credential implementation provides a comprehensive solution for digital loyalty membership cards. It combines personal identification with membership-specific data while maintaining security and privacy standards. The implementation follows ISO/IEC TS 23220-4 standards and integrates seamlessly with the Multipaz framework.

Key benefits:

* **Unified Identity**: Combines personal and membership data  
* **Age Verification**: Automatic age-based access control  
* **Security**: Cryptographic signatures and validation  
* **Flexibility**: Multiple verification request types  
* **Standards Compliance**: Follows international standards

This implementation serves as a foundation for building more complex loyalty and membership systems while maintaining interoperability and security.