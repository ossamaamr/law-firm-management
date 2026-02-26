import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CasEngine server is running' });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'CasEngine - Test Email',
      html: '<h1>CasEngine Test Email</h1><p>Email service is working!</p>',
    });
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ CasEngine server running on http://localhost:${PORT}`);
  console.log(`📧 Resend API configured: ${process.env.RESEND_API_KEY ? 'Yes' : 'No'}`);
});
