# 🚀 AI-Driven Demand Letter Generator - Task List (MVP)

**Project:** LawMint (Demand Letter Generator for Law Firms)  
**Organization:** Steno  
**Tech Stack:** React + Vite + Tailwind | Firebase Cloud Functions (Microservices) | OpenAI API  
**Architecture:** True Microservices with Independent Service Deployment  
**Design Theme:** Steno-Inspired Professional Legal Aesthetic

### 🎨 Design Guidelines
- **Colors:** Deep Royal Blue (#1E2A78), Creamy Beige (#F4F1E9), Warm Gold (#C59E47)
- **Typography:** Playfair Display (headings) + Inter/Source Sans Pro (body)
- **Style:** Professional, elegant, trustworthy — AI-enabled legal services
- **UI Components:** Rounded corners, soft shadows, gold CTAs, minimalist with whitespace

### 🏗️ Microservices Architecture Overview

This project implements a **true microservices architecture** using Firebase Cloud Functions:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                     │
│              (Calls all services via HTTP APIs)              │
└──────┬────────┬──────────┬────────┬──────────┬─────────────┘
       │        │          │        │          │
       │        │          │        │          │
   ┌───▼───┐ ┌─▼──────┐ ┌─▼─────┐ ┌▼───────┐ ┌▼─────────┐
   │ auth  │ │template│ │document│ │   ai   │ │  export  │
   │service│ │service │ │service │ │service │ │ service  │
   └───┬───┘ └──┬─────┘ └──┬─────┘ └─┬──────┘ └──┬───────┘
       │        │           │         │           │
       └────────┴───────────┴─────────┴───────────┘
                           │
                    ┌──────▼──────┐
                    │  Firestore  │
                    │  (Shared    │
                    │   Database) │
                    └─────────────┘
```

**Service Responsibilities:**
- **auth-service**: User auth, firm creation/joining, firm member management
- **template-service**: Template CRUD, PDF/DOCX extraction, storage
- **document-service**: Document CRUD, sharing, permissions, source file handling
- **ai-service**: OpenAI integration for generation and refinement
- **export-service**: DOCX export with professional formatting

**Benefits:**
- ✅ Independent deployment and scaling per service
- ✅ Service isolation (failure in one doesn't crash others)
- ✅ Technology flexibility (can swap implementations)
- ✅ Clear separation of concerns
- ✅ Demonstrates modern cloud-native architecture

---

## Phase 0: Project Setup & Configuration
**Goal:** Establish development environment and project structure

### Task 0.1: Initialize Microservices Project Structure
- [ ] Create microservices monorepo structure:
  ```
  /demand-letter-generator
    /frontend (React + Vite + Tailwind)
    /services
      /auth-service (Authentication & Firm Management)
      /template-service (Template CRUD & Extraction)
      /document-service (Document CRUD & Sharing)
      /ai-service (OpenAI Integration)
      /export-service (DOCX Export)
    /shared (TypeScript types, constants, utilities shared across services)
    /scripts (Deployment, seeding, utilities)
  ```
- [ ] Initialize Git repository with `.gitignore`
- [ ] Set up Prettier + ESLint configuration (monorepo root)
- [ ] Create `firebase.json` for multiple function deployments

### Task 0.2: Firebase Project Setup
- [ ] Create Firebase project in Firebase Console
- [ ] Run `firebase init` and enable:
  - Authentication
  - Firestore Database
  - Firebase Realtime Database (for Y.js collaboration)
  - Storage
  - Functions (for microservices deployment)
  - Hosting
- [ ] Configure Firebase Authentication (Email/Password provider)
- [ ] Set up Firestore security rules (basic structure)
- [ ] Set up Storage security rules (basic structure)
- [ ] Configure `firebase.json` for multiple function deployments:
  ```json
  {
    "functions": [
      { "source": "services/auth-service", "codebase": "auth-service" },
      { "source": "services/template-service", "codebase": "template-service" },
      { "source": "services/document-service", "codebase": "document-service" },
      { "source": "services/ai-service", "codebase": "ai-service" },
      { "source": "services/export-service", "codebase": "export-service" }
    ]
  }
  ```

### Task 0.3: Install Dependencies

**Frontend:**
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install firebase react-router-dom @tanstack/react-query react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
- [ ] Add Google Fonts to `index.html`:
  - Playfair Display (headings)
  - Inter or Source Sans Pro (body text)

**Shared Library:**
```bash
cd shared
npm init -y
npm install typescript @types/node
# Shared TypeScript types, constants, and utilities
```

**Microservices - Each Service:**
```bash
# For each service: auth-service, template-service, document-service, ai-service, export-service
cd services/<service-name>
firebase init functions
npm install express cors dotenv firebase-admin
npm install typescript @types/express @types/node -D
```

**Service-Specific Dependencies:**
- **auth-service**: (base dependencies only)
- **template-service**: `npm install mammoth pdf-parse`
- **document-service**: (base dependencies only)
- **ai-service**: `npm install openai`
- **export-service**: `npm install docx`

### Task 0.4: Environment Configuration
- [ ] Create `.env` files for each service:
  - `/frontend/.env` (Firebase config, API endpoints)
  - `/services/ai-service/.env` (OpenAI API key, model selection)
  - Other services inherit Firebase project config
- [ ] Add `.env` to `.gitignore`
- [ ] Document environment variables in `README.md`
- [ ] Configure AI service environment:
  ```bash
  # services/ai-service/.env
  OPENAI_API_KEY=your_key_here
  OPENAI_MODEL=gpt-4o-mini  # Configurable: gpt-4o-mini, gpt-4o, gpt-4-turbo
  ```
- [ ] Configure frontend API endpoints:
  ```bash
  # frontend/.env
  VITE_AUTH_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/authService
  VITE_TEMPLATE_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/templateService
  VITE_DOCUMENT_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/documentService
  VITE_AI_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/aiService
  VITE_EXPORT_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/exportService
  ```

### Task 0.5: Shared Library Setup
- [ ] Create `/shared` package structure:
  ```
  /shared
    /types (User, Firm, Document, Template interfaces)
    /constants (Roles, permissions, error codes)
    /utils (Validation helpers, formatters)
    /api (API client types, request/response interfaces)
  ```
- [ ] Define TypeScript interfaces for all data models
- [ ] Create shared validation utilities
- [ ] Set up build process to compile TypeScript
- [ ] Link shared library to all services using `npm link` or workspace

### Task 0.6: Seed Global Templates
- [ ] Create sample demand letter templates (2-3 examples):
  - Generic Demand Letter Template
  - Personal Injury Demand Letter Template
  - Contract Dispute Demand Letter Template
- [ ] Create seed script: `/scripts/seedGlobalTemplates.js`
- [ ] Script should call template-service API to upload templates
- [ ] Upload templates to `/templates/global/{templateId}` in Firestore
- [ ] Store template files in Storage: `/templates/global/{fileName}`
- [ ] Run seed script after all services are deployed

---

## Phase 1: Authentication Service & User Management
**Goal:** Build auth-service microservice for authentication and firm management

### Task 1.1: Auth Service - Backend Setup
- [ ] Create `services/auth-service/src/index.ts` - Express app
- [ ] Create API endpoints:
  - `POST /auth/signup` - Create user account
  - `POST /auth/createFirm` - Create new firm + set user as admin
  - `POST /auth/joinFirm` - Join existing firm with code
  - `POST /auth/login` - Login (handled by Firebase Auth client-side, but validate)
  - `GET /auth/user/:uid` - Get user profile
  - `GET /auth/firm/:firmId` - Get firm details
  - `GET /auth/firm/:firmId/members` - Get all firm members
- [ ] Implement firm code generation (STENO-XXXXX format)
- [ ] Implement Firestore operations for users and firms
- [ ] Add authentication middleware (verify Firebase ID tokens)
- [ ] Add error handling and validation
- [ ] Deploy: `firebase deploy --only functions:authService`

### Task 1.2: Auth Service - Frontend Integration
- [ ] Create `src/config/firebase.ts` - Initialize Firebase
- [ ] Create `src/services/authService.ts` - API client for auth-service
- [ ] Create `src/contexts/AuthContext.tsx`:
  - State: `user`, `loading`, `firmId`, `firmCode`, `role`
  - Methods: `signup`, `createFirm`, `joinFirm`, `login`, `logout`
  - Call auth-service endpoints for firm operations
- [ ] Create `src/hooks/useAuth.ts` - Access auth context

### Task 1.3: Auth UI Components
- [ ] Create `src/pages/Landing.tsx` - Steno-inspired welcome page:
  - Gradient hero background (linear-gradient(180deg, #1E2A78 0%, #2A2F65 100%))
  - Headline: "AI-Powered Demand Letters for Modern Law Firms" (Playfair Display, white)
  - Subtext: "Draft, refine, and collaborate on demand letters — securely and effortlessly."
  - Gold CTA button: "Get Started" → Navigate to signup
  - Features section with 3-4 key benefits
  - Professional footer
- [ ] Create `src/pages/Login.tsx`:
  - Centered card on cream background (#F4F1E9)
  - Email/password form with elegant styling
  - Gold "Sign In" button
  - Link to signup
  - Error handling with toast notifications
- [ ] Create `src/pages/Signup.tsx`:
  - Centered card on cream background
  - Step 1: Email/password + name
  - Step 2: Choose "Create New Firm" or "Join Existing Firm"
  - Form validation, calls auth-service after selection

### Task 1.4: Firm Creation Flow
- [ ] Create `src/components/CreateFirmForm.tsx`:
  - Input: Custom firm name
  - Submit button calls `POST /auth/createFirm` via auth-service
  - Display generated firm code to user (returned from service)
  - On success: User is set as Admin, navigate to dashboard
- [ ] Ensure auth-service `POST /auth/createFirm` endpoint:
  - Generates unique firm code (STENO-XXXXX format)
  - Creates `/firms/{firmId}` document in Firestore
  - Creates `/users/{uid}` document with role = "admin"
  - Returns firmId and firmCode

### Task 1.5: Join Firm Flow
- [ ] Create `src/components/JoinFirmForm.tsx`:
  - Search bar to find firms by name (query Firestore from frontend)
  - Display search results (firm name only, not code)
  - On selection: Show firm code input field
  - Role selection: Radio buttons (Lawyer / Paralegal)
  - Submit: Call `POST /auth/joinFirm` via auth-service
- [ ] Ensure auth-service `POST /auth/joinFirm` endpoint:
  - Validates firm code matches selected firm
  - Adds user to `/firms/{firmId}/members` map in Firestore
  - Creates `/users/{uid}` document with selected role
  - Returns success/error

### Task 1.6: Protected Routes & Navigation
- [ ] Create `src/components/ProtectedRoute.tsx` - Auth guard
- [ ] Create `src/components/Navbar.tsx`:
  - Show firm name + firm code (Admin only - the user who created the firm)
  - Show firm name only (Lawyers and Paralegals)
  - User menu dropdown with logout button
  - Steno-inspired design (deep blue background #1E2A78)
- [ ] Set up React Router with protected routes

---

## Phase 2: Firestore Data Structure & Security
**Goal:** Define database schema and implement role-based access control

### Task 2.1: Firestore Collections Schema
Define and document collections:

```
/users/{uid}
  - email: string
  - name: string
  - firmId: string
  - role: "admin" | "lawyer" | "paralegal"
  - createdAt: timestamp

/firms/{firmId}
  - name: string
  - firmCode: string (unique)
  - createdBy: string (uid)
  - createdAt: timestamp
  - members: { [uid]: { name, role, joinedAt } }

/templates/global/{templateId}
  - name: string
  - type: "global"
  - content: string (extracted text)
  - metadata: { originalFileName, fileType, uploadedBy: "system" }
  - createdAt: timestamp

/templates/{firmId}/{templateId}
  - name: string
  - type: "firm"
  - firmId: string
  - content: string (extracted text)
  - metadata: { originalFileName, fileType, uploadedBy: uid }
  - createdAt: timestamp
  - updatedAt: timestamp

/documents/{documentId}
  - firmId: string
  - ownerId: string (uid)
  - title: string
  - content: string (collaborative text)
  - templateId: string (reference)
  - sourceDocuments: [{ fileName, storagePath }]
  - visibility: "private" | "shared" | "firm-wide"
  - sharedWith: [uid] (if visibility = "shared")
  - activeUsers: [{ uid, name, lastActive: timestamp }]
  - status: "draft" | "final"
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Task 2.2: Firestore Security Rules
Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isSameFirm(firmId) {
      return isAuthenticated() && getUserData().firmId == firmId;
    }
    
    function isAdminOrLawyer() {
      return isAuthenticated() && getUserData().role in ["admin", "lawyer"];
    }
    
    function isParalegal() {
      return isAuthenticated() && getUserData().role == "paralegal";
    }
    
    // Users collection
    match /users/{uid} {
      allow read: if isAuthenticated() && request.auth.uid == uid;
      allow write: if isAuthenticated() && request.auth.uid == uid;
    }
    
    // Firms collection
    match /firms/{firmId} {
      allow read: if isSameFirm(firmId);
      allow create: if isAuthenticated();
      allow update: if isSameFirm(firmId) && isAdminOrLawyer();
    }
    
    // Global templates (read-only for all authenticated users)
    match /templates/global/{templateId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only system can write
    }
    
    // Firm templates
    match /templates/{firmId}/{templateId} {
      allow read: if isSameFirm(firmId);
      allow create, update, delete: if isSameFirm(firmId) && isAdminOrLawyer();
    }
    
    // Documents
    match /documents/{documentId} {
      allow read: if isAuthenticated() && (
        resource.data.ownerId == request.auth.uid ||
        resource.data.visibility == "firm-wide" && isSameFirm(resource.data.firmId) ||
        resource.data.visibility == "shared" && request.auth.uid in resource.data.sharedWith
      );
      
      allow create: if isAuthenticated() && isSameFirm(request.resource.data.firmId) && isAdminOrLawyer();
      
      allow update: if isAuthenticated() && (
        resource.data.ownerId == request.auth.uid && isAdminOrLawyer() ||
        isParalegal() && (
          resource.data.visibility == "firm-wide" && isSameFirm(resource.data.firmId) ||
          resource.data.visibility == "shared" && request.auth.uid in resource.data.sharedWith
        )
      );
      
      allow delete: if isAuthenticated() && resource.data.ownerId == request.auth.uid && isAdminOrLawyer();
    }
  }
}
```

### Task 2.3: Firebase Storage Security Rules
Create `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserFirmId() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.firmId;
    }
    
    // Templates storage: /templates/{firmId}/{fileName}
    match /templates/{firmId}/{fileName} {
      allow read: if isAuthenticated() && getUserFirmId() == firmId;
      allow write: if isAuthenticated() && getUserFirmId() == firmId;
    }
    
    // Global templates (system only)
    match /templates/global/{fileName} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    
    // Document sources: /sources/{firmId}/{documentId}/{fileName}
    match /sources/{firmId}/{documentId}/{fileName} {
      allow read: if isAuthenticated() && getUserFirmId() == firmId;
      allow write: if isAuthenticated() && getUserFirmId() == firmId;
    }
    
    // Exports: /exports/{firmId}/{documentId}/{fileName}
    match /exports/{firmId}/{documentId}/{fileName} {
      allow read: if isAuthenticated() && getUserFirmId() == firmId;
      allow write: if isAuthenticated() && getUserFirmId() == firmId;
    }
  }
}
```

---

## Phase 3: Template Service & Management System
**Goal:** Build template-service microservice for template management

### Task 3.1: Template Service - Backend Setup
- [ ] Create `services/template-service/src/index.ts` - Express app
- [ ] Create API endpoints:
  - `POST /templates/upload` - Upload template (PDF/DOCX)
  - `GET /templates/global` - List all global templates
  - `GET /templates/firm/:firmId` - List firm-specific templates
  - `GET /templates/:templateId` - Get single template details
  - `DELETE /templates/:templateId` - Delete firm template (Admin/Lawyer only)
  - `GET /templates/:templateId/download` - Download template file
- [ ] Implement text extraction using `mammoth` (DOCX) and `pdf-parse` (PDF)
- [ ] Implement Firebase Storage operations (upload/download)
- [ ] Implement Firestore operations for template metadata
- [ ] Add authentication middleware (verify Firebase ID tokens)
- [ ] Add role-based authorization (Admin/Lawyer for uploads, all for reads)
- [ ] Deploy: `firebase deploy --only functions:templateService`

### Task 3.2: Template Service - Frontend Integration
- [ ] Create `src/services/templateService.ts` - API client for template-service
- [ ] Create `src/hooks/useTemplates.ts` - React Query hooks for templates
- [ ] Create `src/pages/Templates.tsx`:
  - Two tabs: "Global Templates" | "My Firm Templates"
  - Fetch templates using template-service API
  - Display template cards (name, type, upload date)
  - Role-based UI: Hide upload/delete buttons for Paralegals
- [ ] Create `src/components/TemplateCard.tsx`:
  - Display template info
  - Actions: View, Download, Delete (if firm template + has permission)
  - Call template-service endpoints for actions
- [ ] Create `src/components/UploadTemplateModal.tsx`:
  - File upload (PDF/DOCX only)
  - Template name input
  - Progress indicator
  - Calls `POST /templates/upload` via template-service
  - Success/error handling

### Task 3.3: Template Selection Component
- [ ] Create `src/components/TemplateSelector.tsx`:
  - Dropdown or modal to select from global + firm templates
  - Fetches templates from template-service
  - Search/filter functionality
  - Preview template content (modal)

---

## Phase 4: AI Service & Document Service
**Goal:** Build ai-service and document-service microservices for AI generation and document management

### Task 4.1: Document Service - Backend Setup
- [ ] Create `services/document-service/src/index.ts` - Express app
- [ ] Create API endpoints:
  - `POST /documents` - Create new document
  - `GET /documents/:documentId` - Get document details
  - `PUT /documents/:documentId` - Update document content
  - `DELETE /documents/:documentId` - Delete document
  - `GET /documents/user/:uid` - List user's documents
  - `GET /documents/firm/:firmId` - List firm-wide documents
  - `GET /documents/shared/:uid` - List documents shared with user
  - `POST /documents/:documentId/share` - Update sharing settings
  - `POST /documents/upload-sources` - Upload source documents (PDF/DOCX)
- [ ] Implement text extraction for source documents (mammoth, pdf-parse)
- [ ] Implement Firestore operations for documents
- [ ] Implement Firebase Storage operations for source files
- [ ] Add authentication middleware
- [ ] Add role-based authorization
- [ ] Deploy: `firebase deploy --only functions:documentService`

### Task 4.2: AI Service - Backend Setup
- [ ] Create `services/ai-service/src/index.ts` - Express app
- [ ] Configure OpenAI client with environment variables
- [ ] Create API endpoints:
  - `POST /ai/generate` - Generate demand letter draft
  - `POST /ai/refine` - Refine existing document content
- [ ] Implement `POST /ai/generate` endpoint:
  - Input: templateId, sourceDocumentsText[], customInstructions (optional)
  - Fetch template content from Firestore (or receive from document-service)
  - Read model from environment: `process.env.OPENAI_MODEL` (default: gpt-4o-mini)
  - Construct OpenAI prompt:
    ```
    You are an expert legal assistant specializing in demand letters.
    
    Using the provided template and source documents, generate a professional demand letter.
    
    TEMPLATE:
    {templateContent}
    
    SOURCE DOCUMENTS:
    {sourceDocumentsText}
    
    INSTRUCTIONS:
    - Maintain professional legal tone
    - Fill in all relevant details from source documents
    - Follow the structure of the template
    {customInstructions}
    
    Generate the complete demand letter:
    ```
  - Call OpenAI API with configurable model
  - Return: Generated letter content
  - Error handling: Rate limits, API errors, model validation
- [ ] Implement `POST /ai/refine` endpoint (similar to generate, but for refinement)
- [ ] Add authentication middleware
- [ ] Deploy: `firebase deploy --only functions:aiService`

### Task 4.3: Frontend Service Integration
- [ ] Create `src/services/documentService.ts` - API client for document-service
- [ ] Create `src/services/aiService.ts` - API client for ai-service
- [ ] Create `src/hooks/useDocuments.ts` - React Query hooks for documents
- [ ] Create `src/hooks/useAI.ts` - React Query hooks for AI operations

### Task 4.4: Create Document Flow (Frontend)
- [ ] Create `src/pages/NewDocument.tsx`:
  - Step 1: Select template (TemplateSelector component)
  - Step 2: Upload source documents (multiple files, drag-and-drop)
  - Step 3: Optional custom instructions textarea
  - Step 4: Generate button → Show loading state
  - Orchestration:
    1. Upload sources via document-service (`POST /documents/upload-sources`)
    2. Call ai-service (`POST /ai/generate`) with template + extracted text
    3. Create document via document-service (`POST /documents`) with AI-generated content
  - On success: Navigate to document editor
- [ ] Create `src/components/SourceDocumentUploader.tsx`:
  - Multi-file drag-and-drop zone
  - File list with remove option
  - File type validation (PDF/DOCX only)
  - Upload progress indicators

### Task 4.5: Document Creation Logic
- [ ] Create `src/hooks/useDocumentGeneration.ts`:
  - Orchestrate multi-step generation process
  - Step 1: Upload source documents via document-service → Get extracted text
  - Step 2: Call ai-service generate endpoint → Receive draft
  - Step 3: Create document in Firestore via document-service
  - Handle errors and retries for each step
  - Show progress feedback to user

---

## Phase 5: Collaborative Document Editor
**Goal:** Real-time collaborative editing with AI refinement sidebar

### Task 5.1: Setup Collaborative Editor
- [ ] Install TipTap + Y.js dependencies:
  ```bash
  npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
  npm install yjs y-firebase
  ```
- [ ] Enable Firebase Realtime Database in Firebase Console
- [ ] Configure y-firebase provider to use Firebase Realtime Database
- [ ] Create `/documents/{documentId}/yjs` path for Y.js sync data

### Task 5.2: Document Editor Component
- [ ] Create `src/components/DocumentEditor.tsx`:
  - Initialize editor with document content
  - Setup Y.js document binding
  - Real-time sync with Firestore
  - Auto-save on changes (debounced)
  - Toolbar: Basic formatting (bold, italic, underline, headings, lists)
  - Character/word count display

### Task 5.3: Real-Time Collaboration Features
- [ ] Implement presence awareness:
  - Show active users (avatars/names)
  - Cursor positions and selections
  - "User X is typing..." indicators
- [ ] Create `src/hooks/useCollaboration.ts`:
  - Update `activeUsers` in Firestore on join/leave
  - Heartbeat mechanism (update lastActive timestamp)
  - Clean up inactive users after timeout

### Task 5.4: AI Refinement Sidebar
- [ ] Create `src/components/AIRefinementSidebar.tsx`:
  - Textarea for custom instructions
  - "Refine" button
  - History of refinement requests
  - Loading states
  - Calls ai-service `POST /ai/refine` endpoint with current content
- [ ] Verify ai-service `POST /ai/refine` endpoint is implemented (from Task 4.2)
- [ ] Create `src/hooks/useAIRefinement.ts`:
  - Handle refinement requests via ai-service
  - Update editor content with refined version
  - Error handling

### Task 5.5: Document Editor Page
- [ ] Create `src/pages/DocumentEditor.tsx`:
  - Layout: Editor (70%) + AI Sidebar (30%)
  - Header: Document title (editable), save status, share button, export button
  - Load document data via document-service (`GET /documents/:documentId`)
  - Save changes via document-service (`PUT /documents/:documentId`)
  - Handle permissions (read-only for non-owners if private)

---

## Phase 6: Document Sharing & Permissions
**Goal:** Allow document owners to share documents with specific users or firm-wide

### Task 6.1: Share Modal Component
- [ ] Create `src/components/ShareDocumentModal.tsx`:
  - Radio buttons: Private / Shared with specific users / Firm-wide
  - If "Shared with specific users": Multi-select dropdown of firm members
  - Display current sharing settings
  - Save button → Calls document-service (`POST /documents/:documentId/share`)
- [ ] Create `src/hooks/useFirmMembers.ts`:
  - Fetch all members of user's firm via auth-service
  - Return: Array of { uid, name, email, role }

### Task 6.2: Update Document Permissions
- [ ] Verify document-service `POST /documents/:documentId/share` endpoint (from Task 4.1):
  - Validates user is document owner
  - Updates `visibility` and `sharedWith` fields in Firestore
  - Returns success confirmation
- [ ] Add permission checks in editor:
  - Disable editing if user doesn't have write access
  - Show read-only banner for paralegals on private docs

---

## Phase 7: Document Management & Dashboard
**Goal:** Central hub to view, manage, and organize documents

### Task 7.1: Documents Dashboard
- [ ] Create `src/pages/Dashboard.tsx`:
  - Three tabs:
    - **My Documents**: Fetches via document-service `GET /documents/user/:uid`
    - **Shared With Me**: Fetches via document-service `GET /documents/shared/:uid`
    - **Firm Documents**: Fetches via document-service `GET /documents/firm/:firmId`
  - Each tab: Grid/list of document cards
  - Filters: Status (draft/final), Date range, Search by title
  - Sort: Recent, Oldest, Alphabetical

### Task 7.2: Document Card Component
- [ ] Create `src/components/DocumentCard.tsx`:
  - Display: Title, created date, owner name, status badge
  - Actions dropdown: Edit, Share, Export, Delete
  - Actions call appropriate document-service or export-service endpoints
  - Role-based action visibility
  - Click to open in editor

### Task 7.3: Document List Queries
- [ ] Verify `src/hooks/useDocuments.ts` (created in Task 4.3) includes:
  - `useMyDocuments()`: Calls document-service `GET /documents/user/:uid`
  - `useSharedDocuments()`: Calls document-service `GET /documents/shared/:uid`
  - `useFirmDocuments()`: Calls document-service `GET /documents/firm/:firmId`
  - React Query for caching and real-time updates

---

## Phase 8: Export Service
**Goal:** Build export-service microservice for DOCX generation

### Task 8.1: Export Service - Backend Setup
- [ ] Create `services/export-service/src/index.ts` - Express app
- [ ] Create API endpoint:
  - `POST /export/docx` - Export document to DOCX format
- [ ] Implement `POST /export/docx` endpoint:
  - Input: documentId
  - Fetch document content from Firestore via document-service or directly
  - Use `docx` npm library to generate DOCX file:
    - Convert HTML/markdown to DOCX format
    - Apply professional styling:
      - Font: Times New Roman or Calibri
      - Spacing: 1.5 line height
      - Margins: 1 inch all sides
      - Headers and footers (optional)
  - Store exported file in Storage: `/exports/{firmId}/{documentId}/{fileName}`
  - Return: Download URL (signed URL with 1-hour expiration)
- [ ] Add authentication middleware
- [ ] Add authorization (user must have read access to document)
- [ ] Deploy: `firebase deploy --only functions:exportService`

### Task 8.2: Export Service - Frontend Integration
- [ ] Create `src/services/exportService.ts` - API client for export-service
- [ ] Add gold "Export to Word" button to document editor header
- [ ] Create `src/components/ExportModal.tsx`:
  - Confirm export dialog
  - Loading spinner during generation
  - Calls export-service `POST /export/docx`
  - On success: Auto-download file from returned URL
  - Error handling with retry option
- [ ] Create `src/hooks/useDocumentExport.ts`:
  - Handle export request via export-service
  - Trigger file download
  - Error handling

---

## Phase 9: UI Polish & Responsive Design
**Goal:** Professional, lawyer-friendly interface with consistent design system

### Task 9.1: Design System Setup (Steno-Inspired Theme)
- [ ] Define Tailwind color palette in `tailwind.config.js`:
  ```javascript
  colors: {
    primary: {
      DEFAULT: '#1E2A78',  // Deep Royal Blue
      dark: '#2A2F65',
      light: '#4F5B93',     // Muted Blue
    },
    secondary: {
      DEFAULT: '#F4F1E9',  // Creamy Beige
      dark: '#E5E1D8',
    },
    accent: {
      DEFAULT: '#C59E47',  // Warm Gold
      dark: '#A88339',
      light: '#D4B36A',
    },
    text: {
      DEFAULT: '#2A2A2A',  // Charcoal
      light: '#6B6B6B',
    }
  }
  ```
- [ ] Set up typography in `tailwind.config.js`:
  ```javascript
  fontFamily: {
    display: ['Playfair Display', 'serif'],  // Headings
    body: ['Inter', 'Source Sans Pro', 'sans-serif'],  // Body text
  }
  ```
- [ ] Create reusable component library with Steno styling:
  - `Button.tsx` (gold primary, outlined secondary, rounded-full)
  - `Input.tsx` (text, email, password with elegant styling)
  - `Card.tsx` (rounded-lg with soft shadows)
  - `Badge.tsx` (status indicators)
  - `Modal.tsx` (base modal wrapper)
  - `Dropdown.tsx`

### Task 9.2: Layout Components
- [ ] Create `src/components/Layout/DashboardLayout.tsx`:
  - Sidebar navigation (for desktop)
  - Top navbar (firm name, user menu)
  - Main content area
  - Mobile: Hamburger menu
- [ ] Create `src/components/Layout/EditorLayout.tsx`:
  - Full-screen editor mode
  - Collapsible sidebar
  - Floating action buttons

### Task 9.3: Responsive Design
- [ ] Ensure all pages work on:
  - Desktop (1920px+)
  - Laptop (1280px - 1920px)
  - Tablet (768px - 1280px)
  - Mobile (320px - 768px)
- [ ] Test and fix:
  - Navigation (hamburger menu on mobile)
  - Document editor (stack sidebar below on tablet/mobile)
  - Forms (full-width on mobile)
  - Modals (full-screen on mobile)

### Task 9.4: Loading & Error States
- [ ] Create skeleton loaders for:
  - Document list
  - Template list
  - Editor loading
- [ ] Create error components:
  - `ErrorBoundary.tsx` (catch React errors)
  - `ErrorAlert.tsx` (inline error messages)
  - `NotFound.tsx` (404 page)
- [ ] Add toast notifications library (e.g., `react-hot-toast`)

---

## Phase 10: Manual Testing & Quality Assurance
**Goal:** Ensure core functionality works end-to-end through manual testing

### Task 10.1: Manual Testing Checklist
Create test scenarios and execute:

**Authentication:**
- [ ] Sign up → Create new firm → Verify Admin role
- [ ] Sign up → Join firm (valid code) → Verify Lawyer role
- [ ] Sign up → Join firm (valid code) → Verify Paralegal role
- [ ] Sign up → Join firm (invalid code) → Verify error
- [ ] Login with existing credentials
- [ ] Logout and verify session cleared

**Templates:**
- [ ] Admin/Lawyer: Upload DOCX template → Verify extraction
- [ ] Admin/Lawyer: Upload PDF template → Verify extraction
- [ ] Paralegal: Verify cannot upload templates (UI hidden)
- [ ] View global templates
- [ ] View firm templates
- [ ] Delete firm template (Admin/Lawyer only)

**Document Generation:**
- [ ] Select template → Upload single source document → Generate
- [ ] Select template → Upload multiple source documents → Generate
- [ ] Verify generated content quality
- [ ] Test with various template/source combinations

**Collaboration:**
- [ ] Open document in two browsers (same firm) → Verify real-time sync
- [ ] Type in one browser → Verify updates in other browser
- [ ] Verify active users indicator
- [ ] Paralegal: Edit shared document → Verify saves
- [ ] Paralegal: Try to access private document → Verify denied

**Sharing:**
- [ ] Share document with specific user → Verify they can access
- [ ] Make document firm-wide → Verify all firm members can access
- [ ] Change document back to private → Verify access revoked

**AI Refinement:**
- [ ] Use AI sidebar with custom instructions → Verify content updates
- [ ] Test various refinement requests (tone, length, details)
- [ ] Verify error handling for API failures

**Export:**
- [ ] Export document as DOCX → Verify format and content
- [ ] Verify professional styling (fonts, spacing, margins)
- [ ] Verify download triggers correctly
- [ ] Test export with special formatting (bold, italic, lists)

### Task 10.2: Edge Case & Browser Testing
- [ ] Test with large documents (5,000+ words)
- [ ] Test with special characters in templates/documents
- [ ] Test concurrent editing by 3+ users
- [ ] Test file upload validation (size limits, file types)
- [ ] Browser testing: Chrome, Firefox, Safari
- [ ] Mobile responsiveness testing (optional)

### Task 10.3: Performance & Security Review
- [ ] Page load times (aim for < 5s initial load)
- [ ] Test with 50+ documents in dashboard
- [ ] Verify Firestore security rules working correctly
- [ ] Verify Storage security rules enforced
- [ ] Check all role-based permissions (Admin, Lawyer, Paralegal)
- [ ] Monitor Firebase console for errors during testing

---

## Phase 11: Deployment & Production Setup
**Goal:** Deploy all microservices and frontend to Firebase

### Task 11.1: Microservices Environment Configuration
- [ ] Set environment variables for ai-service in Firebase:
  ```bash
  firebase functions:config:set openai.key="YOUR_OPENAI_KEY" --project <project-id>
  firebase functions:config:set openai.model="gpt-4o-mini" --project <project-id>
  ```
- [ ] Update each service's `index.ts` to read Firebase config:
  ```typescript
  // ai-service/src/index.ts
  import * as functions from 'firebase-functions';
  const openaiKey = functions.config().openai?.key || process.env.OPENAI_API_KEY;
  const openaiModel = functions.config().openai?.model || 'gpt-4o-mini';
  ```

### Task 11.2: Frontend Production Configuration
- [ ] Create production `.env.production`:
  - Firebase config (from Firebase console)
  - Production API endpoints for all microservices
  ```bash
  VITE_AUTH_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/authService
  VITE_TEMPLATE_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/templateService
  VITE_DOCUMENT_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/documentService
  VITE_AI_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/aiService
  VITE_EXPORT_SERVICE_URL=https://us-central1-<project>.cloudfunctions.net/exportService
  ```
- [ ] Update `vite.config.ts` for production build optimizations
- [ ] Build frontend: `npm run build`

### Task 11.3: Deploy Microservices to Firebase
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage:rules`
- [ ] Deploy Realtime Database rules: `firebase deploy --only database:rules`
- [ ] Deploy each microservice independently:
  ```bash
  firebase deploy --only functions:authService
  firebase deploy --only functions:templateService
  firebase deploy --only functions:documentService
  firebase deploy --only functions:aiService
  firebase deploy --only functions:exportService
  ```
