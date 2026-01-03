# Timbs A.I. - MCP UX Specification

## Model Context Protocol - User Experience Workflows

This document defines the UI/UX workflows and specifications for the Timbs A.I. platform, designed for integration with the Model Context Protocol (MCP).

---

## 1. Entry Points (3 Options)

### Option A: Build from Prompt (Greenfield)
```
User Action: Types natural language prompt
Example: "Build a CRM for real estate agents"
System Response:
  1. Validates prompt
  2. Calls /api/plan-build
  3. AI generates 12-15 tickets
  4. Displays plan in Kanban
  5. Awaits user approval to build
```

### Option B: Clone from URL
```
User Action: Enters website URL to clone
Example: "stripe.com"
System Response:
  1. Scrapes website (screenshot + content)
  2. Analyzes structure and design
  3. Calls /api/plan-build with context
  4. AI generates tickets based on scraped site
  5. Displays plan in Kanban
```

### Option C: Import from GitHub (Brownfield)
```
User Action: Connects GitHub, selects repository
System Response:
  1. OAuth flow → GitHub connection
  2. Fetches repository structure
  3. Parses existing codebase
  4. AI generates tickets to extend/modify
  5. Displays plan in Kanban
```

---

## 2. Planning Phase

### Auto-Planning Flow
```
Input: User prompt or scraped content
Process:
  1. AI analyzes request
  2. Breaks down into discrete tickets
  3. Estimates complexity (XS, S, M, L, XL)
  4. Identifies dependencies
  5. Detects required user inputs (API keys, etc.)
Output: BuildPlan with 12-15 KanbanTickets
```

### Plan Refinement
```
User Actions Available:
  - Edit ticket title/description
  - Add new tickets
  - Remove tickets (with dependency warnings)
  - Reorder tickets (drag-drop)
  - Provide required inputs

UI Elements:
  - Inline editing
  - "Add Step" button
  - Dependency visualization
  - "Move to Pipeline" button (commits plan)
```

---

## 3. Execution Phase (Kanban Command Center)

### View Modes
| Mode | Description |
|------|-------------|
| Kanban Board | Source of truth - ticket management |
| App Preview | Live sandbox showing built application |
| Split View | Side-by-side (optional) |

### Build Modes

#### Auto-Build Mode
```
Trigger: User clicks "Auto-Build"
Behavior:
  - Tickets move automatically: ToDo → Build → Review → Done
  - Real-time progress updates
  - Pause button available at any time
  - Resume continues from last ticket
```

#### Manual Build Mode
```
Trigger: User enables "Manual Build" toggle
Behavior:
  - "Build This" button on each ticket
  - User authorizes each ticket individually
  - Skip/defer ticket options
```

### Human-in-the-Loop (Stuck State)
```
Trigger: Ticket requires user input (API key, credential, clarification)
Behavior:
  - Ticket moves to "Awaiting Input" column
  - Visual highlighting (pulsing border)
  - User clicks ticket → Input modal appears
  - User provides input
  - Ticket resumes to "Backlog"
```

---

## 4. Board Logic & Guardrails

### Column Progression
```
Valid Flow:
  Backlog → Generating → Applying → Testing → Done

Invalid Actions:
  - Cannot skip columns (ToDo → Done blocked)
  - Cannot move to non-adjacent column directly
```

### Backward Regression (Undo)
```
Trigger: User drags ticket from Done/Review back to Backlog
Behavior:
  1. Warning modal: "Moving this back will remove the associated feature code. Proceed?"
  2. If confirmed:
     - Soft-delete/comment out associated code
     - Trigger auto-refactor for stability
     - Reset ticket status
  3. If cancelled: No action
```

---

## 5. GitHub Integration

### Import Flow
```
1. User clicks "Import from GitHub"
2. OAuth authentication
3. Repository selector modal
4. Branch selection
5. Code analysis
6. Plan generation
```

### Export Flow
```
1. User clicks "Export to GitHub"
2. Options:
   a. Create new repository (name, public/private)
   b. Push to existing repository (branch selector)
3. Commit message input
4. Push execution
5. Success → Link to repository
```

### Auto-Commit (Optional)
```
Toggle: "Auto-commit after each ticket"
Behavior: After ticket completion → Auto-push to selected repo
```

---

## 6. Multi-Tenant Architecture

### User Context
```
All API calls include:
  - userId (from auth token)
  - projectId (from URL/session)

Data Isolation:
  - Users can only access own projects
  - Row-level security on database
  - Separate sandbox instances per user
```

