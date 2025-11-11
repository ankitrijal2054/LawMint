"use strict";
/**
 * Auth Service Microservice
 * Handles user authentication, firm creation/joining, and user management
 *
 * Endpoints:
 * - POST /auth/signup - Create new user account
 * - POST /auth/login - Validate user login (client-side handled, backend validation only)
 * - POST /auth/createFirm - Create new firm
 * - POST /auth/joinFirm - Join existing firm
 * - GET /auth/user/:uid - Get user profile
 * - GET /auth/firm/:firmId - Get firm details
 * - GET /auth/firm/:firmId/members - Get firm members
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
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Initialize environment variables
dotenv_1.default.config();
// Initialize Firebase Admin SDK
const app = admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
// Initialize Express app
const expressApp = (0, express_1.default)();
// Middleware
expressApp.use((0, cors_1.default)({ origin: true }));
expressApp.use(express_1.default.json());
// ============================================================================
// MIDDLEWARE
// ============================================================================
/**
 * Verify Firebase ID token middleware
 * Extracts and verifies the token from Authorization header
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
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Generate unique firm code in format: STENO-XXXXX
 */
function generateFirmCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `STENO-${code}`;
}
/**
 * Check if firm code already exists
 */
async function firmCodeExists(firmCode) {
    const snapshot = await db
        .collection('firms')
        .where('firmCode', '==', firmCode)
        .limit(1)
        .get();
    return !snapshot.empty;
}
/**
 * Get current timestamp
 */
function getCurrentTimestamp() {
    return Date.now();
}
// ============================================================================
// PUBLIC ENDPOINTS (no authentication required)
// ============================================================================
/**
 * POST /auth/signup
 * Create a new user account
 * This is mainly for backend record-keeping; Firebase Auth handles actual signup
 */
