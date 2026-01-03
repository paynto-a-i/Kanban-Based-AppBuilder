# MVP UI/UX Implementation Plan

## Overview
This plan outlines the implementation of the "Overnight" MVP UI/UX workflows for the Timbs A.I. platform.

---

## Phase 1: Onboarding & Project Initiation

### 1.1 Entry Choice Screen (3 Options)
**Status:** 🟡 Partially Complete  
**Priority:** Critical  
**Estimated Effort:** M

**Current State:** Build and Clone exist in SidebarInput

**Tasks:**
- [ ] Create unified entry component with three distinct paths
- [ ] **Option A (Build from Prompt):** 
  - Natural language prompt input
  - Template suggestions (Landing Page, Dashboard, E-commerce, etc.)
  - "Start Building" button → Creates plan
- [ ] **Option B (Clone from URL):**
  - URL input field
  - Style preferences
  - Quick clone examples (Stripe, Linear, Vercel)
  - "Clone Website" button → Creates plan based on scraped site
- [ ] **Option C (Import from GitHub):**
  - "Import from GitHub" button
  - GitHub OAuth flow (already implemented)
  - Repository selection modal with search
  - Branch selection
  - Parse existing codebase structure → Creates plan to extend/modify

**Files to Create/Modify:**
- `components/onboarding/EntryChoice.tsx` (new)
- `components/onboarding/GitHubImport.tsx` (new)
- `components/onboarding/RepoSelector.tsx` (new)
- `app/api/import-github-repo/route.ts` (new)
- `app/generation/page.tsx` (modify to integrate)

---

### 1.2 GitHub Export Functionality
**Status:** 🟡 Partially Complete  
**Priority:** High  
**Estimated Effort:** M

**Current State:** GitHub connection exists, basic save functionality

**Tasks:**
- [ ] "Export to GitHub" button in header
- [ ] Create new repository modal
  - Repository name input
  - Public/Private toggle
  - Description (optional)
- [ ] Push to existing repository option
  - Select from connected repos
  - Branch selection/creation
  - Commit message input
- [ ] Automatic commit after each ticket completion (optional toggle)
- [ ] View repository link after export
- [ ] Push status indicator

**Files to Create/Modify:**
- `components/versioning/ExportToGitHub.tsx` (new)
- `components/versioning/CreateRepoModal.tsx` (new)
- `app/api/github/create-repo/route.ts` (new)
- `app/api/github/push-code/route.ts` (new)
- `lib/versioning/github.ts` (enhance)

---

## Phase 2: The Planning Interface

### 2.1 Auto-Planning System
**Status:** 🟡 Partially Complete  
**Priority:** Critical  
**Estimated Effort:** M

**Current State:** `/api/plan-build` exists and creates tickets

**Tasks:**
- [ ] Enhance plan display with clear structure
- [ ] Show estimated time for each task
- [ ] Display dependencies visually
- [ ] Add plan summary header with totals

**Files to Modify:**
- `components/kanban/PlanView.tsx` (new)
- `app/api/plan-build/route.ts` (enhance)

---

### 2.2 Plan Refinement UI
**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Effort:** M

**Tasks:**
- [ ] Enable inline editing of ticket titles/descriptions
- [ ] Add "Add Step" button to insert new tickets
- [ ] Add "Remove Step" with dependency check
- [ ] Reorder tickets with drag-and-drop
- [ ] Show dependency warnings when editing

**Files to Create/Modify:**
- `components/kanban/TicketEditor.tsx` (enhance)
- `components/planning/PlanEditor.tsx` (new)

---

### 2.3 "Move to Pipeline" Transition
**Status:** 🔴 Not Started  
**Priority:** Critical  
**Estimated Effort:** S

**Tasks:**
- [ ] Add prominent "Move to Pipeline" button
- [ ] Create transition animation from Plan → Kanban
- [ ] Lock plan after commit (read-only unless explicitly unlocked)
- [ ] Store finalized plan state

**Files to Create/Modify:**
- `components/planning/PipelineTransition.tsx` (new)
- `hooks/usePlanState.ts` (new)

---

## Phase 3: Execution Phase (Kanban Command Center)

### 3.1 View Mode Toggle
**Status:** 🟡 Partially Complete  
**Priority:** Critical  
**Estimated Effort:** S

**Current State:** Code/View/Kanban tabs exist

**Tasks:**
- [ ] Rename tabs to "Kanban Board" and "App Preview"
- [ ] Make toggle more prominent
- [ ] Persist view preference
- [ ] Add split-view option (both views side-by-side)

**Files to Modify:**
- `app/generation/page.tsx`
- `components/kanban/KanbanBoard.tsx`

---

### 3.2 Auto-Build Mode
**Status:** 🟡 Partially Complete  
**Priority:** Critical  
**Estimated Effort:** M

