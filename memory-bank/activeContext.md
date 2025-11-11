# Active Context: LawMint

**Last Updated:** November 11, 2025 (Updated Post Phase 1)
**Current Phase:** Phase 1 - Authentication Service  
**Status:** ✅ COMPLETE - Backend Built, UI Complete, Ready for Testing

---

## Current Focus

### Phase 1 Complete! ✅

**Just Completed:**

**Backend (auth-service):**
- ✅ Express.js microservice with 7 endpoints
  - `POST /auth/signup` - Record user signup
  - `POST /auth/login` - Validate login & return user data
  - `POST /auth/createFirm` - Create firm with unique code (STENO-XXXXX format)
  - `POST /auth/joinFirm` - Join firm with code validation
  - `GET /auth/user/:uid` - Get user profile
  - `GET /auth/firm/:firmId` - Get firm details
  - `GET /auth/firm/:firmId/members` - Get firm members
- ✅ Firebase Admin SDK integration (Firestore read/write)
- ✅ Token verification middleware for protected endpoints
- ✅ Firm code generation and uniqueness validation
- ✅ Role-based user creation (admin for creators, lawyer/paralegal for joiners)

**Frontend:**
- ✅ Firebase configuration with emulator support (firebase.ts)
- ✅ API client service (api.ts) for all microservice calls
- ✅ AuthContext + useAuth hook for centralized state management
- ✅ Landing page with hero, features, benefits, CTA
- ✅ Login page with email/password form
- ✅ Multi-step signup page (credentials → firm choice)
- ✅ CreateFirmForm component with success confirmation
- ✅ JoinFirmForm component with role selection
- ✅ ProtectedRoute component for auth guarding
- ✅ Navbar component with firm info & user menu
- ✅ Dashboard placeholder page
- ✅ Routing setup with React Router v6
- ✅ Tailwind CSS global styles & custom components
- ✅ Path alias (@/) configuration for clean imports

**Shared Library:**
- ✅ TypeScript types (User, Firm, AuthUser, Document, etc.)
- ✅ Constants (roles, permissions, validation rules, error codes)
- ✅ Utility functions (validation, firm code gen, timestamp formatting)

### Next: Phase 1 Testing & Firebase Setup

**STATUS:** Backend built ✅ | Emulators configured ✅ | Frontend running ✅

**CURRENT ISSUE:** CORS errors when calling auth-service (frontend at 5173 → backend at 5001)

**ROOT CAUSE:** Firebase emulators need to reload the built auth-service function

**IMMEDIATE ACTION NEEDED:**

1. **Restart Firebase Emulators**
   - Press Ctrl+C in Terminal 1 (where `firebase emulators:start` is running)
   - Run: `firebase emulators:start`
   - Wait for: "✓ Loaded 1 function(s): authService"

2. **Hard Refresh Browser**
   - Visit http://localhost:5173/
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Test Signup**
   - Click "Get Started" → "Sign Up"
   - Fill form and submit
   - Should see success (no CORS error)

4. **If Still Getting Error**
   - See: `/FIX_CORS_ISSUES.md` for detailed troubleshooting

**Test Phase 1 Flows**
   - Visit http://localhost:5173
   - Signup → Create Firm → Confirm firm code
   - Signup → Join Firm → Enter firm code & role
   - Login with created account
   - Logout
   - Check Firestore Emulator UI: http://127.0.0.1:4000/firestore

---

## Recent Changes

**November 11, 2025 - Phase 1 Environment Configuration Complete:**
- ✅ **CRITICAL FIX #1:** Created missing `index.html` entry point for Vite
  - Issue: Frontend was returning 404 at localhost:5173 (no HTML entry point)
  - Fix: Added `frontend/index.html` with proper React mounting point (`<div id="root">`)
  - Result: Frontend dev server now properly bootstraps React app

- ✅ **CRITICAL FIX #2:** Created `frontend/.env.local` with all required env vars
  - Issue: Firebase config missing VITE_FIREBASE_* variables, API calls failing
  - Fix: Added dummy Firebase credentials for emulator + service URLs
  - Key vars: VITE_USE_EMULATOR=true, VITE_AUTH_SERVICE_URL=http://localhost:5001/...
  - Result: Frontend can now find auth-service and make API calls

