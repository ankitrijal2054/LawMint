# LawMint - Microservices Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[React Web App<br/>Vite + TypeScript + Tailwind]
        Landing[Landing Page<br/>Steno-Inspired Theme]
        AuthPages[Auth Pages<br/>Login/Signup/Firm Creation]
        Dashboard[Dashboard<br/>My Docs / Shared / Firm Docs]
        Editor[Collaborative Editor<br/>TipTap + Y.js + Real-time Sync]
        Templates[Template Manager<br/>Global + Firm Templates]
        NewDoc[New Document Flow<br/>Template + Sources + AI]
    end

    subgraph "Microservices Layer - Independent Cloud Functions"
        direction TB
        
        subgraph "auth-service"
            AuthAPI[Express API<br/>Port: 5001]
            AuthEndpoints["/auth/signup<br/>/auth/createFirm<br/>/auth/joinFirm<br/>/auth/user/:uid<br/>/auth/firm/:firmId"]
        end
        
        subgraph "template-service"
            TemplateAPI[Express API<br/>Port: 5002]
            TemplateEndpoints["/templates/upload<br/>/templates/global<br/>/templates/firm/:firmId<br/>/templates/:id"]
            TemplateExtract[Text Extraction<br/>mammoth + pdf-parse]
        end
        
        subgraph "document-service"
            DocumentAPI[Express API<br/>Port: 5003]
            DocumentEndpoints["/documents<br/>/documents/:id<br/>/documents/user/:uid<br/>/documents/:id/share<br/>/documents/upload-sources"]
        end
        
        subgraph "ai-service"
            AIAPI[Express API<br/>Port: 5004]
            AIEndpoints["/ai/generate<br/>/ai/refine"]
            AILogic[OpenAI Client<br/>GPT-4o-mini]
        end
        
        subgraph "export-service"
            ExportAPI[Express API<br/>Port: 5005]
            ExportEndpoints["/export/docx"]
            ExportLogic[DOCX Generation<br/>docx npm library]
        end
    end

    subgraph "Firebase Infrastructure"
        FAuth[Firebase Authentication<br/>Email/Password<br/>ID Token Validation]
        Firestore[(Firestore Database<br/>Collections:<br/>users, firms, templates,<br/>documents)]
        RealtimeDB[(Firebase Realtime DB<br/>Y.js Collaboration Sync<br/>/documents/{id}/yjs)]
        FStorage[Firebase Storage<br/>Buckets:<br/>/templates/, /sources/,<br/>/exports/]
        Hosting[Firebase Hosting<br/>Static Frontend<br/>SPA Rewrites]
    end

    subgraph "External Services"
        OpenAI[OpenAI API<br/>Model: gpt-4o-mini<br/>configurable]
    end

    subgraph "Shared Library"
        SharedTypes[TypeScript Types<br/>User, Firm, Document,<br/>Template interfaces]
        SharedUtils[Shared Utilities<br/>Validation, Constants]
    end

    %% Client to Services
    WebApp --> Landing
    WebApp --> AuthPages
    WebApp --> Dashboard
    WebApp --> Editor
    WebApp --> Templates
    WebApp --> NewDoc

    AuthPages -->|HTTP + ID Token| AuthAPI
    Templates -->|HTTP + ID Token| TemplateAPI
    Dashboard -->|HTTP + ID Token| DocumentAPI
    NewDoc -->|HTTP + ID Token| DocumentAPI
    NewDoc -->|HTTP + ID Token| AIAPI
    Editor -->|HTTP + ID Token| DocumentAPI
    Editor -->|HTTP + ID Token| AIAPI
    Editor -->|HTTP + ID Token| ExportAPI

    %% Auth Service
    AuthAPI --> FAuth
    AuthAPI --> Firestore
    
    %% Template Service
    TemplateAPI --> Firestore
    TemplateAPI --> FStorage
    TemplateAPI --> TemplateExtract
    
    %% Document Service
    DocumentAPI --> Firestore
    DocumentAPI --> FStorage
    DocumentAPI --> RealtimeDB
    
    %% AI Service
    AIAPI --> Firestore
    AIAPI --> AILogic
    AILogic --> OpenAI
    
    %% Export Service
    ExportAPI --> Firestore
    ExportAPI --> FStorage
    ExportAPI --> ExportLogic

    %% Shared Library
    AuthAPI -.->|imports| SharedTypes
    TemplateAPI -.->|imports| SharedTypes
    DocumentAPI -.->|imports| SharedTypes
    AIAPI -.->|imports| SharedTypes
    ExportAPI -.->|imports| SharedTypes

    %% Editor Collaboration
    Editor -->|WebSocket-like| RealtimeDB

    %% Frontend Hosting
    Hosting -->|serves| WebApp

    %% Styling
    style WebApp fill:#61dafb,stroke:#333,stroke-width:3px
    style AuthAPI fill:#1E2A78,stroke:#fff,color:#fff
    style TemplateAPI fill:#1E2A78,stroke:#fff,color:#fff
    style DocumentAPI fill:#1E2A78,stroke:#fff,color:#fff
    style AIAPI fill:#1E2A78,stroke:#fff,color:#fff
    style ExportAPI fill:#1E2A78,stroke:#fff,color:#fff
    style OpenAI fill:#10a37f,stroke:#fff,color:#fff
    style FAuth fill:#ffca28
    style Firestore fill:#ffca28
    style RealtimeDB fill:#ffca28
    style FStorage fill:#ffca28
    style Hosting fill:#ffca28
    style SharedTypes fill:#C59E47
    style SharedUtils fill:#C59E47
