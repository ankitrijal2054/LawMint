# Firestore Database Schema - LawMint

**Last Updated:** November 11, 2025  
**Version:** 1.0  
**Status:** 🟢 Phase 2 Implementation

---

## Overview

LawMint uses Firestore as the primary database for storing user data, firms, templates, and documents. This document defines the complete schema, field types, constraints, and relationships.

### Collections Hierarchy

```
firestore/
├── users/
│   └── {uid}
├── firms/
│   └── {firmId}
├── templates/
│   ├── global/
│   │   └── {templateId}
│   └── {firmId}/
│       └── {templateId}
└── documents/
    └── {documentId}
```

---

## 1. Users Collection (`/users/{uid}`)

Stores user profile information and firm membership.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | `string` | ✅ | Firebase UID (document ID) |
| `email` | `string` | ✅ | User's email address |
| `name` | `string` | ✅ | User's full name |
| `firmId` | `string` | ✅ | ID of the firm they belong to |
| `role` | `enum` | ✅ | User role: `"admin"` \| `"lawyer"` \| `"paralegal"` |
| `createdAt` | `timestamp` | ✅ | Account creation timestamp |
| `updatedAt` | `timestamp` | ⚠️ | Last profile update (optional) |

### Indexes

- **Unique:** `email` (enforced at auth layer)
- **Query:** `firmId` + `role` (for firm member queries)

### Security

- Users can **read** only their own document
- Users can **write** only to their own document
- Auth-service can **write** on signup/firm join

### Example

```json
{
  "uid": "user123",
  "email": "john@lawfirm.com",
  "name": "John Attorney",
  "firmId": "firm456",
  "role": "admin",
  "createdAt": "2025-11-11T10:30:00Z",
  "updatedAt": "2025-11-11T14:20:00Z"
}
```

---

## 2. Firms Collection (`/firms/{firmId}`)

Stores firm information and metadata.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firmId` | `string` | ✅ | Unique firm ID (document ID) - UUID format |
| `name` | `string` | ✅ | Firm's legal name |
| `firmCode` | `string` | ✅ | Unique code for joining (format: `STENO-XXXXX`) |
| `createdBy` | `string` | ✅ | UID of the user who created firm (admin) |
| `createdAt` | `timestamp` | ✅ | Firm creation timestamp |
| `updatedAt` | `timestamp` | ⚠️ | Last update timestamp |
| `members` | `map` | ⚠️ | Map of firm members (optional denormalization) |

### Members Map Structure (Optional)

```json
"members": {
  "user123": {
    "name": "John Attorney",
    "role": "admin",
    "joinedAt": "2025-11-11T10:30:00Z"
  },
  "user456": {
    "name": "Jane Paralegal",
    "role": "paralegal",
    "joinedAt": "2025-11-12T09:15:00Z"
  }
}
```

### Indexes

- **Unique:** `firmCode` (enforced via security rules)
- **Query:** `createdAt` (for sorting firms)

### Security

- Users in firm can **read** firm data
- Only admins/lawyers can **update** firm data
- Only creator (admin) can **delete**

### Example

```json
{
  "firmId": "firm456",
  "name": "Smith & Associates Legal Firm",
  "firmCode": "STENO-ABC123",
  "createdBy": "user123",
  "createdAt": "2025-11-11T10:30:00Z",
  "updatedAt": "2025-11-11T14:20:00Z",
  "members": {
    "user123": {
      "name": "John Attorney",
      "role": "admin",
      "joinedAt": "2025-11-11T10:30:00Z"
    }
  }
}
```

---

## 3. Global Templates Collection (`/templates/global/{templateId}`)

Stores pre-seeded, global templates accessible to all authenticated users.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateId` | `string` | ✅ | Unique template ID (document ID - UUID) |
| `name` | `string` | ✅ | Template name (e.g., "Generic Demand Letter") |
| `type` | `enum` | ✅ | Always: `"global"` |
| `description` | `string` | ⚠️ | Template description (optional) |
| `content` | `string` | ✅ | Extracted template text content |
| `metadata` | `object` | ✅ | Template metadata |
| `createdAt` | `timestamp` | ✅ | Upload/creation timestamp |

### Metadata Structure

```json
"metadata": {
  "originalFileName": "demand-letter-generic.docx",
  "fileType": "docx",  // "pdf" | "docx"
  "uploadedBy": "system",
  "contentHash": "hash123",  // For deduplication
  "pageCount": 2,  // Optional
  "wordCount": 450  // Optional
}
```

### Indexes

- **Query:** `type` = "global"

### Security

- All authenticated users can **read**
- No **write** access (system/admin SDK only)

### Example