**Current State:** Build execution exists via `handleStartKanbanBuild`

**Tasks:**
- [ ] Add "Auto-Build" button (prominent, gradient style)
- [ ] Real-time ticket movement animation
- [ ] Progress indicators on each ticket
- [ ] "Pause" button to halt at any point
- [ ] Resume functionality after pause

**Files to Modify:**
- `components/kanban/KanbanBoard.tsx`
- `components/kanban/KanbanTicket.tsx`
- `hooks/useKanbanBoard.ts`

---

### 3.3 Manual Build Mode
**Status:** 🟡 Partially Complete  
**Priority:** High  
**Estimated Effort:** M

**Current State:** `buildMode` state exists

**Tasks:**
- [ ] Add Manual/Auto toggle switch
- [ ] "Build This" button on individual tickets
- [ ] Confirmation before building each ticket
- [ ] Skip/defer ticket options

**Files to Modify:**
- `components/kanban/KanbanBoard.tsx`
- `components/kanban/KanbanTicket.tsx`

---

### 3.4 Human-in-the-Loop (Stuck State) UI
**Status:** 🟡 Partially Complete  
**Priority:** Critical  
**Estimated Effort:** L

**Current State:** `awaiting_input` status and `InputRequestModal` exist

**Tasks:**
- [ ] Dedicated "Feedback Required" column/section
- [ ] Visual highlighting of blocked tickets (pulsing border)
- [ ] Clear input requirements display
- [ ] One-click credential/API key input
- [ ] Resume ticket after input provided

**Files to Modify:**
- `components/kanban/KanbanBoard.tsx`
- `components/kanban/InputRequestModal.tsx`
- `components/kanban/KanbanColumn.tsx`

---

## Phase 4: Board Logic & Guardrails

### 4.1 Forward Movement Restrictions
**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Effort:** M

**Tasks:**
- [ ] Implement drag-drop validation rules
- [ ] Prevent ToDo → PR Review direct movement
- [ ] Show visual feedback on invalid drops
- [ ] Enforce sequential column progression

**Files to Create/Modify:**
- `components/kanban/DragDropGuards.tsx` (new)
- `hooks/useTicketMovement.ts` (new)
- `components/kanban/KanbanColumn.tsx`

---

### 4.2 Backward Regression (Undo Logic)
**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Effort:** L

**Tasks:**
- [ ] Detect backward ticket movement
- [ ] Warning modal: "Moving this back will remove the associated feature code. Proceed?"
- [ ] Soft-delete/comment out associated code on confirmation
- [ ] Auto-refactor trigger for stability
- [ ] Undo history tracking

**Files to Create/Modify:**
- `components/kanban/RegressionWarningModal.tsx` (new)
- `hooks/useCodeRegression.ts` (new)
- `app/api/rollback-feature/route.ts` (new)

---

## Phase 5: Quality Assurance

### 5.1 PR Review Column
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Effort:** L

**Tasks:**
- [ ] Add "PR Review" column before "Done"
- [ ] Automated code review via AI agent
- [ ] Status checks display on tickets
- [ ] Approve/Request Changes actions
- [ ] Auto-approve for passing checks

**Files to Create/Modify:**
- `components/kanban/PRReviewColumn.tsx` (new)
- `app/api/review-code/route.ts` (new)
- `components/kanban/types.ts` (add new status)

---

## Phase 6: Multi-Tenant Architecture

### 6.1 User Authentication & Identity
**Status:** 🔴 Not Started  
**Priority:** Critical  
**Estimated Effort:** L

**Tasks:**
- [ ] Implement authentication (Clerk, Auth0, or Supabase Auth)
- [ ] User registration/login flows
- [ ] OAuth providers (Google, GitHub, Email)
- [ ] Session management
- [ ] Protected routes middleware
- [ ] User profile storage

**Files to Create/Modify:**
- `app/api/auth/[...nextauth]/route.ts` or Clerk setup
- `middleware.ts` (route protection)
- `lib/auth.ts` (auth utilities)
- `components/auth/LoginModal.tsx`
- `components/auth/UserMenu.tsx`

---

### 6.2 Data Isolation & Project Ownership
**Status:** 🔴 Not Started  
**Priority:** Critical  
**Estimated Effort:** L

**Tasks:**
- [ ] Database schema with `user_id` on all resources
- [ ] Projects table (id, user_id, name, created_at, etc.)
- [ ] Plans table linked to projects
- [ ] Tickets table linked to plans
- [ ] Sandbox sessions linked to projects
- [ ] Row-level security policies (if using Supabase)
- [ ] API route validation (user can only access own data)

