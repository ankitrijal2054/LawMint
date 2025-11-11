# Project Brief: LawMint

**Last Updated:** November 11, 2025  
**Status:** Ready for Development - Phase 0

---

## Project Identity

**Name:** LawMint (Demand Letter Generator)  
**Organization:** Steno  
**Type:** Portfolio Project - Full-Stack AI Web Application  
**Developer:** Solo (Ankit)

---

## Core Purpose

Build an **AI-powered demand letter generator** for law firms using a **true microservices architecture** with Firebase Cloud Functions. This tool automates the time-consuming process of drafting demand letters by leveraging AI (OpenAI GPT-4o-mini), allowing attorneys to save 50%+ time in document preparation.

---

## Target Users

### Primary Users
- **Attorneys at law firms** - Need efficient document creation, customization, streamlined workflows
- Pain points: Time-consuming document review, manual drafting, lack of consistency

### Secondary Users
- **Paralegals and Legal Assistants** - Need easy-to-use tools for document preparation
- Pain points: Limited time to assist attorneys, accuracy requirements

---

## Core Requirements (P0 - Must Have)

1. ✅ **User Authentication & Firm Management**
   - Email/password signup and login
   - Multi-tenant architecture: firms with unique codes (STENO-XXXXX)
   - Role-based access control: Admin, Lawyer, Paralegal

2. ✅ **Template System**
   - Upload PDF/DOCX templates with text extraction
   - Global templates (pre-seeded) + firm-specific templates
   - Template management UI

3. ✅ **AI Document Generation**
   - Upload source documents (PDF/DOCX)
   - Select template + provide custom instructions
   - Generate demand letter draft using OpenAI API

4. ✅ **AI Refinement**
   - Refine existing documents with custom instructions
   - Real-time updates in editor

5. ✅ **Collaborative Editing**
   - Real-time collaborative editor (TipTap + Y.js)
   - Multiple users editing simultaneously
   - Presence awareness (active users, cursors)

6. ✅ **Document Sharing & Permissions**
   - Private, shared with specific users, or firm-wide visibility
   - Role-based editing permissions

7. ✅ **DOCX Export**
   - Professional formatting (Times New Roman, 1.5 spacing, 1" margins)
   - Auto-download capability

8. ✅ **Steno-Inspired UI/UX**
   - Professional legal aesthetic
   - Colors: Deep Royal Blue (#1E2A78), Creamy Beige (#F4F1E9), Warm Gold (#C59E47)
   - Typography: Playfair Display (headings) + Inter (body)

---

## Technical Architecture

### Microservices Pattern
5 independent Firebase Cloud Functions:

1. **auth-service** - Authentication, firm creation/joining, user management
2. **template-service** - Template upload, extraction, CRUD operations
3. **document-service** - Document lifecycle, sharing, permissions
4. **ai-service** - OpenAI integration for generation and refinement
5. **export-service** - DOCX export with professional formatting

### Technology Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Firebase Cloud Functions (Node.js + Express)
- **Database:** Firestore (primary) + Firebase Realtime Database (Y.js sync)
- **Storage:** Firebase Storage
- **Auth:** Firebase Authentication (Email/Password)
- **AI:** OpenAI API (GPT-4o-mini, configurable)
- **Editor:** TipTap + Y.js + y-firebase

---

## Success Metrics

**For Portfolio:**
- ✅ Demonstrates microservices architecture
- ✅ Shows full-stack capabilities (React, Node.js, Firebase)
- ✅ AI integration (OpenAI API)
- ✅ Real-time collaboration (WebSocket-like with Y.js)
- ✅ Professional UI/UX implementation
- ✅ Role-based security patterns

**Functional Goals:**
- Generate quality demand letter drafts from templates + sources
- Support 3+ concurrent users editing same document
- Export to professional DOCX format
- All core flows tested and deployed to production

---

## Out of Scope (MVP)

- ❌ PDF export (DOCX only)
- ❌ Mobile app
- ❌ Third-party integrations (Clio, MyCase, etc.)
- ❌ Automated testing (manual testing only)
- ❌ Version history with rollback
- ❌ Email integration
- ❌ E-signature workflow
- ❌ Anthropic/Claude API integration

---

## Timeline

**Estimated:** 4-6 weeks (microservices adds complexity over monolithic)

**Phases:**
- Phase 0: Setup & Microservices Configuration (2-3 days)
- Phase 1: Auth Service (3-4 days)
- Phase 2: Database Schema & Security (2-3 days)
- Phase 3: Template Service (3-4 days)
- Phase 4: Document + AI Services (4-5 days)
- Phase 5: Collaborative Editor (4-5 days)
- Phase 6: Sharing & Permissions (1-2 days)
- Phase 7: Dashboard (2-3 days)
- Phase 8: Export Service (2-3 days)
- Phase 9: UI Polish (3-4 days)
- Phase 10: Manual Testing (3-4 days)
- Phase 11: Deployment (2-3 days)

**Note:** No hard deadline. This is a portfolio project with flexibility.

---

## Key Constraints

1. **Solo Development** - All work done by one developer
2. **Budget** - Firebase free tier + minimal OpenAI API costs
3. **Learning Curve** - First time implementing microservices with Firebase
4. **Scope Discipline** - Must resist feature creep, stick to MVP

---

## Definition of Done (MVP Complete)

- [ ] All 5 microservices deployed and operational
- [ ] User can signup, create/join firm
- [ ] User can upload templates (with text extraction)
- [ ] User can generate demand letter from template + sources
- [ ] User can collaborate in real-time with other firm members
- [ ] User can share documents with specific permissions
- [ ] User can export document to DOCX
- [ ] Steno-inspired UI implemented and responsive
- [ ] Manual testing completed (all flows validated)
- [ ] Deployed to Firebase production
- [ ] Documentation complete (README, ARCHITECTURE)

---

## References

- **PRD:** `/AI-Docs/PRD.md`
- **TaskList:** `/AI-Docs/TaskList.md`
- **Architecture:** `/AI-Docs/architecture.md`

---

## Contact & Resources

- **Developer:** Ankit Rijal
- **Workspace:** `/Users/ankitrijal/Desktop/GauntletAI/LawMint`
- **Firebase Project:** (To be created in Phase 0)
- **OpenAI API:** (Key to be configured in Phase 0)

