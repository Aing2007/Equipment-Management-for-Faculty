import { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send, Sparkles, X } from 'lucide-react';

export default function ChatbotMock() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
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

  return (
    <div className="chatbot-dock">
      {open && (
        <section className="chatbot-panel" id="chatbot-panel" aria-label="AI Assistant ตัวอย่าง">
          <header className="chatbot-header">
            <span className="chatbot-header-icon"><MessageSquareText size={20} /></span>
            <span className="chatbot-heading"><strong>AI Assistant</strong><small>ตัวอย่างหน้าตา · ยังไม่เชื่อมต่อระบบ</small></span>
            <button ref={closeRef} className="icon-button chatbot-close" type="button" onClick={() => setOpen(false)} aria-label="ปิดแชตบอต"><X size={18} /></button>
          </header>
          <div className="chatbot-body">
            <div className="chatbot-message">
              <span className="chatbot-message-icon"><Sparkles size={15} /></span>
              <p>สวัสดีค่ะ เมื่อเชื่อมต่อระบบแล้ว ฉันจะช่วยค้นหาครุภัณฑ์ สรุปงานซ่อม และอธิบายผลวิเคราะห์ความเสี่ยงได้</p>
            </div>
            <div className="chatbot-suggestions" aria-label="ตัวอย่างคำถาม">
              <span>ตัวอย่างคำถาม</span>
              <span className="chatbot-suggestion">ครุภัณฑ์ใดใกล้ถึงรอบตรวจ?</span>
              <span className="chatbot-suggestion">สรุปงานซ่อมของเดือนนี้</span>
            </div>
          </div>
          <footer className="chatbot-footer">
            <div className="chatbot-input" aria-disabled="true">พิมพ์คำถามของคุณ... <Send size={16} /></div>
            <small>Mock layout สำหรับนักพัฒนาต่อยอด</small>
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
