// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

require('dotenv').config();

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Multipaz',
  tagline: 'Multipaz is an identity framework designed to handle secure, real-world credential issuance and verification.',
  favicon: 'img/multipaz.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  customFields: {
    askAiApiUrl: process.env.ASK_AI_API_URL || '',
  },

  url: process.env.DOCUSAURUS_URL || 'http://localhost',
  baseUrl: process.env.DOCUSAURUS_BASEURL || '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'openmobilehub', // Usually your GitHub org/user name.
  projectName: 'developer-multipaz-website', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  onBrokenAnchors: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        /* docs: {
          sidebarPath: './sidebars.js'
        }, */
        docs: false,
        blog: {
          showReadingTime: true,
          blogTitle: 'Multipaz Blog',
          blogDescription: 'News, updates, and stories from the Multipaz team.',
          postsPerPage: 10,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        // No id means this is the default docs instance
        path: 'docs',
        routeBasePath: 'docs', // or '/' for root
        sidebarPath: require.resolve('./sidebars.js'),
      },
    ],

    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'contributing',
        path: 'contributing',
        routeBasePath: 'contributing',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'codelabs',
        path: 'codelabs',
        routeBasePath: 'codelabs',
        sidebarPath: require.resolve('./sidebars.codelabs.js'),
      },
    ],

    // Redirect the old space/capitalized codelab URLs (which produced %20 in
    // links) to the new kebab-case paths, so existing/bookmarked links keep working.
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          { from: '/codelabs/Utopia Wholesale Codelab', to: '/codelabs/utopia-wholesale-codelab' },
          { from: '/codelabs/Utopia Wholesale Codelab/Before You Begin', to: '/codelabs/utopia-wholesale-codelab/before-you-begin' },
          { from: '/codelabs/Utopia Wholesale Codelab/Get Set Up', to: '/codelabs/utopia-wholesale-codelab/get-set-up' },
          { from: '/codelabs/Utopia Wholesale Codelab/Issuer', to: '/codelabs/utopia-wholesale-codelab/issuer' },
          { from: '/codelabs/Utopia Wholesale Codelab/Holder/Obtaining a credential', to: '/codelabs/utopia-wholesale-codelab/holder/obtaining-a-credential' },
          { from: '/codelabs/Utopia Wholesale Codelab/Holder/Storage', to: '/codelabs/utopia-wholesale-codelab/holder/storage' },
          { from: '/codelabs/Utopia Wholesale Codelab/Holder/Holder', to: '/codelabs/utopia-wholesale-codelab/holder/holder' },
          { from: '/codelabs/Utopia Wholesale Codelab/Verifier/Verifier', to: '/codelabs/utopia-wholesale-codelab/verifier/verifier' },
          { from: '/codelabs/Utopia Wholesale Codelab/Verifier/Verification Modes', to: '/codelabs/utopia-wholesale-codelab/verifier/verification-modes' },
          { from: '/codelabs/Utopia Wholesale Codelab/Verifier/Testing Holder', to: '/codelabs/utopia-wholesale-codelab/verifier/testing-holder' },
          { from: '/codelabs/Utopia Wholesale Codelab/Advanced Features/W3C DC API Implementation', to: '/codelabs/utopia-wholesale-codelab/advanced-features/w3c-dc-api-implementation' },
          { from: '/codelabs/Utopia Wholesale Codelab/Advanced Features/Request Multiple Credentials with DCQL', to: '/codelabs/utopia-wholesale-codelab/advanced-features/request-multiple-credentials-with-dcql' },
          { from: '/codelabs/Utopia Wholesale Codelab/Advanced Features/iOS App Group ID Setup', to: '/codelabs/utopia-wholesale-codelab/advanced-features/ios-app-group-id-setup' },
          // Utopia Universe Servers Codelab
          { from: '/codelabs/Utopia Universe Servers Codelab', to: '/codelabs/utopia-universe-servers-codelab' },
          { from: '/codelabs/Utopia Universe Servers Codelab/Before You Begin', to: '/codelabs/utopia-universe-servers-codelab/before-you-begin' },
          { from: '/codelabs/Utopia Universe Servers Codelab/Get Set Up', to: '/codelabs/utopia-universe-servers-codelab/get-set-up' },
          { from: '/codelabs/Utopia Universe Servers Codelab/Run the Bundle', to: '/codelabs/utopia-universe-servers-codelab/run-the-bundle' },
          { from: '/codelabs/Utopia Universe Servers Codelab/Issue Credentials', to: '/codelabs/utopia-universe-servers-codelab/issue-credentials' },
          { from: '/codelabs/Utopia Universe Servers Codelab/Verify and Pay', to: '/codelabs/utopia-universe-servers-codelab/verify-and-pay' },
          { from: '/codelabs/Utopia Universe Servers Codelab/Extend the Servers', to: '/codelabs/utopia-universe-servers-codelab/extend-the-servers' },
          { from: '/codelabs/Utopia Universe Servers Codelab/Deploying to Google Cloud Run', to: '/codelabs/utopia-universe-servers-codelab/deploying-to-google-cloud-run' },
        ],
      },
    ],

  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [
        {
          name: "algolia-site-verification",
          content: "004D866D9F7AD1BD",
        },
      ],

      algolia: {
        // The application ID provided by Algolia
        appId: "VCNDSOJNTR",

        // Public API key: it is safe to commit it
        apiKey: "952725045e5be0fe86e3c6dbca429a57",

        indexName: "Algolia Crawler for Multipaz Developer Website",

        // Optional: see doc section below
        contextualSearch: true,
      },

      // Replace with your project's social card
      image: 'img/multipaz.png',
      navbar: {
        title: 'Multipaz',
        logo: {
          alt: 'MultipazLogo',
          src: 'img/multipaz.png',
        },
        items: [
          {
            label: "Getting Started",
            to: "/docs",
            position: "left",
          },
          {
            label: 'Codelabs',
            to: '/codelabs',
            position: 'left',
          },
          {
            label: 'API Docs',
            to: '/api-reference',
            position: 'left',
            items: [
              { label: 'Multipaz SDK ↗', href: '/kdocs/index.html', target: '_blank' },
              { label: 'Extras SDK ↗', href: '/kdocs-extras/index.html', target: '_blank' },
            ],
          },
          {
            label: 'Applications',
            position: 'left',
            items: [
              { label: 'Android Apps', href: 'https://apps.multipaz.org/', target: '_blank' },
              { label: 'Web Verifier App', href: 'https://verifier.multipaz.org/', target: '_blank' },
              { label: 'Issuer Portal', href: 'https://issuer.multipaz.org/', target: '_blank' },
              { label: 'Identity Reader Backend', href: 'https://verifier.multipaz.org/identityreaderbackend/', target: '_blank' },
            ],
          },
          {
            label: 'Contributing',
            to: '/contributing/contributing',
            position: 'left',
          },
          {
            label: 'Collaborators',
            to: '/collaborators',
            position: 'left',
          },
          {
            label: 'Showcase',
            to: '/showcase',
            position: 'left',
          },
          {
            label: 'Blog',
            to: '/blog',
            position: 'left',
          },
          {
            type: 'html',
            position: 'right',
            value: `
              <a href="https://github.com/openwallet-foundation-labs/identity-credential" target="_blank" aria-label="GitHub repository" style="display: flex; align-items: center;">
                <img src="https://raw.githubusercontent.com/openmobilehub/developer-multipaz-website/refs/heads/main/static/img/GitHub_Invertocat_Dark.png" alt="GitHub" width="28" height="28" style="vertical-align: middle;" />
              </a>
            `,
          },
          {
            label: 'Community',
            position: 'right',
            items: [
              {
                type: 'html',
                value: `
                  <a href="https://discord.com/channels/1022962884864643214/1179828955717574707" target="_blank" style="display: flex; align-items: center; gap: 0.5em; text-decoration: none; color: inherit;">
                    <img src="https://raw.githubusercontent.com/openmobilehub/developer-multipaz-website/refs/heads/main/static/img/Discord-Symbol-Blurple.svg" alt="Discord" width="20" height="20" style="vertical-align: middle;" />
                    Discord
                  </a>
                `,
              },
              {
                type: 'html',
                value: `
                  <a href="https://x.com/TBD-MULTIPAZ" target="_blank" style="display: flex; align-items: center; gap: 0.5em; text-decoration: none; color: inherit;">
                    <img src="https://github.com/openmobilehub/developer-multipaz-website/blob/main/static/img/x-logo-black.png?raw=true" alt="X" width="14" height="14" style="vertical-align: middle; border-radius: 4px;" />
                    X
                  </a>
                `,
              },
            ],
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Get Started',
                to: '/docs/getting-started',
              },
              {
                label: 'API Reference',
                to: '/api-reference',
              },
              {
                label: 'Codelabs',
                to: '/codelabs',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discord',
                href: 'https://discord.gg/openwalletfoundation',
              },
              {
                label: 'Showcase',
                href: '/showcase',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/facebook/docusaurus',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Open Wallet Foundation.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      mermaid: {

      },
    }),
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
