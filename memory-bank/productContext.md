# Product Context: LawMint

**Last Updated:** November 11, 2025

---

## Why This Project Exists

### Problem Statement

**Lawyers spend considerable time** reviewing source documents to manually draft demand letters—an essential but repetitive step in litigation. This manual process:
- Is time-consuming (can take hours per letter)
- Delays the litigation process
- Requires careful attention to detail
- Lacks consistency across different attorneys
- Prevents attorneys from focusing on higher-value legal strategy

### The Opportunity

By leveraging **AI to automate demand letter generation**, law firms can:
- Reduce drafting time by **50%+**
- Increase consistency across firm output
- Free attorneys to focus on strategy and client relationships
- Improve client satisfaction through faster turnaround
- Maintain professional quality while accelerating workflows

---

## What Problems It Solves

### For Attorneys
1. **Time Efficiency** - Automate the initial draft instead of starting from scratch
2. **Consistency** - Use firm-approved templates for standardized output
3. **Collaboration** - Work with paralegals in real-time on same document
4. **Refinement** - Use AI to adjust tone, add details, or restructure on demand

### For Paralegals
1. **Empowerment** - Contribute to document drafting without bottlenecking attorney time
2. **Quality Control** - Review and edit shared documents with proper permissions
3. **Efficiency** - Access firm-wide templates and documents instantly

### For Law Firms
1. **Scalability** - Handle more cases without proportionally increasing staff
2. **Quality** - Maintain firm standards through template system
3. **Security** - Keep documents within firm boundaries with proper access control
4. **Modern Tech** - Demonstrate innovation to clients and recruits

---

## How It Should Work

### Core User Flows

#### 1. Onboarding Flow
```
User visits landing page
  → Clicks "Get Started"
  → Signs up with email/password
  → Chooses: "Create New Firm" OR "Join Existing Firm"
  
If Create New Firm:
  → Enters firm name
  → System generates unique firm code (STENO-12345)
  → User becomes Admin
  → Dashboard with empty state

If Join Existing Firm:
  → Searches for firm by name
  → Enters firm code to verify
  → Selects role: Lawyer or Paralegal
  → Request processed
  → Dashboard with shared documents visible
```

#### 2. Template Management Flow
```
Admin/Lawyer navigates to Templates
  → Sees "Global Templates" and "My Firm Templates" tabs
  → Clicks "Upload Template"
  → Uploads PDF or DOCX file
  → System extracts text automatically
  → Template saved and available to firm
  → Can preview, download, or delete templates
```

#### 3. Document Generation Flow
```
User clicks "New Document"
  → Step 1: Select template (from global or firm templates)
  → Step 2: Upload source documents (medical records, contracts, etc.)
  → Step 3: (Optional) Add custom instructions
  → Clicks "Generate"
  → System:
      a) Uploads and extracts text from sources
      b) Sends template + sources + instructions to AI
      c) Generates draft demand letter
      d) Creates document in Firestore
  → User redirected to collaborative editor
```

#### 4. Collaborative Editing Flow
```
User opens document in editor
  → Sees rich text editor with formatting toolbar
  → Sees other active users (avatars in header)
  → Edits text - changes sync in real-time to all users
  → Can see others' cursors and selections
  → Auto-saves every few seconds
  
AI Refinement (optional):
  → Opens AI sidebar
  → Enters instructions ("Make more formal", "Add liability language")
  → Clicks "Refine"
  → AI updates content with suggested changes
  → User can accept or reject changes
```

#### 5. Document Sharing Flow
```
Document owner clicks "Share" button
  → Modal opens with options:
      • Private (only owner)
      • Shared with specific users (multi-select from firm members)
      • Firm-wide (all firm members)
  → Saves sharing settings
  → Recipients can now access document based on permissions
```

#### 6. Export Flow
```
User clicks gold "Export to Word" button
  → Confirms export
  → System generates professional DOCX:
      • Times New Roman font
      • 1.5 line spacing
      • 1" margins
      • Preserved formatting (bold, italic, lists)
  → Download link provided
  → File auto-downloads to user's computer
```

---

## User Experience Goals

### Design Principles

1. **Professional & Trustworthy**
   - Steno-inspired aesthetic
   - Legal industry standards
   - No frivolous elements

2. **Efficient & Fast**
   - Minimal clicks to complete tasks
   - Fast page loads (< 5 seconds)
   - Instant feedback on actions

3. **Clear & Guided**
   - Step-by-step workflows for complex tasks
   - Helpful empty states
   - Descriptive error messages

4. **Collaborative & Social**
   - See who's online
   - Real-time updates
   - Clear ownership and permissions

### UI/UX Specifications

