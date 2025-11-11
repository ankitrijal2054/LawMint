"use strict";
/**
 * Document Service Microservice
 * Handles document lifecycle, permissions, and collaboration metadata.
 *
 * Endpoints:
 * - POST /documents - Create new document
 * - GET /documents/:documentId - Get document details
 * - PUT /documents/:documentId - Update document content
 * - DELETE /documents/:documentId - Delete document
 * - GET /documents/user/:uid - List user's documents
 * - GET /documents/firm/:firmId - List firm-wide documents
 * - GET /documents/shared/:uid - List documents shared with user
 * - POST /documents/:documentId/share - Update sharing settings
 * - POST /documents/upload-sources - Upload source documents (PDF/DOCX)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentService = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mammoth_1 = __importDefault(require("mammoth"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const uuid_1 = require("uuid");
// Initialize environment variables
dotenv_1.default.config();
// Initialize Firebase Admin SDK (if not already initialized)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();
const expressApp = (0, express_1.default)();
// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://lawmint.web.app',
];
const corsOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ??
    defaultOrigins;
const corsOptions = {
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
expressApp.use((0, cors_1.default)(corsOptions));
expressApp.options('*', (0, cors_1.default)(corsOptions));
expressApp.use(express_1.default.json({ limit: '50mb' }));
expressApp.use(express_1.default.raw({ type: 'application/pdf', limit: '50mb' }));
expressApp.use(express_1.default.raw({
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    limit: '50mb',
}));
// ============================================================================
// MIDDLEWARE
// ============================================================================
/**
 * Verify Firebase ID token middleware
 */
const verifyToken = async (req, res, next) => {
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
        req.user = decodedToken;
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
        });
    }
};
/**
 * Get user data from Firestore
 */
const getUserData = async (uid) => {
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.data();
};
/**
 * Check if user has admin or lawyer role
 */
const isAdminOrLawyer = async (uid) => {
    const userData = await getUserData(uid);
    return userData?.role === 'admin' || userData?.role === 'lawyer';
};
/**
 * Check if user belongs to a firm
 */
const userBelongsToFirm = async (uid, firmId) => {
    const userData = await getUserData(uid);
    return userData?.firmId === firmId;
};
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer) {
    try {
        const data = await (0, pdf_parse_1.default)(buffer);
        return data.text;
    }
    catch (error) {
        throw new Error(`Failed to extract PDF text: ${error}`);
    }
}
/**
 * Extract text from DOCX buffer
 */
async function extractTextFromDOCX(buffer) {
    try {
        const result = await mammoth_1.default.extractRawText({ buffer });
        return result.value;
    }
    catch (error) {
        throw new Error(`Failed to extract DOCX text: ${error}`);
    }
}
/**
 * Determine file type from filename
 */
function getFileType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf')
        return 'pdf';
    if (ext === 'docx' || ext === 'doc')
        return 'docx';
    throw new Error('Invalid file type. Only PDF and DOCX are supported.');
}
/**
 * Get signed download URL for storage file
 */
async function getSignedUrl(storagePath, expiresIn = 3600) {
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
    });
    return url;
}
// ============================================================================
// ENDPOINTS
// ============================================================================
/**
 * Health check endpoint
 */
expressApp.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Document service is running',
    });
});
/**
 * POST /documents - Create new document
 * Body: { title, firmId, templateId?, sourceDocuments?, visibility, content }
 */
expressApp.post('/documents', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { title, firmId, templateId, sourceDocuments = [], visibility = 'private', content = '' } = req.body;
        // Validate required fields
        if (!title || !firmId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: title, firmId',
            });
        }
        // Validate visibility
        if (!['private', 'shared', 'firm-wide'].includes(visibility)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid visibility. Must be: private, shared, or firm-wide',
            });
        }
        // Check user belongs to firm
        const belongsToFirm = await userBelongsToFirm(uid, firmId);
        if (!belongsToFirm) {
            return res.status(403).json({
                success: false,
                error: 'User does not belong to this firm',
            });
        }
        // Check user has permission to create document
        const isLawyer = await isAdminOrLawyer(uid);
        if (!isLawyer) {
            return res.status(403).json({
                success: false,
                error: 'Only admins and lawyers can create documents',
            });
        }
        // Create document in Firestore
        const documentId = (0, uuid_1.v4)();
        const now = firestore_1.FieldValue.serverTimestamp();
        const documentData = {
            documentId,
            firmId,
            ownerId: uid,
            title,
            content,
            templateId: templateId || null,
            sourceDocuments,
            visibility,
            sharedWith: visibility === 'shared' ? [] : [],
            activeUsers: [{ uid, name: req.user.email }],
            lastActivityAt: now,
            status: 'draft',
            metadata: {
                lastEditedBy: uid,
                wordCount: content.split(/\s+/).length,
                version: 1,
                notes: '',
            },
            createdAt: now,
            updatedAt: now,
        };
        await db.collection('documents').doc(documentId).set(documentData);
        res.status(201).json({
            success: true,
            data: {
                documentId,
                document: documentData,
            },
        });
    }
    catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({
            success: false,
            error: `Failed to create document: ${error}`,
        });
    }
});
/**
 * GET /documents/:documentId - Get document details
 */