```

---

## Service Boundaries & Responsibilities

### 1. **auth-service** 
**Responsibility:** User authentication, firm management, role-based access control

**Endpoints:**
- `POST /auth/signup` - Create new user account
- `POST /auth/createFirm` - Create new firm with generated code (STENO-XXXXX)
- `POST /auth/joinFirm` - Join existing firm with validation
- `GET /auth/user/:uid` - Get user profile
- `GET /auth/firm/:firmId` - Get firm details
- `GET /auth/firm/:firmId/members` - List all firm members

**Data Access:**
- Firestore: `/users/{uid}`, `/firms/{firmId}`
- Firebase Auth: User creation, token validation

**Dependencies:** None (foundational service)

---

### 2. **template-service**
**Responsibility:** Template upload, text extraction, CRUD operations

**Endpoints:**
- `POST /templates/upload` - Upload PDF/DOCX template
- `GET /templates/global` - List global templates
- `GET /templates/firm/:firmId` - List firm-specific templates
- `GET /templates/:templateId` - Get single template
- `DELETE /templates/:templateId` - Delete firm template
- `GET /templates/:templateId/download` - Download template file

**Data Access:**
- Firestore: `/templates/global/{id}`, `/templates/{firmId}/{id}`
- Storage: `/templates/{firmId}/{fileName}`, `/templates/global/{fileName}`

**Processing:**
- Text extraction: `mammoth` (DOCX), `pdf-parse` (PDF)

**Dependencies:** None

---

### 3. **document-service**
**Responsibility:** Document lifecycle, sharing, permissions, source document handling

**Endpoints:**
- `POST /documents` - Create new document
- `GET /documents/:documentId` - Get document details
- `PUT /documents/:documentId` - Update document content
- `DELETE /documents/:documentId` - Delete document
- `GET /documents/user/:uid` - List user's documents
- `GET /documents/firm/:firmId` - List firm-wide documents
- `GET /documents/shared/:uid` - List documents shared with user
- `POST /documents/:documentId/share` - Update sharing settings
- `POST /documents/upload-sources` - Upload source documents (PDF/DOCX)

**Data Access:**
- Firestore: `/documents/{documentId}`
- Realtime DB: `/documents/{documentId}/yjs` (Y.js collaboration)
- Storage: `/sources/{firmId}/{documentId}/{fileName}`

**Processing:**
- Text extraction from source documents: `mammoth`, `pdf-parse`

**Dependencies:** None (but often called alongside ai-service)

---

### 4. **ai-service**
**Responsibility:** AI-powered document generation and refinement

**Endpoints:**
- `POST /ai/generate` - Generate demand letter from template + sources
- `POST /ai/refine` - Refine existing document content

**Data Access:**
- Firestore: Read templates (if needed for context)
- OpenAI API: GPT-4o-mini (configurable)

**Environment:**
- `OPENAI_API_KEY` - API key
- `OPENAI_MODEL` - Model selection (gpt-4o-mini, gpt-4o, gpt-4-turbo)

**Dependencies:** 
- Receives template content and extracted source text from frontend orchestration
- Does NOT call other services (stateless)

---

### 5. **export-service**
**Responsibility:** Document export to DOCX format

**Endpoints:**
- `POST /export/docx` - Export document to DOCX

**Data Access:**
- Firestore: `/documents/{documentId}` (read content)
- Storage: `/exports/{firmId}/{documentId}/{fileName}` (write export)

**Processing:**
- DOCX generation: `docx` npm library
- Professional styling: Times New Roman, 1.5 spacing, 1" margins

**Output:**
- Signed URL (1-hour expiration) for file download

**Dependencies:** document-service (reads document content)

---

## Data Flow Examples

### Flow 1: User Signup & Firm Creation
```
Frontend → auth-service POST /auth/signup
         → auth-service POST /auth/createFirm
         → Firestore: Write /users/{uid}, /firms/{firmId}
         → Firebase Auth: Create user account
         ← Return: firmCode (STENO-XXXXX)
