# AI Service Microservice

**Service Name:** ai-service  
**Purpose:** OpenAI integration for AI-powered document generation and refinement  
**Technology:** Express.js + TypeScript + OpenAI API  

---

## Overview

The AI Service is a stateless microservice that leverages OpenAI's GPT models to:
1. **Generate** professional demand letters from templates and source documents
2. **Refine** existing documents based on custom instructions

The service uses industry-standard legal writing guidelines and maintains professional legal tone throughout all operations.

---

## API Endpoints

### 1. Health Check
```http
GET /health
```

**Response (200):**
```json
{
  "success": true,
  "message": "AI service is running",
  "model": "gpt-4o-mini",
  "hasApiKey": true
}
```

---

### 2. Generate Document
```http
POST /ai/generate
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "templateId": "template_001",
  "sourceTexts": [
    "This is the extracted text from complaint.pdf...",
    "This is the extracted text from evidence.docx..."
  ],
  "customInstructions": "Make the tone more formal and emphasize the breach of contract."
}
```

**Parameters:**
- `templateId` (optional) - UUID of template to fetch from Firestore. If not provided, `templateContent` must be provided.
- `templateContent` (optional) - Raw template text. Used if `templateId` is not provided.
- `sourceTexts` (required) - Array of extracted text from source documents (minimum 1)
- `customInstructions` (optional) - Additional instructions for AI generation

**Response (200):**
```json
{
  "success": true,
  "content": "[FIRM LETTERHEAD]\n\n[DATE]\n\n[RECIPIENT ADDRESS]\n\nRE: Demand for Payment - Breach of Contract\n\n[FULL LETTER CONTENT]",
  "model": "gpt-4o-mini"
}
```

**Key Features:**
- Automatic template fetching from Firestore if templateId provided
- Professional legal tone maintained throughout
- Incorporates custom instructions if provided
- Complete letter ready for attorney review
- Maximum output: 4000 tokens (~3000 words)

**Error Responses:**
- `400` - Missing source texts or template
- `401` - Invalid/expired token
- `500` - OpenAI API error or server error

**Error Examples:**
```json
{
  "success": false,
  "error": "At least one source text is required for generation"
}
```

```json
{
  "success": false,
  "error": "OpenAI API rate limit exceeded. Please try again in a moment."
}
```

---

### 3. Refine Document
```http
POST /ai/refine
Authorization: Bearer {firebaseIdToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "[CURRENT DOCUMENT TEXT]...",
  "refinementInstructions": "Make this section more persuasive and add specific damages calculations. Also fix any typos."
}
```

**Parameters:**
- `content` (required) - Current document text to refine
- `refinementInstructions` (required) - Specific instructions for refinement

**Response (200):**
```json
{
  "success": true,
  "content": "[REFINED DOCUMENT TEXT WITH IMPROVEMENTS]...",
  "model": "gpt-4o-mini"
}
```

**Key Features:**
- Targeted refinements based on instructions
- Maintains document structure and flow
- Professional legal tone preserved
- Ready for attorney review
- Tracks refinement requests for analytics

**Example Refinement Instructions:**
- "Make the language more formal"
- "Add more specific details about the contract terms"
- "Emphasize the company's liability"
- "Make the demand for damages more prominent"
- "Simplify the legal jargon for clarity"

**Error Responses:**
- `400` - Missing content or refinement instructions
- `401` - Invalid/expired token
- `500` - OpenAI API error or server error

---

## Configuration

### Environment Variables

**Required:**
```env
OPENAI_API_KEY=sk-...
```
Get your API key from: https://platform.openai.com/account/api-keys

**Optional:**
```env
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGINS=http://localhost:5173,https://lawmint.web.app
```

### Model Selection

**Default:** `gpt-4o-mini` (recommended for cost-efficiency)

**Alternative Models:**
- `gpt-4o` - More capable, higher quality (2x cost)
- `gpt-4-turbo` - Highest quality (3x cost)

To change model, update `OPENAI_MODEL` environment variable in Firebase Functions config:
```bash
firebase functions:config:set openai.model="gpt-4o"
```

---

## Integration with Other Services

### Calls From
- **Frontend** - Directly for document generation/refinement
- **Document Service** - Could call for AI-assisted document creation

### Calls To
- **OpenAI API** - For chat completions
- **Firebase Admin SDK** - For template fetching from Firestore

### Data Flow
```
Frontend
  ↓
AI Service
  ├→ OpenAI API (generate/refine)
  ├→ Firestore (fetch template if needed)
  ↓
Response with generated/refined content
```

---

## System Prompts

### Generation System Prompt
```
You are an expert legal assistant specializing in demand letters and legal documentation.

Key Guidelines:
1. Maintain professional, formal legal tone
2. Structure logically (letterhead, date, recipient, body, signature)
3. Fill in specific details from source documents
4. Follow template structure
5. Use accurate legal terminology
6. Ensure letter is complete and ready for review
7. Keep content clear, concise, and persuasive
8. Comply with legal letter formatting conventions
```

### Refinement System Prompt
```
You are an expert legal assistant specializing in refining legal documents.

Key Guidelines:
1. Make targeted improvements based on user instructions
2. Maintain consistent professional legal tone
3. Preserve overall structure and key arguments
4. Enhance clarity and persuasiveness
5. Ensure additions comply with legal writing standards
6. Flag sections needing attorney review if needed
7. Preserve formatting and structure
```

---

