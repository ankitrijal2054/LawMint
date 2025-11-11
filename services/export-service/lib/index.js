"use strict";
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
exports.exportService = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const docx_1 = require("docx");
/**
 * Export Service Microservice
 * Handles document export to DOCX format with professional styling.
 * Includes standardized CORS configuration matching other services.
 */
// Initialize environment variables
dotenv_1.default.config();
// Initialize Firebase Admin SDK (if not already initialized)
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            projectId: process.env.GCLOUD_PROJECT || 'lawmint',
        });
    }
    catch (error) {
        // App might already be initialized in some contexts
        console.warn('Firebase Admin SDK already initialized or initialization failed', error);
    }
}
const expressApp = (0, express_1.default)();
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
expressApp.use(express_1.default.json());
/**
 * Verify Firebase ID Token from Authorization header
 */
async function verifyFirebaseToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);
    return await admin.auth().verifyIdToken(token);
}
/**
 * Convert HTML/text content to DOCX document with professional styling
 */
function convertContentToDOCX(content) {
    // Split content into paragraphs (by double newlines or HTML paragraphs)
    const paragraphStrings = content
        .split(/\n\n+|<p>|<\/p>/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    // Convert paragraphs to DOCX paragraphs with professional styling
    const paragraphs = paragraphStrings.map((text) => new docx_1.Paragraph({
        text: sanitizeText(text),
        spacing: {
            line: 360, // 1.5 line spacing (240 = single, 360 = 1.5, 480 = double)
            after: 200, // Space after paragraph
        },
        alignment: docx_1.AlignmentType.LEFT,
        style: 'Normal',
    }));
    // Create DOCX document with professional margins and styling
    return new docx_1.Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: (0, docx_1.convertInchesToTwip)(1),
                            bottom: (0, docx_1.convertInchesToTwip)(1),
                            left: (0, docx_1.convertInchesToTwip)(1),
                            right: (0, docx_1.convertInchesToTwip)(1),
                        },
                    },
                },
                children: paragraphs,
            },
        ],
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Times New Roman',
                        size: 22, // 11pt (22 half-points)
                        color: '000000',
                    },
                    paragraph: {
                        spacing: { line: 360, after: 200 },
                    },
                },
            },
        },
    });
}
/**
 * Sanitize text by removing HTML tags
 */
function sanitizeText(text) {
    return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace nbsp with space
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
}
/**
 * Health check endpoint
 */
expressApp.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Export service is running',
    });
});
/**
 * POST /export/docx
 * Export document to DOCX format
 *
 * Request body:
 * {
 *   documentId: string,
 *   content: string,  // Document content (HTML or plain text)
 *   title?: string    // Document title (optional)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   downloadUrl: string,  // Signed download URL
 *   fileName: string,
 *   exportedAt: timestamp
 * }
 */
expressApp.post('/export/docx', async (req, res) => {
    try {
        // Verify authentication
        const authHeader = req.headers.authorization;
        const decodedToken = await verifyFirebaseToken(authHeader);
        const userId = decodedToken.uid;
        // Validate request body
        const { documentId, content, title } = req.body;
        if (!documentId || !content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: documentId and content',
            });
        }
        // Verify user has access to document
        const docRef = admin.firestore().collection('documents').doc(documentId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
            });
        }
        const docData = docSnap.data();
        // Check access permissions
        const isOwner = docData.ownerId === userId;
        const isFirmMember = docData.visibility === 'firmWide' ||
            (docData.sharedWith && docData.sharedWith[userId]);
        const userFirm = await admin
            .firestore()
            .collection('users')
            .doc(userId)
            .get()
            .then((snap) => snap.data()?.firmId);
        const isFirmWide = docData.firmId === userFirm && docData.visibility === 'firmWide';
        if (!isOwner && !isFirmMember && !isFirmWide) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this document',
            });
        }
        // Convert content to DOCX
        const docxDocument = convertContentToDOCX(content);
        // Generate DOCX buffer
        const docxBuffer = await docx_1.Packer.toBuffer(docxDocument);
        // Create filename
        const fileName = `${title || 'document'}_${Date.now()}.docx`;
        // Log export
        console.log(`Document exported: ${documentId} by user: ${userId}`);
        // Return DOCX file directly as downloadable response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', docxBuffer.length);
        res.status(200).send(docxBuffer);
    }
    catch (error) {
        console.error('Export error:', error);
        // Handle authentication errors
        if (error.message.includes('Token')) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: Invalid or expired token',
            });
        }
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to export document',
        });
    }
});
exports.exportService = functions.https.onRequest(expressApp);