```

### Flow 2: Template Upload
```
Frontend → template-service POST /templates/upload (FormData)
         → Extract text (mammoth/pdf-parse)
         → Storage: Write /templates/{firmId}/{fileName}
         → Firestore: Write /templates/{firmId}/{templateId}
         ← Return: templateId
```

### Flow 3: Document Generation (Multi-Service Orchestration)
```
Frontend → document-service POST /documents/upload-sources
         ← Return: extracted text array

Frontend → ai-service POST /ai/generate
         → OpenAI API: Generate letter
         ← Return: generated content

Frontend → document-service POST /documents
         → Firestore: Write /documents/{documentId}
         → Realtime DB: Initialize Y.js sync
         ← Return: documentId
         
Frontend → Navigate to editor
```

### Flow 4: Collaborative Editing
```
User A Editor → Realtime DB /documents/{id}/yjs (Y.js CRDT)
User B Editor → Realtime DB /documents/{id}/yjs (Y.js CRDT)
[Real-time sync via Y.js + Firebase]

On Save → document-service PUT /documents/:id
        → Firestore: Update content snapshot
```

### Flow 5: AI Refinement
```
Editor → ai-service POST /ai/refine
       → OpenAI API: Refine with instructions
       ← Return: refined content
       → Editor: Update content (via Y.js)
```

### Flow 6: Document Export
```
Editor → export-service POST /export/docx
       → Firestore: Read /documents/{id}
       → Generate DOCX (docx library)
       → Storage: Write /exports/{firmId}/{documentId}/{fileName}
       ← Return: signed download URL
       → Browser: Auto-download file
