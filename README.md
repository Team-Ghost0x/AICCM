# Retake — AI Content Creator Marketplace (AICCM)

> **Enterprise-grade marketplace connecting global brands with verified AI filmmakers, animators, and generative artists.** Built on verified iterative workflow transparency, milestone-based escrow payments, and commercial copyright clearance.

---

## 🌟 Key Highlights

- **Dual-Sided Marketplace Experience**: Tailored workspaces for **Brands/Agencies** (brief commissioning, creator discovery, escrow deposits) and **AI Creators** (portfolio showcases, multi-take proof, project delivery).
- **Proof-of-Process Take Scrubber**: Interactive visual inspection allowing clients to evaluate creator iterations, prompt evolution, and ComfyUI/Runway toolchains before hiring.
- **Milestone Escrow & Secure Payments**: Multi-stage escrow protection with automated funds locking, milestone release approvals, and wallet management.
- **Commercial Rights & Verification Matrix**: Cryptographic certificate generation and license verification for AI-generated assets with clear commercial usage grants.
- **Automated Creator Matching**: Intelligent algorithmic scoring evaluating creator style tags, tool stack, budget fit, and turnaround time against creative briefs.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies & Standards |
| :--- | :--- |
| **Frontend Framework** | **Next.js 16** (App Router, Turbopack, Server & Client Components) |
| **UI & Styling** | **React 19**, **Tailwind CSS v4**, Custom Design Tokens & Dark/Light System |
| **State & Audio** | Reactive client stores, contextual sound feedback, zero heavy external UI libraries |
| **Backend API** | **Node.js**, **Express.js**, RESTful API architecture across 35 endpoints |
| **Authentication** | Bearer JWT with session revocation list and role-based access control (RBAC) |
| **Data & Storage** | Dual-mode: In-Memory / Relational MySQL database with audit trail logging |
| **Testing** | **Vitest**, **JSDOM**, **Testing Library** (12 suites, 73 unit & integration tests) |

## 🛠️ Engineering Methodology: Human Architecture & AI-Assisted Tooling

This platform was designed and engineered using modern fullstack software engineering practices, combining deep human architectural design with AI-assisted developer acceleration:

- **Human Systems Design & Architecture**: The core system architecture—including the domain data schemas, multi-stage escrow state machine, RESTful API specifications, and custom CSS design system—was designed and architected by our engineering team to solve real-world enterprise creative bottlenecks.
- **Custom Interactive Components**: The signature **Take Scrubber** was engineered with custom keyboard navigation (`J`/`K` shortcuts) and responsive frame controls, built with zero heavy external UI dependencies to ensure 60fps interaction.
- **AI-Assisted Acceleration**: We utilized modern developer AI tooling (such as GitHub Copilot and code assistants) as force multipliers to accelerate boilerplate scaffolding, mock fixture authoring, and unit test coverage.
- **Rigor & Security**: All business logic—from the algorithmic vector matching scorer to RBAC authentication, rate limiting, and SHA-256 certificate hashing—was manually implemented, profiled, and verified with **73 automated unit and integration tests**.

---

## 🚀 Quick Start & Local Run

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 1. Installation
Install root, frontend, and backend dependencies:

```bash
# Clone the repository
git clone https://github.com/Team-Ghost0x/AICCM.git
cd AICCM

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Run the Platform Locally

You can run both the frontend and backend concurrently:

```bash
# In Terminal 1: Start Backend API (Port 3001)
cd backend && npm run dev