- [ ] Or deploy all functions at once: `firebase deploy --only functions`
- [ ] Deploy frontend: `firebase deploy --only hosting`
- [ ] Verify all services are live in Firebase Console

### Task 11.4: Post-Deployment Testing
- [ ] Test all API endpoints individually (use Postman or curl)
- [ ] Test auth-service: signup, createFirm, joinFirm
- [ ] Test template-service: upload, list, download
- [ ] Test document-service: CRUD operations, sharing
- [ ] Test ai-service: generate, refine
- [ ] Test export-service: DOCX generation
- [ ] Test full end-to-end flow on production URL
- [ ] Verify environment variables loaded correctly across all services
- [ ] Check Firebase Console logs for each service
- [ ] Monitor Functions invocations, Storage usage, Firestore reads/writes

### Task 11.5: Documentation
- [ ] Create `README.md` with:
  - Project overview and microservices architecture diagram
  - Tech stack
  - Setup instructions for local development
  - Microservices deployment guide
  - Environment variables list for each service
- [ ] Create `ARCHITECTURE.md` with:
  - Microservices architecture diagram
  - API endpoint documentation for each service
  - Data flow diagrams
  - Inter-service communication patterns
- [ ] Create `TESTING.md` with test scenarios
- [ ] Create API documentation for each microservice