```

---

## Security Architecture

### Authentication Flow
```
User Login → Firebase Auth → ID Token issued
Frontend → Service (with ID Token in Authorization header)
Service → Verify token with firebase-admin
Service → Check user role in Firestore /users/{uid}
Service → Authorize operation based on role + resource ownership
Service → Execute operation
```

### Role-Based Access Control (RBAC)

| Role      | Can Create Firm | Can Upload Templates | Can Create Documents | Can Edit Own Docs | Can Edit Shared Docs | Can Export |
|-----------|----------------|----------------------|---------------------|-------------------|---------------------|------------|
| Admin     | ✅             | ✅                   | ✅                  | ✅                | ✅ (if shared)      | ✅         |
| Lawyer    | ❌             | ✅                   | ✅                  | ✅                | ✅ (if shared)      | ✅         |
| Paralegal | ❌             | ❌                   | ❌                  | ❌                | ✅ (if shared)      | ✅         |

### Firestore Security Rules
- Defense-in-depth: Rules enforced at both service-level AND Firestore-level
- Firm isolation: Users can only access documents from their firm
- Document visibility: Private, Shared (specific users), Firm-wide

---

## Deployment Architecture

### Local Development
```
Frontend:     http://localhost:5173 (Vite dev server)
auth-service: http://localhost:5001 (via Firebase emulator)
template-service: http://localhost:5002
document-service: http://localhost:5003
ai-service: http://localhost:5004
export-service: http://localhost:5005
Firestore Emulator: localhost:8080
Firebase Auth Emulator: localhost:9099
Realtime DB Emulator: localhost:9000
Storage Emulator: localhost:9199
```

### Production (Firebase)
```
Frontend: https://<project>.web.app (Firebase Hosting)
auth-service: https://us-central1-<project>.cloudfunctions.net/authService
template-service: https://us-central1-<project>.cloudfunctions.net/templateService
document-service: https://us-central1-<project>.cloudfunctions.net/documentService
ai-service: https://us-central1-<project>.cloudfunctions.net/aiService
export-service: https://us-central1-<project>.cloudfunctions.net/exportService
```

### Independent Deployment
Each service can be deployed independently:
```bash
firebase deploy --only functions:authService
firebase deploy --only functions:templateService
firebase deploy --only functions:documentService
firebase deploy --only functions:aiService
firebase deploy --only functions:exportService
```

---

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Steno theme: #1E2A78, #F4F1E9, #C59E47)
- **State Management:** React Query (for API calls), Context API (for auth)
- **Editor:** TipTap + Y.js + y-firebase
- **Routing:** React Router v6

### Backend (All Microservices)
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Authentication:** Firebase Admin SDK (token verification)
- **Database Client:** firebase-admin (Firestore)

### Service-Specific Libraries
- **template-service:** mammoth, pdf-parse
- **document-service:** mammoth, pdf-parse
- **ai-service:** openai (official SDK)
- **export-service:** docx

### Infrastructure
- **Cloud Platform:** Google Cloud (via Firebase)
- **Functions:** Firebase Cloud Functions (2nd gen)
- **Database:** Firestore (NoSQL), Realtime Database (Y.js sync)
- **Storage:** Firebase Storage
- **Auth:** Firebase Authentication
- **Hosting:** Firebase Hosting
- **CDN:** Firebase CDN (automatic)

---

## Monitoring & Observability

### Firebase Console Dashboards
- **Functions:** Invocation count, execution time, errors per service
- **Firestore:** Document reads/writes, active connections
- **Storage:** Download/upload bandwidth, storage usage
- **Auth:** Active users, sign-ups per day

### Logging Strategy
Each service logs:
- Request ID (for tracing across services)
- User ID
- Operation performed
- Execution time
- Errors with stack traces

View logs: `firebase functions:log --only <serviceName>`

---

## Scalability Considerations

### Horizontal Scaling
- Each microservice auto-scales independently based on load
- Firebase Cloud Functions scales from 0 to N instances per service
- No manual intervention required

### Performance Optimizations
- **Firestore:** Indexed queries, pagination (limit 50 per page)
- **Storage:** Signed URLs (1-hour expiration), CDN caching
- **AI Service:** Request queuing for rate limit management
- **Export Service:** Background processing for large documents
- **Frontend:** React Query caching, lazy loading components

### Cost Optimization
- Services scale to zero when not in use
- Separate services allow granular cost analysis
- AI service isolated to control OpenAI API costs

---

## Future Enhancements

### Additional Microservices (Post-MVP)
- **notification-service:** Email and in-app notifications
- **analytics-service:** Usage tracking, document analytics
- **billing-service:** Subscription management (if commercialized)
- **audit-service:** Compliance logging, document access history

### Technology Upgrades
- **API Gateway:** Cloud Endpoints or API Gateway for unified entry point
- **Message Queue:** Pub/Sub for async inter-service communication
- **Caching Layer:** Redis for frequently accessed data
- **Search Service:** Algolia or Elastic for full-text search

---

## Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                        │
│                  Steno Theme | TipTap + Y.js                     │
└──┬────────┬────────┬────────┬────────┬────────────────────────┘
   │        │        │        │        │
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
┌──────┐ ┌────────┐ ┌────────┐ ┌─────┐ ┌────────┐
│ auth │ │template│ │document│ │ ai  │ │ export │  ◄── Microservices
│service│ │service │ │service │ │serv │ │ service│      (Independent)
└──┬───┘ └───┬────┘ └───┬────┘ └──┬──┘ └───┬────┘
   │         │           │         │        │
   │         │           │         │        │
   └─────────┴───────────┴─────────┴────────┘
                      │
           ┌──────────┴───────────┐
           │                      │
           ▼                      ▼
    ┌────────────┐        ┌──────────────┐
    │ Firestore  │        │ Realtime DB  │
    │ (Primary)  │        │ (Y.js Sync)  │
    └────────────┘        └──────────────┘
           │
           │
    ┌──────┴──────┐
    │   Storage   │
    │  (Files)    │
    └─────────────┘
```

---

**Last Updated:** November 11, 2025  
**Architecture Type:** Microservices with Firebase Cloud Functions  
**Total Services:** 5 independent microservices  
**Database:** Firestore + Firebase Realtime Database  