expressApp.get('/documents/:documentId', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { documentId } = req.params;
        const docSnap = await db.collection('documents').doc(documentId).get();
        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        const document = docSnap.data();
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        // Check permissions
        const isOwner = document.ownerId === uid;
        const isFirmWide = document.visibility === 'firm-wide' && document.firmId === (await getUserData(uid))?.firmId;
        const isShared = document.visibility === 'shared' && document.sharedWith.includes(uid);
        if (!isOwner && !isFirmWide && !isShared) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
            });
        }
        res.status(200).json({
            success: true,
            document,
        });
    }
    catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({
            success: false,
            error: `Failed to fetch document: ${error}`,
        });
    }
});
/**
 * PUT /documents/:documentId - Update document content
 * Body: { content, status? }
 */
expressApp.put('/documents/:documentId', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { documentId } = req.params;
        const { content, status } = req.body;
        const docSnap = await db.collection('documents').doc(documentId).get();
        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        const document = docSnap.data();
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        // Check permissions
        const isOwner = document.ownerId === uid;
        const isLawyer = await isAdminOrLawyer(uid);
        const isShared = document.visibility !== 'private' && (document.sharedWith?.includes(uid) || document.visibility === 'firm-wide');
        if (!isOwner && !(isShared && document.visibility !== 'private')) {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
            });
        }
        // Update document
        const updateData = {
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            'metadata.lastEditedBy': uid,
        };
        if (content !== undefined) {
            updateData.content = content;
            updateData['metadata.wordCount'] = content.split(/\s+/).length;
        }
        if (status !== undefined && ['draft', 'final', 'approved'].includes(status)) {
            updateData.status = status;
        }
        await db.collection('documents').doc(documentId).update(updateData);
        res.status(200).json({
            success: true,
            message: 'Document updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({
            success: false,
            error: `Failed to update document: ${error}`,
        });
    }
});
/**
 * DELETE /documents/:documentId - Delete document
 */
expressApp.delete('/documents/:documentId', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { documentId } = req.params;
        const docSnap = await db.collection('documents').doc(documentId).get();
        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        const document = docSnap.data();
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        // Only owner can delete
        if (document.ownerId !== uid) {
            return res.status(403).json({
                success: false,
                error: 'Only the document owner can delete it',
            });
        }
        // Delete document
        await db.collection('documents').doc(documentId).delete();
        // Delete source files from Storage
        if (document.sourceDocuments && Array.isArray(document.sourceDocuments)) {
            const bucket = storage.bucket();
            for (const source of document.sourceDocuments) {
                try {
                    await bucket.file(source.storagePath).delete();
                }
                catch (e) {
                    console.warn(`Failed to delete file: ${source.storagePath}`, e);
                }
            }
        }
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            error: `Failed to delete document: ${error}`,
        });
    }
});
/**
 * GET /documents/user/:uid - List user's documents (private + shared with + authored)
 */
expressApp.get('/documents/user/:uid', verifyToken, async (req, res) => {
    try {
        const currentUid = req.user.uid;
        const { uid } = req.params;
        // Can only list own documents
        if (currentUid !== uid) {
            return res.status(403).json({
                success: false,
                error: 'Can only list your own documents',
            });
        }
        const userData = await getUserData(uid);
        const firmId = userData?.firmId;
        // Query: documents owned by user
        const ownedDocs = await db
            .collection('documents')
            .where('ownerId', '==', uid)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        // Query: documents shared with user
        const sharedDocs = await db
            .collection('documents')
            .where('sharedWith', 'array-contains', uid)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        // Query: firm-wide documents (if user belongs to firm)
        let firmWideDocs = [];
        if (firmId) {
            const firmDocs = await db
                .collection('documents')
                .where('firmId', '==', firmId)
                .where('visibility', '==', 'firm-wide')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();
            firmWideDocs = firmDocs.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((doc) => doc.ownerId !== uid); // Exclude already owned
        }
        const documents = [
            ...ownedDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            ...sharedDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            ...firmWideDocs,
        ];
        res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    }
    catch (error) {
        console.error('Error listing user documents:', error);
        res.status(500).json({
            success: false,
            error: `Failed to list documents: ${error}`,
        });
    }
});
/**
 * GET /documents/firm/:firmId - List firm-wide documents
 */
