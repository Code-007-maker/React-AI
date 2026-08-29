import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Lazy Google Gen AI initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.1-pro-preview',
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}

/**
 * Resilient helper utility for Gemini API with automated fallback ladder and error recovery
 */
async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getAIClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.7,
        },
      });

      const responseText = response.text || '';
      return { text: responseText, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || 500;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini Fallback] Model ${model} encountered status ${status}: ${errMsg}. Attempting fallback...`);

      // Check if recoverable status code (503, 429, 404, 500, etc.)
      const isRecoverable =
        status === 503 ||
        status === 429 ||
        status === 404 ||
        status === 500 ||
        errMsg.includes('not found') ||
        errMsg.includes('quota') ||
        errMsg.includes('unavailable');

      if (!isRecoverable && model === MODEL_FALLBACK_LADDER[MODEL_FALLBACK_LADDER.length - 1]) {
        break;
      }
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// Health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Chat / Multi-turn Reflection Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    // 2. Defensive Payload Ingestion (Null-Safe Destructuring)
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const tone = typeof data.tone === 'string' ? data.tone : 'empathetic';
    const category = typeof data.category === 'string' ? data.category : 'daily_journal';
    const contextTitle = typeof data.contextTitle === 'string' ? data.contextTitle : '';

    if (messages.length === 0) {
      res.status(400).json({ error: 'At least one message is required' });
      return;
    }

    let toneInstruction = 'Provide compassionate, validating, and constructive reflections.';
    if (tone === 'analytical') {
      toneInstruction = 'Break down thoughts with clarity, identifying root causes, patterns, and logical steps.';
    } else if (tone === 'socratic') {
      toneInstruction = 'Ask probing, thoughtful open-ended questions that help the user discover deeper clarity themselves.';
    } else if (tone === 'summarizer') {
      toneInstruction = 'Provide crisp, actionable takeaways, distillations, and bullet points.';
    }

    const systemInstruction = `You are ReflectAI, an insightful, warm, and highly capable personal journaling and reflection partner powered by Gemini.
The user is writing in their private reflection journal.
Topic/Category: ${category}
${contextTitle ? `Entry Title/Focus: ${contextTitle}` : ''}
Tone Style: ${toneInstruction}

Guidelines:
1. Treat all user input with deep respect, privacy, and care.
2. Acknowledge emotional nuances, celebrate wins, and offer gentle reframing for stressors.
3. Keep reflections clear, engaging, and readable with subtle Markdown formatting (bolding key concepts, clean bullet lists when appropriate).
4. Encourage further exploration when helpful, offering 1-2 thoughtful follow-up reflection questions or concrete micro-actions.`;

    // Map conversation turns to Gemini API contents format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 10000) }],
    }));

    const result = await generateContentWithFallback({
      contents,
      systemInstruction,
      temperature: 0.7,
    });

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate reflection response',
    });
  }
});

// Summarization & Action Items Endpoint
app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const data = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = Array.isArray(data.messages) ? data.messages : [];
    const title = typeof data.title === 'string' ? data.title : 'Reflection Session';

    if (messages.length === 0) {
      res.status(400).json({ error: 'Messages are required for summarization' });
      return;
    }

    const fullTranscript = messages
      .map((m: any) => `${m.role === 'assistant' ? 'Gemini' : 'User'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Analyze this personal reflection transcript and produce a JSON response with the following keys:
1. "summary": A well-crafted, thoughtful 2-4 sentence narrative distillation of the user's reflection and conversation.
2. "keyInsights": Array of 3-5 core takeaways or cognitive shifts extracted from the entry.
3. "actionItems": Array of 2-4 practical, encouraging micro-habits or next steps.

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "...",
  "keyInsights": ["...", "..."],
  "actionItems": ["...", "..."]
}

Transcript for entry "${title}":
${fullTranscript.slice(0, 15000)}`;

    const result = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: 'You are an expert cognitive reflection synthesizer. Output valid JSON only, without markdown codeblock wrappers.',
      temperature: 0.3,
    });

    let cleanedText = result.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(cleanedText);
      res.json({
        summary: parsed.summary || 'Summary generated.',
        keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        modelUsed: result.modelUsed,
      });
    } catch (parseErr) {
      res.json({
        summary: cleanedText,
        keyInsights: [],
        actionItems: [],
        modelUsed: result.modelUsed,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    res.status(500).json({
      error: error.message || 'Failed to synthesize summary',
    });
  }
});

// Setup Vite / Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
