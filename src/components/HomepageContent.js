import React from 'react';
import styles from './HomepageContent.module.css';

const cards = [
  {
    title: 'API Reference',
    description: 'Explore comprehensive documentation for every API endpoint.',
    icon: '📘',
    link: '/docs/api-reference',
  },
  {
    title: 'Codelabs',
    description: 'Hands-on tutorials to guide you through key concepts.',
    icon: '🧪',
    link: '/docs/codelabs',
  },
  {
    title: 'Sample Apps',
    description: 'Review practical examples to help you build quickly.',
    icon: '💡',
    link: '/docs/sample-apps',
  },
  {
    title: 'Showcase Apps',
    description: 'See real-world apps built with our platform.',
    icon: '🌟',
    link: '/docs/showcase-apps',
  },
];

export default function HomepageContent() {
  return (
    <div className={styles.container}>
      {cards.map((card) => (
        <a key={card.title} href={card.link} className={styles.card}>
          <div className={styles.icon}>{card.icon}</div>
          <h3 className={styles.title}>{card.title}</h3>
          <p className={styles.description}>{card.description}</p>
        </a>
      ))}
    </div>
  );
}