### Database Schema
```sql
users (id, email, name, avatar_url, created_at)
projects (id, user_id, name, description, status, created_at)
plans (id, project_id, prompt, status, created_at)
tickets (id, plan_id, title, description, type, status, order)
sandboxes (id, project_id, provider_id, url, expires_at)
github_connections (id, user_id, access_token, username)
```

### Usage Limits
| Tier | AI Generations/day | Sandbox Hours | Storage |
|------|-------------------|---------------|---------|
| Free | 10 | 2 | 100MB |
| Pro | 100 | 24 | 5GB |
| Enterprise | Unlimited | Unlimited | Unlimited |

---

## 7. Security Requirements

### Critical Controls
| Control | Status | Implementation |
|---------|--------|----------------|
| API Keys Server-Side Only | Required | All AI calls via Next.js API routes |
| Sandbox Isolation | Required | Vercel/E2B isolated environments |
| User Authentication | Required | Clerk/Auth0/Supabase Auth |
| Input Sanitization | Required | Server-side validation |
| Rate Limiting | Required | Per-user, per-endpoint limits |
| HTTPS | Required | Vercel handles TLS |

### Token Security
```
GitHub Tokens:
  - Encrypted at rest
  - Minimal OAuth scopes
  - Never logged
  - Revoked on disconnect

User Secrets (API keys for integrations):
  - Stored encrypted in DB
  - Generated as .env placeholders in code
  - Never committed to GitHub exports
```

---

## 8. API Endpoints

### Planning
```
POST /api/plan-build
  Input: { prompt: string, context?: object }
  Output: SSE stream of tickets + plan

POST /api/generate-ui-options
  Input: { prompt: string }
  Output: { options: UIDesign[] }
```

### Execution
```
POST /api/generate-ai-code-stream
  Input: { prompt: string, model: string, context: object }
  Output: SSE stream of code chunks

POST /api/apply-code
  Input: { sandboxId: string, files: FileContent[] }
  Output: { success: boolean }
```

### GitHub
```
GET /api/github/repos
  Output: { repos: Repository[] }

POST /api/github/create-repo
  Input: { name: string, private: boolean }
  Output: { url: string }

POST /api/github/push
  Input: { repoId: string, files: FileContent[], message: string }
  Output: { commitUrl: string }
```

### Projects
```
GET /api/projects
  Output: { projects: Project[] }

POST /api/projects
  Input: { name: string, description?: string }
  Output: { project: Project }

DELETE /api/projects/:id
  Output: { success: boolean }
```

---

## 9. UI Component Inventory

### Entry Components
- `EntryChoice.tsx` - 3-option selector
- `PromptInput.tsx` - Natural language input
- `CloneURLInput.tsx` - URL clone interface
- `GitHubImport.tsx` - Repo selector

### Planning Components
- `PlanView.tsx` - Plan display
- `PlanEditor.tsx` - Inline editing
- `TicketEditor.tsx` - Single ticket edit modal
- `UIOptionsSelector.tsx` - 3 UI design picker

### Execution Components
- `KanbanBoard.tsx` - Main board
- `KanbanColumn.tsx` - Column container
- `KanbanTicket.tsx` - Ticket card
- `InputRequestModal.tsx` - User input modal
- `BuildControls.tsx` - Auto/Manual/Pause buttons

### GitHub Components
- `GitHubConnectButton.tsx` - OAuth trigger
- `ExportToGitHub.tsx` - Export modal
- `RepoSelector.tsx` - Repository picker
- `CreateRepoModal.tsx` - New repo form

### Dashboard Components
- `ProjectGrid.tsx` - All projects
- `ProjectCard.tsx` - Single project
- `UsageIndicator.tsx` - Limits display

---

## 10. State Management

### Global State (Jotai/React Context)
```typescript
interface AppState {
  user: User | null;
  currentProject: Project | null;
  plan: BuildPlan | null;
  tickets: KanbanTicket[];
  isBuilding: boolean;
  isPaused: boolean;
  buildMode: 'auto' | 'manual';
  sandboxData: SandboxData | null;
  githubConnection: GitHubConnection | null;
}
```

### Persistence
- Plans: LocalStorage + Database (when auth enabled)
- Tickets: LocalStorage + Database
- User preferences: LocalStorage
- Sandbox sessions: Server-side only

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-03 | Initial MCP UX specification |
