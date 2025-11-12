# 🏛️ LawMint - AI-Powered Demand Letter Generator

A **microservices-based platform** for law firms to automate demand letter generation using AI (OpenAI GPT-4o-mini), with real-time collaborative editing and professional DOCX export.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Development](#development)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Environment Variables](#environment-variables)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm 9+**
- **Firebase CLI 12+**
- **OpenAI API Key**

### 1. Clone Repository

```bash
cd ~/Desktop/GauntletAI/LawMint
git clone <repo-url> .
```

### 2. Install Dependencies

```bash
# Root
npm install

# Frontend
cd frontend && npm install && cd ..

# Shared
cd shared && npm install && cd ..

# Services (each)
cd services/auth-service && npm install && cd ../..
cd services/template-service && npm install && cd ../..
cd services/document-service && npm install && cd ../..
cd services/ai-service && npm install && cd ../..
cd services/export-service && npm install && cd ../..
```

### 3. Configure Environment Variables

**Frontend: `frontend/.env.local`**
```env
VITE_FIREBASE_API_KEY=<from-firebase-console>
VITE_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
VITE_FIREBASE_STORAGE_BUCKET=<project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
VITE_FIREBASE_APP_ID=<app-id>

# Emulator
VITE_USE_EMULATOR=true
VITE_AUTH_SERVICE_URL=http://localhost:5001/<project>/us-central1/authService
VITE_TEMPLATE_SERVICE_URL=http://localhost:5001/<project>/us-central1/templateService
VITE_DOCUMENT_SERVICE_URL=http://localhost:5001/<project>/us-central1/documentService
VITE_AI_SERVICE_URL=http://localhost:5001/<project>/us-central1/aiService
VITE_EXPORT_SERVICE_URL=http://localhost:5001/<project>/us-central1/exportService
```

**AI Service: `services/ai-service/.env`**
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### 4. Start Firebase Emulators

```bash
firebase emulators:start
```

Emulator UI: http://localhost:4000

### 5. Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173

---

## 📁 Project Structure

```
LawMint/
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Route pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── contexts/           # Context API (AuthContext, etc.)
│   │   ├── services/           # API client services
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Helper utilities
│   │   └── App.tsx
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── services/                    # Microservices (Firebase Cloud Functions)
│   ├── auth-service/           # Authentication & Firm Management
│   ├── template-service/       # Template CRUD & Text Extraction
│   ├── document-service/       # Document CRUD & Sharing
│   ├── ai-service/             # OpenAI Integration
│   └── export-service/         # DOCX Export
│
├── shared/                      # Shared Types & Utilities
│   ├── src/
│   │   ├── types/              # TypeScript interfaces
│   │   ├── constants/          # Shared constants
│   │   ├── utils/              # Helper functions
│   │   └── api/                # API types
│   └── package.json
│
├── memory-bank/                # Project Documentation
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── activeContext.md
│   └── progress.md
│
├── AI-Docs/                    # Technical Documentation
│   ├── PRD.md
│   ├── architecture.md
│   └── TaskList.md
│
├── firebase.json               # Firebase config
├── package.json                # Root workspace
├── tsconfig.json               # TypeScript config
├── .eslintrc.json              # ESLint rules
└── README.md                   # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **React 18+** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling (custom colors: #1E2A78, #F4F1E9, #C59E47)
- **React Router v6** - Client routing
- **React Query** - Server state management
- **React Hot Toast** - Notifications
- **TipTap + Y.js** - Collaborative editing

### Backend (Microservices)
- **Firebase Cloud Functions** - Serverless compute
- **Node.js 18+** - Runtime
- **Express** - HTTP framework
- **Firebase Realtime Database** - Y.js sync
- **Firebase Firestore** - Primary database
- **Firebase Storage** - File storage

### External Services
- **OpenAI API** - GPT-4o-mini for generation/refinement
- **Firebase Auth** - Email/Password authentication
- **Firebase Hosting** - Static site hosting

---

## 🧑‍💻 Development

### Start All Services

**Terminal 1: Firebase Emulators**
```bash
firebase emulators:start
```

**Terminal 2: Frontend Dev Server**
```bash
cd frontend && npm run dev
```

**Terminal 3: Watch Services**
```bash
# Build all services in watch mode
cd services/auth-service && npm run dev
```

### Build Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Build Services
```bash
cd services/<service-name>
npm run build
# Output: services/<service-name>/lib/
```

### Lint & Format
```bash
# Lint all code
npm run lint

# Format all code
npm run format
```

---

## 🚢 Deployment

### Production Deployment

**⚠️ Important:** Before deploying to production, read `PRODUCTION_SETUP.md` for complete setup instructions.

Quick deployment (if already set up):

```bash
# 1. Build all services
bash scripts/build-all.sh

# 2. Deploy everything
firebase deploy
```

**Deploy Specific Service**
```bash
firebase deploy --only functions:authService
firebase deploy --only functions:templateService
firebase deploy --only functions:documentService
firebase deploy --only functions:aiService
firebase deploy --only functions:exportService
```

**Deploy Rules Only**
```bash
firebase deploy --only firestore:rules database:rules storage:rules
```

### Documentation

- **`PRODUCTION_SETUP.md`** - Complete production setup guide with Firebase project creation
- **`DEPLOYMENT_GUIDE.md`** - Step-by-step deployment instructions with troubleshooting
- **`scripts/build-all.sh`** - Automated build script for all services

---

## 🏗️ Architecture

### Microservices Pattern

```
┌─────────────────────────────────────┐
│   React Frontend (Vite)             │
│  (localhost:5173)                   │
└──────────────┬──────────────────────┘
               │ HTTP API Calls
       ┌───────┴──────────┬──────────┬──────────┬────────────┐
       │                  │          │          │            │
   ┌───▼────┐         ┌───▼────┐ ┌──▼──┐  ┌───▼────┐   ┌───▼──┐
   │ Auth   │         │Template│ │Doc  │  │  AI    │   │Export│
   │Service │         │Service │ │Svc  │  │Service │   │Svc   │
   │:5001   │         │:5001   │ │:5001│  │:5001   │   │:5001 │
   └───┬────┘         └───┬────┘ └──┬──┘  └───┬────┘   └───┬──┘
       │                  │         │          │            │
       └──────────────────┼─────────┼──────────┼────────────┘
                          │
                    ┌─────▼──────┐
                    │ Firestore  │
                    │ (Primary)  │
                    └────────────┘
```

**Each Service:**
- Independent Express.js app
- Firebase Admin SDK for authentication
- Firestore for database
- Firebase Storage for files
- Token verification middleware
- CORS enabled

### Key Design Principles
1. **Service Independence** - Can deploy/scale individually
2. **Shared Database** - Single Firestore instance for all services
3. **Token-Based Auth** - Firebase ID tokens verified in each service
4. **Clear Boundaries** - Each service owns its endpoints and logic

---

## 📝 Environment Variables

### Frontend (.env.local)

```env
# Firebase
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

# Service URLs
VITE_AUTH_SERVICE_URL
VITE_TEMPLATE_SERVICE_URL
VITE_DOCUMENT_SERVICE_URL
VITE_AI_SERVICE_URL
VITE_EXPORT_SERVICE_URL

# Emulator
VITE_USE_EMULATOR=true (dev only)
VITE_FIREBASE_AUTH_EMULATOR_PORT=9099
VITE_FIREBASE_FIRESTORE_EMULATOR_PORT=8080
```

### Services (.env)

All services need:
```env
FIREBASE_PROJECT_ID
NODE_ENV=development
```

AI Service also needs:
```env
OPENAI_API_KEY
OPENAI_MODEL=gpt-4o-mini
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] **Auth**: Sign up → Create firm → Login → Logout
- [ ] **Templates**: Upload PDF/DOCX → Extract text → List templates
- [ ] **Documents**: Create document → Generate with AI → View
- [ ] **Collaboration**: Open 2 browsers → Edit simultaneously → See changes
- [ ] **Sharing**: Share doc → Change permissions → Verify access
- [ ] **Export**: Export to DOCX → Verify formatting

