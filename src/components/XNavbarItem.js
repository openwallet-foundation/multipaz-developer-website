import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function XNavbarItem() {
  return (
    <a
      href="https://x.com/TBD-MULTIPAZ"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="X (Twitter)"
      style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}
    >
      <img
        src={useBaseUrl('/img/x-logo-black.png')}
        alt="X"
        width={28}
        height={28}
        style={{ verticalAlign: 'middle', borderRadius: 4 }}
      />
    </a>
  );
} 