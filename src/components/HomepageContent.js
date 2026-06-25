import React from 'react';
import styles from './HomepageContent.module.css';
import Link from '@docusaurus/Link';

const cards = [
  {
    title: 'Agentic',
    description: 'AI agents for identity and commerce — MCP, x402, and more.',
    icon: '🤖',
    link: '/docs/agentic',
  },
  {
    title: 'API Reference',
    description: 'Explore comprehensive documentation for every API endpoint.',
    icon: '📘',
    link: 'kdocs/index.html',
    target: '_blank',
  },
  {
    title: 'Codelabs',
    description: 'Hands-on tutorials to guide you through key concepts.',
    icon: '🧪',
    link: '/codelabs',
  },
  {
    title: 'Sample Apps',
    description: 'Review practical examples to help you build quickly.',
    icon: '💡',
    link: '#',
  },
  {
    title: 'Showcase Apps',
    description: 'See real-world apps built with our platform.',
    icon: '🌟',
    link: '/showcase',
  },
];

export default function HomepageContent() {
  return (
    <div className={styles.container}>
      {cards.map((card) => (
        <Link key={card.title} to={card.link} target={card.target} className={styles.card}>
          <div className={styles.icon}>{card.icon}</div>
          <h3 className={styles.title}>{card.title}</h3>
          <p className={styles.description}>{card.description}</p>
        </Link>
      ))}
    </div>
  );
}
