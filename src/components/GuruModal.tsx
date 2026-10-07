import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Bot,
  User as UserIcon,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ChatMessage,
  loadGuruChatFromFirestore,
  saveGuruChatToFirestore,
  clearGuruChatInFirestore
} from '../lib/guruChat';

interface GuruModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_GURU_MESSAGE: ChatMessage = {
  id: 'init-guru-msg',
  sender: 'guru',
  text: 'Namaste! I am Guru, your guide in academic learning and Indian wisdom. What chapter concept, Hindu mythology, or Sanskrit explanation would you like to explore today?',
  timestamp: Date.now(),
};

const SUGGESTED_QUESTIONS = [
  'Explain Chemical Reactions simply',
  'Meaning and Sanskrit roots of Gayatri Mantra',
  'Story of Arjuna & Krishna in the Bhagavad Gita',
  'What are Newton’s Laws of Motion?',
  'Explain the concepts of Dharma and Karma',
];

export const GuruModal: React.FC<GuruModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GURU_MESSAGE]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load chat history from Firestore when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadHistory = async () => {
        try {
          const history = await loadGuruChatFromFirestore(user);
          if (history && history.length > 0) {
            setMessages(history);
          } else {
            setMessages([INITIAL_GURU_MESSAGE]);
          }
        } catch (err) {
          console.warn('[Guru Modal] Error loading history:', err);
        }
      };

      loadHistory();
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom('auto');
      }, 100);
    }
  }, [isOpen, user?.uid]);

  // Scroll on messages change
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    // Save user message (only persists to Firestore if user signed in with Google/Email)
    saveGuruChatToFirestore(newMessages, user);

    try {
      const response = await fetch('/api/guru-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: newMessages,
        }),
      });

      const data = await response.json().catch(() => null);

      let replyText = data?.reply;
      if (!replyText || typeof replyText !== 'string') {
        replyText =
          data?.error ||
          'I am reflecting on your question. Let us return to your studies: what concept can we review together?';
      }

      // Ensure reply is pure plaintext with no markdown symbols
      const cleanReply = replyText
        .replace(/(\*{1,3}|_{1,3})([^*_\n]+)\1/g, '$2')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/`/g, '')
        .replace(/^[ \t]*#+[ \t]*/gm, '')
        .replace(/[*_~]/g, '')
        .trim();

      const guruMsg: ChatMessage = {
        id: `guru-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: 'guru',
        text: cleanReply,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, guruMsg];
      setMessages(finalMessages);
      saveGuruChatToFirestore(finalMessages, user);
    } catch (err) {
      console.error('[Guru Chat Fetch Error]:', err);
      const errorMsg: ChatMessage = {
        id: `guru-err-${Date.now()}`,
        sender: 'guru',
        text: 'I am taking a moment to reflect. Let us continue our discussion on your chapter. Please ask your question again.',
        timestamp: Date.now(),
      };
      const finalMessages = [...newMessages, errorMsg];
      setMessages(finalMessages);
      saveGuruChatToFirestore(finalMessages, user);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClearChat = async () => {
    setIsClearing(true);
    try {
      await clearGuruChatInFirestore(user);
      setMessages([INITIAL_GURU_MESSAGE]);
    } catch (err) {
      console.warn('[Guru Modal] Error clearing chat:', err);
    } finally {
      setIsClearing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Helper to render pure plaintext without any markdown, bolding, or symbol highlighting
  const renderPlainText = (rawText: string) => {
    // Strip any markdown asterisks, hashes, backticks, or symbols
    const cleanText = rawText
      .replace(/(\*{1,3}|_{1,3})([^*_\n]+)\1/g, '$2')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/`/g, '')
      .replace(/^[ \t]*#+[ \t]*/gm, '')
      .replace(/[*_~]/g, '');

    const lines = cleanText.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm leading-relaxed my-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guru-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl h-[88vh] max-h-[720px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all relative"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-warm)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==========================================================
            MODAL HEADER: Guru Avatar, Title & Subtitle, Clear Chat, X Button
            (Strictly NO technical specifiers)
           ========================================================== */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0"
          style={{
            borderColor: 'var(--border-warm)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="guru-modal-title"
                className="text-lg font-extrabold tracking-tight font-serif-heading"
                style={{ color: 'var(--text-primary)' }}
              >
                Guru
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Your Academic & Cultural Heritage Companion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear Chat Button */}
            <button
              type="button"
              id="guru-clear-chat-btn"
              onClick={handleClearChat}
              disabled={isClearing || (messages.length <= 1 && !isLoading)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-secondary)',
              }}
              title="Clear entire conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            {/* Close (X) Button */}
            <button
              type="button"
              id="guru-modal-close-btn"
              onClick={onClose}
              aria-label="Close Guru modal"
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 cursor-pointer shadow-2xs"
              style={{
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==========================================================
            CHAT MESSAGES AREA (Scrollable)
           ========================================================== */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          style={{ backgroundColor: 'var(--bg-main)' }}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Sender Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser
                      ? 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      : 'text-white'
                  }`}
                  style={!isUser ? { backgroundColor: 'var(--accent-saffron)' } : undefined}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-2xs text-sm leading-relaxed ${
                    isUser
                      ? 'rounded-tr-none text-white'
                      : 'rounded-tl-none border'
                  }`}
                  style={
                    isUser
                      ? {
                          backgroundColor: 'var(--accent-saffron)',
                        }
                      : {
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-warm)',
                          color: 'var(--text-primary)',
                        }
                  }
                >
                  {renderPlainText(msg.text)}
                </div>
              </div>
            );
          })}

          {/* Thinking / Reflecting Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs"
                style={{ backgroundColor: 'var(--accent-saffron)' }}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div
                className="rounded-2xl rounded-tl-none border px-4 py-3 shadow-2xs flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-warm)',
                }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--accent-saffron-text)' }}>
                  Guru is reflecting
                </span>
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ==========================================================
            SUGGESTED STARTER PILLS (Shown if conversation is short)
           ========================================================== */}
        {messages.length <= 1 && !isLoading && (
          <div
            className="px-4 py-2 border-t flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0"
            style={{
              borderColor: 'var(--border-warm)',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <span className="text-xs font-bold text-nowrap" style={{ color: 'var(--text-secondary)' }}>
              Ask:
            </span>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border shrink-0 transition-all hover:opacity-80 active:scale-95 cursor-pointer shadow-2xs"
                style={{
                  backgroundColor: 'var(--bg-main)',
                  borderColor: 'var(--border-warm)',
                  color: 'var(--text-primary)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ==========================================================
            INPUT BAR
           ========================================================== */}
        <div
          className="p-3 sm:p-4 border-t shrink-0"
          style={{
            borderColor: 'var(--border-warm)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              id="guru-chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Guru about chapters, Indian culture, mythology, or Sanskrit..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 disabled:opacity-60"
              style={{
                backgroundColor: 'var(--bg-main)',
                borderColor: 'var(--border-warm)',
                color: 'var(--text-primary)',
                outlineColor: 'var(--accent-saffron)',
              }}
            />
            <button
              type="submit"
              id="guru-send-message-btn"
              disabled={!inputText.trim() || isLoading}
              aria-label="Send message to Guru"
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0"
              style={{
                backgroundColor: 'var(--accent-saffron)',
                color: '#FFFFFF',
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