# In Terminal 2: Start Frontend Application (Port 3002)
cd frontend && npm run dev -- -p 3002
```

- **Frontend Application**: [http://localhost:3002](http://localhost:3002)
- **Backend REST API**: [http://localhost:3001](http://localhost:3001)
- **API Health Endpoint**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 🔑 Demo & Evaluation Accounts

The platform comes pre-seeded with full operational test accounts for evaluation:

| Persona | Role | Email | Features to Test |
| :--- | :--- | :--- | :--- |
| **Vikram Sharma** | Brand / Agency | `vikram.sharma@zomatostudios.com` | Post briefs, browse creators, fund escrow, review takes |
| **Arjun Patel** | Verified Creator | `arjun@retake.market` | View assigned briefs, submit milestone takes, manage portfolio |
| **Dev Verma** | Verified Creator | `director@hyperreal.studio` | Editorial fashion showcase, review proposals, withdraw funds |
| **Aditya Rao** | Platform Admin | `aditya.dev@retake.internal` | Audit logs, dispute resolution, GMV telemetry (PIN: `0000`) |

*(Tip: You can switch roles instantaneously in the UI via the top navigation bar or the role switch dropdown)*

---

## 🧪 Testing & Quality Assurance

The codebase includes comprehensive test coverage verifying UI rendering, security controls, match scoring, and escrow logic:

```bash
cd frontend
npm test
```

To run a production build verification:

```bash
cd frontend
npm run build
```

---

## 📂 Project Structure

```
AICCM/
├── frontend/                     # Next.js 16 Web Application
│   ├── app/                      # Next.js App Router Pages
│   │   ├── admin/                # Admin operations & escrow console
│   │   ├── briefs/               # Campaign briefs catalog & creation
│   │   ├── creators/[handle]/    # Creator portfolio dossier & take player
│   │   ├── dashboard/            # Creator & Brand operational hubs
│   │   ├── discover/             # Faceted creator discovery catalog
│   │   ├── messages/             # Real-time brand/creator message threads
│   │   └── tracker/              # Production milestone tracker
│   ├── components/               # High-fidelity custom React components
│   ├── lib/
│   │   ├── client/               # API clients, auth stores, audio engines
│   │   └── contract/             # Schemas, rights matrices, seed fixtures
│   └── tests/                    # Vitest test suites (73 unit/integration tests)
├── backend/                      # Express.js REST API Server
│   ├── src/
│   │   ├── routes/               # API route modules (Auth, Creators, Briefs, etc.)
│   │   ├── auth.js               # JWT authentication & RBAC middleware
│   │   ├── db.js                 # Database abstraction & audit logging
│   │   └── server.js             # Express application & security middleware
├── docs/                         # Presentation slides & demo materials
└── package.json                  # Root workspace definition
```

---

## 🏆 Hackathon Deliverables & Evaluation Mapping

This project addresses **Challenge 2: Kampus.VC — AI Content Creator Marketplace** for HacXLerate 2026.

| Deliverable / Rubric Criterion | Implementation & Documentation |
| :--- | :--- |
| **1. Creator Profiles & AI Portfolios (30%)** | Rich creator dossiers with multi-take scrubber, prompt evolution, tools, and LoRA checkpoints. Visit `/creators/mira-okonkwo` or `/creators/arjun-patel`. |
| **2. Brief Definition & Scoping (20%)** | Multi-aspect-ratio scoping (`9:16`, `16:9`, `1:1`), commercial usage licensing matrix, and escrow milestones. Visit `/briefs/new`. |
| **3. Discovery & Filtering (25%)** | 9+ faceted filters (specializations, AI tools, content types, turnaround, budget) with intelligent empty-state relaxation suggestions. Visit `/discover`. |
| **4. User Experience & Aesthetics (15%)** | Dual-sided brand/creator workflow, native range sliders, dark/light theme, and contextual audio feedback. Visit `/dashboard`. |
| **5. Presentation & Demo (10%)** | 16:9 widescreen presentation deck: [`docs/AI-Content-Creator-Marketplace-Demo.pptx`](file:///home/ghost/aiccm/docs/AI-Content-Creator-Marketplace-Demo.pptx) and script in [`docs/demo-slides.md`](file:///home/ghost/aiccm/docs/demo-slides.md). |
| **Bonus 1: Creator Verification Signals** | 4-tier verification (`unverified`, `self_declared`, `evidence_attached`, `reviewed`) with tool verification badges and audit history. |
| **Bonus 2: AI-Assisted Brief Builder** | Natural language prompt parser converting rough ideas into structured parameters with auto-filled budgets, ratios, and tools. |
| **Data Model Note** | Full architectural data model specification documented in [`docs/DATA_MODEL.md`](file:///home/ghost/aiccm/docs/DATA_MODEL.md). |

---

## 📄 License

This project is licensed under the MIT License.
