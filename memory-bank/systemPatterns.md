# System Patterns: LawMint

**Last Updated:** November 11, 2025

---

## Architecture Overview

### Pattern: True Microservices Architecture

LawMint implements a **true microservices architecture** using Firebase Cloud Functions. Each service is independently:
- Developed
- Deployed
- Scaled
- Monitored

**Why Microservices?**
1. ✅ **Service Isolation** - Failure in one service doesn't crash others
2. ✅ **Independent Scaling** - AI service can scale separately from auth
3. ✅ **Technology Flexibility** - Can swap implementations per service
4. ✅ **Clear Boundaries** - Separation of concerns enforced at deployment level
5. ✅ **Portfolio Value** - Demonstrates modern cloud-native architecture

---

## Service Architecture

### 5 Independent Microservices

```
Frontend (React)
    ↓ HTTP + Firebase ID Token
┌────────────────────────────────┐
│  5 Independent Cloud Functions │
├────────────────────────────────┤
│ 1. auth-service                │
│ 2. template-service            │
│ 3. document-service            │
│ 4. ai-service                  │
│ 5. export-service              │
└────────────────────────────────┘
    ↓ firebase-admin SDK
┌────────────────────────────────┐
│  Shared Firebase Infrastructure│
├────────────────────────────────┤
│ - Firestore (primary database) │
│ - Realtime DB (Y.js sync)      │
│ - Storage (files)              │
│ - Authentication               │
└────────────────────────────────┘
```

---

## Service Boundaries & Responsibilities

### 1. auth-service
**Domain:** User authentication, firm management, access control

**Responsibilities:**
- User signup and login (coordination with Firebase Auth)
- Firm creation with unique code generation (STENO-XXXXX)
- Firm joining with code validation
- User profile management
- Firm member listing

**Data Ownership:**
- `/users/{uid}` in Firestore
- `/firms/{firmId}` in Firestore

**Key Pattern:** This is the **foundational service**. All other services verify user identity through Firebase ID tokens but query this service's data for role-based authorization.

---

### 2. template-service
**Domain:** Template lifecycle management

**Responsibilities:**
- Template upload (PDF/DOCX)
- Text extraction from uploaded files
- Template CRUD operations
- Global vs firm-specific template management
- Template file storage and retrieval

**Data Ownership:**
- `/templates/global/{templateId}` in Firestore
- `/templates/{firmId}/{templateId}` in Firestore
- `/templates/` in Storage

**Key Pattern:** **Stateless extraction pipeline** - Upload → Extract → Store → Return metadata. No inter-service dependencies.

**Processing Libraries:**
- `mammoth` - DOCX text extraction
- `pdf-parse` - PDF text extraction

---

### 3. document-service
**Domain:** Document lifecycle, sharing, collaboration

**Responsibilities:**
- Document CRUD operations
- Source document upload and extraction
- Document sharing and permission management
- Collaboration metadata (active users)
- Document querying (by user, firm, shared status)

**Data Ownership:**
- `/documents/{documentId}` in Firestore
- `/documents/{documentId}/yjs` in Realtime Database (Y.js sync)
- `/sources/{firmId}/{documentId}/` in Storage

**Key Pattern:** **Orchestration hub** - Often called in sequence with ai-service. Frontend orchestrates the multi-step flow.

---

### 4. ai-service
**Domain:** AI-powered document operations

**Responsibilities:**
- Generate demand letter drafts from template + sources
- Refine existing document content based on user instructions
- OpenAI API integration and error handling
- Configurable model selection (gpt-4o-mini, gpt-4o, gpt-4-turbo)

**Data Ownership:**
- None (stateless service)
- Reads template content if needed for context

**Key Pattern:** **Stateless AI gateway** - Receives inputs, calls OpenAI, returns output. No direct database writes.

**Environment Configuration:**
- `OPENAI_API_KEY` - API key
- `OPENAI_MODEL` - Model selection (default: gpt-4o-mini)

**Rate Limiting:** Handled by queuing requests if needed.

---

### 5. export-service
**Domain:** Document export to DOCX

**Responsibilities:**
- Fetch document content from Firestore
- Generate professional DOCX with styling
- Store exported file in Storage
- Return signed download URL (1-hour expiration)

**Data Ownership:**
- `/exports/{firmId}/{documentId}/` in Storage

**Key Pattern:** **Document transformer** - Read from Firestore, transform to DOCX, store in Storage, return URL.

**Processing Library:**
- `docx` - DOCX generation with professional formatting

**Styling Standards:**
- Font: Times New Roman or Calibri
- Spacing: 1.5 line height
- Margins: 1 inch all sides
- Preserve formatting: bold, italic, lists, headings

---

## Key Technical Decisions

### Decision 1: Why Microservices Over Monolith?

**Options Considered:**
1. **Monolithic Express API** (single Cloud Function)
2. **Microservices** (5 independent Cloud Functions) ✅ CHOSEN

