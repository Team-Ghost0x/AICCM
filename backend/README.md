# Retake Platform — Backend API

Express.js REST API for the Retake Generative AI Creator Platform. Implements all 35 endpoints specified in `backend_required_routes.md`.

## Quick Start

```bash
npm install
npm run dev    # Development with --watch
npm start      # Production
```

Server runs at: **http://localhost:3001**

## Environment Variables

Copy `.env` and adjust as needed:

```
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

## Seed Accounts

| Email | Password | Role |
|---|---|---|
| `brand@nexawave.in` | `password` | brand |
| `director@hyperreal.studio` | `password` | creator |
| `admin@retake.design` | `password` | admin |

## API Modules (35 Endpoints)

### Auth (`/api/auth`)
- `POST /register` – Register new account
- `POST /login` – Email or Google OAuth login
- `POST /logout` – Invalidate session
- `GET /me` – Get current user profile
- `PATCH /role` – Switch active role context

### Creators (`/api/creators`)
- `GET /` – Faceted search with 9+ filter params
- `GET /:handle` – Full creator dossier & portfolio
- `POST /` – Onboard new creator profile
- `PATCH /:id` – Update creator profile

### Briefs (`/api/briefs`)
- `POST /draft` – AI NLP brief parser
- `POST /` – Publish production brief
- `GET /` – List briefs (with filters)
- `GET /:id` – Get brief details
- `PATCH /:id` – Update brief
- `GET /:id/matches` – Ranked creator matches

### Communications
- `GET /api/requests` – List requests
- `POST /api/requests` – Send inquiry to creator
- `PATCH /api/requests/:id` – Accept/decline (auto-creates thread)
- `GET /api/threads` – List message threads
- `GET /api/threads/:id` – Get thread messages
- `POST /api/threads/:id/messages` – Send message

### Payments & Escrow (`/api/payments`)
- `GET /wallet` – Balance, locked escrow, credits
- `GET /transactions` – Transaction ledger
- `POST /deposit` – Top-up via UPI/Card
- `POST /escrow/lock` – Lock milestone funds
- `POST /escrow/release` – Release to creator

### Production Tracker (`/api/tracker`)
- `GET /:briefId` – Tracker state & takes
- `POST /:briefId/takes` – Submit generation take
- `PATCH /:briefId/takes/:n` – Approve/request changes
- `POST /:briefId/deliverables/approve` – Final sign-off + cert

### Rights (`/api/rights`)
- `POST /verify` – Generate SHA-256 signed certificate
- `GET /certificates/:certId` – Verify certificate authenticity

### Admin (`/api/admin`)
- `GET /metrics` – Platform telemetry & GMV
- `GET /audit-logs` – Security & escrow audit trail
- `POST /data/reset` – Reset to golden seed data
