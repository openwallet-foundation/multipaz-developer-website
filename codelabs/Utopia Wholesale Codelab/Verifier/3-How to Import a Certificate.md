---
title: How to Import a Certificate
sidebar_position: 3
---


# How to Import a Certificate

The **Multipaz Identity Verifier** requires the issuer’s certificate to verify credentials. Follow these steps to import the certificate:

1. Open the **Holder** app project.
2. <a href="https://raw.githubusercontent.com/openmobilehub/multipaz-utopia-wholesale-codelab/0efb6d19d93780065dd49f3e363a968389718f61/Holder/composeApp/src/commonMain/composeResources/files/iaca_certificate.pem" target="_blank">Download the IACA certificate</a>

:::info Download Instructions
Long-press the link above and select **"Download link"** or **"Save link"** from the context menu.
:::

3. Copy `iaca_certificate.pem` to your phone.
4. On your phone, open the **Multipaz Identity Verifier** app.
4. Tap the **hamburger menu** (☰) in the top-left corner.
6. Navigate to: **Settings** → **Trusted Issuers**
7. Tap the **"+" button** (bottom right).
8. Choose **Import Certificate** and select the `iaca_certificate.pem` file.

 You’re now ready to use the Verifier app to scan a barcode from the Holder app.


### Certificate Trust and Document Verification

After importing a certificate, it must be added to the trust manager. The following code, located in TrustedIssuersScreen.kt, handles certificate import and trust management:

```
onResult = { files ->
    if (files.isNotEmpty()) {
        coroutineScope.launch {
            try {
                val cert = X509Cert.fromPem(pemEncoding = files[0].toByteArray().decodeToString())
                val entry = userTrustManager.addX509Cert(
                    certificate = cert,
                    metadata = TrustMetadata()
                )
                onTrustEntryClicked(TRUST_MANAGER_ID_USER, userTrustManager.getEntries().size - 1, true)
            } catch (_: TrustPointAlreadyExistsException) {
                showImportErrorDialog.value = "A certificate with this Subject Key Identifier already exists"
            } catch (e: Throwable) {
                showImportErrorDialog.value = "Importing certificate failed: $e"
            }
        }
    }
}

```

When the Verifier app receives a document, it verifies the document’s authenticity and trust chain. This process is implemented in ShowResultScreen.kt:


```
require(document.deviceSignedAuthenticated) { "Device Authentication failure" }
require(document.issuerSignedAuthenticated) { "Issuer Authentication failure" }
require(now >= document.validityInfoValidFrom && now <= document.validityInfoValidUntil) {
    "Document is not valid at this point"
}

val trustResult = issuerTrustManager.verify(document.issuerCertificateChain.certificates, now)
require(trustResult.isTrusted) { "Document issuer isn't trusted" }
```

This validation ensures:Device Signature Authentication is successful,Issuer Signature Authentication is valid,the issuer's certificate chain is verified against trusted certificates.
