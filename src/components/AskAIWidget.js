import React, { useState, useRef, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import useIsBrowser from '@docusaurus/useIsBrowser';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './AskAIWidget.module.css';

function CodeBlock({ className, children }) {
  const match = /language-(\w+)/.exec(className || '');
  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  if (match) {
    return (
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={match[1]}
        customStyle={{ margin: '8px 0', borderRadius: '6px', fontSize: '12px' }}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  }
  return <code className={className}>{children}</code>;
}

function extractFollowUps(text) {
  const lines = text.trimEnd().split('\n');
  const questions = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = lines[i].match(/^[\s]*[-*]\s+\*{0,2}(.+?\?)\*{0,2}$/);
    if (match) {
      questions.unshift(match[1].trim());
    } else {
      break;
    }
  }
  return questions.length >= 2 ? questions : [];
}

function MessageBubble({ role, content, showFollowUps, onFollowUp, baseUrl }) {
  const followUps = (showFollowUps && role === 'assistant') ? extractFollowUps(content) : [];
  const markdownComponents = {
    code: CodeBlock,
    a: ({ href, children, ...props }) => {
      const fixedHref = href && href.startsWith('/') && baseUrl !== '/'
        ? `${baseUrl.replace(/\/$/, '')}${href}`
        : href;
      return <a href={fixedHref} {...props}>{children}</a>;
    },
  };
  return (
    <div className={`${styles.message} ${role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
      <div className={styles.messageContent}>
        {role === 'assistant' ? (
          <Markdown components={markdownComponents}>{content}</Markdown>
        ) : content}
      </div>
      {followUps.length > 0 && (
        <div className={styles.followUps}>
          {followUps.map((q) => (
            <button
              key={q}
              className={styles.followUpButton}
              onClick={() => onFollowUp(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AskAIWidget() {
  const isBrowser = useIsBrowser();
  const { siteConfig } = useDocusaurusContext();
  const apiUrl = siteConfig.customFields?.askAiApiUrl || 'http://localhost:3010';
  const baseUrl = siteConfig.baseUrl || '/';
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('askAiOpen') === 'true';
    }
    return false;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      try { return JSON.parse(sessionStorage.getItem('askAiMessages')) || []; } catch { return []; }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const mountedRef = useRef(false);
  // Callback ref: scrolls to bottom when the sentinel div first mounts (page refresh, navigation back)
  const scrollSentinelRef = useCallback((node) => {
    messagesEndRef.current = node;
    if (node && !mountedRef.current) {
      mountedRef.current = true;
      node.scrollIntoView({ behavior: 'instant' });
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('askAiMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('askAiOpen', String(isOpen));
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isBrowser) return null;

  const suggestedQuestions = [
    'How do I get started with Multipaz?',
    'How does credential issuance work?',
    'What verification methods are supported?',
  ];

  const handleSend = async (text) => {
    if (!text || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let buffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop(); // keep incomplete trailing frame

        for (const event of events) {
          const line = event.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              assistantText += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            } else if (data.type === 'error') {
              assistantText += '\n\nSorry, an error occurred.';
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I couldn't connect to the server. ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleSend(input.trim());
  };

  return (
    <div className={`${styles.widget} ${isExpanded && isOpen ? styles.widgetExpanded : ''}`}>
      {isOpen && (
        <div className={`${styles.chatPanel} ${isExpanded ? styles.chatPanelExpanded : ''}`}>
          <div className={styles.chatHeader}>
            <span className={styles.chatTitle}>Ask AI</span>
            <div className={styles.headerActions}>
              <button
                className={styles.expandChat}
                onClick={() => setIsExpanded((v) => !v)}
                aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
              <button
                className={styles.closeChat}
                onClick={() => { setIsExpanded(false); setIsOpen(false); }}
                aria-label="Close chat"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>
          <div className={styles.pilotStrip}>
            🧪 This is an experimental feature — <a href="https://github.com/openwallet-foundation/multipaz-developer-website/issues" target="_blank" rel="noopener noreferrer">share feedback</a>
          </div>

          <div className={`${styles.chatMessages} ${isExpanded ? styles.chatMessagesExpanded : ''}`}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✨</div>
                <div className={styles.emptyTitle}>Ask me anything about Multipaz!</div>
                <div className={styles.emptySubtitle}>I can help with setup, credentials, verification, and more.</div>
                <div className={styles.suggestedQuestions}>
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      className={styles.suggestedQuestion}
                      onClick={() => handleSend(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                role={msg.role}
                content={msg.content}
                showFollowUps={!isLoading && i === messages.length - 1}
                onFollowUp={handleSend}
                baseUrl={baseUrl}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.typingIndicator}>
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={scrollSentinelRef} />
          </div>

          <form className={styles.chatInputForm} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={styles.chatInput}
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              className={styles.sendButton}
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          className={styles.fab}
          onClick={() => setIsOpen(true)}
          aria-label="Ask AI about Multipaz"
          title="Ask AI"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white" className={styles.fabIcon}>
            <path d="M9 2l1.5 4.5L15 8l-4.5 1.5L9 14l-1.5-4.5L3 8l4.5-1.5z" />
            <path d="M18 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" className={styles.sparkleSmall} />
            <path d="M14 17l.75 2.25L17 20l-2.25.75L14 23l-.75-2.25L11 20l2.25-.75z" className={styles.sparkleTiny} />
          </svg>
        </button>
      )}
    </div>
  );
}