```json
{
  "templateId": "global_template_001",
  "name": "Generic Demand Letter",
  "type": "global",
  "description": "Standard demand letter template for general use",
  "content": "[FIRM LETTERHEAD]\n\nRE: Demand for Payment...",
  "metadata": {
    "originalFileName": "generic-demand-letter.docx",
    "fileType": "docx",
    "uploadedBy": "system",
    "contentHash": "abc123def",
    "pageCount": 2,
    "wordCount": 450
  },
  "createdAt": "2025-11-01T00:00:00Z"
}
```

---

## 4. Firm Templates Collection (`/templates/{firmId}/{templateId}`)

Stores firm-specific templates uploaded by firm members.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateId` | `string` | ✅ | Unique template ID (document ID - UUID) |
| `name` | `string` | ✅ | Template name |
| `type` | `enum` | ✅ | Always: `"firm"` |
| `firmId` | `string` | ✅ | Parent firm ID |
| `description` | `string` | ⚠️ | Template description (optional) |
| `content` | `string` | ✅ | Extracted template text content |
| `storageRef` | `string` | ✅ | Firebase Storage path (e.g., `templates/{firmId}/{fileName}`) |
| `metadata` | `object` | ✅ | Template metadata |
| `createdAt` | `timestamp` | ✅ | Upload timestamp |
| `updatedAt` | `timestamp` | ⚠️ | Last update timestamp |

### Metadata Structure

```json
"metadata": {
  "originalFileName": "contract-dispute-template.pdf",
  "fileType": "pdf",  // "pdf" | "docx"
  "uploadedBy": "user123",  // UID of uploader
  "contentHash": "xyz789",
  "pageCount": 3,
  "wordCount": 520,
  "extractedAt": "2025-11-12T15:30:00Z"
}
```

### Indexes

- **Query:** `firmId` + `createdAt` (for listing firm templates)

### Security

- Firm members can **read**
- Only admins/lawyers can **create**, **update**, **delete**

### Example

```json
{
  "templateId": "firm_template_001",
  "name": "Contract Dispute Demand Letter",
  "type": "firm",
  "firmId": "firm456",
  "description": "Custom template for contract disputes",
  "content": "[FIRM LETTERHEAD]\n\nRE: Contract Dispute Demand...",
  "storageRef": "templates/firm456/contract-dispute-template-v1.pdf",
  "metadata": {
    "originalFileName": "contract-dispute-template.pdf",
    "fileType": "pdf",
    "uploadedBy": "user123",
    "contentHash": "xyz789",
    "pageCount": 3,
    "wordCount": 520,
    "extractedAt": "2025-11-12T15:30:00Z"
  },
  "createdAt": "2025-11-12T15:30:00Z",
  "updatedAt": "2025-11-12T15:30:00Z"
}
```

---

## 5. Documents Collection (`/documents/{documentId}`)

Stores demand letter documents with collaboration metadata.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentId` | `string` | ✅ | Unique document ID (document ID - UUID) |
| `firmId` | `string` | ✅ | Parent firm ID |
| `ownerId` | `string` | ✅ | UID of document creator |
| `title` | `string` | ✅ | Document title |
| `content` | `string` | ✅ | Current document content (collaborative text) |
| `templateId` | `string` | ⚠️ | Reference to template used (optional) |
| `sourceDocuments` | `array` | ⚠️ | Array of source documents metadata (optional) |
| `visibility` | `enum` | ✅ | `"private"` \| `"shared"` \| `"firm-wide"` |
| `sharedWith` | `array` | ⚠️ | Array of UIDs (only if visibility="shared") |
| `activeUsers` | `array` | ⚠️ | Array of users currently editing |
| `status` | `enum` | ✅ | `"draft"` \| `"final"` \| `"approved"` |
| `metadata` | `object` | ⚠️ | Additional metadata |
| `createdAt` | `timestamp` | ✅ | Document creation timestamp |
| `updatedAt` | `timestamp` | ✅ | Last update timestamp |

### SourceDocuments Array

```json
"sourceDocuments": [
  {
    "fileName": "complaint-letter.pdf",
    "storagePath": "sources/firm456/doc123/complaint-letter.pdf",
    "extractedText": "...",
    "uploadedAt": "2025-11-12T10:00:00Z",
    "uploadedBy": "user123"
  }
]
```

### ActiveUsers Array

```json
"activeUsers": [
  {
    "uid": "user123",
    "name": "John Attorney",
    "lastActive": "2025-11-12T16:45:30Z",
    "cursor": { "line": 5, "column": 20 }  // Optional for collaboration
  }
]
```

### Metadata Structure

```json
"metadata": {
  "lastEditedBy": "user456",
  "wordCount": 850,
  "version": 3,
  "notes": "Client review complete, ready for finalization",
  "tags": ["personal-injury", "urgent"]  // Optional
}
```

### Indexes