---

## Phase 12: Future Enhancements (Post-MVP)
**Goal:** Roadmap for features beyond MVP scope

### Potential Features:
- [ ] **PDF Export:** Add PDF generation alongside DOCX export
- [ ] **Version History:** Track document revisions with rollback capability
- [ ] **Admin Controls:** Comprehensive firm management (add/remove members, analytics)
- [ ] **Advanced Templates:** Template variables/placeholders for dynamic content
- [ ] **Email Integration:** Send demand letters directly via email
- [ ] **Signature Collection:** E-signature workflow
- [ ] **Document Analytics:** Track document views, edits, time spent
- [ ] **Mobile App:** React Native version
- [ ] **Third-party Integrations:** Clio, MyCase, PracticePanther
- [ ] **Advanced AI:** GPT-4o upgrade option, prompt customization, AI model comparison
- [ ] **Custom Branding:** Firm logos, color schemes in exports
- [ ] **Notification System:** Email/in-app notifications for shares, comments
- [ ] **Comment System:** Inline comments on specific document sections
- [ ] **Search:** Full-text search across all documents
- [ ] **Automated Testing:** Unit tests (Jest) and E2E tests (Playwright/Cypress)

---

## Summary & Milestones

### Core Milestones:
- [ ] **Milestone 1:** Microservices structure setup + auth-service deployed (Phase 0-1)
- [ ] **Milestone 2:** Template-service operational with upload/extraction (Phase 2-3)
- [ ] **Milestone 3:** Document-service + ai-service generating quality drafts (Phase 4)
- [ ] **Milestone 4:** Collaborative editor with real-time sync operational (Phase 5)
- [ ] **Milestone 5:** Sharing and permissions enforced across services (Phase 6)
- [ ] **Milestone 6:** Dashboard + export-service producing DOCX files (Phase 7-8)
- [ ] **Milestone 7:** Steno-inspired UI polished and responsive (Phase 9)
- [ ] **Milestone 8:** All microservices tested and deployed to production (Phase 10-11)

