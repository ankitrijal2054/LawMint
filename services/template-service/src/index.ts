/**
 * Template Service Microservice
 * Handles template upload, extraction, and management.
 *
 * Endpoints:
 * - POST /templates/upload - Upload template (PDF/DOCX) with text extraction
 * - GET /templates/global - List all global templates
 * - GET /templates/firm/:firmId - List firm-specific templates
 * - GET /templates/:templateId - Get single template details
 * - DELETE /templates/:templateId - Delete firm template (Admin/Lawyer only)
 * - GET /templates/:templateId/download - Download template file
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';

// Initialize environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const app = admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Initialize Express app
const expressApp = express();

// CORS Configuration
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
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Type-Encoding'],
  optionsSuccessStatus: 204,
};

expressApp.use(cors(corsOptions));
expressApp.options('*', cors(corsOptions));
expressApp.use(express.json({ limit: '50mb' }));
expressApp.use(express.raw({ type: 'application/pdf', limit: '50mb' }));
expressApp.use(express.raw({ type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', limit: '50mb' }));

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Verify Firebase ID token middleware
 * Extracts and verifies the token from Authorization header
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
 * Check if user has admin or lawyer role
 */
const isAdminOrLawyer = async (uid: string): Promise<boolean> => {
  const userData = await getUserData(uid);
  return userData?.role === 'admin' || userData?.role === 'lawyer';
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to extract PDF text: ${error}`);
  }
}

/**
 * Extract text from DOCX buffer
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to extract DOCX text: ${error}`);
  }
}

/**
 * Determine file type from buffer or filename
 */
function getFileType(filename: string): 'pdf' | 'docx' {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  throw new Error('Invalid file type. Only PDF and DOCX are supported.');
}

/**
 * Get current timestamp
 */
function getCurrentTimestamp(): number {
  return Date.now();
}

// ============================================================================
// PUBLIC ENDPOINTS (no authentication required)
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
expressApp.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Template service is running',
  });
});

/**
 * GET /templates/global
 * List all global templates (public, all authenticated users can read)
 */
expressApp.get('/templates/global', verifyToken, async (req: Request, res: Response) => {
  try {
    const snapshot = await db
      .collection('templates')
      .doc('global')
      .collection('items')
      .get();

    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching global templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch global templates',
    });
  }
});

// ============================================================================
// PROTECTED ENDPOINTS (authentication required)
// ============================================================================

/**
 * GET /templates/firm/:firmId
 * List firm-specific templates
 */
expressApp.get('/templates/firm/:firmId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { firmId } = req.params;
    const userId = (req as any).user.uid;

    // Verify user is member of firm
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.firmId !== firmId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this firm',
      });
    }

    const snapshot = await db
      .collection('templates')
      .doc(firmId)
      .collection('items')
      .get();

    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching firm templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch firm templates',
    });
  }
});

/**
 * GET /templates/:templateId
 * Get single template details (metadata only, not the full content)
 */
expressApp.get('/templates/:templateId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const userId = (req as any).user.uid;

    // Try to fetch from global templates first
    let templateDoc = await db
      .collection('templates')
      .doc('global')
      .collection('items')
      .doc(templateId)
      .get();

    if (templateDoc.exists) {
      return res.status(200).json({
        success: true,
        data: {
          id: templateDoc.id,
          type: 'global',
          ...templateDoc.data(),
        },
      });
    }

    // Try to fetch from user's firm templates
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    templateDoc = await db
      .collection('templates')
      .doc(userData.firmId)
      .collection('items')
      .doc(templateId)
      .get();

    if (templateDoc.exists) {
      return res.status(200).json({
        success: true,
        data: {
          id: templateDoc.id,
          type: 'firm-specific',
          firmId: userData.firmId,
          ...templateDoc.data(),
        },
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Template not found',
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
    });
  }
});

/**
 * POST /templates/upload
 * Upload new template (PDF/DOCX) with text extraction
 * Only Admin and Lawyer roles can upload
 */
