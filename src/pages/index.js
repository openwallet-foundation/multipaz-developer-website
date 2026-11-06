import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import Heading from "@theme/Heading";
import styles from "./index.module.css";
import HomepageContent from "../components/HomepageContent";

import useBaseUrl from "@docusaurus/useBaseUrl";


function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <img src={useBaseUrl("/img/multipaz.png")} alt="Multipaz Logo" style={{ height: 192, marginBottom: 20 }} />
       
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started"
          >
            Get Started
          </Link>
        </div>
        <Link to="/docs/agentic/skills" className={styles.agenticBanner}>
          <span className={styles.agenticBadge}>New</span>
          <span className={styles.agenticText}>
            <strong>Multipaz Skill:</strong> give your AI coding agent built-in
            Multipaz expertise.
          </span>
          <span className={styles.agenticArrow} aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Multipaz is an identity framework designed to handle secure, real-world credential issuance and verification."
    >
      <HomepageHeader />
      <main>
        <HomepageContent />
      </main>
    </Layout>
  );
}
