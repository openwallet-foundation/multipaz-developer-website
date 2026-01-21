# Replacing key.jwk in Multipaz Servers

## **Before You Begin**​

In the [Deploying to Google Cloud Run](https://developer.multipaz.org/codelabs/Utopia%20Wholesale%20Codelab/Advanced%20Features/Deploying%20to%20Google%20Cloud%20Run) guide, we explain how to deploy Multipaz servers. This tutorial guides you through replacing the `key.jwk` file used for authentication between the Multipaz OpenID4VCI Server and the Records Server. The key is used to sign and verify JWT client assertions that authenticate the OpenID4VCI server when communicating with the Records server.



---

## **Prerequisites**​

* Access to the Multipaz repository ([openwallet-foundation/multipaz](https://github.com/openwallet-foundation/multipaz))
* Text editor
* Terminal/command line access
* Understanding of the Multipaz server architecture (see [Deploying to Google Cloud Run](https://developer.multipaz.org/codelabs/Utopia%20Wholesale%20Codelab/Advanced%20Features/Deploying%20to%20Google%20Cloud%20Run))
---

## **What You'll Learn**​

* What `key.jwk` is and how it's used in the system
* Where the key needs to be configured in both servers
* Step-by-step instructions for replacing the key
* How to verify the replacement was successful
* Security best practices for key management

---

## **Understanding key.jwk**​

The `key.jwk` file contains a JSON Web Key (JWK) with an Elliptic Curve P-256 key pair. This key is used for:

1. **OpenID4VCI Server**: Signs JWT client assertions when communicating with the Records Server
2. **Records Server**: Verifies JWT client assertions from the OpenID4VCI Server

The key contains:
* **Public key components**: `x`, `y`, `crv` (curve)
* **Private key component**: `d` (used only by the OpenID4VCI Server)
* **Key identifier**: `kid` (used to look up the public key)

---

## **Files That Need Updating**​

When replacing `key.jwk`, you need to update **three locations**:

1. **`key.jwk`** (root directory) - The key file itself
2. **`multipaz-openid4vci-server/src/main/resources/resources/default_configuration.json`** - `system_of_record_jwk` section
3. **`multipaz-records-server/src/main/resources/resources/default_configuration.json`** - `trusted_client_assertions` section
4. **`env-vars.yaml`** (if deploying to Google Cloud Run) - Update the `system_of_record_jwk` environment variable in the `/env-vars.yaml` file used for Cloud Run deployment

⚠️ **Important**: The `kid` (key ID) must match exactly in both server configurations.

:::tip 💡 Google Cloud Run Deployment
If you're deploying to Google Cloud Run, remember to update the `system_of_record_jwk` value in your `env-vars.yaml` file before deploying. This ensures the new JWK is used in your Cloud Run deployment.
:::

---

## **Step-by-Step Replacement Guide**​

### **Step 1: Generate key.jwk**​

1. Create a file `generate-key-jwk.js`:

```javascript
#!/usr/bin/env node
const crypto = require("crypto");

// Generate EC P-256 (prime256v1) keypair
const { privateKey } = crypto.generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});

// Export private key as JWK (includes public coords too)
const jwk = privateKey.export({ format: "jwk" });

// Add Multipaz-required fields
const keyJwk = {
  kty: jwk.kty,         // "EC"
  alg: "ES256",         // signing algorithm
  kid: crypto.randomUUID(),
  crv: jwk.crv,         // "P-256"
  x: jwk.x,             // public X (base64url)
  y: jwk.y,             // public Y (base64url)
  d: jwk.d,             // private key (base64url)
};

console.log(JSON.stringify(keyJwk, null, 2));
```

2. Run it and write the output to `key.jwk`:

```bash
node generate-key-jwk.js > key.jwk
```

3. Confirm the file looks like this:
   - Has **all** fields: `kty`, `alg`, `kid`, `crv`, `x`, `y`, `d`
   - Uses `crv: "P-256"` and `alg: "ES256"`

### **Step 2: Introduce key.jwk**​

Below is a structure of JWK sample:

```json
{
  "kty": "EC",
  "alg": "ES256",
  "kid": "your-unique-key-id-here",
  "crv": "P-256",
  "x": "base64url-encoded-x-coordinate",
  "y": "base64url-encoded-y-coordinate",
  "d": "base64url-encoded-private-key"
}
```

#### **Field Explanations**​

Each field in the `key.jwk` file has a specific purpose:

* **`"kty": "EC"`**
  * **Key Type**: Specifies that this is an Elliptic Curve key pair
  * **Value**: Must be `"EC"` for Elliptic Curve cryptography
  * **Purpose**: Identifies the cryptographic algorithm family used

* **`"alg": "ES256"`**
  * **Algorithm**: Specifies the signature algorithm used
  * **Value**: `"ES256"` means ECDSA (Elliptic Curve Digital Signature Algorithm) using P-256 curve and SHA-256 hash
  * **Purpose**: Defines how signatures are created and verified
  * **Note**: This must match in both server configurations

* **`"kid": "your-unique-key-id-here"`**
  * **Key ID**: A unique identifier for this key
  * **Value**: A string that uniquely identifies this key (e.g., UUID like `"bdbb8887-7cb7-4457-8a3f-1216924ed543"`)
  * **Purpose**: Used by the Records Server to look up the corresponding public key in `trusted_client_assertions`
  * **Critical**: This value **must match exactly** in both server configurations

* **`"crv": "P-256"`**
  * **Curve**: Specifies the elliptic curve used
  * **Value**: `"P-256"` refers to the secp256r1 curve (also known as NIST P-256)
  * **Purpose**: Defines the mathematical curve parameters for the key pair
  * **Note**: This determines the size and format of the `x`, `y`, and `d` values

* **`"x": "base64url-encoded-x-coordinate"`**
  * **X Coordinate**: The X coordinate of the public key point on the elliptic curve
  * **Value**: Base64URL-encoded bytes representing the X coordinate
  * **Purpose**: Part of the public key (along with `y` and `crv`)
  * **Example**: `"tvNovlSdvTIjUW4okuSmeMiM7egvRLaj8W45MVXEM8Y"`

* **`"y": "base64url-encoded-y-coordinate"`**
  * **Y Coordinate**: The Y coordinate of the public key point on the elliptic curve
  * **Value**: Base64URL-encoded bytes representing the Y coordinate
  * **Purpose**: Part of the public key (along with `x` and `crv`)
  * **Note**: Together with `x`, this defines the complete public key point
  * **Example**: `"L0AQ7DU9f6kyYdrJZlCfD0LjhoXQtX7lmfubjjIdLCg"`

* **`"d": "base64url-encoded-private-key"`**
  * **Private Key**: The secret scalar used for signing
  * **Value**: Base64URL-encoded bytes representing the private key
  * **Purpose**: Used by the OpenID4VCI Server to sign JWT client assertions
  * **Security**: ⚠️ **CRITICAL** - This is a secret value that must be kept confidential
  * **Note**: This field is **only** included in the OpenID4VCI server configuration, **not** in the Records server
  * **Example**: `"lYmbuSV3m7XwvDfU8xAkWRlNUPd_lWGXMEtslR_fFxI"`

**Important Notes:**
* The `kid` must be unique and consistent across both servers
* Use a secure method to generate the key pair
* Keep the private key (`d`) secure and never expose it publicly
* The public key (`x`, `y`, `crv`) can be shared, but the private key (`d`) must remain secret

---

### **Step 3: Replace key.jwk File**​

Replace the root `key.jwk` file with your new key:

```bash
# Backup the old key (recommended)
cp key.jwk key.jwk.backup

# Replace with your new key
# (Copy your new key.jwk content to the file)
```

**File location**: `/path/to/identity-credential/key.jwk`

---

### **Step 4: Update OpenID4VCI Server Configuration**​

Update the OpenID4VCI server configuration file:

**File**: `multipaz-openid4vci-server/src/main/resources/resources/default_configuration.json`

Find the `system_of_record_jwk` section (around line 45) and replace it with your new key:

```json
"system_of_record_jwk": {
  "kty": "EC",
  "alg": "ES256",
  "kid": "your-new-key-id",  // ⚠️ Must match kid from your new key.jwk
  "crv": "P-256",
  "x": "your-new-x-value",   // From your new key.jwk
  "y": "your-new-y-value",   // From your new key.jwk
  "d": "your-new-d-value"     // ⚠️ Private key - must be included here
}
```

**Important Notes:**
* Include **all fields**, including the private key `d`
* The `kid` must match exactly in both server configurations
* This server needs the private key to sign JWTs

**Example:**

```json
"system_of_record_jwk": {
  "kty": "EC",
  "alg": "ES256",
  "kid": "bdbb8887-7cb7-4457-8a3f-1216924ed543",
  "crv": "P-256",
  "x": "tvNovlSdvTIjUW4okuSmeMiM7egvRLaj8W45MVXEM8Y",
  "y": "L0AQ7DU9f6kyYdrJZlCfD0LjhoXQtX7lmfubjjIdLCg",
  "d": "lYmbuSV3m7XwvDfU8xAkWRlNUPd_lWGXMEtslR_fFxI"
}
```

---

### **Step 5: Update Records Server Configuration**​

Update the Records server configuration file:

**File**: `multipaz-records-server/src/main/resources/resources/default_configuration.json`

Find the `trusted_client_assertions` section (around line 5) and update the entry:

```json
"trusted_client_assertions": {
  "your-new-key-id": {  // ⚠️ Key must be the kid value (same as in openid4vci server)
    "kty": "EC",
    "alg": "ES256",
    "crv": "P-256",
    "x": "your-new-x-value",  // From your new key.jwk
    "y": "your-new-y-value"   // From your new key.jwk
    // ⚠️ NO "d" field here - this is public key only!
  }
}
```

**Important Notes:**
* The object key must be the `kid` value (e.g., `"bdbb8887-7cb7-4457-8a3f-1216924ed543"`)
* Do **NOT** include the `d` field - this server only verifies signatures
* If replacing an existing key, remove the old entry or update it

**Example:**

```json
"trusted_client_assertions": {
  "bdbb8887-7cb7-4457-8a3f-1216924ed543": {
    "kty": "EC",
    "alg": "ES256",
    "crv": "P-256",
    "x": "tvNovlSdvTIjUW4okuSmeMiM7egvRLaj8W45MVXEM8Y",
    "y": "L0AQ7DU9f6kyYdrJZlCfD0LjhoXQtX7lmfubjjIdLCg"
  }
}
```

---

### **Step 6: Update env-vars.yaml**​

:::info ℹ️ Google Cloud Run 
This step is  required if you're deploying to Google Cloud Run.
:::

Update the `system_of_record_jwk` environment variable in your `env-vars.yaml` file:

**File**: `multipaz-records-server/env-vars.yaml`

Update the `system_of_record_jwk` value with your new JWK (the complete JSON object from your new `key.jwk` file):

```yaml
system_of_record_jwk: '{"kty":"EC","alg":"ES256","kid":"your-new-key-id","crv":"P-256","x":"your-new-x-value","y":"your-new-y-value","d":"your-new-d-value"}'
```

**Important Notes:**
* The value must be a **single-line JSON string** (not formatted JSON)
* Include **all fields** from your `key.jwk` file: `kty`, `alg`, `kid`, `crv`, `x`, `y`, `d`
* The `kid` must match the one used in Steps 4 and 5
* Use single quotes around the JSON string to prevent YAML parsing issues

**Example:**

```yaml
system_of_record_jwk: '{"kty":"EC","alg":"ES256","kid":"bdbb8887-7cb7-4457-8a3f-1216924ed543","crv":"P-256","x":"tvNovlSdvTIjUW4okuSmeMiM7egvRLaj8W45MVXEM8Y","y":"L0AQ7DU9f6kyYdrJZlCfD0LjhoXQtX7lmfubjjIdLCg","d":"your-private-key-d-value-here"}'
```

:::tip 💡 Quick Tip
You can convert your `key.jwk` file to a single-line JSON string using:
```bash
cat key.jwk | jq -c .
```
:::

---

### **Step 7: Rebuild and Redeploy Servers**​

After updating the configurations, you need to rebuild and redeploy both servers.

#### **For Local Development:**

```bash
# Rebuild the OpenID4VCI server
./gradlew :multipaz-openid4vci-server:buildFatJar

# Rebuild the Records server
./gradlew :multipaz-records-server:buildFatJar
```

#### **For Cloud Run Deployment:**

1. Rebuild the fat JARs (as shown above)
2. Rebuild Docker images
3. Redeploy to Cloud Run

Refer to the [Deploying to Google Cloud Run tutorial](https://developer.multipaz.org/codelabs/Utopia%20Wholesale%20Codelab/Advanced%20Features/Deploying%20to%20Google%20Cloud%20Run) for detailed deployment steps.

---

## **Verification Checklist**​

After replacing the key, verify the following:

- [ ] `key.jwk` contains the new key with all fields (`kty`, `alg`, `kid`, `crv`, `x`, `y`, `d`)
- [ ] OpenID4VCI server `system_of_record_jwk` has all fields including `d`
- [ ] Records server `trusted_client_assertions` has an entry keyed by the new `kid`
- [ ] Records server entry contains only public key fields (no `d`)
- [ ] `kid` values match exactly in both configurations
- [ ] Both servers rebuilt and redeployed successfully

---

## **Security Best Practices**​

1. **Keep Private Key Secure**
   * Never commit the private key (`d`) to public repositories
   * Use environment variables or secrets management for production deployments
   * Restrict file permissions on `key.jwk`

2. **Use Unique Key IDs**
   * Generate a unique `kid` for each key
   * Use UUIDs or other unique identifiers

3. **Rotate Keys Regularly**
   * Replace keys periodically for security
   * Update both servers simultaneously during rotation

4. **Backup Old Keys**
   * Keep backups of old keys during transition periods
   * Verify new keys work before removing old ones

---

## **Troubleshooting**​

### **Issue: Authentication fails between servers**​

**Solution:**
* Verify the `kid` matches exactly in both configurations
* Ensure all required fields are present
* Check that the Records server has the public key (without `d`)
* Verify the OpenID4VCI server has the complete key (with `d`)

### **Issue: "CA not registered" error**​

**Solution:**
* Ensure the `kid` in the JWT header matches a key in `trusted_client_assertions`
* Verify the key entry uses the `kid` as the object key
* Check for typos in the `kid` value

### **Issue: "Invalid JWT signature" error**​

**Solution:**
* Verify the public key (`x`, `y`) in the Records server matches the private key used for signing
* Ensure the key pair is valid (public/private key match) using OpenSSL or online tools
* Check that the algorithm (`alg`) is `ES256` in both places

### **Issue: Configuration not taking effect**​

**Solution:**
* Rebuild the fat JAR files after configuration changes
* Redeploy the servers
* Clear any caches if applicable
* Verify the configuration files are included in the build

---

## **Summary**​

In this tutorial, you learned:

1. **What `key.jwk` is** and its role in server authentication
2. **The three locations** that need updating when replacing the key
3. **How to update** the OpenID4VCI server configuration (with private key)
4. **How to update** the Records server configuration (public key only)
5. **The importance** of matching `kid` values across configurations
6. **Security best practices** for key management

After completing these steps, your servers will use the new key for authentication. Remember to update both servers simultaneously to avoid authentication failures.

---

## **Additional Resources**​

* [RFC 7517 - JSON Web Key (JWK)](https://datatracker.ietf.org/doc/html/rfc7517)
* [RFC 7519 - JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519)
* [Multipaz Deployment Guide](https://developer.multipaz.org/codelabs/Utopia%20Wholesale%20Codelab/Advanced%20Features/Deploying%20to%20Google%20Cloud%20Run)

