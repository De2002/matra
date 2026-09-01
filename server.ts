import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));

// Built-in offline dictionary helper for instant, reliable definitions
const OFFLINE_DICTIONARY: Record<string, { phonetic?: string; partOfSpeech: string; definition: string; example?: string }> = {
  scruttin: {
    phonetic: '/ˈskruː.tɪn/',
    partOfSpeech: 'proper noun',
    definition: 'A fast, elegant and lightweight multi-format document and PDF reader.',
    example: 'Scruttin opens documents instantly with minimal memory footprint.'
  },
  pdf: {
    phonetic: '/ˌpiː diː ˈef/',
    partOfSpeech: 'noun',
    definition: 'Portable Document Format: a versatile file format created by Adobe that gives people an easy, reliable way to present and exchange documents.',
    example: 'The manual was exported as a searchable PDF.'
  },
  document: {
    phonetic: '/ˈdɒkjʊm(ə)nt/',
    partOfSpeech: 'noun',
    definition: 'A piece of written, printed, or electronic matter that provides information or evidence or that serves as an official record.',
    example: 'Please open the document in continuous view mode.'
  },
  reader: {
    phonetic: '/ˈriːdə/',
    partOfSpeech: 'noun',
    definition: 'A program or device that enables the reading of electronic books, documents, or data files.',
    example: 'Scruttin is the fastest document reader available.'
  },
  annotation: {
    phonetic: '/ˌænəˈteɪʃn/',
    partOfSpeech: 'noun',
    definition: 'A note of explanation or comment added to a text, diagram, or document.',
    example: 'Highlight important passages with custom annotations.'
  }
};

// Lazy Google GenAI Client
let genAI: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please check environment variables.');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Scruttin Web Server', timestamp: Date.now() });
});

// AI Chat with Document Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, model = 'gemini-2.5-flash', history = [] } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `**Notice:** The AI Chat feature requires a \`GEMINI_API_KEY\`. You can set this in your environment settings.\n\n*Document Context Snippet:*\n> ${context ? context.slice(0, 300) + '...' : 'No document loaded yet.'}\n\nTo answer your question: "${message}", please provide your API key for real-time generative responses.`,
        mockNotice: true
      });
    }

    const ai = getGenAI();
    
    // Build prompt with document context and system instructions
    const systemInstruction = `You are Scruttin AI Assistant, an expert document analysis assistant built into Scruttin Web.
Your job is to assist the user in reading, understanding, summarizing, searching, and analyzing the loaded document.
Document context:
---
${context || 'No specific document context provided.'}
---
Answer concisely, cite page numbers or sections when evident, and use clear markdown formatting with lists and bold text when helpful.`;

    const contents = [
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction
      }
    });

    const reply = response.text || 'No response generated.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(200).json({
      reply: `**Notice:** AI request could not be processed (${error.message || 'Service unavailable'}). Please check your GEMINI_API_KEY configuration.`,
      error: error.message || 'Failed to process AI chat request',
      mockNotice: true
    });
  }
});

// Translation Endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'Spanish' } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Text is required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        translatedText: `[${targetLanguage} Translation]: ${text}`,
        sourceLanguage: 'Auto',
        targetLanguage,
        mockNotice: true
      });
    }

    const ai = getGenAI();
    const prompt = `Translate the following passage accurately and fluently into ${targetLanguage}. Output ONLY the translated text without extra commentary:\n\n${text}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return res.json({
      translatedText: response.text?.trim() || text,
      targetLanguage
    });
  } catch (error: any) {
    console.error('Error in /api/translate:', error);
    const { text, targetLanguage = 'Spanish' } = req.body || {};
    return res.json({
      translatedText: `[${targetLanguage}]: ${text || ''}`,
      targetLanguage,
      mockNotice: true
    });
  }
});

// Quick Definition & Analysis Endpoint
app.post('/api/define', async (req, res) => {
  try {
    const { word, context = '' } = req.body || {};
    if (!word) return res.status(400).json({ error: 'Word/phrase is required' });

    const lowerWord = word.trim().toLowerCase();

    // Check offline dictionary first for instant response
    if (OFFLINE_DICTIONARY[lowerWord]) {
      const entry = OFFLINE_DICTIONARY[lowerWord];
      return res.json({
        word,
        phonetic: entry.phonetic,
        meanings: [
          {
            partOfSpeech: entry.partOfSpeech,
            definitions: [
              {
                definition: entry.definition,
                example: entry.example
              }
            ]
          }
        ],
        definition: `${entry.partOfSpeech}: ${entry.definition}`
      });
    }

    // If Gemini API is available, generate comprehensive dictionary definition
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGenAI();
        const prompt = `Provide a structured dictionary entry for the term "${word}" in JSON format:
{
  "word": "${word}",
  "phonetic": "/pronunciation/",
  "meanings": [
    {
      "partOfSpeech": "noun/verb/adjective",
      "definitions": [
        { "definition": "clear explanation", "example": "example sentence" }
      ]
    }
  ],
  "definition": "concise summary definition"
}
Document Context for nuances: "${context.slice(0, 300)}"
Respond with ONLY valid JSON.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const jsonText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '';
        const parsed = JSON.parse(jsonText);
        return res.json(parsed);
      } catch (aiErr) {
        console.warn('AI dictionary generation fallback:', aiErr);
      }
    }

    // Default fallback
    return res.json({
      word,
      phonetic: '',
      meanings: [
        {
          partOfSpeech: 'term',
          definitions: [
            {
              definition: `A referenced term or concept in the document ("${word}").`,
              example: context ? `"...${context.slice(0, 80)}..."` : undefined
            }
          ]
        }
      ],
      definition: `Definition of "${word}": A key concept or phrase within the document.`,
      mockNotice: true
    });
  } catch (error: any) {
    console.error('Error in /api/define:', error);
    return res.json({
      word: req.body?.word || 'Term',
      definition: `Definition for "${req.body?.word || 'selected text'}".`,
      mockNotice: true
    });
  }
});

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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scruttin Web Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
