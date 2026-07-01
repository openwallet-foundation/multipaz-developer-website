# Request Multiple Credentials with DCQL
## **Overview**

DCQL (Declarative Credential Query Language) is a JSON-based query language used to request specific credentials and claims from a digital wallet. This tutorial will guide you through creating DCQL queries, with a practical example using a Loyalty credential.

## **What is DCQL?**

DCQL allows verifiers to specify:

* Which credential types they accept (e.g., mDL, PID, Loyalty)  
* Which specific claims they need from each credential  
* How credentials can be combined (AND/OR relationships) 

## **How to Use DCQL Queries**

To test DCQL queries in practice, follow these steps:

1. Install TestApp from the  [website](https://apps.multipaz.org/). Open TestApp, click Document Store then click “Create Test Documents in Platform Secure Area” to make sure you have credentials on the device.

2. Open the website [**verifier.multipaz.org**](http://verifier.multipaz.org/) in your browser

3. Click the **"Raw DCQL"** button

4. Input your DCQL JSON query. For example, to query a Loyalty credential:

```json
{  
  "credentials": [  
    {  
      "id": "loyalty",  
      "format": "mso_mdoc",  
      "meta": {  
        "doctype_value": "org.multipaz.loyality.1"  
      },  
      "claims": [  
        {  
          "path": ["org.multipaz.loyality.1", "family_name"]  
        },  
        {  
          "path": ["org.multipaz.loyality.1", "given_name"]  
        },  
        {  
          "path": ["org.multipaz.loyality.1", "portrait"]  
        },  
        {  
          "path": ["org.multipaz.loyality.1", "membership_number"]  
        },  
        {  
          "path": ["org.multipaz.loyality.1", "issue_date"]  
        },  
        {  
          "path": ["org.multipaz.loyality.1", "expiry_date"]  
        }  
      ]  
    }  
  ]  
}
```


4. Select the protocol (default: **"W3C DC API (OpenID4VP 1.0)"**)

5. Click the **"Request"** button

## This will query the loyalty credential from your device and request the specified claims.

It will popup Loyalty Credential just like below:  
<img src="/img/dcql.png" alt="DCQL Example" width="50%" height="50%" />

## **Basic Structure**

Every DCQL query has this basic structure:

```json
{    
  "credentials": [ ],    
  "credential_sets": [ ]  

}
```

Where:
- `credentials`: Array of credential queries
- `credential_sets`: Optional field that defines AND/OR logic

## **Step 1: Define a Single Credential Query**

Let's start with a simple query for a Loyalty credential.

The Loyalty credential type in Multipaz uses the document type org.multipaz.loyality.1.

```json
{    
  "credentials": [    
    {    
      "id": "loyalty",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.multipaz.loyality.1"    
      },    
      "claims": [    
        {    
          "path": ["org.multipaz.loyality.1", "membership_number"]    
        }  
      ]    
    }    
  ]  

}
```

Key Components:

* id: A unique identifier for this credential query (used in credential_sets)  
* format: "mso_mdoc" for ISO mdoc credentials  
* meta.doctype_value: The document type identifier  
* claims: Array of claims to request, each with a path array containing [namespace, claim_name] verifier.js:138-165

## **Step 2: Request Multiple Claims**

The Loyalty credential supports several claims. You can query different attributes by adding items in claims. Here's a comprehensive query:

```json
{    
  "credentials": [    
    {    
      "id": "loyalty",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.multipaz.loyality.1"    
      },    
      "claims": [    
        {    
          "path": ["org.multipaz.loyality.1", "family_name"]    
        },    
        {    
          "path": ["org.multipaz.loyality.1", "given_name"]    
        },    
        {    
          "path": ["org.multipaz.loyality.1", "portrait"]    
        },    
        {    
          "path": ["org.multipaz.loyality.1", "membership_number"]    
        },   
        {    
          "path": ["org.multipaz.loyality.1", "issue_date"]    
        },    
        {    
          "path": ["org.multipaz.loyality.1", "expiry_date"]    
        }    
      ]    
    }    
  ]  

}
```

## **Step 3: Combining Multiple Credentials**

### **OR Relationship (Either/Or)**

To accept either an mDL or a Loyalty credential, in options of credential_sets, add id separately to create a Either/or relationship in query.

```json
{    
  "credentials": [    
    {    
      "id": "mdl",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.iso.18013.5.1.mDL"    
      },    
      "claims": [    
        {    
          "path": ["org.iso.18013.5.1", "given_name"]    
        },    
        {    
          "path": ["org.iso.18013.5.1", "family_name"]    
        }    
      ]    
    },    
    {    
      "id": "loyalty",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.multipaz.loyality.1"    
      },    
      "claims": [    
        {    
          "path": ["org.multipaz.loyality.1", "given_name"]    
        },    
        {    
          "path": ["org.multipaz.loyality.1", "family_name"]    
        }    
      ]    
    }    
  ],    
  "credential_sets": [    
    {    
      "options": [    
        ["mdl"],    
        ["loyalty"]    
      ]    
    }    
  ]  

}
```

### **AND Relationship (Both Required)**

To require both an mDL and a Loyalty credential, in options of credential_sets, add ids create a AND relationship in query. If one if the ids doesn’t exist it will show “No ID found”: 

```json
{    
  "credentials": [    
    {    
      "id": "mdl",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.iso.18013.5.1.mDL"    
      },    
      "claims": [    
        {    
          "path": ["org.iso.18013.5.1", "portrait"]    
        }    
      ]    
    },    
    {    
      "id": "loyalty",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.multipaz.loyality.1"    
      },    
      "claims": [    
        {    
          "path": ["org.multipaz.loyality.1", "membership_number"]    
        }    
      ]    
    }    
  ],    
  "credential_sets": [    
    {    
      "options": [    
        ["mdl", "loyalty"]    
      ]    
    }    
  ]  

}
```

## **Step 4: Optional Credentials**

You can make credential sets optional using the required field inside the credential_sets array object.This query requires an mDL but optionally accepts a Loyalty credential if available.

```json
{    
  "credentials": [    
    {    
      "id": "mdl",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.iso.18013.5.1.mDL"    
      },    
      "claims": [    
        {    
          "path": ["org.iso.18013.5.1", "given_name"]    
        }    
      ]    
    },    
    {    
      "id": "loyalty",    
      "format": "mso_mdoc",    
      "meta": {    
        "doctype_value": "org.multipaz.loyality.1"    
      },    
      "claims": [    
        {    
          "path": ["org.multipaz.loyality.1", "membership_number"]    
        }    
      ]    
    }    
  ],    
  "credential_sets": [    
    {    
      "required": true,    
      "options": [    
        ["mdl"]    
      ]    
    },    
    {    
      "required": false,    
      "options": [    
        ["loyalty"]    
      ]    
    }    
  ]  

}
```

## **Conclusion**

DCQL (Declarative Credential Query Language) provides a powerful, JSON-based approach to digital credential verification. This tutorial demonstrated how DCQL enables verifiers to precisely request specific credentials and claims through structured queries. Key Benefits:

* Precision: Request exactly the claims needed  
* Flexibility: Support OR/AND relationships between credentials  
* Privacy: Enable selective disclosure of information  
* Interoperability: Standardized across different credential types

Practical Implementation:The tutorial showed hands-on examples using verifier.multipaz.org, from simple single-credential queries to complex multi-credential scenarios with optional requirements. DCQL represents a significant advancement in digital identity verification, offering a robust foundation for building efficient, privacy-preserving, and user-friendly credential systems. As digital identity ecosystems continue to evolve, DCQL provides the flexibility and precision needed for modern verification requirements.
