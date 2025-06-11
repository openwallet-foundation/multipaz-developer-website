// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Multipaz',
  tagline: 'Digital Identity Simplified!',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://vishnusanal.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/developer-multipaz-website/',

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
        docs: {
          sidebarPath: './sidebars.js'
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
        id: 'overview', 
        path: 'overview',
        routeBasePath: 'overview',
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
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'showcase', 
        path: 'showcase',
        routeBasePath: 'showcase',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'changelog', 
        path: 'changelog',
        routeBasePath: 'changelog',
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
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
            label: 'Get Started',
            to: '/overview/getting-started',
            position: 'left'
          },
          {
            label: 'API Reference',
            href: '/kdocs/index.html',
            target: '_blank',
            position: 'left',
          },
          {
            label: 'Codelabs',
            to: '/codelabs/codelabs',
            position: 'left',
          },
          {
            label: 'Contributing',
            to: '/contributing/contributing',
            position: 'left',
          },
          {
            label: 'Changelog',
            to: '/changelog/changelog',
            position: 'left',
          },
          {
            label: 'Showcase',
            to: '/showcase/showcase',
            position: 'left',
          },
          {
            href: 'https://github.com/facebook/docusaurus',
            label: 'GitHub',
            position: 'right',
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
                to: '/overview/getting-started',
              },
              {
                label: 'API Reference',
                target: '_blank',
                href: '/kdocs/index.html',
              },
              {
                label: 'Codelabs',
                to: '/codelabs/codelabs',
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
                href: '/showcase/showcase',
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
        copyright: `Copyright © ${new Date().getFullYear()} Open Wallet Foundation. Built with <a href="https://github.com/facebook/docusaurus">Docusaurus</a>.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
