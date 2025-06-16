import React from 'react';
import Layout from '@theme/Layout';
import ShowcaseGrid from '../components/ShowcaseGrid';

export default function Showcase() {
  return (
    <Layout
      title="Showcase"
      description="Explore apps and organizations using Multipaz for secure, real-world credential issuance and verification."
    >
      <div
        style={{
          width: '100%',
          background: 'var(--ifm-color-primary)',
          color: '#fff',
          padding: '2.5rem 0 2rem 0',
          textAlign: 'left',
          fontSize: '2.2rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '2rem',
          paddingLeft: 'max(2rem, 8vw)',
          paddingRight: 'max(2rem, 8vw)',
        }}
      >
        <div>Who is using Multipaz?</div>
        <div style={{
          fontSize: '1.15rem',
          fontWeight: 400,
          marginTop: '0.75rem',
          color: 'rgba(255,255,255,0.85)',
        }}>
          Explore apps and organizations using Multipaz for secure, real-world credential issuance and verification.
        </div>
      </div>
      <main style={{ padding: '2rem 0', maxWidth: 1100, margin: '0 auto' }}>
        <ShowcaseGrid />
        <section style={{ textAlign: 'center', marginTop: 32 }}>
          <h2>Want to be featured?</h2>
          <p>
            Are you using Multipaz in your project? <a href="mailto:info@multipaz.com">Contact us</a> to be included in the showcase!
          </p>
        </section>
      </main>
    </Layout>
  );
} 