### Firebase Emulator UI

Visit: **http://localhost:4000**

- View Firestore collections and documents
- Inspect Storage files
- Check Function logs
- Monitor Authentication

---

## 📖 Documentation

- **`memory-bank/projectbrief.md`** - Project goals and requirements
- **`memory-bank/productContext.md`** - User flows and UX details
- **`memory-bank/systemPatterns.md`** - Architecture and design patterns
- **`memory-bank/techContext.md`** - Technology stack details
- **`AI-Docs/architecture.md`** - Technical architecture deep dive
- **`AI-Docs/PRD.md`** - Product requirements document
- **`AI-Docs/TaskList.md`** - Development tasks by phase

---

## 🎨 Design System

### Colors
- **Primary**: #1E2A78 (Deep Royal Blue)
- **Secondary**: #F4F1E9 (Creamy Beige)
- **Accent**: #C59E47 (Warm Gold)
- **Text**: #2A2A2A (Charcoal)

### Typography
- **Headings**: Playfair Display (serif, elegant)
- **Body**: Inter (sans-serif, readable)

### UI Principles
- Rounded corners (border-radius: 1rem)
- Soft shadows
- Gold CTAs with hover effects
- Minimalist with whitespace

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TipTap Editor](https://tiptap.dev)

---

## 📞 Support

For issues, check:
1. Firebase Emulator UI logs (http://localhost:4000)
2. Browser DevTools Console
3. Terminal output for error messages
4. `.gitignore` to ensure env files aren't tracked

---

## 📄 License

Private project for portfolio purposes.

---

**Happy coding! 🎉**

**Last Updated**: November 11, 2025  
**Current Phase**: Phase 0 - Setup Complete ✅