## Prompt Engineering

### Generation Prompt Template
```
Generate a professional demand letter based on the following information:

TEMPLATE TO FOLLOW:
{template_content}

SOURCE DOCUMENTS:
[Source Document 1]
{source_text_1}

[Source Document 2]
{source_text_2}

SPECIAL INSTRUCTIONS:
{custom_instructions}

Please generate a complete, professional demand letter that incorporates the template structure and information from the source documents.
```

### Refinement Prompt Template
```
Please refine the following legal document based on these instructions:

REFINEMENT INSTRUCTIONS:
{refinement_instructions}

CURRENT DOCUMENT:
{current_content}

Please provide the refined version incorporating the requested changes while maintaining professional legal standards.
```

---

## Usage Examples

### Example 1: Generate Document from Template + Sources

**Request:**
```bash
curl -X POST http://localhost:5001/lawmint/us-central1/aiService/ai/generate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template_001",
    "sourceTexts": [
      "Contract between Acme Corp and Smith LLC dated 2024...",
      "Email from Acme threatening breach..."
    ],
    "customInstructions": "Emphasize the contract violation and calculate damages"
  }'
```

**Response:**
```json
{
  "success": true,
  "content": "[Complete demand letter]",
  "model": "gpt-4o-mini"
}
```

### Example 2: Refine Generated Draft

**Request:**
```bash
curl -X POST http://localhost:5001/lawmint/us-central1/aiService/ai/refine \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "[Current letter text]",
    "refinementInstructions": "Make the damages section more specific and add interest calculations"
  }'
```

**Response:**
```json
{
  "success": true,
  "content": "[Refined letter with damages calculations]",
  "model": "gpt-4o-mini"
}
```

---

## Token Limits & Costs

### Token Usage

**Generation:**
- Input: ~500-2000 tokens (depending on template + sources)
- Output: Up to 4000 tokens (~3000 words)
- Total: ~2500-6000 tokens per generation

**Refinement:**
- Input: ~500-2000 tokens (existing content + instructions)
- Output: ~500-2000 tokens (refined content)
- Total: ~1000-4000 tokens per refinement

### Cost Estimation (gpt-4o-mini)

- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

**Monthly Budget Planning:**
- 100 generations: ~$0.50-1.00
- 1000 generations: ~$5.00-10.00
- 5000 generations: ~$25-50

---

## Error Handling

### Rate Limiting
OpenAI API has rate limits. The service returns:
```json
{
  "success": false,
  "error": "OpenAI API rate limit exceeded. Please try again in a moment."
}
```

**Mitigation:** Implement frontend retry logic with exponential backoff.

### Token Limits
If content exceeds token limits:
```json
{
  "success": false,
  "error": "Request exceeded token limits. Please reduce content size."
}
```

**Mitigation:** Break large documents into sections for refinement.

### API Key Issues
```json
{
  "success": false,
  "error": "OpenAI API authentication failed. Check API key configuration."
}
```

**Solution:** Verify OPENAI_API_KEY is set correctly in Firebase Functions config.

---

## Logging & Analytics

All requests are logged with timestamp, user ID, action, and success status:

```json
{
  "timestamp": "2025-11-12T10:05:00Z",
  "service": "ai-service",
  "action": "generate",
  "userId": "user123",
  "model": "gpt-4o-mini",
  "templateId": "template_001",
  "sourceCount": 2,
  "success": true
}
```

---

## Security Considerations

1. **API Key Protection**
   - Never commit OPENAI_API_KEY to git
   - Use Firebase Functions config for secrets
   - Rotate key regularly

2. **Rate Limiting**
   - Frontend should limit requests per user
   - Backend logs all requests for monitoring
   - Consider implementing queue for high volume

3. **Content Privacy**
   - OpenAI API stores content temporarily
   - See OpenAI's privacy policy for details
   - For sensitive documents, consider alternative APIs

---

## Future Enhancements

1. **Multi-Model Support**
   - Support Claude, PaLM, other providers
   - Allow user/firm to select preferred model

2. **Streaming Responses**
   - Stream content as it's generated
   - Better UX for long documents

3. **Custom Fine-Tuning**
   - Fine-tune model on firm's templates
   - Improved results specific to firm's style

4. **Caching**
   - Cache common generations
   - Reduce API calls and costs

5. **Analytics Dashboard**
   - Track generation success rates
   - Monitor costs and usage patterns
   - Identify common refinement patterns

---

## Deployment

```bash
# Build TypeScript
npm run build

# Test locally with emulator
npm run serve

# Deploy to Firebase
firebase deploy --only functions:aiService

# Deploy with custom model
firebase functions:config:set openai.model="gpt-4o"
firebase deploy --only functions:aiService
```

---

## Monitoring

### Firebase Functions Dashboard
- View execution time
- Monitor error rates
- Check invocation metrics

### OpenAI Usage
Monitor usage and costs at: https://platform.openai.com/account/usage/overview

### Logs
View service logs:
```bash
firebase functions:log --only aiService
```

---

## Support

For issues or questions:
1. Check `/memory-bank/activeContext.md` for current status
2. Review error messages and suggestions above
3. Verify OPENAI_API_KEY configuration
4. Check Firebase Functions logs

---

## References

- **OpenAI Documentation:** https://platform.openai.com/docs/
- **LawMint Architecture:** `/memory-bank/systemPatterns.md`
- **Project Brief:** `/memory-bank/projectbrief.md`

