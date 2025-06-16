import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function DiscordNavbarItem() {
  return (
    <a
      href="https://discord.com/channels/1022962884864643214/1179828955717574707"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discord community"
      style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}
    >
      <img
        src={useBaseUrl('/img/Discord-Symbol-Blurple.svg')}
        alt="Discord"
        width={28}
        height={28}
        style={{ verticalAlign: 'middle' }}
      />
    </a>
  );
} 