**Rationale:**
- **Portfolio Impact:** Demonstrates advanced architecture skills
- **Scalability:** AI service can scale independently (costly operations)
- **Maintainability:** Clear boundaries, easier to debug per service
- **Real-world Pattern:** Mirrors production systems at scale
- **Learning Goal:** Understand microservices challenges (inter-service communication, deployment complexity)

**Trade-offs Accepted:**
- ⚠️ Increased deployment complexity (5 services vs 1)
- ⚠️ More boilerplate (auth middleware in each service)
- ⚠️ Orchestration responsibility on frontend

---

### Decision 2: Firebase vs AWS/GCP

**Options Considered:**
1. **AWS Lambda + RDS + S3**
2. **GCP Cloud Functions + Cloud SQL + GCS**
3. **Firebase (Cloud Functions + Firestore + Storage)** ✅ CHOSEN

**Rationale:**
- **Speed:** Firebase provides all services in one ecosystem
- **Real-time:** Firestore and Realtime DB built for live data
- **Authentication:** Firebase Auth integrates seamlessly
- **Cost:** Free tier generous for portfolio project
- **Deployment:** Single CLI for all services
- **Emulators:** Full local development environment

---

### Decision 3: Firestore (NoSQL) vs PostgreSQL (SQL)

**Options Considered:**
1. **PostgreSQL** (as specified in original PRD)
2. **Firestore (NoSQL)** ✅ CHOSEN

**Rationale:**
- **Real-time:** Firestore listeners for live updates
- **Scalability:** Horizontally scalable by design
- **Simplicity:** No ORM, no migrations
- **Firebase Integration:** Native support in Cloud Functions
- **Document Model:** Natural fit for documents/templates data

**Trade-offs Accepted:**
- ⚠️ No complex joins (design queries carefully)
- ⚠️ Eventual consistency (acceptable for this use case)

---

### Decision 4: OpenAI vs Anthropic

**Options Considered:**
1. **Anthropic Claude** (as mentioned in PRD)
2. **OpenAI GPT-4o-mini** ✅ CHOSEN

**Rationale:**
- **Maturity:** OpenAI API more established
- **Cost:** GPT-4o-mini very cost-effective
- **Performance:** Sufficient quality for demand letter drafts
- **Familiarity:** Well-documented, easier to debug
- **Configurability:** Can upgrade to GPT-4o/GPT-4-turbo via env var

**Future:** Can add Anthropic as alternative model option post-MVP.

---

### Decision 5: TipTap + Y.js vs Quill/Slate

**Options Considered:**
1. **Quill** (popular, simple)
2. **Slate** (powerful, complex)
3. **TipTap + Y.js** ✅ CHOSEN

**Rationale:**
- **Collaboration:** Y.js is gold standard for CRDT-based real-time editing
- **Modern:** TipTap built on ProseMirror (extensible)
- **Firebase Integration:** y-firebase adapter available
- **Features:** Rich formatting out of the box
- **Performance:** Handles 3+ concurrent users smoothly

---

## Design Patterns

### Pattern 1: API Gateway Pattern (Frontend Orchestration)

**Problem:** Multiple microservices need to be called in sequence for complex operations.

**Solution:** Frontend acts as orchestrator.

**Example: Document Generation Flow**
```typescript
// Frontend orchestrates multi-service calls
async function generateDocument(templateId, sourceFiles, instructions) {
  // Step 1: Upload sources to document-service
  const { extractedTexts } = await documentService.uploadSources(sourceFiles);
  
  // Step 2: Generate draft via ai-service
  const { content } = await aiService.generate({
    templateId,
    sourceTexts: extractedTexts,
    instructions
  });
  
  // Step 3: Create document via document-service
  const { documentId } = await documentService.create({
    content,
    templateId,
    sourceFiles
  });
  
  return documentId;
}
```

**Benefits:**
- No inter-service HTTP calls (simpler)
- Frontend controls flow and error handling
- Services remain stateless

**Trade-off:** Frontend has more logic, but acceptable for MVP.

---

### Pattern 2: Shared Data via Firestore

**Problem:** Services need to access data created by other services.

**Solution:** Firestore as **single source of truth**. All services have read access.

**Example:**
- auth-service writes to `/users/{uid}` and `/firms/{firmId}`
- document-service reads from `/users/{uid}` to check permissions
- export-service reads from `/documents/{documentId}` to fetch content

**Benefits:**
- No service-to-service HTTP calls
- Firestore handles consistency
- Security rules provide defense-in-depth

---

### Pattern 3: Token-Based Authorization

**Problem:** Each service needs to verify user identity and permissions.

**Solution:** Firebase ID Token passed in Authorization header.

**Flow:**
```
1. User logs in → Firebase Auth issues ID token
2. Frontend includes token in all API calls:
   Authorization: Bearer <firebase-id-token>
3. Each service:
   a) Verifies token with firebase-admin
   b) Extracts uid from token
   c) Queries /users/{uid} for role and firmId
   d) Authorizes operation based on role + resource ownership
```

**Implementation (Middleware):**
```typescript
// Reusable auth middleware in all services
async function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // { uid, email, ... }
    
    // Fetch user data from Firestore
    const userDoc = await admin.firestore().doc(`users/${req.user.uid}`).get();
    req.userData = userDoc.data(); // { role, firmId, ... }
    
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}
```