- ⏳ **CURRENT ISSUE:** CORS error blocking signup
  - Issue: API calls getting CORS error + "Failed to fetch"
  - Cause: auth-service Cloud Function not built yet
  - Solution: Build auth-service: `cd services/auth-service && npm install && npm run build`
  - Verification: Should create `lib/index.js` file
  - Test: After build, restart emulators and try signup again
  - Reference: See CORS_FIX_AND_BUILD.md for detailed guide

**Status:** Frontend ready and running, attempting signup but auth-service not deployed to emulator

**November 11, 2025 - Phase 0 Complete:**
- ✅ Git repository initialized (Git config: ankitrijal2054@gmail.com)
- ✅ Monorepo workspace configured with 7 workspaces
- ✅ All configuration files created (prettier, eslint, typescript, firebase.json)
- ✅ Frontend scaffolded (React 18 + Vite + TypeScript + Tailwind CSS)
- ✅ 5 Microservices created with proper structure
- ✅ Shared library initialized
- ✅ Firebase configuration ready (emulators, rules, indexes)
- ✅ Comprehensive documentation written (README, guides, docs)
- ✅ **IMPORTANT:** No git commits done - user to handle all commits
- ✅ **IMPORTANT:** Firebase project will be "lawmint" (portfolio, not lawmint-dev)

---

## Active Decisions & Considerations

### Architecture Decisions Made

1. **True Microservices** ✅
   - 5 independent Cloud Functions
   - Each service deployed separately
   - Frontend orchestrates multi-service calls
   - Firestore as shared data layer

2. **Firebase Over AWS/GCP** ✅
   - Faster development (integrated ecosystem)
   - Better real-time support
   - Generous free tier
   - Single CLI for all services

3. **Firestore Over PostgreSQL** ✅
   - Real-time listeners for live updates
   - Horizontal scalability
   - No ORM complexity
   - Native Firebase integration

4. **OpenAI Over Anthropic** ✅
   - More mature API
   - GPT-4o-mini is cost-effective
   - Can upgrade via environment variable
   - Well-documented

5. **TipTap + Y.js for Collaboration** ✅
   - Y.js is CRDT gold standard
   - TipTap is modern and extensible
   - y-firebase adapter available
   - Handles 3+ concurrent users

### Open Questions

**None currently.** All major decisions have been made and documented.

If questions arise during Phase 0:
- Document them here
- Update relevant memory bank files
- Note resolution and rationale

---

## Working Patterns

### Development Approach

**Sequential Phase Completion:**
- Complete all tasks in Phase N before moving to Phase N+1
- Test thoroughly at end of each phase
- Deploy services incrementally (auth → template → document → AI → export)

**Task Execution:**
1. Read task description from TaskList
2. Reference relevant sections in Memory Bank
3. Implement feature
4. Test locally with Firebase emulators
5. Commit to Git with descriptive message
6. Move to next task

**Testing Strategy:**
- Manual testing only (no automated tests for MVP)
- Use Firebase Emulator UI to inspect data
- Test with multiple browser windows for collaboration
- Document any bugs or edge cases discovered

---

## Current Blockers

**None.** Ready to start Phase 0.

### Potential Blockers to Watch For

1. **Firebase Quota Limits:**
   - Monitor usage via Firebase Console
   - Implement pagination if approaching free tier limits
   - Consider upgrading to Blaze plan if needed

2. **OpenAI API Costs:**
   - Budget $10-20/month for development
   - Use GPT-4o-mini by default
   - Monitor token usage

3. **Learning Curve:**
   - First time implementing microservices
   - First time using Y.js for collaboration
   - Firebase Realtime Database is new
   - Solution: Follow TaskList step-by-step, leverage AI assistance

---

## Development Environment Status

### Phase 0 Complete ✅

- [x] Git repository initialized (ankitrijal2054@gmail.com)
- [ ] Firebase project created (awaiting user: "lawmint")
- [x] Firebase emulators configured
- [x] Frontend scaffolded with Vite
- [x] Microservices folder structure created
- [x] All package.json files configured (dependencies not installed - user to install)
- [ ] Environment variables configured (awaiting Firebase project + OpenAI key)

### Tools Needed

**Already Installed (Assumed):**
- Node.js 18+
- npm
- Git
- VS Code (or preferred editor)

