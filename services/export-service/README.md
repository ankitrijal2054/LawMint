# Export Service

**Microservice:** DOCX Document Export & Professional Formatting

## Overview

The Export Service handles converting document content to professional DOCX format with standardized legal document styling. It generates high-quality Word documents with proper formatting, margins, fonts, and line spacing suitable for legal demand letters.

## Features

✅ **DOCX Generation** - Convert document content to professional Word format
✅ **Professional Styling** - Times New Roman, 1.5 line spacing, 1" margins
✅ **Storage Integration** - Store exported files in Firebase Storage
✅ **Signed URLs** - Generate 1-hour expiration signed download URLs
✅ **Access Control** - Verify user permissions before export
✅ **Error Handling** - Comprehensive error handling and validation

## Architecture

```
┌─────────────────────────────────────────────┐
│           Frontend (React)                   │
│      Calls POST /export/docx                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│        Export Service (Cloud Function)      │
│  ┌─────────────────────────────────────┐    │
│  │  POST /export/docx Endpoint         │    │
│  │  - Verify Firebase ID Token         │    │
│  │  - Validate request data            │    │
│  │  - Check access permissions         │    │
│  │  - Convert content to DOCX          │    │
│  │  - Upload to Firebase Storage       │    │
│  │  - Generate signed download URL     │    │
│  │  - Return download link             │    │
│  └─────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
    ┌──────────┐      ┌──────────────────┐
    │Firestore │      │ Firebase Storage │
    │(metadata)│      │ (DOCX files)     │
    └──────────┘      └──────────────────┘
```

## API Endpoints

### POST /export/docx

Convert document content to DOCX format and return binary file.

**Authentication:** Required (Firebase ID Token)

**Request:**
```json
{
  "documentId": "doc_123abc",
  "content": "Document text content (HTML or plain text)",
  "title": "demand_letter"  // Optional, used for filename
}
```

**Response (Success - 200):**
Binary DOCX file with headers:
- `Content-Type`: application/vnd.openxmlformats-officedocument.wordprocessingml.document
- `Content-Disposition`: attachment; filename="demand_letter_1699564800000.docx"
- `Content-Length`: (file size in bytes)

**Response (Error - 400):**
```json
{
  "success": false,
  "error": "Missing required fields: documentId and content"
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or expired token"
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "error": "You do not have access to this document"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "error": "Document not found"
}
```

## DOCX Formatting

### Professional Styling Applied:

| Property | Value |
|----------|-------|
| Font | Times New Roman, 11pt |
| Line Spacing | 1.5 (360 twips) |
| Paragraph Spacing | 200 twips after each paragraph |
| Margins | 1 inch (all sides) |
| Alignment | Left-aligned |
| Color | Black (#000000) |

### Content Processing:

1. **Paragraph Parsing** - Split content by double newlines or `<p>` tags
2. **HTML Sanitization** - Remove HTML tags and decode entities
3. **Text Cleaning** - Trim whitespace and remove empty paragraphs
4. **Formatting** - Apply consistent styling to all paragraphs

## Usage Example

### From Frontend

```typescript
import { useDocumentExport } from '@/hooks/useDocumentExport';

function ExportButton() {
  const { exportDocument, isLoading, error } = useDocumentExport();

  const handleExport = async () => {
    try {
      const result = await exportDocument({
        documentId: 'doc_123',
        content: 'My document content...',
        title: 'My Demand Letter'
      });
      
      // Trigger download
      window.location.href = result.downloadUrl;
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <button onClick={handleExport} disabled={isLoading}>
      {isLoading ? 'Exporting...' : 'Export to Word'}
    </button>
  );
}
```

### cURL Example

```bash
curl -X POST http://localhost:5001/project-id/region/exportService/export/docx \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "doc_123",
    "content": "Demand letter content here",
    "title": "demand_letter"
  }'
```

## Security

### Access Control

- ✅ Firebase ID Token verification required on all endpoints
- ✅ User must own document or have read access (via sharing)
- ✅ Firm-wide documents accessible to all firm members
- ✅ Private documents restricted to owner

### Response Security

- ✅ Firebase token required on all requests
- ✅ User permissions verified before generating file
- ✅ Content-Type validated and set to DOCX MIME type
- ✅ Files streamed directly to user (no storage overhead)

## Dependencies

```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.0",
  "firebase-admin": "^12.0.0",
  "firebase-functions": "^4.5.0",
  "docx": "^8.5.0"
}
```

### Key Package: `docx`

The `docx` library provides programmatic DOCX file generation:
- `Document` - Create DOCX documents
- `Packer` - Convert document to binary buffer
- `Paragraph` - Create paragraphs with styling
- `TextRun` - Format text runs
- `AlignmentType` - Text alignment options
- `convertInchesToTwip` - Convert inches to twips (Word's measurement unit)

## Environment Variables

Optional environment variables:

```bash
ALLOWED_ORIGINS=http://localhost:5173,https://lawmint.web.app
```

If not set, defaults to:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://lawmint.web.app`

## Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Export service is running"
}
```

## Error Handling

| Error | HTTP Status | Description |
|-------|------------|-------------|
| Missing Authorization | 401 | No Bearer token provided |
| Invalid Token | 401 | Token expired or invalid |
| Missing Fields | 400 | documentId or content not provided |
| Document Not Found | 404 | documentId doesn't exist in Firestore |
| Access Denied | 403 | User doesn't have permission to access document |
| Generation Failed | 500 | DOCX generation or storage upload failed |

## Performance

- **Average Export Time:** 300-800ms (Firestore lookup + DOCX generation, streamed directly)
- **File Size:** 20-100KB depending on content length
- **Storage Usage:** None (files streamed directly, no storage overhead)
- **Concurrent Exports:** Supports unlimited concurrent requests

## Monitoring & Logs

### Log Format

```
[timestamp] Document exported: doc_123 by user: user_456
```

### Firebase Console

Monitor in Firebase Console:
- **Functions Invocations** - Track export requests
- **Storage Usage** - Monitor exported file sizes
- **Logs** - See detailed error and success messages

## Deployment

### Build

```bash
npm run build
```

### Deploy to Firebase

```bash
firebase deploy --only functions:exportService
```

### Deploy All Services

```bash
firebase deploy --only functions
```

## Testing

### Local Testing with Emulator

```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Test the endpoint
curl -X POST http://localhost:5001/PROJECT_ID/REGION/exportService/export/docx \
  -H "Authorization: Bearer $(firebase auth:token)" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"test","content":"test content","title":"test"}'
```

### Manual Testing Steps

1. Create a test document in Firestore
2. Call POST /export/docx with valid token
3. Verify DOCX file generated in Storage
4. Verify signed URL works and file downloads
5. Check DOCX formatting (font, spacing, margins)
6. Test permission checks (different users, visibility levels)

## Troubleshooting

### "Unauthorized: Invalid or expired token"

- Verify Firebase ID token is valid and not expired
- Check Authorization header format: `Bearer <token>`
- Ensure token is for correct Firebase project

### "Document not found"

- Verify documentId exists in Firestore
- Check Firestore security rules allow reading document metadata

### "You do not have access to this document"

- Verify document visibility settings
- Check if user owns document or has read access
- For firm-wide documents, verify user is firm member

### DOCX file doesn't download

- Check browser downloads folder
- Verify signed URL hasn't expired (1 hour limit)
- Check browser console for CORS errors

## Future Enhancements

- [ ] Support for custom fonts (Calibri, Arial)
- [ ] Advanced formatting (bold, italic, underline, tables)
- [ ] Headers and footers with page numbers
- [ ] Custom document templates
- [ ] Batch export (multiple documents)
- [ ] Export to PDF format
- [ ] Export to Google Docs

## Related Services

- **document-service** - Document storage and retrieval
- **ai-service** - Content generation
- **template-service** - Template management

## Support

For issues or questions, refer to:
- Main README: `/README.md`
- Architecture Docs: `/AI-Docs/architecture.md`
- Firebase Console: https://console.firebase.google.com

