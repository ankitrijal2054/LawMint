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
 * - PATCH /auth/firm/:firmId/members/:uid/role - Update member role (admin only)
 * - POST /auth/firm/:firmId/api-key - Set firm's OpenAI API key (admin only)
 * - GET /auth/firm/:firmId/settings - Get firm settings (admin only)
 * - GET /auth/firm/:firmId/api-key/decrypt - Get decrypted API key (internal)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import * as crypto from 'crypto';

// Initialize environment variables
dotenv.config();

// Initialize Firebase Admin SDK
const app = admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Initialize Express app
const expressApp = express();

// Middleware
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://lawmint.web.app',
  'https://lawmint-c5a21.web.app',
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
expressApp.use(express.json());

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique firm code in format: STENO-XXXXX
 */
function generateFirmCode(): string {
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
async function firmCodeExists(firmCode: string): Promise<boolean> {
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
function getCurrentTimestamp(): number {
  return Date.now();
}

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte hex key for AES-256
const IV_LENGTH = 16;

/**
 * Encrypt a string using AES-256-CBC
 * Returns format: iv_hex:encrypted_hex
 */
function encryptApiKey(apiKey: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a string using AES-256-CBC
 * Expects format: iv_hex:encrypted_hex
 */
function decryptApiKey(encryptedKey: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured');
  }
  const parts = encryptedKey.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted key format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Validate OpenAI API key by making a test request
 */
async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// PUBLIC ENDPOINTS (no authentication required)
// ============================================================================

/**
 * POST /auth/signup
 * Create a new user account
 * This is mainly for backend record-keeping; Firebase Auth handles actual signup
 */
expressApp.post('/auth/signup', async (req: Request, res: Response) => {
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
  } catch (error: any) {
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
expressApp.post('/auth/login', async (req: Request, res: Response) => {
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
  } catch (error: any) {
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
expressApp.post('/auth/createFirm', verifyToken, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const email = (req as any).user.email;
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
          email: email,
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
  } catch (error: any) {
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
expressApp.post('/auth/joinFirm', verifyToken, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const email = (req as any).user.email;
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
      email: email,
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
  } catch (error: any) {
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
expressApp.get('/auth/user/:uid', verifyToken, async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const requestingUser = (req as any).user.uid;

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
  } catch (error: any) {
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
expressApp.get('/auth/firm/:firmId', verifyToken, async (req: Request, res: Response) => {
  try {
    const { firmId } = req.params;
    const requestingUser = (req as any).user.uid;

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
  } catch (error: any) {
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
expressApp.get(
  '/auth/firm/:firmId/members',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { firmId } = req.params;
      const requestingUser = (req as any).user.uid;

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
    } catch (error: any) {
      console.error('Get firm members error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// ============================================================================
// ADMIN ENDPOINTS (require admin role)
// ============================================================================

/**
 * PATCH /auth/firm/:firmId/members/:uid/role
 * Update a member's role (admin only)
 * Rules:
 * - Admin cannot demote themselves
 * - Cannot change another admin's role
 * - Can only change between lawyer and paralegal
 */
expressApp.patch(
  '/auth/firm/:firmId/members/:uid/role',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { firmId, uid: targetUid } = req.params;
      const { newRole } = req.body;
      const requestingUser = (req as any).user.uid;

      // Validate new role
      if (!['lawyer', 'paralegal'].includes(newRole)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role. Must be "lawyer" or "paralegal"',
          code: 'INVALID_ROLE',
        });
      }

      // Get requesting user's data
      const requestingUserDoc = await db.collection('users').doc(requestingUser).get();
      const requestingUserData = requestingUserDoc.data();

      // Verify requesting user is admin of this firm
      if (requestingUserData?.firmId !== firmId || requestingUserData?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only firm admins can update member roles',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      // Prevent admin from demoting themselves
      if (targetUid === requestingUser) {
        return res.status(400).json({
          success: false,
          error: 'You cannot change your own role',
          code: 'CANNOT_DEMOTE_SELF',
        });
      }

      // Get firm data
      const firmDoc = await db.collection('firms').doc(firmId).get();
      if (!firmDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Firm not found',
          code: 'FIRM_NOT_FOUND',
        });
      }

      const firmData = firmDoc.data();
      const members = firmData?.members || {};

      // Check if target user is a member
      if (!members[targetUid]) {
        return res.status(404).json({
          success: false,
          error: 'User is not a member of this firm',
          code: 'USER_NOT_FOUND',
        });
      }

      // Cannot change an admin's role
      if (members[targetUid].role === 'admin') {
        return res.status(400).json({
          success: false,
          error: 'Cannot change an admin\'s role',
          code: 'CANNOT_CHANGE_ADMIN_ROLE',
        });
      }

      const now = getCurrentTimestamp();

      // Update role in firm members
      members[targetUid].role = newRole;
      await db.collection('firms').doc(firmId).update({
        members,
        updatedAt: now,
      });

      // Update role in user document
      await db.collection('users').doc(targetUid).update({
        role: newRole,
        updatedAt: now,
      });

      return res.status(200).json({
        success: true,
        data: {
          message: 'Role updated successfully',
          updatedRole: newRole,
        },
      });
    } catch (error: any) {
      console.error('Update member role error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * POST /auth/firm/:firmId/api-key
 * Set or update firm's OpenAI API key (admin only)
 * Key is validated with OpenAI before being encrypted and stored
 */
expressApp.post(
  '/auth/firm/:firmId/api-key',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { firmId } = req.params;
      const { apiKey } = req.body;
      const requestingUser = (req as any).user.uid;

      if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: apiKey',
        });
      }

      // Get requesting user's data
      const requestingUserDoc = await db.collection('users').doc(requestingUser).get();
      const requestingUserData = requestingUserDoc.data();

      // Verify requesting user is admin of this firm
      if (requestingUserData?.firmId !== firmId || requestingUserData?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only firm admins can configure API keys',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      // Verify firm exists
      const firmDoc = await db.collection('firms').doc(firmId).get();
      if (!firmDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Firm not found',
          code: 'FIRM_NOT_FOUND',
        });
      }

      // Validate API key with OpenAI
      const isValid = await validateOpenAIKey(apiKey);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid OpenAI API key. Please check the key and try again.',
          code: 'INVALID_API_KEY',
        });
      }

      // Encrypt and store the API key
      const encryptedKey = encryptApiKey(apiKey);
      const now = getCurrentTimestamp();

      await db.collection('firms').doc(firmId).update({
        encryptedOpenAIKey: encryptedKey,
        updatedAt: now,
      });

      return res.status(200).json({
        success: true,
        data: {
          message: 'API key configured successfully',
          hasApiKey: true,
        },
      });
    } catch (error: any) {
      console.error('Set API key error:', error);

      if (error.message === 'ENCRYPTION_KEY not configured') {
        return res.status(500).json({
          success: false,
          error: 'Server encryption not configured. Please contact support.',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * GET /auth/firm/:firmId/settings
 * Get firm settings including API key status (admin only)
 */
expressApp.get(
  '/auth/firm/:firmId/settings',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { firmId } = req.params;
      const requestingUser = (req as any).user.uid;

      // Get requesting user's data
      const requestingUserDoc = await db.collection('users').doc(requestingUser).get();
      const requestingUserData = requestingUserDoc.data();

      // Verify requesting user is admin of this firm
      if (requestingUserData?.firmId !== firmId || requestingUserData?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Only firm admins can view firm settings',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      // Get firm data
      const firmDoc = await db.collection('firms').doc(firmId).get();
      if (!firmDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Firm not found',
          code: 'FIRM_NOT_FOUND',
        });
      }

      const firmData = firmDoc.data();

      return res.status(200).json({
        success: true,
        data: {
          hasOpenAIKey: !!firmData?.encryptedOpenAIKey,
        },
      });
    } catch (error: any) {
      console.error('Get firm settings error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * GET /auth/firm/:firmId/api-key/decrypt
 * Internal endpoint to get decrypted API key (for AI service)
 * This should only be called by other services
 */
expressApp.get(
  '/auth/firm/:firmId/api-key/decrypt',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const { firmId } = req.params;
      const requestingUser = (req as any).user.uid;

      // Get requesting user's data to verify they belong to this firm
      const requestingUserDoc = await db.collection('users').doc(requestingUser).get();
      const requestingUserData = requestingUserDoc.data();

      if (requestingUserData?.firmId !== firmId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          code: 'INSUFFICIENT_PERMISSIONS',
        });
      }

      // Get firm data
      const firmDoc = await db.collection('firms').doc(firmId).get();
      if (!firmDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Firm not found',
          code: 'FIRM_NOT_FOUND',
        });
      }

      const firmData = firmDoc.data();

      if (!firmData?.encryptedOpenAIKey) {
        return res.status(404).json({
          success: false,
          error: 'OpenAI API key not configured for this firm',
          code: 'API_KEY_NOT_CONFIGURED',
        });
      }

      // Decrypt the API key
      const apiKey = decryptApiKey(firmData.encryptedOpenAIKey);

      return res.status(200).json({
        success: true,
        data: {
          apiKey,
        },
      });
    } catch (error: any) {
      console.error('Decrypt API key error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
expressApp.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
  });
});

// ============================================================================
// EXPORT CLOUD FUNCTION
// ============================================================================

exports.authService = functions.https.onRequest(expressApp);