- **Query:** `firmId` + `visibility` + `createdAt` (for listing documents)
- **Query:** `ownerId` + `createdAt` (for user's documents)
- **Query:** `sharedWith` (for finding shared documents) - May need composite index

### Security

- **Read:** Owner OR firm-wide/shared visibility
- **Create:** Only admins/lawyers in firm
- **Update:** Owner (admin/lawyer) OR shared/firm-wide + paralegal
- **Delete:** Owner only

### Example

```json
{
  "documentId": "doc789",
  "firmId": "firm456",
  "ownerId": "user123",
  "title": "Acme Corp - Breach of Contract Demand",
  "content": "[FIRM LETTERHEAD]\n\nRE: Demand for Payment - Breach of Contract...",
  "templateId": "firm_template_001",
  "sourceDocuments": [
    {
      "fileName": "contract.pdf",
      "storagePath": "sources/firm456/doc789/contract.pdf",
      "extractedText": "...",
      "uploadedAt": "2025-11-12T10:00:00Z",
      "uploadedBy": "user123"
    }
  ],
  "visibility": "shared",
  "sharedWith": ["user456", "user789"],
  "activeUsers": [
    {
      "uid": "user123",
      "name": "John Attorney",
      "lastActive": "2025-11-12T16:45:30Z"
    }
  ],
  "status": "draft",
  "metadata": {
    "lastEditedBy": "user456",
    "wordCount": 850,
    "version": 3,
    "notes": "Client review complete"
  },
  "createdAt": "2025-11-12T10:00:00Z",
  "updatedAt": "2025-11-12T16:45:30Z"
}
```

---

## Data Relationships

### User → Firm (Many-to-One)

- Users have a `firmId` field pointing to their firm
- A firm can have multiple users
- Users can only belong to ONE firm (MVP constraint)

### Firm → Templates (One-to-Many)

- Firm has multiple custom templates at `/templates/{firmId}/{templateId}`
- Firm also has access to global templates at `/templates/global/{templateId}`

### Firm → Documents (One-to-Many)

- Firm has multiple documents
- All documents in firm are stored in `/documents/{documentId}` (not nested)
- Documents have firmId field for querying

### Document → Template (Many-to-One)

- Document references template via `templateId`
- Document can be created without template (optional)

### Document → SourceDocuments (One-to-Many)

- Document can have multiple source documents
- Source files stored in Firebase Storage: `/sources/{firmId}/{documentId}/{fileName}`

---

## Query Patterns

### Common Queries

**Get user profile:**
```javascript
db.collection('users').doc(uid).get()
```

**Get firm details:**
```javascript
db.collection('firms').doc(firmId).get()
```

**Get all firm members:**
```javascript
db.collection('users').where('firmId', '==', firmId).get()
```

**Get all global templates:**
```javascript
db.collection('templates').doc('global').collection('templates').get()
```

**Get firm templates:**
```javascript
db.collection('templates').doc(firmId).collection('templates').get()
```

**Get user's documents:**
```javascript
db.collection('documents').where('ownerId', '==', uid).get()
```

**Get firm-wide documents:**
```javascript
db.collection('documents')
  .where('firmId', '==', firmId)
  .where('visibility', '==', 'firm-wide')
  .get()
```

**Get documents shared with user:**
```javascript
db.collection('documents')
  .where('sharedWith', 'array-contains', uid)
  .get()
```

---

## Constraints & Validation

### Field Constraints

| Field | Constraint |
|-------|-----------|
| `email` | Valid email format, unique at auth level |
| `firmCode` | Format: `STENO-XXXXX`, unique at db level |
| `role` | Must be: `"admin"` \| `"lawyer"` \| `"paralegal"` |
| `visibility` | Must be: `"private"` \| `"shared"` \| `"firm-wide"` |
| `status` | Must be: `"draft"` \| `"final"` \| `"approved"` |
| `fileType` | Must be: `"pdf"` \| `"docx"` |

### Cross-Collection Constraints

- User's `firmId` must reference valid firm in `/firms/{firmId}`
- Document's `firmId` must match owner's `firmId`
- Template's `firmId` must reference valid firm
- Document's `sharedWith` UIDs must have same `firmId` as document

---

## Future Enhancements

1. **Versioning:** Add document version history collection
2. **Audit Log:** Track all changes to documents for compliance
3. **Comments:** Add comments collection for collaborative feedback
4. **Activity Feed:** Log all user actions (view, edit, share)
5. **Templates Library:** More sophisticated template management
6. **Multi-Firm Support:** Allow users to belong to multiple firms

---

## Deployment Checklist

- [ ] Security rules deployed to Firestore
- [ ] Storage rules deployed to Firebase Storage
- [ ] Indexes created (if needed)
- [ ] Test with Firebase Emulator UI
- [ ] Verify role-based access works
- [ ] Test all CRUD operations
- [ ] Test document sharing scenarios
- [ ] Load test for performance

---

## References

- **Project Brief:** `/memory-bank/projectbrief.md`
- **Active Context:** `/memory-bank/activeContext.md`
- **Firestore Rules:** `/firestore.rules`
- **Storage Rules:** `/storage.rules`
- **TaskList:** `/AI-Docs/TaskList.md`

