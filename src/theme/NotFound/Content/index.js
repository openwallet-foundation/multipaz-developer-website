import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';

/**
 * Overrides the classic theme's NotFound/Content so agent-friendly 404s
 * work everywhere: the static 404.html served by GitHub Pages (production)
 * and client-side "route not found" rendering (dev server and in-app
 * navigation to unknown URLs).
 */
export default function NotFoundContent({ className }) {
  const { siteConfig } = useDocusaurusContext();
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className="row">
        <div className="col col--8 col--offset-2">
          <Heading as="h1" className="hero__title">
            404 — Page Not Found
          </Heading>
          <p>
            The page you requested does not exist on the {siteConfig.title}{' '}
            developer documentation. Nothing was found at this address, but all
            of the documentation is reachable from the links below.
          </p>
          <h2>Where to go next</h2>
          <ul>
            <li>
              <Link to="/docs/getting-started">Documentation root (Getting Started)</Link>
            </li>
            <li>
              <a href={useBaseUrl('/sitemap.xml')}>Sitemap (all pages)</a>
            </li>
            <li>
              <a href={useBaseUrl('/llms.txt')}>llms.txt (AI agent index of this site)</a>
            </li>
            <li>
              <Link to="/codelabs">Codelabs</Link>
            </li>
            <li>
              <a href={useBaseUrl('/kdocs/index.html')}>API reference (KDoc)</a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
