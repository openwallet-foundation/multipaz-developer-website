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
          id: 'Utopia Wholesale Codelab/index',
        },
        items: [
          'Utopia Wholesale Codelab/Before You Begin',
          'Utopia Wholesale Codelab/Get Set Up',
             'Utopia Wholesale Codelab/Issuer',
          {
            type: 'category',
            label: 'Holder',
            items: [
              'Utopia Wholesale Codelab/Holder/Obtaining a credential',
              'Utopia Wholesale Codelab/Holder/Storage',
              'Utopia Wholesale Codelab/Holder/Holder'
            ],
            collapsed: false,
            collapsible: true,
          },
          {
            type: 'category',
            label: 'Verifier',
            items: [
              'Utopia Wholesale Codelab/Verifier/Verifier',
              'Utopia Wholesale Codelab/Verifier/BLE and Camera Permission',
              'Utopia Wholesale Codelab/Verifier/Verification Modes',
              'Utopia Wholesale Codelab/Verifier/How to Import a Certificate'
            ],
            collapsed: false,
            collapsible: true,
          },
       
        ],
        collapsed: false,
        collapsible: true,
      }
    ],
  
  };
  
  export default sidebars;
  