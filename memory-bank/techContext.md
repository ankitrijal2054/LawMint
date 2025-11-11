# Tech Context: LawMint

**Last Updated:** November 11, 2025  
**Current Phase:** Phase 0 - Not Yet Started

---

## Technology Stack

### Frontend

**Core Framework:**
- **React 18+** - UI library (functional components + hooks only)
- **TypeScript** - Type safety throughout
- **Vite** - Build tool and dev server

**Styling:**
- **Tailwind CSS** - Utility-first CSS framework
- **Custom Theme:** Steno-inspired colors and typography
  - Primary: #1E2A78 (Deep Royal Blue)
  - Secondary: #F4F1E9 (Creamy Beige)
  - Accent: #C59E47 (Warm Gold)
  - Fonts: Playfair Display (headings) + Inter (body)

**State Management:**
- **React Context API** - AuthContext for user state
- **React Query (@tanstack/react-query)** - Server state management, caching
- **Custom Hooks** - useAuth, useDocuments, useTemplates, etc.

**Editor & Collaboration:**
- **TipTap** - Rich text editor (based on ProseMirror)
  - @tiptap/react
  - @tiptap/starter-kit
  - @tiptap/extension-collaboration
  - @tiptap/extension-collaboration-cursor
- **Y.js** - CRDT for conflict-free real-time collaboration
- **y-firebase** - Y.js adapter for Firebase Realtime Database

**UI Components:**
- **react-hot-toast** - Toast notifications
- **lucide-react** - Icon library
- **React Router v6** - Client-side routing

**HTTP Client:**
- **Native Fetch API** - No axios (keep it simple)
- Custom API client wrapper per microservice

---

### Backend (Microservices)

**Platform:**
- **Firebase Cloud Functions** (2nd generation)
- **Node.js 18+**
- **TypeScript** - All services use TypeScript

**Framework:**
- **Express.js** - HTTP server for each microservice
- **CORS** - Cross-origin support
- **dotenv** - Environment variable management

**Authentication:**
- **firebase-admin** - SDK for token verification, Firestore access
- Custom auth middleware in each service

**Service-Specific Libraries:**

**auth-service:**
- firebase-admin (auth, firestore)
- express, cors, dotenv

**template-service:**
- firebase-admin
- express, cors, dotenv
- **mammoth** - DOCX text extraction
- **pdf-parse** - PDF text extraction

**document-service:**
- firebase-admin (firestore, storage, realtime database)
- express, cors, dotenv
- mammoth, pdf-parse (for source document extraction)

**ai-service:**
- firebase-admin
- express, cors, dotenv
- **openai** - Official OpenAI SDK

**export-service:**
- firebase-admin
- express, cors, dotenv
- **docx** - DOCX file generation

---

### Database & Storage

**Primary Database:**
- **Firestore** - NoSQL document database
  - Collections: users, firms, templates, documents
  - Real-time listeners for live updates
  - Security rules for defense-in-depth

**Collaboration Sync:**
- **Firebase Realtime Database** - For Y.js CRDT sync
  - Path: `/documents/{documentId}/yjs`
  - WebSocket-like real-time updates

**File Storage:**
- **Firebase Storage** - Object storage
  - Buckets: /templates/, /sources/, /exports/
  - Signed URLs for secure downloads (1-hour expiration)

**Authentication:**
- **Firebase Authentication**
  - Email/Password provider
  - ID token-based authorization
  - Token verification in each microservice

---

### External Services

**AI Provider:**
- **OpenAI API**
  - Models: gpt-4o-mini (default), gpt-4o, gpt-4-turbo
  - Configured via environment variable: `OPENAI_MODEL`
  - API key stored in Firebase Functions config

**Hosting:**
- **Firebase Hosting** - Static site hosting
  - Automatic CDN
  - SPA rewrites for React Router

---

## Development Setup

### Prerequisites

```bash
# Required installations
node -v                    # Node.js 18+ required
npm -v                     # npm 9+ required
firebase --version         # Firebase CLI 12+ required

# Install Firebase CLI if needed
npm install -g firebase-tools

# Login to Firebase
firebase login
```

### Local Development Environment

**1. Clone Repository:**
```bash
cd ~/Desktop/GauntletAI
git clone <repo-url> LawMint  # or initialize new repo
cd LawMint
```

**2. Install Dependencies:**

```bash
# Frontend
cd frontend
npm install

# Each microservice
cd ../services/auth-service
npm install

cd ../template-service
npm install

# ... repeat for all 5 services

# Shared library
cd ../../shared
npm install
```

**3. Configure Environment Variables:**

```bash
# Frontend: frontend/.env.local
VITE_FIREBASE_API_KEY=<from-firebase-console>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<project-id>
# ... more Firebase config

VITE_AUTH_SERVICE_URL=http://localhost:5001/<project-id>/us-central1/authService
VITE_TEMPLATE_SERVICE_URL=http://localhost:5001/<project-id>/us-central1/templateService
# ... more service URLs

# AI Service: services/ai-service/.env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

**4. Start Firebase Emulators:**
```bash
firebase emulators:start
```

This starts:
- Functions: localhost:5001
- Firestore: localhost:8080
- Auth: localhost:9099
- Realtime Database: localhost:9000
- Storage: localhost:9199
- Emulator UI: localhost:4000

**5. Start Frontend Dev Server:**
```bash
cd frontend
npm run dev
```
Opens at: http://localhost:5173

---

## Build & Deployment

### Build Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Deploy to Firebase

**Deploy All:**
```bash
firebase deploy
```

**Deploy Specific Service:**
```bash
firebase deploy --only functions:authService
firebase deploy --only functions:templateService
firebase deploy --only functions:documentService
firebase deploy --only functions:aiService
firebase deploy --only functions:exportService
```

**Deploy Frontend Only:**
```bash
firebase deploy --only hosting
```

**Deploy Rules:**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only database:rules
```