expressApp.post('/templates/upload', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;
    const { templateName, fileData, fileName } = req.body;

    // Validate required fields
    if (!templateName || !fileData || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: templateName, fileData, fileName',
      });
    }

    // Check user permissions (admin or lawyer only)
    const hasPermission = await isAdminOrLawyer(userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and lawyers can upload templates',
      });
    }

    // Get user firm ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const firmId = userData.firmId;

    // Decode base64 file data
    const buffer = Buffer.from(fileData, 'base64');
    const fileType = getFileType(fileName);

    // Extract text from file
    let extractedText = '';
    if (fileType === 'pdf') {
      extractedText = await extractTextFromPDF(buffer);
    } else if (fileType === 'docx') {
      extractedText = await extractTextFromDOCX(buffer);
    }

    // Generate unique template ID
    const templateId = uuidv4();

    // Upload file to Storage
    const storagePath = `templates/${firmId}/${templateId}/${fileName}`;
    const fileRef = storage.bucket().file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });

    // Create template metadata in Firestore
    const templateMetadata = {
      name: templateName,
      type: 'firm-specific',
      content: extractedText,
      metadata: {
        originalFileName: fileName,
        fileType: fileType,
        uploadedBy: userId,
        size: buffer.length,
      },
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    await db
      .collection('templates')
      .doc(firmId)
      .collection('items')
      .doc(templateId)
      .set(templateMetadata);

    return res.status(201).json({
      success: true,
      data: {
        id: templateId,
        ...templateMetadata,
      },
      message: 'Template uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload template',
    });
  }
});

/**
 * DELETE /templates/:templateId
 * Delete firm template (Admin/Lawyer only)
 * Can only delete from user's own firm
 */
expressApp.delete('/templates/:templateId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const userId = (req as any).user.uid;

    // Check user permissions (admin or lawyer only)
    const hasPermission = await isAdminOrLawyer(userId);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and lawyers can delete templates',
      });
    }

    // Get user firm ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const firmId = userData.firmId;

    // Verify template exists and belongs to firm
    const templateDoc = await db
      .collection('templates')
      .doc(firmId)
      .collection('items')
      .doc(templateId)
      .get();

    if (!templateDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    // Delete template file from Storage
    const templateData = templateDoc.data();
    if (templateData?.metadata?.originalFileName) {
      const storagePath = `templates/${firmId}/${templateId}/${templateData.metadata.originalFileName}`;
      try {
        await storage.bucket().file(storagePath).delete();
      } catch (err) {
        console.warn('File not found in storage, continuing with metadata deletion:', err);
      }
    }

    // Delete template metadata from Firestore
    await db
      .collection('templates')
      .doc(firmId)
      .collection('items')
      .doc(templateId)
      .delete();

    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete template',
    });
  }
});

/**
 * GET /templates/:templateId/download
 * Download template file
 * Returns a signed URL for the file
 */
expressApp.get('/templates/:templateId/download', verifyToken, async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { firmId: queryFirmId } = req.query as { firmId?: string };
    const userId = (req as any).user.uid;

    // Get user firm ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const firmId = queryFirmId || userData.firmId;

    // Verify user has access to this firm
    if (queryFirmId && queryFirmId !== userData.firmId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to download from this firm',
      });
    }

    // Get template metadata
    const templateDoc = await db
      .collection('templates')
      .doc(firmId)
      .collection('items')
      .doc(templateId)
      .get();

    if (!templateDoc.exists) {
      // Check global templates
      const globalTemplateDoc = await db
        .collection('templates')
        .doc('global')
        .collection('items')
        .doc(templateId)
        .get();

      if (!globalTemplateDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Template not found',
        });
      }

      // Generate signed URL for global template
      const templateData = globalTemplateDoc.data();
      const storagePath = `templates/global/${templateId}/${templateData?.metadata?.originalFileName}`;
      const signedUrl = await storage
        .bucket()
        .file(storagePath)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 1 * 60 * 60 * 1000, // 1 hour
        });

      return res.status(200).json({
        success: true,
        data: {
          downloadUrl: signedUrl[0],
          fileName: templateData?.metadata?.originalFileName,
        },
      });
    }

    // Generate signed URL for firm template
    const templateData = templateDoc.data();
    const storagePath = `templates/${firmId}/${templateId}/${templateData?.metadata?.originalFileName}`;
    const signedUrl = await storage
      .bucket()
      .file(storagePath)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 1 * 60 * 60 * 1000, // 1 hour
      });

    return res.status(200).json({
      success: true,
      data: {
        downloadUrl: signedUrl[0],
        fileName: templateData?.metadata?.originalFileName,
      },
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate download URL',
    });
  }
});

export const templateService = functions.https.onRequest(expressApp);

