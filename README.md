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

## 📄 License

This project is licensed under the MIT License.
