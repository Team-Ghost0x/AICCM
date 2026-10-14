# AICCM (Retake) — Quick Setup & Evaluation Guide

A point-to-point guide for new users, developers, and judges to set up and run the platform locally in under 2 minutes.

---

## ⚡ 1. Prerequisites

- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **Git**: Installed on your system

---

## 📦 2. Clone & Install Dependencies

Open your terminal and run:

```bash
# 1. Clone the repository
git clone https://github.com/Team-Ghost0x/AICCM.git
cd AICCM

# 2. Install Frontend dependencies
cd frontend
npm install
cd ..

# 3. Install Backend dependencies
cd backend
npm install
cd ..
```

---

## 🚀 3. Start the Platform

Run the backend and frontend in two separate terminal tabs:

### Terminal 1: Backend API Server (Port 3001)
```bash
cd backend
npm run dev
```
*Backend runs at `http://localhost:3001` (Health check: `http://localhost:3001/api/health`)*

### Terminal 2: Frontend Web Application (Port 3002)
```bash
cd frontend
npm run dev -- -p 3002
```
*Frontend runs at `http://localhost:3002`*

---

## 🌐 4. Core Application URLs

| View | URL | What to Test |
| :--- | :--- | :--- |
| **Marketplace Home** | [http://localhost:3002](http://localhost:3002) | Hero showcase, interactive take scrubber, categories |
| **Creator Discovery** | [http://localhost:3002/discover](http://localhost:3002/discover) | Search creators, tool stack filters, rate ranges |
| **Creator Profile** | [http://localhost:3002/creators/arjun-patel](http://localhost:3002/creators/arjun-patel) | 3-column portfolio, workflow sequence, hire modal |
| **Campaign Briefs** | [http://localhost:3002/briefs](http://localhost:3002/briefs) | Active briefs, budget escrow, deliverable specs |
| **Post a New Brief** | [http://localhost:3002/briefs/new](http://localhost:3002/briefs/new) | Create a brief with AI auto-drafting assistance |
| **Milestone Tracker** | [http://localhost:3002/tracker](http://localhost:3002/tracker) | Production stages, milestone approval, take delivery |
| **Messages Inbox** | [http://localhost:3002/messages](http://localhost:3002/messages) | Real-time brand/creator client threads |
| **Admin Console** | [http://localhost:3002/admin](http://localhost:3002/admin) | Platform metrics, GMV, audit logs (PIN: `0000`) |

---

## 👥 5. Pre-Seeded Test Accounts

You can switch personas directly via the top header or use these seeded accounts:

| Persona | Role | Default Email | What They See |
| :--- | :--- | :--- | :--- |
| **Vikram Sharma** | Brand / Agency | `vikram.sharma@zomatostudios.com` | Brand hub, wallet balance (₹3,50,000), brief creator, hire actions |
| **Arjun Patel** | AI Creator | `arjun@retake.market` | Creator studio, portfolio management, assigned production jobs |
| **Aditya Rao** | Platform Admin | `aditya.dev@retake.internal` | Moderation queue, escrow ledger, audit logs (PIN: `0000`) |

---

## 🧪 6. Testing & Build Verification

```bash
# Run unit and integration tests (73 tests across 12 test suites)
cd frontend
npm test

# Run production build check
npm run build
```

---

## 🛠️ 7. Troubleshooting

- **Port 3002 already in use?**
  Run frontend on another port:
  ```bash
  npm run dev -- -p 3005
  ```
- **Reset test data to initial seed?**
  Go to the Admin Console at [http://localhost:3002/admin](http://localhost:3002/admin) (PIN `0000`) and click **"Reset Platform Data"** or clear your browser's `localStorage`.
