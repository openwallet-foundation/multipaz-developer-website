import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

const showcaseApps = [
  {
    name: 'Google Wallet',
    logo: '/img/google-wallet-alone.png',
    platforms: ['Android', 'iOS'],
    description: 'A digital wallet platform by Google that uses Multipaz for secure credential management.',
    link: 'https://play.google.com/store/apps/details?id=com.google.android.apps.walletnfcrel',
  },
  {
    name: 'EU Digital Identity Wallet',
    logo: '/img/eudi-wallet-square.png',
    platforms: ['Android', 'iOS'],
    description: 'The official EU Digital Identity Wallet, leveraging Multipaz for digital identity.',
    link: 'https://github.com/eu-digital-identity-wallet',
  },
  // Add more apps as needed
];

export default function ShowcaseGrid() {
  return (
    <section
      className="showcase-grid"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 32, marginBottom: 48 }}
    >
      {showcaseApps.map(app => (
        <div key={app.name} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={useBaseUrl(app.logo)} alt={app.name + ' logo'} style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 16, borderRadius: 8 }} />
          <h3 style={{ margin: '0 0 8px' }}>{app.name}</h3>
          <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>
            {app.platforms.join(' • ')}
          </div>
          <p style={{ fontSize: 15, marginBottom: 16 }}>{app.description}</p>
          <Link className="button button--primary button--sm" to={app.link} target="_blank">
            Learn more
          </Link>
        </div>
      ))}
    </section>
  );
} 