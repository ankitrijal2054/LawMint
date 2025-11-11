# Document Service Microservice

**Service Name:** document-service  
**Purpose:** Manage document lifecycle, permissions, sharing, and collaboration metadata  
**Technology:** Express.js + TypeScript + Firebase Admin SDK  

---

## API Endpoints

### 1. Health Check
```http
GET /health
```
**Response:**
```json
{
  "success": true,
  "message": "Document service is running"
}
```

---

### 2. Create Document
```http
POST /documents
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Acme Corp - Breach of Contract Demand",
  "firmId": "firm456",
  "templateId": "template_001",
  "sourceDocuments": [],
  "visibility": "private",
  "content": "Generated document content here..."
}
```

**Required Fields:** `title`, `firmId`  
**Optional Fields:** `templateId`, `sourceDocuments`, `visibility`, `content`  
**Default Values:**
- `visibility`: "private"
- `content`: ""

**Response (201):**
```json
{
  "success": true,
  "documentId": "doc789",
  "document": {
    "documentId": "doc789",
    "firmId": "firm456",
    "ownerId": "user123",
    "title": "Acme Corp - Breach of Contract Demand",
    "content": "Generated document content here...",
    "templateId": "template_001",
    "sourceDocuments": [],
    "visibility": "private",
    "sharedWith": [],
    "activeUsers": [
      {
        "uid": "user123",
        "name": "john@lawfirm.com",
        "lastActive": "2025-11-12T10:00:00Z"
      }
    ],
    "status": "draft",
    "metadata": {
      "lastEditedBy": "user123",
      "wordCount": 42,
      "version": 1,
      "notes": ""
    },
    "createdAt": "2025-11-12T10:00:00Z",
    "updatedAt": "2025-11-12T10:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields or invalid visibility
- `403` - User doesn't belong to firm or doesn't have permission
- `500` - Server error

---

### 3. Get Document
```http
GET /documents/:documentId
Authorization: Bearer {firebaseIdToken}
```

**Parameters:**
- `documentId` (path) - UUID of document

**Response (200):**
```json
{
  "success": true,
  "document": {
    "documentId": "doc789",
    "firmId": "firm456",
    "ownerId": "user123",
    "title": "Acme Corp - Breach of Contract Demand",
    "content": "...",
    "visibility": "private",
    "status": "draft",
    "createdAt": "2025-11-12T10:00:00Z",
    "updatedAt": "2025-11-12T10:00:00Z"
  }
}
```

**Error Responses:**
- `404` - Document not found
- `403` - Access denied
- `500` - Server error

---

### 4. Update Document
```http
PUT /documents/:documentId
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated document content...",
  "status": "draft"
}
```

**Optional Fields:** `content`, `status`

**Status Values:** `"draft"`, `"final"`, `"approved"`

**Response (200):**
```json
{
  "success": true,
  "message": "Document updated successfully"
}
```

**Error Responses:**
- `404` - Document not found
- `403` - Access denied
- `500` - Server error

---

### 5. Delete Document
```http
DELETE /documents/:documentId
Authorization: Bearer {firebaseIdToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Error Responses:**
- `404` - Document not found
- `403` - Only owner can delete
- `500` - Server error

---

### 6. List User's Documents
```http
GET /documents/user/:uid
Authorization: Bearer {firebaseIdToken}
```

**Parameters:**
- `uid` (path) - User's Firebase UID

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "documents": [
    {
      "id": "doc789",
      "title": "Acme Corp - Breach of Contract Demand",
      "status": "draft",
      "visibility": "private",
      "createdAt": "2025-11-12T10:00:00Z",
      "updatedAt": "2025-11-12T10:00:00Z"
    }
  ]
}
```

**Includes:**
- Documents owned by user
- Documents shared with user
- Firm-wide documents (if applicable)

**Error Responses:**
- `403` - Can only list your own documents
- `500` - Server error

---

### 7. List Firm-Wide Documents
```http
GET /documents/firm/:firmId
Authorization: Bearer {firebaseIdToken}
```

**Parameters:**
- `firmId` (path) - Firm UUID

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "documents": [
    {
      "id": "doc456",
      "title": "Personal Injury Demand",
      "ownerId": "user123",
      "visibility": "firm-wide",
      "createdAt": "2025-11-12T10:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `403` - User doesn't belong to firm
- `500` - Server error

---

### 8. List Documents Shared With User
```http
GET /documents/shared/:uid
Authorization: Bearer {firebaseIdToken}
```

**Parameters:**
- `uid` (path) - User's Firebase UID

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "documents": [
    {
      "id": "doc123",
      "title": "Contract Dispute - Draft",
      "ownerId": "user456",
      "visibility": "shared",
      "createdAt": "2025-11-11T09:00:00Z"
    }
  ]
}
```

**Error Responses:**
- `403` - Can only list documents shared with you
- `500` - Server error

---

### 9. Update Document Sharing
```http
POST /documents/:documentId/share
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "visibility": "shared",
  "sharedWith": ["user456", "user789"]
}
```

**Visibility Options:**
- `"private"` - Only owner can access
- `"shared"` - Only owner + specified users
- `"firm-wide"` - All firm members

**Response (200):**
```json
{
  "success": true,
  "message": "Document sharing updated successfully"
}
```

**Error Responses:**
- `400` - Invalid visibility
- `403` - Only owner can change sharing
- `404` - Document not found
- `500` - Server error

---

