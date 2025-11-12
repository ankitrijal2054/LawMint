/**
 * AI Service Microservice
 * Handles AI-powered document generation and refinement using OpenAI API.
 *
 * Endpoints:
 * - POST /ai/generate - Generate demand letter draft from template + sources
 * - POST /ai/refine - Refine existing document with custom instructions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Initialize environment variables
dotenv.config();

// Initialize Firebase Admin SDK (if not already initialized)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

const expressApp = express();

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://lawmint.web.app',
];

const corsOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ??
  defaultOrigins;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      return callback(null, origin ?? corsOrigins[0]);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

expressApp.use(cors(corsOptions));
expressApp.options('*', cors(corsOptions));
expressApp.use(express.json({ limit: '50mb' }));

// ============================================================================
// OPENAI INITIALIZATION
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  console.warn('⚠️ WARNING: OPENAI_API_KEY not set. AI endpoints will fail.');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Verify Firebase ID token middleware
 */
const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.substring(7);

  try {
    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Get user data from Firestore
 */
const getUserData = async (uid: string) => {
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.data();
};

/**
 * Get template content from Firestore
 */
const getTemplateContent = async (templateId: string): Promise<string | null> => {
  try {
    // First try global templates
    const globalDoc = await db.collection('templates').doc('global').collection('templates').doc(templateId).get();
    if (globalDoc.exists) {
      return globalDoc.data()?.content || null;
    }

    // Then try all firm templates (less efficient but fallback)
    const firmsSnapshot = await db.collectionGroup('templates').where('templateId', '==', templateId).limit(1).get();
    if (!firmsSnapshot.empty) {
      return firmsSnapshot.docs[0].data()?.content || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build system prompt for legal document generation
 */
function buildGenerationSystemPrompt(): string {
  return `You are an expert legal assistant specializing in demand letters and legal documentation. Your role is to generate professional, compelling demand letters based on provided templates and source documents.

IMPORTANT FORMATTING REQUIREMENTS:
- Use proper HTML structure with semantic tags (<p>, <h1>, <h2>, <h3>, <strong>, <em>, <br>, etc.)
- ALWAYS wrap different sections in separate <p> tags
- Add line breaks between sections using </p><p> for readability
- Use <h2> for major section headings (e.g., "RE: Demand for Payment")
- Use <strong> for emphasis on important terms and amounts
- Wrap the letterhead in <p> tags with line breaks between lines
- Add a blank line (two </p><p>) between major sections
- Structure as: Letterhead → Date → Recipient Address → Salutation → Body sections → Closing → Signature
- Use proper legal letter formatting with clear visual hierarchy

Key Guidelines:
1. Maintain a professional, formal legal tone appropriate for law firm correspondence
2. Structure the letter logically with clear sections (letterhead, date, recipient, salutation, body, signature block)
3. Fill in specific details from source documents when available
4. Follow the template structure provided
5. Use accurate legal terminology and proper formatting
6. Ensure the letter is complete and ready for attorney review
7. Keep the content clear, concise, and persuasive
8. Comply with standard legal letter formatting conventions
9. Output ONLY the formatted HTML document - no explanations or commentary

The generated letter should be a polished draft that requires minimal editing from the attorney, with clear visual separation between sections.`;
}

/**
 * Build system prompt for document refinement
 */
function buildRefinementSystemPrompt(): string {
  return `You are an expert legal assistant specializing in refining and improving legal documents. Your role is to enhance existing legal documents based on specific user instructions while maintaining professional legal standards.

Key Guidelines:
1. Make targeted improvements based on user instructions
2. Maintain consistent professional legal tone throughout
3. Preserve the overall structure and key arguments of the original document
4. Enhance clarity and persuasiveness where possible
5. Ensure any additions comply with legal writing standards
6. Flag any sections that might need attorney review
7. Preserve proper formatting and structure

Provide the refined document as your response, ready for attorney review.`;
}

/**
 * Call OpenAI API to generate or refine content
 */
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI API');
    }

    return content;
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
    }
    if (error.status === 401) {
      throw new Error('OpenAI API authentication failed. Check API key configuration.');
    }
    if (error.message?.includes('exceeded')) {
      throw new Error('Request exceeded token limits. Please reduce content size.');
    }
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
expressApp.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AI service is running',
    model: OPENAI_MODEL,
    hasApiKey: !!OPENAI_API_KEY,
  });
});

