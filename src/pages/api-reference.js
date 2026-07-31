import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './api-reference.module.css';

// Modules are listed manually because the KDocs are generated in separate repos and
// copied into static/ by copy_docs.sh, so there is nothing for this page to import.
// When a module is added to the `dokka { }` dependencies in either repo's root
// build.gradle.kts, add it here too.
const MULTIPAZ_MODULES = [
  {
    name: 'multipaz',
    description:
      'The core library: cryptography, CBOR and JSON encoding, credential formats (ISO mdoc, SD-JWT VC), secure areas, transports (NFC, BLE, web), and the presentment and verification APIs.',
  },
  {
    name: 'multipaz-compose',
    description:
      'Reusable Compose Multiplatform UI — camera and QR scanning, document lists, prompts, and the presentment activity.',
  },
  {
    name: 'multipaz-doctypes',
    description:
      'Standardized document types and their data elements, including ISO mDL and the EU PID.',
  },
  {
    name: 'multipaz-dcapi',
    description: 'Integration with the Android Digital Credentials API.',
  },
  {
    name: 'multipaz-longfellow',
    description:
      "Zero-knowledge proof support built on Google's Longfellow library.",
  },
  {
    name: 'multipaz-utopia',
    description: 'Document types and helpers for the fictional country of Utopia.',
  },
  {
    name: 'multipaz-cbor-rpc',
    description: 'Multiplatform RPC over CBOR, used between the SDK and Multipaz servers.',
  },
  {
    name: 'multipaz-android-legacy',
    description:
      'Deprecated Android-only APIs kept for applications migrating from the Identity Credential library.',
  },
];

const EXTRAS_MODULES = [
  {
    name: 'multipaz-vision',
    description:
      'Camera-based checks: barcode scanning, face detection, face matching, and selfie liveness checks.',
  },
];

function ModuleCard({ name, description, baseUrl }) {
  return (
    <a
      className={styles.card}
      href={`${baseUrl}/${name}/index.html`}
      target="_blank"
      rel="noopener noreferrer">
      <h3 className={styles.cardTitle}>
        {name} <span className={styles.cardArrow}>↗</span>
      </h3>
      <p className={styles.cardDescription}>{description}</p>
    </a>
  );
}

export default function ApiReference() {
  return (
    <Layout
      title="API Reference"
      description="KDoc API reference for every module of the Multipaz SDK and the Multipaz Extras SDK">
      <main className={styles.main}>
        <h1>API Reference</h1>
        <p className={styles.intro}>
          Generated KDocs for every published module. The Multipaz SDK is the core, and the
          Extras SDK adds optional libraries that carry heavier third-party dependencies, so
          they ship from a separate repository and are documented separately.
        </p>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Multipaz SDK</h2>
            <a
              className={styles.sectionLink}
              href="https://github.com/openwallet-foundation/multipaz"
              target="_blank"
              rel="noopener noreferrer">
              openwallet-foundation/multipaz ↗
            </a>
          </div>
          <div className={styles.cardList}>
            {MULTIPAZ_MODULES.map((module) => (
              <ModuleCard key={module.name} baseUrl="/kdocs" {...module} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Extras SDK</h2>
            <a
              className={styles.sectionLink}
              href="https://github.com/openwallet-foundation/multipaz-extras"
              target="_blank"
              rel="noopener noreferrer">
              openwallet-foundation/multipaz-extras ↗
            </a>
          </div>
          <div className={styles.cardList}>
            {EXTRAS_MODULES.map((module) => (
              <ModuleCard key={module.name} baseUrl="/kdocs-extras" {...module} />
            ))}
          </div>
        </section>

        <div className={styles.cta}>
          <strong>New to Multipaz?</strong>
          <p>
            The <Link to="/docs/getting-started">Getting Started guide</Link> and the{' '}
            <Link to="/codelabs">codelabs</Link> walk through the APIs above in context.
          </p>
        </div>
      </main>
    </Layout>
  );
}
