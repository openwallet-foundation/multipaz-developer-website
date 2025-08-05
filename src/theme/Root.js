import React from 'react';
import FeedbackWidget from '../components/FeedbackWidget';

export default function Root({children}) {
  return (
    <>
      {children}
      <FeedbackWidget />
    </>
  );
} 