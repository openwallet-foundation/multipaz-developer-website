import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';

export default function About() {
  const kdocsUrl = useBaseUrl('/kdocs/index.html');
  return (
    <Layout title="About" description="About Multipaz and the OpenWallet Foundation.">
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <h1>About Multipaz</h1>
        <p>
          Multipaz is an open-source identity framework designed to handle
          secure, real-world credential issuance and verification. It is a
          Kotlin Multiplatform (KMP) SDK for digital credentials: wallet
          applications that hold and present credentials, issuer services that
          provision them, and verifiers that read and validate them.
        </p>
        <p>
          Multipaz started as a project at Google and was donated to the{' '}
          <a href="https://openwallet.foundation/" target="_blank" rel="noopener noreferrer">
            OpenWallet Foundation (OWF)
          </a>
          , a collaborative open-source project hosted by the Linux Foundation.
          Development happens in the open under the{' '}
          <a href="https://github.com/openwallet-foundation" target="_blank" rel="noopener noreferrer">
            openwallet-foundation GitHub organization
          </a>
          , with public community calls, a public Discord, and contributions
          welcome from anyone.
        </p>
        <h2>What Multipaz supports</h2>
        <ul>
          <li>
            <strong>Credential formats:</strong> ISO mdoc / mobile driving
            license (mDL) and IETF SD-JWT VC.
          </li>
          <li>
            <strong>Issuance:</strong> OpenID4VCI, including offers, OAuth
            flows, attestation, and provisioning.
          </li>
          <li>
            <strong>Presentment &amp; verification:</strong> ISO/IEC
            18013-5:2021 proximity (QR and NFC), ISO/IEC 18013-7:2025 and the
            W3C Digital Credentials API over the web, and OpenID4VP.
          </li>
          <li>
            <strong>Platforms:</strong> Android, iOS, JVM/server, Linux, and
            Web, with Compose Multiplatform and SwiftUI UI bindings.
          </li>
        </ul>
        <h2>Open source</h2>
        <p>
          The SDK, the sample applications, this documentation website, and the
          reference wallet are all open source under the Apache License 2.0.
          You can find the source code in the{' '}
          <a href="https://github.com/openwallet-foundation/multipaz" target="_blank" rel="noopener noreferrer">
            multipaz repository
          </a>{' '}
          and the{' '}
          <Link to="/docs/sample-apps">sample applications</Link>. The entire
          developer website is open source too — see{' '}
          <a
            href="https://github.com/openwallet-foundation/multipaz-developer-website"
            target="_blank"
            rel="noopener noreferrer"
          >
            multipaz-developer-website
          </a>
          .
        </p>
        <p>
          See also the <Link to="/docs/getting-started">getting started guide</Link>,{' '}
          <Link to="/codelabs">codelabs</Link>, and the{' '}
          <a href={kdocsUrl}>API reference</a>.
        </p>
      </main>
    </Layout>
  );
}