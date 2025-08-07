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
          'Utopia Wholesale Codelab/holder',
          'Utopia Wholesale Codelab/verifier',
          'Utopia Wholesale Codelab/issuer',
        ],
        collapsed: false,
        collapsible: true,
      }
    ],
  
  };
  
  export default sidebars;
  