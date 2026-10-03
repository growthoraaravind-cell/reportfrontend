import { useState, type FormEvent } from 'react';
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import { apiError, postData, track, visitorId } from '../../lib/api';

interface ChatReply {
  sessionId: string;
  reply: string;
  quickReplies: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickReplies = ['How do I check eligibility?', 'How to get Udyam?', 'Talk to an expert'];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Hello. I can help you explore schemes, registrations, or your next business step.' }]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('growthora.chatSession') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(message: string) {
    const text = message.trim();
    if (!text || busy) return;
    setInput('');
    setError('');
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const result = await postData<ChatReply>('/chat/message', { message: text, sessionId: sessionId || undefined, visitorId: visitorId() });
      setSessionId(result.sessionId);
      localStorage.setItem('growthora.chatSession', result.sessionId);
      setMessages((current) => [...current, { role: 'assistant', content: result.reply }]);
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <>
      {open && (
        <section className="chat-panel" aria-label="Growthora chat assistant">
          <header className="chat-header"><div><strong>Growthora assistant</strong><span>Here to help you move forward</span></div><button className="chat-close" type="button" aria-label="Close chat" onClick={() => setOpen(false)}><FiX /></button></header>
          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => <p key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>{message.content}</p>)}
            {busy && <p className="chat-message assistant">Thinking…</p>}
            {error && <p className="inline-error">{error}</p>}
          </div>
          <div className="chat-quick-replies">{quickReplies.map((reply) => <button key={reply} type="button" onClick={() => void send(reply)}>{reply}</button>)}</div>
          <form className="chat-input" onSubmit={submit}><input aria-label="Your message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Growthora" maxLength={1000} /><button type="submit" aria-label="Send message" disabled={busy || !input.trim()}><FiSend /></button></form>
          <a className="chat-human-link" href="https://wa.me/916360886843" target="_blank" rel="noreferrer">Continue with a person on WhatsApp</a>
        </section>
      )}
      <button className={`chat-launcher${open ? ' is-open' : ''}`} type="button" aria-label={open ? 'Close assistant' : 'Open assistant'} onClick={() => { if (!open) void track('chat_opened', window.location.pathname).catch(() => undefined); setOpen(!open); }}>
        {open ? <FiX /> : <><FiMessageCircle /><span>Ask Growthora</span></>}
      </button>
    </>
  );
}