expressApp.get('/documents/firm/:firmId', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { firmId } = req.params;
        // Check user belongs to firm
        const belongsToFirm = await userBelongsToFirm(uid, firmId);
        if (!belongsToFirm) {
            return res.status(403).json({
                success: false,
                error: 'User does not belong to this firm',
            });
        }
        // Query firm-wide documents
        const docs = await db
            .collection('documents')
            .where('firmId', '==', firmId)
            .where('visibility', '==', 'firm-wide')
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        const documents = docs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    }
    catch (error) {
        console.error('Error listing firm documents:', error);
        res.status(500).json({
            success: false,
            error: `Failed to list firm documents: ${error}`,
        });
    }
});
/**
 * GET /documents/shared/:uid - List documents shared with user
 */
expressApp.get('/documents/shared/:uid', verifyToken, async (req, res) => {
    try {
        const currentUid = req.user.uid;
        const { uid } = req.params;
        // Can only list documents shared with self
        if (currentUid !== uid) {
            return res.status(403).json({
                success: false,
                error: 'Can only list documents shared with you',
            });
        }
        const docs = await db
            .collection('documents')
            .where('sharedWith', 'array-contains', uid)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        const documents = docs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    }
    catch (error) {
        console.error('Error listing shared documents:', error);
        res.status(500).json({
            success: false,
            error: `Failed to list shared documents: ${error}`,
        });
    }
});
/**
 * POST /documents/:documentId/share - Update document sharing settings
 * Body: { visibility, sharedWith? }
 */
expressApp.post('/documents/:documentId/share', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { documentId } = req.params;
        const { visibility, sharedWith = [] } = req.body;
        if (!['private', 'shared', 'firm-wide'].includes(visibility)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid visibility. Must be: private, shared, or firm-wide',
            });
        }
        const docSnap = await db.collection('documents').doc(documentId).get();
        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        const document = docSnap.data();
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        // Only owner can change sharing settings
        if (document.ownerId !== uid) {
            return res.status(403).json({
                success: false,
                error: 'Only the document owner can change sharing settings',
            });
        }
        // Update document
        await db.collection('documents').doc(documentId).update({
            visibility,
            sharedWith: visibility === 'shared' ? sharedWith : [],
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        res.status(200).json({
            success: true,
            message: 'Document sharing updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating document sharing:', error);
        res.status(500).json({
            success: false,
            error: `Failed to update sharing: ${error}`,
        });
    }
});
/**
 * POST /documents/upload-sources - Upload and extract source documents
 * Body: { documentId, files: [{ filename, data (base64) }] }
 * Returns: { extractedTexts, sourceDocuments }
 */
expressApp.post('/documents/upload-sources', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const { documentId, files } = req.body;
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files provided',
            });
        }
        // If documentId provided, verify access
        if (documentId) {
            const docSnap = await db.collection('documents').doc(documentId).get();
            if (docSnap.exists) {
                const document = docSnap.data();
                if (document) {
                    const belongsToFirm = await userBelongsToFirm(uid, document.firmId);
                    if (!belongsToFirm) {
                        return res.status(403).json({
                            success: false,
                            error: 'User does not have access to this document',
                        });
                    }
                }
            }
        }
        const extractedTexts = [];
        const sourceDocuments = [];
        const bucket = storage.bucket();
        // Process each file
        for (const file of files) {
            const { filename, data: base64Data } = file;
            if (!filename || !base64Data) {
                return res.status(400).json({
                    success: false,
                    error: 'Each file must have filename and data (base64)',
                });
            }
            try {
                // Decode base64
                const buffer = Buffer.from(base64Data, 'base64');
                // Get file type
                const fileType = getFileType(filename);
                // Extract text
                let extractedText = '';
                if (fileType === 'pdf') {
                    extractedText = await extractTextFromPDF(buffer);
                }
                else if (fileType === 'docx') {
                    extractedText = await extractTextFromDOCX(buffer);
                }
                // Store file in Firebase Storage
                const userData = await getUserData(uid);
                const firmId = userData?.firmId;
                const docId = documentId || `temp_${Date.now()}`;
                const storagePath = `sources/${firmId}/${docId}/${filename}`;
                const fileRef = bucket.file(storagePath);
                await fileRef.save(buffer);
                extractedTexts.push(extractedText);
                sourceDocuments.push({
                    fileName: filename,
                    fileType,
                    storagePath,
                    extractedText,
                    uploadedAt: firestore_1.FieldValue.serverTimestamp(),
                    uploadedBy: uid,
                });
            }
            catch (fileError) {
                console.error(`Error processing file ${filename}:`, fileError);
                return res.status(400).json({
                    success: false,
                    error: `Failed to process file ${filename}: ${fileError}`,
                });
            }
        }
        res.status(200).json({
            success: true,
            data: {
                extractedTexts,
                sourceDocuments,
            },
        });
    }
    catch (error) {
        console.error('Error uploading sources:', error);
        res.status(500).json({
            success: false,
            error: `Failed to upload source documents: ${error}`,
        });
    }
});
exports.documentService = functions.https.onRequest(expressApp);
