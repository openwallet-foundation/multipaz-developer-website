import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function GithubNavbarItem() {
  return (
    <a
      href="https://github.com/openwallet-foundation-labs/identity-credential"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub repository"
      style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}
    >
      <img
        src={useBaseUrl('/img/GitHub_Invertocat_Dark.svg')}
        alt="GitHub"
        width={28}
        height={28}
        style={{ verticalAlign: 'middle' }}
      />
    </a>
  );
} 