### Estimated Timeline:
- **Phase 0:** 2-3 days (Setup & Microservices Configuration)
- **Phase 1:** 3-4 days (Auth Service & Firm Management)
- **Phase 2:** 2-3 days (Database Schema & Security Rules)
- **Phase 3:** 3-4 days (Template Service)
- **Phase 4:** 4-5 days (Document Service + AI Service)
- **Phase 5:** 4-5 days (Collaborative Editor with TipTap + Y.js)
- **Phase 6:** 1-2 days (Sharing & Permissions)
- **Phase 7:** 2-3 days (Dashboard & Document Management)
- **Phase 8:** 2-3 days (Export Service)
- **Phase 9:** 3-4 days (UI Polish with Steno Theme)
- **Phase 10:** 3-4 days (Manual Testing - including inter-service testing)
- **Phase 11:** 2-3 days (Microservices Deployment)

**Total Estimated Time: 4-6 weeks for complete MVP** (microservices architecture adds complexity)

---

## Key Technical Decisions

### Architecture Choices:
- **Architecture Pattern:** True Microservices with independent service deployment
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (Steno-inspired theme)
- **Backend:** Firebase Cloud Functions (Node.js + Express) deployed as independent microservices
- **Microservices:**
  1. **auth-service**: Authentication, user management, firm creation/joining
  2. **template-service**: Template upload, extraction (mammoth, pdf-parse), management
  3. **document-service**: Document CRUD, sharing, permissions, collaboration sync
  4. **ai-service**: OpenAI integration for generation and refinement (gpt-4o-mini default)
  5. **export-service**: DOCX export with professional formatting
