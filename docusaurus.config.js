// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

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
        docs:false,
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
            label: 'API ↗',
            href: '/kdocs/index.html',
            target: '_blank',
            position: 'left',
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
                label: 'API Reference ↗',
                target: '_blank',
                href: '/kdocs/index.html',
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

    }),
};

export default config;
