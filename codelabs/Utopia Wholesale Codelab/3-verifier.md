---
title: Verifier
sidebar_position: 3
---

# Verifier


Multipaz Identity Verifier( Multipaz Identity Reader) allows you to request and display identity credentials from another person using QR codes, NFC, or Bluetooth Low Energy (BLE), in compliance with ISO/IEC 18013-5:2021. It works entirely offline, without requiring an Internet connection, and supports importing IACA certificates and VICALs.Click **[here](https://apps.multipaz.org/identityreader/identity-reader-0.3.0-pre.7.bdf1bce.apk)** to download the latest APK for sideloading.

The source code for the Multipaz Identity Reader is available **[here](https://github.com/davidz25/MpzIdentityReader)**.


# How to Import a Certificate

The **Multipaz Identity Verifier** requires the issuer’s certificate to verify credentials. Only the verifier app needs this certificate. The issuer can be part of the trusted list.

Follow these steps to import the certificate:

1. Open the **Holder** app project.
2. Go to the folder:  
   `/composeApp/src/commonMain/composeResources`
3. Find the file:  
   `iaca_certificate.pem`
4. Copy `iaca_certificate.pem` to your phone.
5. On your phone, open the **Multipaz Identity Verifier** app.
6. Tap the **hamburger menu** (☰) in the top-left corner.
7. Navigate to: **Settings** → **Trusted Issuers**
8. Tap the **"+" button** (bottom right).
9. Choose **Import Certificate** and select the `iaca_certificate.pem` file.

 You’re now ready to use the Verifier app to scan a barcode from the Holder app.

---

# How to Generate a Certificate (Optional)

This section shows how to generate your own certificate. **You can skip this** if you already have one.

### Step 1: Add `multipazctl` to Your System Path

Follow the official instructions:  
👉 [Command-Line Tool Setup](https://github.com/openwallet-foundation-labs/identity-credential?tab=readme-ov-file#command-line-tool)

Once set up, you can run `multipazctl` like any other terminal command.

### Step 2: Generate the IACA Certificate and Private Key

Run the following command:

```bash
multipazctl generateIaca
```

This will generate:
- `iaca_certificate.pem` — used by the Verifier (contains the public key)
- `iaca_private_key.pem` — private key



---

### 🔗 Usage in the Holder App

The content of following files `iaca_private_key.pem`and `iaca_certificate.pem` are used in  [`App.kt`](https://github.com/openmobilehub/multipaz-utopia-wholesale-codelab/blob/main/composeApp/src/commonMain/kotlin/org/multipaz/samples/wallet/cmp/App.kt):