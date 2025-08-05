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
            Are you using Multipaz in your project?{' '}
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                const issueUrl = 'https://github.com/openmobilehub/developer-multipaz-website/issues/new';
                const title = encodeURIComponent('Add App to Multipaz Showcase');
                const body = encodeURIComponent(`## App Information

**App Name:**
[Your app name]

**App Description:**
[Brief description of what your app does]

**How you're using Multipaz:**
[Describe how your app uses Multipaz for credential issuance, verification, or other features]

**App URL:**
[Link to your app or project]

**Screenshot/Logo:**
[Optional: Add a screenshot or logo of your app]

**Additional Information:**
[Any other relevant details about your app and its use of Multipaz]

## Contact Information
[Your contact information if you'd like us to reach out]

---

*This issue will be reviewed by the Multipaz team for inclusion in the showcase.*`);
                
                window.open(`${issueUrl}?title=${title}&body=${body}`, '_blank');
              }}
              style={{ color: 'var(--ifm-color-primary)', textDecoration: 'underline' }}
            >
              Submit your app
            </a>{' '}
            to be included in the showcase!
          </p>
        </section>
      </main>
    </Layout>
  );
} 