expressApp.post('/auth/signup', async (req, res) => {
    try {
        const { uid, email, name } = req.body;
        if (!uid || !email || !name) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: uid, email, name',
            });
        }
        // Check if user already exists
        const existingUser = await db.collection('users').doc(uid).get();
        if (existingUser.exists) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
            });
        }
        // User will be created when they complete firm creation or join flow
        // For now, just acknowledge the signup
        return res.status(201).json({
            success: true,
            data: {
                uid,
                email,
                name,
            },
            message: 'Signup successful. Please create or join a firm.',
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * POST /auth/login
 * Validate user credentials (Firebase Auth handles actual login)
 * This endpoint is mainly for backend to retrieve/validate user on login
 */
expressApp.post('/auth/login', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: uid',
            });
        }
        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found. Please create or join a firm first.',
            });
        }
        const user = userDoc.data();
        return res.status(200).json({
            success: true,
            data: {
                uid,
                email: user?.email,
                name: user?.name,
                firmId: user?.firmId,
                role: user?.role,
            },
            message: 'Login successful',
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
// ============================================================================
// PROTECTED ENDPOINTS (require authentication)
// ============================================================================
/**
 * POST /auth/createFirm
 * Create a new firm and set user as admin
 */
expressApp.post('/auth/createFirm', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const email = req.user.email;
        const { name, userFullName } = req.body;
        if (!name || !userFullName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, userFullName',
            });
        }
        // Check if user already has a firm
        const existingUser = await db.collection('users').doc(uid).get();
        if (existingUser.exists && existingUser.data()?.firmId) {
            return res.status(409).json({
                success: false,
                error: 'User already belongs to a firm',
            });
        }
        // Generate unique firm code
        let firmCode = generateFirmCode();
        let attempts = 0;
        while ((await firmCodeExists(firmCode)) && attempts < 10) {
            firmCode = generateFirmCode();
            attempts++;
        }
        if (attempts >= 10) {
            return res.status(500).json({
                success: false,
                error: 'Failed to generate unique firm code',
            });
        }
        // Create firm document
        const firmId = db.collection('firms').doc().id;
        const now = getCurrentTimestamp();
        await db.collection('firms').doc(firmId).set({
            id: firmId,
            name: name.trim(),
            firmCode,
            createdBy: uid,
            createdAt: now,
            updatedAt: now,
            memberCount: 1,
            members: {
                [uid]: {
                    name: userFullName.trim(),
                    role: 'admin',
                    joinedAt: now,
                },
            },
        });
        // Create user document
        await db.collection('users').doc(uid).set({
            uid,
            email,
            name: userFullName.trim(),
            firmId,
            role: 'admin',
            createdAt: now,
            updatedAt: now,
        });
        return res.status(201).json({
            success: true,
            data: {
                firmId,
                firmCode,
            },
            message: `Firm "${name}" created successfully`,
        });
    }
    catch (error) {
        console.error('Create firm error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * POST /auth/joinFirm
 * Join an existing firm with firm code
 */
expressApp.post('/auth/joinFirm', verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const email = req.user.email;
        const { firmCode, role, userFullName } = req.body;
        if (!firmCode || !role || !userFullName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: firmCode, role, userFullName',
            });
        }
        // Validate role (cannot be admin)
        if (!['lawyer', 'paralegal'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be "lawyer" or "paralegal"',
            });
        }
        // Check if user already has a firm
        const existingUser = await db.collection('users').doc(uid).get();
        if (existingUser.exists && existingUser.data()?.firmId) {
            return res.status(409).json({
                success: false,
                error: 'User already belongs to a firm',
            });
        }
        // Find firm by code
        const firmSnapshot = await db
            .collection('firms')
            .where('firmCode', '==', firmCode)
            .limit(1)
            .get();
        if (firmSnapshot.empty) {
            return res.status(404).json({
                success: false,
                error: 'Invalid firm code',
            });
        }
        const firmDoc = firmSnapshot.docs[0];
        const firmId = firmDoc.id;
        const firmData = firmDoc.data();
        // Check if user is already a member
        if (firmData.members && firmData.members[uid]) {
            return res.status(409).json({
                success: false,
                error: 'User is already a member of this firm',
            });
        }
        const now = getCurrentTimestamp();
        // Add user to firm
        const updatedMembers = firmData.members || {};
        updatedMembers[uid] = {
            name: userFullName.trim(),
            role,
            joinedAt: now,
        };
        await db.collection('firms').doc(firmId).update({
            members: updatedMembers,
            memberCount: Object.keys(updatedMembers).length,
            updatedAt: now,
        });
        // Create user document
        await db.collection('users').doc(uid).set({
            uid,
            email,
            name: userFullName.trim(),
            firmId,
            role,
            createdAt: now,
            updatedAt: now,
        });
        return res.status(201).json({
            success: true,
            data: {
                firmId,
            },
            message: `Successfully joined firm "${firmData.name}"`,
        });
    }
    catch (error) {
        console.error('Join firm error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * GET /auth/user/:uid
 * Get user profile information
 */
expressApp.get('/auth/user/:uid', verifyToken, async (req, res) => {
    try {
        const { uid } = req.params;
        const requestingUser = req.user.uid;
        // Users can only view their own profile, or any user in same firm (if admin)
        if (uid !== requestingUser) {
            const requestingUserDoc = await db.collection('users').doc(requestingUser).get();
            const requestingUserRole = requestingUserDoc.data()?.role;
            if (requestingUserRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                });
            }
        }
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const user = userDoc.data();
        return res.status(200).json({
            success: true,
            data: {
                uid,
                email: user?.email,
                name: user?.name,
                firmId: user?.firmId,
                role: user?.role,
                createdAt: user?.createdAt,
                updatedAt: user?.updatedAt,
            },
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * GET /auth/firm/:firmId
 * Get firm details
 */
expressApp.get('/auth/firm/:firmId', verifyToken, async (req, res) => {
    try {
        const { firmId } = req.params;
        const requestingUser = req.user.uid;
        // Get requesting user's firm
        const userDoc = await db.collection('users').doc(requestingUser).get();
        const userFirmId = userDoc.data()?.firmId;
        // Users can only view their own firm details
        if (firmId !== userFirmId) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
            });
        }
        const firmDoc = await db.collection('firms').doc(firmId).get();
        if (!firmDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Firm not found',
            });
        }
        const firm = firmDoc.data();
        return res.status(200).json({
            success: true,
            data: {
                id: firmId,
                name: firm?.name,
                firmCode: firm?.firmCode,
                createdBy: firm?.createdBy,
                createdAt: firm?.createdAt,
                updatedAt: firm?.updatedAt,
                memberCount: firm?.memberCount,
            },
        });
    }
    catch (error) {
        console.error('Get firm error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
/**
 * GET /auth/firm/:firmId/members
 * Get all members of a firm
 */
expressApp.get('/auth/firm/:firmId/members', verifyToken, async (req, res) => {
    try {
        const { firmId } = req.params;
        const requestingUser = req.user.uid;
        // Get requesting user's firm
        const userDoc = await db.collection('users').doc(requestingUser).get();
        const userFirmId = userDoc.data()?.firmId;
        // Users can only view members of their own firm
        if (firmId !== userFirmId) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
            });
        }
        const firmDoc = await db.collection('firms').doc(firmId).get();
        if (!firmDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Firm not found',
            });
        }
        const firm = firmDoc.data();
        const members = firm?.members || {};
        return res.status(200).json({
            success: true,
            data: {
                members,
            },
        });
    }
    catch (error) {
        console.error('Get firm members error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});
// ============================================================================
// HEALTH CHECK
// ============================================================================
/**
 * GET /health
 * Health check endpoint
 */
expressApp.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Auth service is running',
    });
});
// ============================================================================
// EXPORT CLOUD FUNCTION
// ============================================================================
exports.authService = functions.https.onRequest(expressApp);
