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
    codelabSidebar: [
      'index',
      {
        type: 'category',
        label: 'Utopia Wholesale Codelab',
        link: {
          type: 'doc',
          id: 'utopia-wholesale-codelab/index',
        },
        items: [
          'utopia-wholesale-codelab/before-you-begin',
          'utopia-wholesale-codelab/get-set-up',
          'utopia-wholesale-codelab/issuer',
          {
            type: 'category',
            label: 'Holder',
            items: [
              'utopia-wholesale-codelab/holder/obtaining-a-credential',
              'utopia-wholesale-codelab/holder/storage',
              'utopia-wholesale-codelab/holder/holder'
            ],
            collapsed: false,
            collapsible: true,
          },
          {
            type: 'category',
            label: 'Verifier',
            items: [
              'utopia-wholesale-codelab/verifier/verifier',
              'utopia-wholesale-codelab/verifier/verification-modes',
              'utopia-wholesale-codelab/verifier/testing-holder'
            ],
            collapsed: false,
            collapsible: true,
          },
          {
            type: 'category',
            label: 'Advanced Features',
            items: [
              'utopia-wholesale-codelab/advanced-features/w3c-dc-api-implementation',
              'utopia-wholesale-codelab/advanced-features/request-multiple-credentials-with-dcql',
              'utopia-wholesale-codelab/advanced-features/ios-app-group-id-setup'
            ],
            collapsed: false,
            collapsible: true,
          }
        ],
        collapsed: false,
        collapsible: true,
      },
      {
        type: 'category',
        label: 'Utopia Universe Servers Codelab',
        link: {
          type: 'doc',
          id: 'utopia-universe-servers-codelab/index',
        },
        items: [
          'utopia-universe-servers-codelab/before-you-begin',
          'utopia-universe-servers-codelab/get-set-up',
          'utopia-universe-servers-codelab/run-the-bundle',
          'utopia-universe-servers-codelab/issue-credentials',
          'utopia-universe-servers-codelab/verify-and-pay',
          'utopia-universe-servers-codelab/extend-the-servers',
          'utopia-universe-servers-codelab/deploying-to-google-cloud-run'
        ],
        collapsed: false,
        collapsible: true,
      }
    ],

  };
  
  export default sidebars;
  