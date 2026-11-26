import Layout from '@theme/Layout';

export default function Privacy() {
  return (
    <Layout
      title="Privacy"
      description="What data this documentation site collects and how it is handled."
    >
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <h1>Privacy</h1>
        <p>
          This is the developer documentation site for the open-source Multipaz
          project, hosted by the{' '}
          <a href="https://openwallet.foundation/" target="_blank" rel="noopener noreferrer">
            OpenWallet Foundation
          </a>{' '}
          and built with{' '}
          <a href="https://docusaurus.io" target="_blank" rel="noopener noreferrer">
            Docusaurus
          </a>{' '}
          on GitHub Pages. This page describes what data the site itself
          handles. It is informational and not a substitute for the OpenWallet
          Foundation's policies.
        </p>
        <h2>Browsing the site</h2>
        <p>
          The site is fully static: it has no user accounts, does not require
          sign-in, and does not itself place tracking cookies. Reading pages
          downloads standard web resources (HTML, JavaScript, CSS, images) from
          GitHub Pages, which may process standard request logs such as IP
          address and user agent. See GitHub's privacy documentation for
          details on how GitHub Pages handles that data.
        </p>
        <h2>Search</h2>
        <p>
          Site search is provided by Algolia DocSearch. When you type a search
          query, the query is sent to Algolia to return matching pages. Algolia
          processes this data as described in{' '}
          <a href="https://www.algolia.com/policies/privacy" target="_blank" rel="noopener noreferrer">
            Algolia's privacy policy
          </a>
          .
        </p>
        <h2>Ask AI</h2>
        <p>
          The "Ask AI" widget lets you ask questions about the documentation.
          When you use it, your conversation (your questions and the assistant's
          answers) is sent to a server operated for this site, which forwards it
          to Google's Gemini API to generate the response. If you submit the
          thumbs-up/thumbs-down feedback, the rating together with the related
          question and answer is stored to improve the documentation. Do not
          include personal or confidential information in questions or feedback.
        </p>
        <h2>External links</h2>
        <p>
          The site links to external services — for example GitHub, the
          OpenWallet Foundation Discord, and partner sites. Those services have
          their own privacy policies, which apply once you leave this site.
        </p>
        <h2>Questions</h2>
        <p>
          Questions about this page or the project can be raised on the{' '}
          <a
            href="https://discord.com/channels/1022962884864643214/1179828955717574707"
            target="_blank"
            rel="noopener noreferrer"
          >
            Multipaz Discord channel
          </a>{' '}
          or as an issue on the{' '}
          <a
            href="https://github.com/openwallet-foundation/multipaz-developer-website/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            website repository
          </a>
          .
        </p>
      </main>
    </Layout>
  );
}