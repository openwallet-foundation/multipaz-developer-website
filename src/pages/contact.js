import Layout from '@theme/Layout';

export default function Contact() {
  return (
    <Layout title="Contact" description="How to reach the Multipaz community and maintainers.">
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1rem 4rem' }}>
        <h1>Contact</h1>
        <p>
          Multipaz is a community project of the{' '}
          <a href="https://openwallet.foundation/" target="_blank" rel="noopener noreferrer">
            OpenWallet Foundation
          </a>
          . There is no private support inbox — the fastest way to reach the
          team and other developers is through the public channels below.
        </p>
        <h2>Discord (primary)</h2>
        <p>
          The Multipaz community and maintainers are active on the{' '}
          <a
            href="https://discord.com/channels/1022962884864643214/1179828955717574707"
            target="_blank"
            rel="noopener noreferrer"
          >
            #project-multipaz channel on the OpenWallet Foundation Discord
          </a>
          . Ask questions, propose features, or just say hi — public discussion
          helps everyone, so please start there before filing an issue.
        </p>
        <h2>GitHub issues</h2>
        <ul>
          <li>
            <a
              href="https://github.com/openwallet-foundation/multipaz/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              multipaz SDK issues
            </a>{' '}
            — bugs and feature requests for the SDK and libraries.
          </li>
          <li>
            <a
              href="https://github.com/openwallet-foundation/multipaz-developer-website/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              developer website issues
            </a>{' '}
            — problems or suggestions about this documentation site.
          </li>
        </ul>
        <h2>Community calls</h2>
        <p>
          The project holds public community calls and works in the open. The
          schedule, agendas, and notes are linked from the project pages on the{' '}
          <a href="https://openwallet.foundation/" target="_blank" rel="noopener noreferrer">
            OpenWallet Foundation website
          </a>{' '}
          and in the multipaz repository.
        </p>
        <h2>Security</h2>
        <p>
          Please do not report security vulnerabilities through public GitHub
          issues or Discord. Use the security policy and private vulnerability
          reporting on the{' '}
          <a href="https://github.com/openwallet-foundation/multipaz/security" target="_blank" rel="noopener noreferrer">
            multipaz repository security page
          </a>
          .
        </p>
      </main>
    </Layout>
  );
}