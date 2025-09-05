// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  docs: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      link: {
        type: 'doc',
        id: 'getting-started/getting-started',
      },
      items: [
        'getting-started/installation',
        {
          type: 'category',
          label: 'Holder',
          link: {
            type: 'doc',
            id: 'getting-started/holder/index',
          },
          items: [
            'getting-started/holder/storage',
            'getting-started/holder/documentstore',
            'getting-started/holder/creation',
            'getting-started/holder/lookup',
            'getting-started/holder/reader-trust',
            'getting-started/holder/presentation',
          ],
          collapsed: false,
          collapsible: true,
        },
        'getting-started/issuer',
        {
          type: 'category',
          label: 'Verifier',
          link: {
            type: 'doc',
            id: 'getting-started/verifier/index',
          },
          items: [
            'getting-started/verifier/import-cert',
            'getting-started/verifier/issuer-trust',
            'getting-started/verifier/read-qr',
          ],
          collapsed: false,
          collapsible: true,
        },
      ],
      collapsed: false,
      collapsible: true,
    },
    'sample-apps',
  ],
};

export default sidebars;