---

### Pattern 4: Role-Based Access Control (RBAC)

**Roles:**
- **Admin** - User who created the firm (first user)
- **Lawyer** - Can create documents and templates
- **Paralegal** - Can only edit shared documents

**Authorization Matrix:**

| Action                  | Admin | Lawyer | Paralegal |
|-------------------------|-------|--------|-----------|
| Create Firm             | ✅    | ❌     | ❌        |
| Upload Template         | ✅    | ✅     | ❌        |
| Create Document         | ✅    | ✅     | ❌        |
| Edit Own Document       | ✅    | ✅     | N/A       |
| Edit Shared Document    | ✅    | ✅     | ✅        |
| Share Document          | ✅    | ✅     | ❌        |
| Export Document         | ✅    | ✅     | ✅        |

**Implementation Pattern:**
```typescript
// Authorization helper function
function canCreateDocument(userData) {
  return ['admin', 'lawyer'].includes(userData.role);
}

function canEditDocument(userData, document) {
  // Owner can always edit
  if (document.ownerId === userData.uid) return true;
  
  // Shared with user
  if (document.visibility === 'shared' && 
      document.sharedWith.includes(userData.uid)) return true;
  
  // Firm-wide
  if (document.visibility === 'firm-wide' && 
      document.firmId === userData.firmId) return true;
  
  return false;
}
```

---

### Pattern 5: Collaborative Editing with CRDTs

**Technology:** Y.js (Conflict-free Replicated Data Type)

**Architecture:**
```
User A's Editor ←→ Y.js Document (in-memory CRDT)
                          ↕
                   y-firebase provider
                          ↕
              Firebase Realtime Database
                  /documents/{id}/yjs
                          ↕
                   y-firebase provider
                          ↕
User B's Editor ←→ Y.js Document (in-memory CRDT)
```

**Why This Works:**
- **Y.js** handles conflict resolution automatically
- **Firebase Realtime Database** provides WebSocket-like sync
- **CRDTs** guarantee eventual consistency without operational transforms

**Benefits:**
- No complex merge logic needed
- Sub-second sync latency
- Works offline (syncs when reconnected)

---

## Component Relationships

### Frontend → Services Communication

**Pattern:** RESTful HTTP with JSON payloads

**API Client Pattern:**
```typescript
// src/services/apiClient.ts
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async request(method, endpoint, data = null) {
    const token = await auth.currentUser.getIdToken();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
  
  get(endpoint) { return this.request('GET', endpoint); }
  post(endpoint, data) { return this.request('POST', endpoint, data); }
  put(endpoint, data) { return this.request('PUT', endpoint, data); }
  delete(endpoint) { return this.request('DELETE', endpoint); }
}

// Usage per service
export const authService = new APIClient(import.meta.env.VITE_AUTH_SERVICE_URL);
export const templateService = new APIClient(import.meta.env.VITE_TEMPLATE_SERVICE_URL);
// ... etc
```

---

### Service → Firestore Communication

**Pattern:** firebase-admin SDK with type-safe helpers

```typescript
// Shared library pattern
import { admin } from './firebaseAdmin';

export class FirestoreService {
  collection(path) {
    return admin.firestore().collection(path);
  }
  
  async getDocument(path) {
    const doc = await admin.firestore().doc(path).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  
  async createDocument(path, data) {
    const ref = admin.firestore().collection(path).doc();
    await ref.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return ref.id;
  }
  
  // ... more helpers
}
```

---

## Folder Structure

```
/demand-letter-generator
  /frontend                  # React app
    /src
      /components            # Reusable UI components
      /pages                 # Page components
      /contexts              # AuthContext, etc.
      /hooks                 # Custom hooks
      /services              # API clients (per microservice)
      /config                # Firebase config
      /styles                # Tailwind CSS
  
  /services                  # Microservices
    /auth-service
      /src
        index.ts             # Express app + endpoints
        /middleware          # Auth middleware
        /utils               # Helpers
      package.json
      tsconfig.json
    
    /template-service        # Same structure
    /document-service
    /ai-service
    /export-service
  
  /shared                    # Shared library
    /types                   # TypeScript interfaces
      User.ts
      Firm.ts
      Document.ts
      Template.ts
    /constants               # Roles, error codes
    /utils                   # Validation helpers
  
  /scripts                   # Utility scripts
    seedGlobalTemplates.js   # Seed sample templates
  
  /memory-bank               # Cursor Memory Bank
  /AI-Docs                   # PRD, TaskList, Architecture
  
  firebase.json              # Multi-function config
  firestore.rules            # Security rules
  storage.rules              # Storage security rules
  .gitignore
  README.md
```

---

## References

- **Project Brief:** `/memory-bank/projectbrief.md`
- **Product Context:** `/memory-bank/productContext.md`
- **Tech Context:** `/memory-bank/techContext.md`
- **Architecture Diagram:** `/AI-Docs/architecture.md`