### 10. Upload Source Documents
```http
POST /documents/upload-sources
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "documentId": "doc789",
  "files": [
    {
      "filename": "contract.pdf",
      "data": "JVBERi0xLjQKJeLj..."
    },
    {
      "filename": "complaint.docx",
      "data": "UEsDBBQABgAIAAAAIQD..."
    }
  ]
}
```

**Parameters:**
- `documentId` (optional) - If provided, validates user has access
- `files` (required) - Array of file objects
  - `filename` - Original filename (with extension)
  - `data` - Base64-encoded file content

**Supported File Types:** `.pdf`, `.docx`, `.doc`

**Response (200):**
```json
{
  "success": true,
  "extractedTexts": [
    "This is the extracted text from contract.pdf...",
    "This is the extracted text from complaint.docx..."
  ],
  "sourceDocuments": [
    {
      "fileName": "contract.pdf",
      "fileType": "pdf",
      "storagePath": "sources/firm456/doc789/contract.pdf",
      "extractedText": "This is the extracted text from contract.pdf...",
      "uploadedAt": "2025-11-12T10:05:00Z",
      "uploadedBy": "user123"
    },
    {
      "fileName": "complaint.docx",
      "fileType": "docx",
      "storagePath": "sources/firm456/doc789/complaint.docx",
      "extractedText": "This is the extracted text from complaint.docx...",
      "uploadedAt": "2025-11-12T10:05:00Z",
      "uploadedBy": "user123"
    }
  ]
}
```

**Error Responses:**
- `400` - No files provided or invalid file format
- `403` - User doesn't have access to document
- `500` - Server error

---

## Authorization & Permissions

### Role-Based Access Control

| Action | Admin | Lawyer | Paralegal |
|--------|-------|--------|-----------|
| Create Document | ✅ | ✅ | ❌ |
| View Own Doc | ✅ | ✅ | N/A |
| View Shared Doc | ✅ | ✅ | ✅ |
| View Firm-Wide Doc | ✅ | ✅ | ✅ |
| Update Own Doc | ✅ | ✅ | N/A |
| Update Shared Doc | ✅ | ✅ | ✅ |
| Delete Doc | Owner Only | Owner Only | ❌ |
| Share Doc | Owner Only | Owner Only | ❌ |
| Upload Sources | All | All | All* |

*Paralegals can upload sources to shared/firm-wide documents they have access to.

### Token Verification

All endpoints (except `/health`) require:
```
Authorization: Bearer {firebaseIdToken}
```

Tokens are verified using Firebase Admin SDK. Invalid/expired tokens return `401`.

---

## Data Models

### Document Object
```typescript
{
  documentId: string;              // UUID
  firmId: string;                  // Parent firm ID
  ownerId: string;                 // Creator's UID
  title: string;
  content: string;                 // Collaborative text
  templateId?: string;             // Reference to template
  sourceDocuments: {
    fileName: string;
    fileType: 'pdf' | 'docx';
    storagePath: string;
    extractedText: string;
    uploadedAt: timestamp;
    uploadedBy: string;
  }[];
  visibility: 'private' | 'shared' | 'firm-wide';
  sharedWith: string[];            // Array of user UIDs (if visibility='shared')
  activeUsers: {
    uid: string;
    name: string;
    lastActive: timestamp;
  }[];
  status: 'draft' | 'final' | 'approved';
  metadata: {
    lastEditedBy: string;
    wordCount: number;
    version: number;
    notes: string;
  };
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

---

## Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Resource created
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (access denied)
- `404` - Not found
- `500` - Server error

---

## Text Extraction

### PDF Extraction
- Library: `pdf-parse`
- Extracts all text from PDF pages
- Handles scanned PDFs with OCR limitations

### DOCX Extraction
- Library: `mammoth`
- Extracts text while preserving structure
- Supports both .doc and .docx formats

### File Size Limits
- Maximum file size: 50MB
- Enforced via Express middleware

---

## Firebase Storage

### File Organization
```
sources/
├── {firmId}/
│   ├── {documentId}/
│   │   ├── contract.pdf
│   │   ├── complaint.docx
│   │   └── evidence.pdf
```

### Signed URLs
- Signed download URLs expire after 1 hour
- Use `/documents/:documentId/download` endpoint (future) for downloads

---

## Environment Variables

None required for basic functionality. Optional:
- `ALLOWED_ORIGINS` - Comma-separated CORS origins (default: localhost:5173, lawmint.web.app)

---

## Integration with Other Services

### Calls to
- **Firebase Admin SDK** - Firestore, Storage, Auth

### Called by
- **Frontend** - All document operations
- **AI Service** - To read document content for refinement
- **Export Service** - To read document content for DOCX generation

---

## Testing

### Test Scenarios
1. ✅ Create document with minimal fields
2. ✅ Create document with template + sources
3. ✅ Update document content
4. ✅ List user's documents (owned + shared + firm-wide)
5. ✅ Share document with specific users
6. ✅ Make document firm-wide
7. ✅ Delete document (owner only)
8. ✅ Upload source documents with text extraction
9. ✅ Verify permission checks (paralegals can't create)

---

## Future Enhancements

1. **Batch Operations** - Create/update multiple documents
2. **Document Search** - Full-text search across documents
3. **Version History** - Track all changes with rollback
4. **Comments** - Add comments to documents
5. **Audit Log** - Track all user actions for compliance
6. **Export Formats** - Export to PDF, HTML, etc.

---

## Deployment

```bash
# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions:documentService
```

---

## Support

For issues or questions, see `/memory-bank/activeContext.md` for current development status.