- **Database:** Firestore (NoSQL, real-time) + Firebase Realtime Database (Y.js collaboration sync)
- **Storage:** Firebase Storage (templates, source documents, exports)
- **Authentication:** Firebase Auth (Email/Password) with token-based inter-service auth
- **AI Provider:** OpenAI API (configurable: gpt-4o-mini, gpt-4o, gpt-4-turbo)
- **Collaborative Editor:** TipTap + Y.js + y-firebase
- **Document Processing:** mammoth (DOCX extraction), pdf-parse (PDF extraction)
- **Export:** docx npm library (DOCX generation only)

### Microservices Communication:
- Frontend → Services: RESTful HTTP calls with Firebase ID token authentication
- Service → Firestore: Direct read/write with firebase-admin SDK
- Service → Service: HTTP calls (when needed) with service account authentication
- All services share data via Firestore as single source of truth

### Security Considerations:
- Role-based access control (Admin, Lawyer, Paralegal) enforced in each service
- Firm-level data isolation across all services
- Firebase ID token validation in all service endpoints
- Firestore security rules for data access (defense in depth)
- Storage security rules for file access
- Firm code validation for joining firms
- Environment variables for API keys (ai-service)
- Service-level authorization checks before database operations

### Performance Optimizations:
- Independent scaling per microservice
- Debounced auto-save in editor
- Lazy loading for document lists
- Firestore query limits and pagination
- Signed URLs for file downloads (1-hour expiration)
- Client-side caching with React Query
- Service-specific cold start optimization