**Database Schema:**
```sql
users (id, email, name, avatar, created_at)
projects (id, user_id, name, description, status, created_at, updated_at)
plans (id, project_id, prompt, tickets_json, status, created_at)
sandboxes (id, project_id, sandbox_id, url, created_at, expires_at)
github_connections (id, user_id, access_token, username, connected_at)
```

**Files to Create/Modify:**
- `lib/db/schema.ts` (Prisma or Drizzle schema)
- `lib/db/queries.ts` (data access layer)
- All API routes (add user context)

---

### 6.3 Project Management Dashboard
**Status:** 🔴 Not Started  
**Priority:** High  
**Estimated Effort:** M

**Tasks:**
- [ ] "My Projects" dashboard page
- [ ] Project cards with preview thumbnails
- [ ] Create new project flow
- [ ] Resume existing project
- [ ] Delete/archive project
- [ ] Project search and filters
- [ ] Recent projects quick access

**Files to Create/Modify:**
- `app/dashboard/page.tsx` (new)
- `components/dashboard/ProjectCard.tsx` (new)
- `components/dashboard/ProjectGrid.tsx` (new)
- `app/api/projects/route.ts` (new)

---

### 6.4 Usage Tracking & Limits
**Status:** 🔴 Not Started  
**Priority:** Medium  
**Estimated Effort:** M

**Tasks:**
- [ ] Track API calls per user (AI generations, sandbox time)
- [ ] Usage limits by tier (Free, Pro, Enterprise)
- [ ] Usage display in UI
- [ ] Limit enforcement on API routes
- [ ] Upgrade prompts when limits reached
- [ ] Usage reset on billing cycle

**Files to Create/Modify:**
- `lib/usage/tracking.ts` (new)
- `lib/usage/limits.ts` (new)
- `components/billing/UsageIndicator.tsx` (new)
- `app/api/usage/route.ts` (new)

---

### 6.5 Team Collaboration (Future)
**Status:** 🔴 Not Started  
**Priority:** Low (Post-MVP)  
**Estimated Effort:** XL

**Tasks:**
- [ ] Team/Organization model
- [ ] Invite team members
- [ ] Role-based permissions (Owner, Editor, Viewer)
- [ ] Shared projects within team
- [ ] Real-time collaboration (presence indicators)
- [ ] Activity feed / audit log

---

### 6.6 Sandbox Isolation
**Status:** 🟡 Partially Complete  
**Priority:** Critical  
**Estimated Effort:** S

**Current State:** Vercel sandbox provider exists

**Tasks:**
- [ ] Each user gets isolated sandbox instances
- [ ] Sandbox cleanup on session end
- [ ] Sandbox timeout/expiry handling
- [ ] Resource limits per sandbox
- [ ] Persistent sandbox option (paid feature)

**Files to Modify:**
- `lib/sandbox/factory.ts`
- `app/api/create-ai-sandbox-v2/route.ts`

---

## Implementation Order (Recommended)

### Sprint 1: Core Flow (Days 1-3)
1. ✅ Plan creation from prompt (DONE)
2. ✅ Kanban display with columns (DONE)
3. ✅ Start Build button (DONE)
4. Entry Choice screen refinement
5. View mode toggle cleanup

### Sprint 2: Build Execution (Days 4-6)
1. Auto-Build with real-time updates
2. Pause/Resume functionality
3. Manual Build mode toggle
4. Human-in-the-Loop improvements

### Sprint 3: Guardrails & Quality (Days 7-9)
1. Forward movement restrictions
2. Backward regression with warnings
3. PR Review column
4. Code rollback logic

### Sprint 4: Polish (Days 10-12)
1. GitHub import flow
2. "Come up with 3 UIs" feature
3. Animations and transitions
4. Error handling and edge cases

---

## Key UI Elements Checklist

| Element | Status | Priority |
|---------|--------|----------|
| **Entry Options** | | |
| Prompt Input Field (Build) | ✅ Done | Critical |
| Clone URL Input | ✅ Done | Critical |
| "Import from GitHub" Button | 🟡 Partial | High |
| **GitHub Integration** | | |
| GitHub Connect | ✅ Done | High |
| "Export to GitHub" Button | 🔴 Not Started | High |
| Create New Repo Modal | 🔴 Not Started | High |
| Push to Existing Repo | 🔴 Not Started | Medium |
| **Planning** | | |
| "Come up with 3 UIs" Button | 🔴 Not Started | Medium |
| "Move to Pipeline" Button | 🔴 Not Started | Critical |
| Plan Edit Mode | 🔴 Not Started | High |
| **Build Execution** | | |
| "Auto-Build" Button | 🟡 Partial (Start Build) | Critical |
| Pause/Resume Buttons | ✅ Done | Critical |
| "Manual Build" Toggle | 🟡 Partial | High |
| **Views & Navigation** | | |
| View Toggle (Kanban/Preview) | ✅ Done | Critical |
| Split View Option | 🔴 Not Started | Low |
| **Guardrails** | | |
| Warning Modals (backward movement) | 🔴 Not Started | High |
| Drag-Drop Restrictions | 🔴 Not Started | High |

