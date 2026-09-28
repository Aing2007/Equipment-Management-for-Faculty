import { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send, Sparkles, X } from 'lucide-react';
import { api } from '../api';

const suggestions = [
  'สรุปจำนวนครุภัณฑ์',
  'สรุปงานซ่อมของเดือนนี้',
  'ครุภัณฑ์ใดใกล้ถึงรอบตรวจ?'
];

export default function ChatbotMock() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpenRef.current) triggerRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, error, open]);

  async function sendMessage(text = draft) {
    const question = text.trim();
    if (!question || busy) return;
    const userMessage = { role: 'user', content: question };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setBusy(true);
    try {
      const response = await api('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: nextMessages.slice(-8) })
      });
      setMessages((current) => [...current, {
        role: 'assistant',
        content: response.reply,
        sources: response.sources || []
      }]);
    } catch (cause) {
      setError(cause.message || 'ส่งคำถามไม่สำเร็จ กรุณาลองใหม่');
      inputRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chatbot-dock">
      {open && (
        <section className="chatbot-panel" id="chatbot-panel" aria-label="AI Assistant">
          <header className="chatbot-header">
            <span className="chatbot-header-icon"><MessageSquareText size={20} /></span>
            <span className="chatbot-heading"><strong>AI Assistant</strong><small>ตอบจากข้อมูลครุภัณฑ์ในระบบ</small></span>
            <button ref={closeRef} className="icon-button chatbot-close" type="button" onClick={() => setOpen(false)} aria-label="ปิดแชตบอต"><X size={18} /></button>
          </header>
          <div className="chatbot-body" ref={bodyRef} aria-live="polite">
            <div className="chatbot-message">
              <span className="chatbot-message-icon"><Sparkles size={15} /></span>
              <p>สวัสดีค่ะ ถามข้อมูลครุภัณฑ์ รอบตรวจ และงานซ่อมได้เลย ฉันจะค้นข้อมูลล่าสุดจากระบบมาช่วยตอบ</p>
            </div>
            {messages.map((message, index) => (
              <div className={`chatbot-message ${message.role === 'user' ? 'from-user' : ''}`} key={`${message.role}-${index}`}>
                {message.role === 'assistant' && <span className="chatbot-message-icon"><Sparkles size={15} /></span>}
                <div className="chatbot-message-content">
                  <p>{message.content}</p>
                  {message.sources?.length > 0 && <small className="chatbot-sources">อ้างอิง: {message.sources.join(' · ')}</small>}
                </div>
              </div>
            ))}
            {busy && <div className="chatbot-message"><span className="chatbot-message-icon"><Sparkles size={15} /></span><p className="chatbot-loading" role="status">กำลังค้นข้อมูลและร่างคำตอบ...</p></div>}
            {error && <div className="chatbot-error" role="alert">{error}</div>}
            {!messages.length && <div className="chatbot-suggestions" aria-label="ตัวอย่างคำถาม">
              <span>ตัวอย่างคำถาม</span>
              {suggestions.map((suggestion) => <button className="chatbot-suggestion" key={suggestion} type="button" disabled={busy} onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}
            </div>}
            <div ref={(element) => { if (element && bodyRef.current) element.scrollIntoView({ block: 'end' }); }} />
          </div>
          <footer className="chatbot-footer">
            <form className="chatbot-compose" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
              <input ref={inputRef} className="chatbot-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="พิมพ์คำถามของคุณ..." aria-label="พิมพ์คำถามของคุณ" maxLength={1000} disabled={busy} />
              <button className="chatbot-send" type="submit" aria-label="ส่งคำถาม" disabled={busy || !draft.trim()}><Send size={16} /></button>
            </form>
            <small>คำตอบสร้างจากข้อมูลที่คุณมีสิทธิ์เข้าถึง</small>
          </footer>
        </section>
      )}
      {!open && (
        <button
          ref={triggerRef}
          className="chatbot-trigger"
          type="button"
          aria-label="เปิดแชตบอต"
          onClick={() => setOpen(true)}
          title="AI Assistant"
        >
          <MessageSquareText size={25} strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}
