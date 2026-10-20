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

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// Set once /api/tts reports it isn't configured (503), so later clicks go
// straight to browser speech: no wasted request, and speech starts within the
// click itself, which iOS Safari requires.
let serverTtsUnavailable = false;

// If browser speech hasn't started by then, report an error instead of
// showing "playing" with no sound.
const SPEECH_START_TIMEOUT_MS = 5000;

function canUseBrowserSpeech() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// iOS Safari only lets speechSynthesis speak if it was first used within a
// user gesture. Speaking a silent utterance during the click unlocks it, so the
// fallback still works after the /api/tts request fails.
function unlockBrowserSpeech() {
  const primer = new SpeechSynthesisUtterance(' ');
  primer.volume = 0;
  window.speechSynthesis.speak(primer);
}

// tts state: 'idle' | 'loading' | 'playing' | 'error'
function SpeakerButton({ text, apiUrl }) {
  const [ttsState, setTtsState] = useState('idle');
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const speakingRef = useRef(false);
  const startTimerRef = useRef(null);

  const stopBrowserSpeech = () => {
    clearTimeout(startTimerRef.current);
    if (speakingRef.current) {
      speakingRef.current = false;
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      stopBrowserSpeech();
    };
  }, []);

  // Fallback when ElevenLabs is unavailable: the browser's built-in voice.
  const speakWithBrowser = (plainText) => {
    const synth = window.speechSynthesis;
    synth.cancel(); // stop any other answer being read
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = document.documentElement.lang || 'en-US';
    // Only show "playing" once sound actually starts.
    utterance.onstart = () => {
      clearTimeout(startTimerRef.current);
      if (speakingRef.current) setTtsState('playing');
    };
    utterance.onend = () => {
      clearTimeout(startTimerRef.current);
      if (!speakingRef.current) return; // already stopped
      speakingRef.current = false;
      setTtsState('idle');
    };
    utterance.onerror = (e) => {
      clearTimeout(startTimerRef.current);
      if (!speakingRef.current) return;
      speakingRef.current = false;
      // 'interrupted'/'canceled' mean playback was stopped, not a failure.
      if (e.error === 'interrupted' || e.error === 'canceled') {
        setTtsState('idle');
        return;
      }
      console.error('Speech synthesis error:', e.error);
      setTtsState('error');
      setTimeout(() => setTtsState('idle'), 2000);
    };
    speakingRef.current = true;
    setTtsState('loading');
    clearTimeout(startTimerRef.current);
    startTimerRef.current = setTimeout(() => {
      if (!speakingRef.current) return;
      console.error('Speech synthesis did not start');
      stopBrowserSpeech();
      setTtsState('error');
      setTimeout(() => setTtsState('idle'), 2000);
    }, SPEECH_START_TIMEOUT_MS);
    synth.speak(utterance);
  };

  const handleClick = async () => {
    // If playing, stop
    if (ttsState === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopBrowserSpeech();
      setTtsState('idle');
      return;
    }

    // If loading, ignore
    if (ttsState === 'loading') return;

    const plainText = stripMarkdown(text);
    if (!plainText) return;

    if (serverTtsUnavailable && canUseBrowserSpeech()) {
      speakWithBrowser(plainText);
      return;
    }

    if (canUseBrowserSpeech()) unlockBrowserSpeech();
    setTtsState('loading');

    try {
      const res = await fetch(`${apiUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: plainText }),
      });

      if (!res.ok) {
        if (res.status === 503) serverTtsUnavailable = true;
        throw new Error(`HTTP ${res.status}`);
      }

      const blob = await res.blob();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener('ended', () => setTtsState('idle'));
      audio.addEventListener('error', () => setTtsState('error'));

      await audio.play();
      setTtsState('playing');
    } catch (err) {
      if (canUseBrowserSpeech()) {
        console.warn('Server TTS unavailable, using browser speech:', err.message);
        audioRef.current = null;
        speakWithBrowser(plainText);
        return;
      }
      console.error('TTS error:', err);
      setTtsState('error');
      setTimeout(() => setTtsState('idle'), 2000);
    }
  };

  const icons = {
    idle: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
      </svg>
    ),
    loading: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className={styles.ttsSpinner}>
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
      </svg>
    ),
    playing: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
  };

  return (
    <button
      className={`${styles.ttsButton} ${ttsState === 'playing' ? styles.ttsPlaying : ''} ${ttsState === 'error' ? styles.ttsError : ''}`}
      onClick={handleClick}
      aria-label={ttsState === 'playing' ? 'Stop audio' : 'Read aloud'}
      title={ttsState === 'playing' ? 'Stop' : ttsState === 'error' ? 'TTS error' : 'Read aloud'}
    >
      {icons[ttsState]}
    </button>
  );
}

function FeedbackButtons({ question, answer, apiUrl }) {
  const [rating, setRating] = useState(null); // 'up' | 'down' | null
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (value) => {
    if (submitted) return;
    const newRating = rating === value ? null : value;
    setRating(newRating);

    if (!newRating) return;

    // POST to feedback endpoint — only lock on success
    try {
      const res = await fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating, question, answer }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        console.error('Feedback submit error:', res.status);
        setRating(null);
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      setRating(null);
    }
  };

  return (
    <div className={styles.feedbackButtons}>
      <button
        className={`${styles.feedbackButton} ${rating === 'up' ? styles.feedbackActive : ''}`}
        onClick={() => handleFeedback('up')}
        disabled={submitted && rating !== 'up'}
        aria-label="Helpful (anonymous feedback)"
        title="Helpful (anonymous feedback)"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
        </svg>
      </button>
      <button
        className={`${styles.feedbackButton} ${rating === 'down' ? styles.feedbackActive : ''}`}
        onClick={() => handleFeedback('down')}
        disabled={submitted && rating !== 'down'}
        aria-label="Not helpful (anonymous feedback)"
        title="Not helpful (anonymous feedback)"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
        </svg>
      </button>
    </div>
  );
}

function MessageBubble({ role, content, question, showFollowUps, onFollowUp, baseUrl, apiUrl }) {
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
      {role === 'assistant' && content && (
        <div className={styles.messageActions}>
          <FeedbackButtons question={question} answer={content} apiUrl={apiUrl} />
          <SpeakerButton text={content} apiUrl={apiUrl} />
        </div>
      )}
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
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('askAiBannerDismissed') !== 'true';
    }
    return true;
  });
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

      if (!assistantText) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Sorry, no answer came back. Please try again.',
          };
          return updated;
        });
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
          {showBanner && (
            <div className={styles.pilotStrip}>
              🧪 Experimental — feedback is anonymous, no personal data is collected. <a href="https://github.com/openwallet-foundation/multipaz-developer-website/issues" target="_blank" rel="noopener noreferrer">Report issues</a>
              <button
                className={styles.pilotDismiss}
                onClick={() => { setShowBanner(false); sessionStorage.setItem('askAiBannerDismissed', 'true'); }}
                aria-label="Dismiss"
              >✕</button>
            </div>
          )}

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
            {messages.map((msg, i) => {
              // Find the preceding user message for assistant feedback
              const question = msg.role === 'assistant' && i > 0 && messages[i - 1].role === 'user'
                ? messages[i - 1].content
                : '';
              return (
                <MessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  question={question}
                  showFollowUps={!isLoading && i === messages.length - 1}
                  onFollowUp={handleSend}
                  baseUrl={baseUrl}
                  apiUrl={apiUrl}
                />
              );
            })}
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