---

## Security Considerations

### 🔴 Critical Security Issues to Address

#### 1. API Key Exposure
**Risk:** HIGH  
**Current Issue:** API keys (OpenAI, GitHub tokens) may be exposed in client-side code or logs

**Mitigations:**
- [ ] All AI API calls go through server-side routes only
- [ ] Never expose API keys in client bundle
- [ ] Use environment variables for all secrets
- [ ] Implement key rotation mechanism
- [ ] Audit logs for API key usage

---

#### 2. Sandbox Code Execution
**Risk:** CRITICAL  
**Current Issue:** User-generated code runs in sandboxes - potential for malicious code

**Mitigations:**
- [ ] Sandboxes are fully isolated (Vercel/E2B handles this)
- [ ] No access to host system from sandbox
- [ ] Network restrictions on sandboxes (no outbound to internal services)
- [ ] Sandbox timeout limits (prevent crypto mining)
- [ ] Resource limits (CPU, memory, disk)
- [ ] Code scanning before execution (optional)

---

#### 3. User Input Validation
**Risk:** HIGH  
**Current Issue:** Prompts and URLs are user-provided - injection risks

**Mitigations:**
- [ ] Sanitize all user inputs server-side
- [ ] URL validation before scraping
- [ ] Prompt injection protection (system prompt hardening)
- [ ] XSS prevention in rendered content
- [ ] SQL injection prevention (parameterized queries)

---

#### 4. Authentication & Authorization
**Risk:** CRITICAL  
**Current Issue:** No user auth currently - all data is public/shared

**Mitigations:**
- [ ] Implement proper auth (Clerk/Auth0/Supabase)
- [ ] JWT token validation on all API routes
- [ ] CSRF protection
- [ ] Secure session management
- [ ] Password policies (if email/password auth)
- [ ] Rate limiting on auth endpoints

---

#### 5. GitHub Token Security
**Risk:** HIGH  
**Current Issue:** GitHub OAuth tokens stored - sensitive access

**Mitigations:**
- [ ] Encrypt tokens at rest
- [ ] Minimal OAuth scopes (only what's needed)
- [ ] Token refresh mechanism
- [ ] Revoke tokens on user logout/disconnect
- [ ] Never log tokens
- [ ] Secure token storage (httpOnly cookies or encrypted DB)

---

#### 6. Secrets in Generated Code
**Risk:** MEDIUM  
**Current Issue:** Users may input API keys for integrations (Stripe, etc.)

**Mitigations:**
- [ ] Store user secrets encrypted in DB, not in code
- [ ] Generate .env files with placeholders
- [ ] Never commit secrets to GitHub exports
- [ ] Warn users about secret exposure
- [ ] Auto-detect and mask secrets in logs

---

#### 7. Rate Limiting & DDoS Protection
**Risk:** MEDIUM  
**Current Issue:** No rate limiting on expensive operations

**Mitigations:**
- [ ] Rate limit AI generation endpoints (per user, per IP)
- [ ] Rate limit sandbox creation
- [ ] Rate limit GitHub API calls
- [ ] Implement request queuing for heavy operations
- [ ] Use Vercel/Cloudflare DDoS protection

---

#### 8. Data Privacy & GDPR
**Risk:** MEDIUM  
**Current Issue:** User data handling needs compliance

**Mitigations:**
- [ ] Privacy policy page
- [ ] Data deletion capability (right to be forgotten)
- [ ] Data export capability
- [ ] Cookie consent (if using analytics)
- [ ] Clear data retention policies
- [ ] Anonymize logs

---

### Security Checklist for Launch

| Item | Status | Priority |
|------|--------|----------|
| API keys server-side only | 🟡 Partial | Critical |
| Sandbox isolation verified | ✅ Done (Vercel) | Critical |
| User authentication | 🔴 Not Started | Critical |
| Input sanitization | 🟡 Partial | Critical |
| GitHub token encryption | 🔴 Not Started | High |
| Rate limiting | 🔴 Not Started | High |
| Secrets handling | 🔴 Not Started | High |
| HTTPS everywhere | ✅ Done (Vercel) | Critical |
| CORS configured | 🟡 Partial | Medium |
| Security headers | 🔴 Not Started | Medium |

---

## Notes

- All ticket movements should animate smoothly
- Loading states should show skeleton UI
- Error states should provide clear recovery options
- Mobile responsiveness is secondary for MVP
- Focus on desktop experience first
- **Security audit recommended before public launch**
