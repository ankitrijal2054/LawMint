
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express, { Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';

/**
 * AI Service Microservice
 * Handles AI-powered document generation and refinement.
 * Standardized CORS configuration for cross-service consistency.
 */

// Initialize environment variables
dotenv.config();

// Initialize Firebase Admin SDK (if not already initialized)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const expressApp = express();

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
expressApp.use(express.json());

/**
 * Health check endpoint
 */
expressApp.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'AI service is running',
  });
});

export const aiService = functions.https.onRequest(expressApp);