---

## Notes for AI-Driven Development

This task list is designed for sequential development with AI assistance. Each task is atomic and can be implemented independently with clear requirements.

**Recommended Approach:**
1. Complete tasks in order within each phase
2. Test thoroughly at the end of each phase before moving forward
3. Use AI to generate boilerplate code and component structures
4. Review and refine AI-generated code for security and best practices
5. Commit to Git after completing each major task

**AI Prompting Tips:**
- Provide this task list as context when asking for implementation help
- Reference specific tasks by phase and task number (e.g., "Task 3.1")
- Include relevant schema definitions when working on database operations
- Request code reviews for security-critical components (auth, permissions)
- Reference the Steno design guidelines for all UI component implementations

---

## 📝 Key Decisions & Scope Clarifications

### Finalized Decisions:
1. ✅ **Architecture:** True microservices with 5 independent Firebase Cloud Functions
2. ✅ **Collaboration Setup:** Firebase Realtime Database + y-firebase
3. ✅ **AI Model:** GPT-4o-mini (configurable via environment variable)
4. ✅ **Global Templates:** Pre-loaded with 2-3 sample templates
5. ✅ **Admin Privileges:** Admin = first user who created firm; can see firm code
6. ✅ **Firm Discovery:** Open search by firm name (no restrictions)
7. ✅ **Export Format:** DOCX only (no PDF for MVP)
8. ✅ **Testing:** Manual testing only (no unit/E2E tests for MVP)
9. ✅ **UI Theme:** Steno-inspired professional legal aesthetic
10. ✅ **Folder Structure:** `/frontend`, `/services/{service-name}`, `/shared`, `/scripts`

