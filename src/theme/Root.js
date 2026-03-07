import React from 'react';
import FeedbackWidget from '../components/FeedbackWidget';
import AskAIWidget from '../components/AskAIWidget';

export default function Root({children}) {
  return (
    <>
      {children}
      <FeedbackWidget />
      <AskAIWidget />
    </>
  );
} 