const express = require('express');
const { protect } = require('../middleware/auth');
const { answerQuestion, AssistantError } = require('../services/assistant');

const router = express.Router();
const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_QUESTION_LENGTH = 1000;

router.post('/chat', protect, async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_HISTORY_MESSAGES) {
    return res.status(400).json({ success: false, message: 'กรุณาส่งประวัติแชตไม่เกิน 8 ข้อความ' });
  }

  const history = [];
  for (const entry of messages.slice(0, -1)) {
    if (!entry || !['user', 'assistant'].includes(entry.role) || typeof entry.content !== 'string' || !entry.content.trim() || entry.content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ success: false, message: 'รูปแบบประวัติแชตไม่ถูกต้อง' });
    }
    history.push({ role: entry.role, content: entry.content.trim() });
  }

  const latest = messages.at(-1);
  if (!latest || latest.role !== 'user' || typeof latest.content !== 'string') {
    return res.status(400).json({ success: false, message: 'ข้อความล่าสุดต้องเป็นคำถามจากผู้ใช้' });
  }
  const question = latest.content.trim();
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return res.status(400).json({ success: false, message: `คำถามต้องมีความยาวไม่เกิน ${MAX_QUESTION_LENGTH} ตัวอักษร` });
  }

  try {
    const data = await answerQuestion(question, history.slice(-6), req.user);
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof AssistantError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('AI assistant request failed:', error);
    return res.status(500).json({ success: false, message: 'ค้นข้อมูลหรือสร้างคำตอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' });
  }
});

module.exports = router;