**To Install:**
- Firebase CLI: `npm install -g firebase-tools`
- Any missing VS Code extensions for TypeScript/React

---

## Next: Phase 1 Development Plan

**Goal:** Build the Authentication Service (auth-service microservice)

**Estimated Time:** 3-4 days

**Prerequisites (You Need to Do):**
1. Create Firebase project: `lawmint` (not lawmint-dev)
2. Get Firebase config from console
3. Get OpenAI API key
4. Create `frontend/.env.local` and `services/ai-service/.env`
5. Run `firebase login`

**When Ready, Phase 1 Tasks:**

### Day 1: Auth Service Backend
1. Create Express app in `services/auth-service/src/index.ts`
2. Implement endpoints:
   - POST `/auth/signup` - Create user account
   - POST `/auth/login` - Validate credentials
   - POST `/auth/createFirm` - Create new firm with unique code
   - POST `/auth/joinFirm` - Join firm with validation
   - GET `/auth/user/:uid` - Get user profile
   - GET `/auth/firm/:firmId` - Get firm details

### Day 2: Firestore Integration
1. Create Firestore collections schema (users, firms)
2. Implement user and firm creation logic
3. Generate firm codes (STENO-XXXXX format)
4. Implement auth middleware

### Day 3: Frontend Auth UI & Testing
1. Create AuthContext + useAuth hook
2. Build signup and login components
3. Create firm creation and joining flows
4. Implement protected routes
5. Test all authentication flows with emulators

**When Complete:**
- ✅ Users can signup and login
- ✅ Users can create/join firms with unique codes
- ✅ Role-based access control ready
- ✅ Ready for Phase 2

---

## Progress Tracking

### Milestones

- [ ] **Milestone 1:** Microservices structure setup + auth-service deployed (Phase 0-1)
- [ ] **Milestone 2:** Template-service operational with upload/extraction (Phase 2-3)
- [ ] **Milestone 3:** Document-service + ai-service generating quality drafts (Phase 4)
- [ ] **Milestone 4:** Collaborative editor with real-time sync operational (Phase 5)
- [ ] **Milestone 5:** Sharing and permissions enforced across services (Phase 6)
- [ ] **Milestone 6:** Dashboard + export-service producing DOCX files (Phase 7-8)
- [ ] **Milestone 7:** Steno-inspired UI polished and responsive (Phase 9)
- [ ] **Milestone 8:** All microservices tested and deployed to production (Phase 10-11)

### Current Milestone Progress

**Milestone 1: Microservices structure setup + auth-service deployed**
- Phase 0: ⬜️ 0% (Not started)
- Phase 1: ⬜️ 0% (Not started)

---

## Communication Protocol

### When to Update This File

**Update activeContext.md when:**
- ✅ Starting a new phase
- ✅ Completing a major task
- ✅ Encountering a blocker
- ✅ Making a significant architectural decision
- ✅ Discovering a new pattern or best practice
- ✅ Finishing a development session

**What to Update:**
- "Current Focus" section - what you're working on right now
- "Recent Changes" section - what you just completed
- "Active Decisions" section - any new decisions made
- "Current Blockers" section - any issues encountered
- "Progress Tracking" section - milestone percentages

### When to Update Other Memory Bank Files

- **projectbrief.md:** Only update if core requirements change (rare)
- **productContext.md:** Update if user flows or personas change (rare)
- **systemPatterns.md:** Update when discovering new architectural patterns
- **techContext.md:** Update when adding new technologies or changing setup
- **progress.md:** Update at end of each phase with what works, what's left, known issues

---

## References

- **Project Brief:** `/memory-bank/projectbrief.md`
- **Product Context:** `/memory-bank/productContext.md`
- **System Patterns:** `/memory-bank/systemPatterns.md`
- **Tech Context:** `/memory-bank/techContext.md`
- **Progress:** `/memory-bank/progress.md`
- **TaskList:** `/AI-Docs/TaskList.md`
- **Architecture:** `/AI-Docs/architecture.md`
- **PRD:** `/AI-Docs/PRD.md`

---

**Status:** ✅ Phase 0 COMPLETE  
**Next Action:** Create Firebase project "lawmint" and configure environment, then start Phase 1 (Authentication Service)