---

## Technical Constraints

### Firebase Free Tier Limits
- **Cloud Functions:** 2M invocations/month, 400K GB-seconds, 200K CPU-seconds
- **Firestore:** 50K reads/day, 20K writes/day, 1GB storage
- **Storage:** 5GB storage, 1GB/day downloads
- **Hosting:** 10GB storage, 360MB/day bandwidth
- **Realtime Database:** 1GB storage, 10GB/month bandwidth

**Mitigation Strategies:**
- Implement pagination (limit 50 documents per query)
- Cache aggressively with React Query
- Use signed URLs with short expiration
- Monitor usage via Firebase Console

### OpenAI API Costs
- **GPT-4o-mini:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **GPT-4o:** ~$2.50 per 1M input tokens, ~$10 per 1M output tokens

**Budget Planning:**
- Estimate 2000 tokens per generation
- Budget $10-20/month for development testing
- Consider rate limiting for production

### Performance Targets
- **Page Load:** < 5 seconds (initial load)
- **API Response:** < 2 seconds (CRUD operations)
- **AI Generation:** < 30 seconds (demand letter draft)
- **Real-time Sync:** < 500ms (Y.js update latency)
- **Export Generation:** < 10 seconds (DOCX creation)

---

## Development Workflow

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/auth-service
# ... make changes ...
git add .
git commit -m "feat: implement auth-service with firm creation"
git push origin feature/auth-service
# Merge to main after testing
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Testing
- `chore:` - Maintenance

---

### Testing Strategy (Manual)

**Local Testing Workflow:**
1. Start Firebase emulators
2. Start frontend dev server
3. Test feature in browser
4. Check Firebase Emulator UI (localhost:4000) for data
5. Check Functions logs for errors
6. Fix issues and repeat

**Testing Checklist Per Phase:**
- Phase 1: Auth signup, firm creation, login, logout
- Phase 3: Template upload (PDF & DOCX), list, download
- Phase 4: Document generation, AI integration
- Phase 5: Collaborative editing with 2+ browser windows
- Phase 6: Document sharing, permission enforcement
- Phase 7: Dashboard queries (my docs, shared, firm-wide)
- Phase 8: DOCX export with correct formatting
- Phase 9: UI responsiveness (mobile, tablet, desktop)

---

## Debugging Tools

### Frontend Debugging
- **React DevTools** - Component inspection
- **Browser DevTools** - Network tab, Console, Sources
- **React Query DevTools** - Cache inspection

### Backend Debugging
- **Firebase Emulator UI** (localhost:4000)
  - View Firestore data
  - View Storage files
  - View Auth users
  - View Functions logs
- **Functions Logs:**
  ```bash
  firebase functions:log --only authService
  ```
- **Cloud Functions Logs (Production):**
  ```bash
  firebase functions:log --only authService --limit 50
  ```

### Common Debug Commands
```bash
# Clear Firestore emulator data
firebase emulators:start --import=./emulator-data --export-on-exit

# View specific function logs
firebase functions:log --only aiService

# Check Firebase project status
firebase projects:list

# Check deployed functions
firebase functions:list
```

---

## Security Considerations

### Environment Variables (NEVER COMMIT)
```bash
# .gitignore includes:
.env
.env.local
.env.production
frontend/.env*
services/*/.env
```

### API Keys Management
- **OpenAI API Key:** Stored in Firebase Functions config, NOT in code
- **Firebase Config:** Public config values are safe in frontend .env
- **Service Account Key:** Never commit `serviceAccountKey.json`

### Firestore Security Rules
- Always enforce authentication
- Always check user's firmId matches resource's firmId
- Role-based permissions checked at both service AND rule level

### CORS Configuration
```typescript
// In each service
import cors from 'cors';
const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://<project-id>.web.app' 
    : 'http://localhost:5173',
  credentials: true
}));
```

---

## Performance Optimizations

### Frontend
- **Code Splitting:** React.lazy() for route components
- **Image Optimization:** WebP format, lazy loading
- **Bundle Size:** Tree-shaking with Vite
- **Caching:** React Query with 5-minute stale time
- **Debouncing:** Auto-save with 2-second debounce

### Backend
- **Cold Start Optimization:** Minimize dependencies per service
- **Firestore Indexing:** Create indexes for complex queries
- **Batch Operations:** Use Firestore batch writes when possible
- **Signed URLs:** 1-hour expiration to reduce Storage bandwidth

---

## Monitoring & Logging

### Production Monitoring (Future)
- Firebase Console dashboards
- Function execution time tracking
- Firestore read/write quotas
- Storage bandwidth usage
- Error tracking (Cloud Logging)

### Logging Pattern
```typescript
// Structured logging in services
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  service: 'auth-service',
  action: 'createFirm',
  userId: req.user.uid,
  firmId: newFirmId,
  duration: Date.now() - startTime
}));
```

---

## Dependencies Summary

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hot-toast": "^2.4.1",
    "firebase": "^10.7.0",
    "@tiptap/react": "^2.1.0",
    "@tiptap/starter-kit": "^2.1.0",
    "@tiptap/extension-collaboration": "^2.1.0",
    "@tiptap/extension-collaboration-cursor": "^2.1.0",
    "yjs": "^13.6.0",
    "y-firebase": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Backend Dependencies (Per Service)
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.10.0"
  }
}
```

---

## References

- **Project Brief:** `/memory-bank/projectbrief.md`
- **System Patterns:** `/memory-bank/systemPatterns.md`
- **Active Context:** `/memory-bank/activeContext.md`
- **TaskList:** `/AI-Docs/TaskList.md`