/**
 * POST /ai/generate - Generate demand letter draft
 * Body: { templateId?, templateContent?, sourceTexts[], customInstructions? }
 */
expressApp.post('/ai/generate', verifyToken, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { templateId, templateContent, sourceTexts = [], customInstructions = '' } = req.body;

    // Validate inputs
    if (!sourceTexts || sourceTexts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one source text is required for generation',
      });
    }

    let finalTemplateContent = templateContent;

    // If templateId provided, fetch from Firestore
    if (templateId && !templateContent) {
      finalTemplateContent = await getTemplateContent(templateId);

      if (!finalTemplateContent) {
        return res.status(400).json({
          success: false,
          error: 'Template not found or has no content',
        });
      }
    }

    // Prepare source text summary
    const sourceTextSummary = sourceTexts
      .map((text: string, idx: number) => `[Source Document ${idx + 1}]\n${text}`)
      .join('\n\n---\n\n');

    // Build user prompt
    const userPrompt = `
Generate a professional demand letter based on the following information:

${finalTemplateContent ? `TEMPLATE TO FOLLOW:\n${finalTemplateContent}\n\n---\n\n` : ''}

SOURCE DOCUMENTS:
${sourceTextSummary}

${customInstructions ? `SPECIAL INSTRUCTIONS:\n${customInstructions}\n\n` : ''}

Please generate a complete, professional demand letter that incorporates the template structure and information from the source documents. The letter should be ready for attorney review and adjustment.
    `.trim();

    // Call OpenAI
    const systemPrompt = buildGenerationSystemPrompt();
    const generatedContent = await callOpenAI(systemPrompt, userPrompt);

    // Log generation for analytics (future use)
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'ai-service',
      action: 'generate',
      userId: uid,
      model: OPENAI_MODEL,
      templateId: templateId || 'custom',
      sourceCount: sourceTexts.length,
      success: true,
    }));

    res.status(200).json({
      success: true,
      data: {
        content: generatedContent,
        model: OPENAI_MODEL,
      },
    });
  } catch (error: any) {
    console.error('Error generating document:', error);

    res.status(error.status === 401 ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to generate document',
    });
  }
});

/**
 * POST /ai/refine - Refine existing document
 * Body: { content, refinementInstructions }
 */
expressApp.post('/ai/refine', verifyToken, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { content, refinementInstructions } = req.body;

    // Validate inputs
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Document content is required',
      });
    }

    if (!refinementInstructions || refinementInstructions.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Refinement instructions are required',
      });
    }

    // Build user prompt
    const userPrompt = `
Please refine the following legal document based on these instructions:

REFINEMENT INSTRUCTIONS:
${refinementInstructions}

CURRENT DOCUMENT:
${content}

Please provide the refined version of the document, incorporating the requested changes while maintaining professional legal standards and the original structure.
    `.trim();

    // Call OpenAI
    const systemPrompt = buildRefinementSystemPrompt();
    const refinedContent = await callOpenAI(systemPrompt, userPrompt);

    // Log refinement for analytics (future use)
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'ai-service',
      action: 'refine',
      userId: uid,
      model: OPENAI_MODEL,
      success: true,
    }));

    res.status(200).json({
      success: true,
      data: {
        content: refinedContent,
        model: OPENAI_MODEL,
      },
    });
  } catch (error: any) {
    console.error('Error refining document:', error);

    res.status(error.status === 401 ? 401 : 500).json({
      success: false,
      error: error.message || 'Failed to refine document',
    });
  }
});

export const aiService = functions.https.onRequest(expressApp);