**Color Palette:**
- Primary: Deep Royal Blue (#1E2A78) - Headers, navbars, primary actions
- Secondary: Creamy Beige (#F4F1E9) - Body background, contrast areas
- Accent: Warm Gold (#C59E47) - CTAs, buttons, highlights
- Text: Charcoal (#2A2A2A) - Main copy

**Typography:**
- Headings: Playfair Display (serif, elegant, 40-56px)
- Body: Inter or Source Sans Pro (sans-serif, readable, 16-18px)
- All-caps small labels in gold for emphasis

**Components:**
- Rounded corners (border-radius: 1rem)
- Soft shadows (box-shadow: 0 4px 20px rgba(0,0,0,0.08))
- Gold CTAs with hover effects
- Minimalist with plenty of whitespace

**Layout Examples:**
- Landing: Gradient hero (#1E2A78 to #2A2F65) + features grid + CTA
- Dashboard: Two-tone layout (blue sidebar, cream main area)
- Editor: White canvas on cream background, blue top bar
- Forms: Centered cards on cream background

---

## User Personas

### Persona 1: Sarah Chen - Senior Attorney
**Role:** Lawyer  
**Firm Size:** 15 attorneys  
**Pain Points:**
- Drafts 3-5 demand letters per week
- Each takes 2-3 hours to write
- Needs consistency across firm's output
- Wants to delegate initial drafts to paralegals

**Goals with LawMint:**
- Generate initial draft in < 10 minutes
- Review and refine instead of writing from scratch
- Collaborate with paralegal on same document
- Maintain firm's professional standards

**Usage Pattern:**
- Uploads sources → Reviews AI draft → Refines with custom instructions → Shares with paralegal for final review → Exports to Word

---

### Persona 2: Marcus Rodriguez - Admin/Managing Partner
**Role:** Admin  
**Firm Size:** 8 attorneys, 3 paralegals  
**Pain Points:**
- Needs to ensure firm uses consistent templates
- Wants to monitor firm's document output
- Requires proper access control for sensitive documents

**Goals with LawMint:**
- Upload and manage firm-wide templates
- See who can access what documents
- Generate firm code for new hires
- Ensure security and compliance

**Usage Pattern:**
- Creates firm → Uploads templates → Invites team with firm code → Manages permissions → Reviews firm-wide documents

---

### Persona 3: Emily Watson - Paralegal
**Role:** Paralegal  
**Firm Size:** 12 attorneys, 4 paralegals  
**Pain Points:**
- Can't create drafts herself (not attorney)
- Spends time on formatting and cleanup
- Waits for attorney edits before finalizing

**Goals with LawMint:**
- Access documents shared by attorneys
- Make edits and suggestions in real-time
- Export final versions for filing
- Work efficiently without bottlenecking attorneys

**Usage Pattern:**
- Receives shared document → Reviews and edits → Adds supporting details → Attorney reviews in real-time → Paralegal exports to Word

---

## Success Criteria

### User Satisfaction
- Users can generate a quality draft in < 10 minutes
- AI-generated drafts require < 30% editing
- Users report time savings of 50%+
- Collaborative editing feels seamless (no lag)

### Technical Performance
- Page load time < 5 seconds
- Real-time sync latency < 500ms
- AI generation time < 30 seconds for typical document
- Export generation < 10 seconds

### Adoption Goals (if deployed to real firms)
- 80% user adoption within first year
- 5+ demand letters generated per firm per week
- Positive user feedback on ease of use

---

## What's Different About Our Approach

### Compared to Generic AI Writing Tools
❌ Generic tools: No legal templates, no firm context, no collaboration  
✅ LawMint: Legal-specific templates, firm isolation, real-time collaboration

### Compared to Manual Document Assembly
❌ Manual: Start from scratch, time-consuming, inconsistent  
✅ LawMint: AI-powered drafts, consistent templates, AI refinement

### Compared to Traditional Legal Tech
❌ Traditional: Expensive, complex, no AI, poor UX  
✅ LawMint: Affordable (Firebase), modern AI, beautiful Steno-inspired UI

---

## Future Vision (Post-MVP)

1. **Version History** - Track all changes with rollback capability
2. **Email Integration** - Send demand letters directly from platform
3. **E-Signature** - Collect signatures without leaving the app
4. **Analytics** - Track document performance, time savings, usage patterns
5. **Mobile App** - Review and edit documents on mobile
6. **Advanced AI** - Multi-model comparison, custom fine-tuned models
7. **Integrations** - Connect to Clio, MyCase, PracticePanther

---

## References

- **Project Brief:** `/memory-bank/projectbrief.md`
- **System Patterns:** `/memory-bank/systemPatterns.md`
- **PRD:** `/AI-Docs/PRD.md`

