import React, {useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';
import clsx from 'clsx';
import styles from './FeedbackWidget.module.css';

export default function FeedbackWidget() {
  const [isVisible, setIsVisible] = useState(true);
  const {siteConfig} = useDocusaurusContext();
  const isBrowser = useIsBrowser();

  // Don't render on server-side
  if (!isBrowser) {
    return null;
  }

  const handleFeedbackClick = () => {
    const issueUrl = 'https://github.com/openwallet-foundation/multipaz-developer-website/issues/new';
    const template = 'website-feedback.md';
    
    // Get the current page title
    const pageTitle = document.title || 'Unknown Page';
    const currentPath = window.location.pathname;
    
    const title = encodeURIComponent(`Website Feedback - ${pageTitle} (${currentPath})`);
    const body = encodeURIComponent(`## Feedback Type
- [ ] Bug report
- [ ] Feature request
- [ ] Documentation improvement
- [ ] General feedback

## Description
Please describe your feedback here...

## Page URL
${window.location.href}

## Page Title
${pageTitle}

## Browser/Device
${navigator.userAgent}

## Additional Context
Any additional information that might be helpful...
`);
    
    window.open(`${issueUrl}?template=${template}&title=${title}&body=${body}`, '_blank');
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.feedbackWidget}>
      <button
        className={styles.feedbackButton}
        onClick={handleFeedbackClick}
        aria-label="Report an issue or provide feedback"
        title="Report an issue or provide feedback"
      >
        <svg
          className={styles.feedbackIcon}
          viewBox="0 0 24 24"
          fill="white"
          width="20"
          height="20"
        >
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
        </svg>
        <span className={styles.feedbackText}>Feedback</span>
      </button>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close feedback widget"
        title="Close"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          width="16"
          height="16"
        >
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  );
} 