### MVP Scope (What's Included):
- ✅ **Microservices architecture** with 5 independent services (auth, template, document, AI, export)
- ✅ Multi-tenant architecture with firm-based isolation
- ✅ Role-based access control (Admin, Lawyer, Paralegal) across all services
- ✅ Template system (global + firm-specific) via template-service
- ✅ AI document generation with source document upload via ai-service + document-service
- ✅ Real-time collaborative editing (TipTap + Y.js)
- ✅ Document sharing and permissions via document-service
- ✅ DOCX export with professional styling via export-service
- ✅ Beautiful Steno-inspired UI with gradient hero, gold CTAs
- ✅ Independent service deployment and scaling

### Not Included in MVP (Future Enhancements):
- ❌ PDF export (DOCX only for MVP)
- ❌ Automated tests (manual testing only)
- ❌ Anthropic API integration (OpenAI only)
- ❌ Mobile app
- ❌ Third-party integrations (Clio, MyCase, etc.)
- ❌ Version history with rollback
- ❌ Email integration
- ❌ E-signature workflow

---

**Last Updated:** November 11, 2025  
**Architecture:** True Microservices with Firebase Cloud Functions  
**Status:** Finalized & Ready for Development  
**Next Step:** Begin Phase 0 - Microservices Project Setup & Configuration