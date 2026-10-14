# Retake Platform // Backend API Specification & Route Registry

> **CONFIDENTIAL // ARCHITECTURE CORE**  
> **Status:** Production Ready  
> **Specification Version:** 2.6.0  
> **Target Backend:** `/home/ghost/aiccm/backend`  
> **Frontend Consumer:** `/home/ghost/aiccm/frontend`  
> **Protocol & Format:** REST / JSON over HTTP/2  
> **Environment Switch:** `NEXT_PUBLIC_USE_REAL_API=true`  
> **Date of Issue:** October 2026  

---

## Executive Architectural Overview

The **Retake Generative AI Creator Platform** frontend is constructed with Next.js 16 and React 19. The application operates in dual-mode:

1. **Development / Mock Mode (Default):** Runs an in-memory client-side mock engine (`frontend/lib/mock/*`) for rapid local development and previewing without external dependencies.
2. **Production / Integrated Backend Mode:** Activated whenever `NEXT_PUBLIC_USE_REAL_API=true` is set in the environment. The Next.js frontend delegates all remote mutations and state synchronizations to the backend service over HTTP/2 REST endpoints rooted at `/api/*`.

This document forms the binding interface contract between the frontend client and the backend server. The backend service must strictly adhere to the endpoints, HTTP methods, headers, request bodies, response shapes, and HTTP status codes defined herein.

---

## 1. Architectural Overview & Global Conventions

### 1.1 Global Conventions Summary

| Convention | Standard | Details & Requirements |
| :--- | :--- | :--- |
| **Authentication** | `Authorization: Bearer <token>` | Standard JWT token returned upon registration or login. The decoded token must supply `userId`, `email`, and active `role` (`"brand"` \| `"creator"` \| `"admin"`). |
| **Content-Type** | `application/json; charset=utf-8` | All request bodies and response payloads must be valid JSON encoded in UTF-8. |
| **Currency Standard** | INR (`₹`) | All monetary values (project budgets, escrow deposits, wallet balances, milestones, and payouts) are calculated and stored in Indian Rupees (INR) as integers. |
| **Error Format** | Uniform Error Object | Standardized error payload: `{"error": string, "code": string, "details"?: any}` paired with standard HTTP 4xx/5xx status codes. |
| **Pagination & Filtering** | Query Parameters | Collection endpoints accept `limit` (default: 20, max: 100), `offset` (default: 0), and domain-specific filter keys. |

### 1.2 Standard Error Response Schema

Whenever a request fails, the backend must return a JSON response matching the following contract:

```json
{
  "error": "Human readable explanation of the failure",
  "code": "ERROR_CODE_STRING",
  "details": {
    "field": "Optional validation or contextual metadata"
  }
}
```

Common status codes:
- `400 Bad Request`: Payload validation failures (e.g. invalid Zod schema match).
- `401 Unauthorized`: Missing, expired, or malformed JWT token.
- `403 Forbidden`: Authenticated user lacks permission for the requested entity or action.
- `404 Not Found`: Target entity ID or handle does not exist.
- `409 Conflict`: Unique constraint violation (e.g. duplicate email or creator handle).
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Master Inventory of Required Backend Routes (35 Endpoints)

The backend service is required to implement the following **35 REST endpoints** distributed across 8 functional modules:

| # | Method | Endpoint Route | Module Domain | Auth Scope | Primary Purpose |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | `POST` | `/api/auth/register` | Authentication | Public | Register brand or creator studio account |
| **2** | `POST` | `/api/auth/login` | Authentication | Public | Authenticate credentials or Google OAuth idToken |
| **3** | `POST` | `/api/auth/logout` | Authentication | Authenticated | Invalidate current session & tokens |
| **4** | `GET` | `/api/auth/me` | Authentication | Authenticated | Retrieve active user session, role & balances |
| **5** | `PATCH` | `/api/auth/role` | Authentication | Authenticated | Switch active context (`brand` / `creator` / `admin`) |
| **6** | `GET` | `/api/creators` | Creators & Dossiers | Public | Faceted search & filter creators directory |
| **7** | `GET` | `/api/creators/:handle` | Creators & Dossiers | Public | Get creator dossier, portfolio & key takes |
| **8** | `POST` | `/api/creators` | Creators & Dossiers | Creator / Admin | Create & onboard verified creator profile |
| **9** | `PATCH` | `/api/creators/:id` | Creators & Dossiers | Creator / Admin | Update creator details, tools & portfolio |
| **10** | `POST` | `/api/briefs/draft` | Briefs & Matchmaking | Brand / Public | AI natural language brief concept parser |
| **11** | `POST` | `/api/briefs` | Briefs & Matchmaking | Brand | Create and publish new production brief |
| **12** | `GET` | `/api/briefs` | Briefs & Matchmaking | Authenticated | List briefs by client, status, or open pool |
| **13** | `GET` | `/api/briefs/:id` | Briefs & Matchmaking | Authenticated | Get complete brief specs, milestones & rights |
| **14** | `PATCH` | `/api/briefs/:id` | Briefs & Matchmaking | Brand / Admin | Update brief state, milestones, or scope |
| **15** | `GET` | `/api/briefs/:id/matches` | Briefs & Matchmaking | Authenticated | Compute AI-ranked creator matches for brief |
| **16** | `GET` | `/api/requests` | Communications | Authenticated | List inbound/outbound inquiry requests |
| **17** | `POST` | `/api/requests` | Communications | Brand | Dispatch direct production inquiry to creator |
| **18** | `PATCH` | `/api/requests/:id` | Communications | Creator / Admin | Accept or decline communication inquiry |
| **19** | `GET` | `/api/threads` | Communications | Authenticated | List all active message channels/threads |
| **20** | `GET` | `/api/threads/:id` | Communications | Participant | Get thread messages and media attachments |
| **21** | `POST` | `/api/threads/:id/messages` | Communications | Participant | Send message with prompt/take attachments |
| **22** | `GET` | `/api/payments/wallet` | Payments & Escrow | Authenticated | Fetch wallet balance, locked escrow & credits |
| **23** | `GET` | `/api/payments/transactions` | Payments & Escrow | Authenticated | Retrieve UPI / Card / Escrow transaction log |
| **24** | `POST` | `/api/payments/deposit` | Payments & Escrow | Brand / Admin | Deposit funds via UPI or Card gateway |
| **25** | `POST` | `/api/payments/escrow/lock` | Payments & Escrow | Brand | Lock funds into milestone escrow contract |
| **26** | `POST` | `/api/payments/escrow/release` | Payments & Escrow | Brand / Admin | Release locked milestone escrow to creator |
| **27** | `GET` | `/api/tracker/:briefId` | Production Tracker | Authenticated | Get stage lifecycle, takes & deliverables |
| **28** | `POST` | `/api/tracker/:briefId/takes` | Production Tracker | Creator | Upload iteration take (prompt, seed, URL) |
| **29** | `PATCH` | `/api/tracker/:briefId/takes/:n` | Production Tracker | Brand / Admin | Approve take or request visual adjustments |
| **30** | `POST` | `/api/tracker/:briefId/deliverables/approve` | Production Tracker | Brand | Sign off master deliverables & release license |
| **31** | `POST` | `/api/rights/verify` | Rights & Certificates | Authenticated | Generate & register commercial rights cert |
| **32** | `GET` | `/api/rights/certificates/:certId` | Rights & Certificates | Public | Cryptographic verification of clearance cert |
| **33** | `GET` | `/api/admin/metrics` | Platform Admin | Admin | Platform telemetry: GMV, escrow, creators |
| **34** | `GET` | `/api/admin/audit-logs` | Platform Admin | Admin | Fetch security, auth, and escrow audit logs |
| **35** | `POST` | `/api/admin/data/reset` | Platform Admin | Admin | Reset demo environment to golden seed data |

---

## 3. Detailed Functional Module Specifications

### Module 1: Authentication & User Management (`/api/auth`)

Manages user identity, JWT session tokens, Google OAuth token exchange, wallet balance summaries, and dynamic role context switching.

---

#### 1.1 `POST /api/auth/register`
- **Auth Scope:** Public
- **Description:** Registers a new brand or creator studio account.
- **Request Body:**
```json
{
  "email": "director@hyperreal.studio",
  "password": "Password123!",
  "name": "Devin Vance",
  "company": "Hyperreal Studio",
  "role": "creator"
}
```
- **Response Contract (201 Created):**
```json
{
  "user": {
    "id": "usr_9921",
    "email": "director@hyperreal.studio",
    "name": "Devin Vance",
    "company": "Hyperreal Studio",
    "role": "creator",
    "balanceInr": 0,
    "credits": 250
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 1.2 `POST /api/auth/login`
- **Auth Scope:** Public
- **Description:** Authenticates credentials or exchanges a Google OAuth ID token.
- **Request Body:**
```json
{
  "email": "brand@nexawave.in",
  "password": "SecretPassword123",
  "provider": "email",
  "idToken": null,
  "role": "brand"
}
```
- **Response Contract (200 OK):**
```json
{
  "user": {
    "id": "usr_1024",
    "email": "brand@nexawave.in",
    "name": "NexaWave Media",
    "role": "brand",
    "balanceInr": 1250000,
    "credits": 500
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 1.3 `POST /api/auth/logout`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Invalidates the current user session and revokes refresh tokens.
- **Request Body:** None
- **Response Contract (200 OK):**
```json
{
  "success": true,
  "message": "Session successfully invalidated"
}
```

---

#### 1.4 `GET /api/auth/me`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Retrieves the active user profile, assigned roles, and current balance counters.
- **Request Body:** None
- **Response Contract (200 OK):**
```json
{
  "id": "usr_1024",
  "name": "NexaWave Media",
  "email": "brand@nexawave.in",
  "role": "brand",
  "balanceInr": 1250000,
  "credits": 500
}
```

---

#### 1.5 `PATCH /api/auth/role`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Switches the active operational role context without re-authenticating.
- **Request Body:**
```json
{
  "role": "creator"
}
```
- **Response Contract (200 OK):**
```json
{
  "id": "usr_1024",
  "role": "creator",
  "updatedAt": "2026-10-13T20:00:00Z"
}
```

---

### Module 2: Creators & Portfolio Dossiers (`/api/creators`)

Powers director discovery, multi-facet parametric search, verification badge audits, and take scrubber inspection.

---

#### 2.1 `GET /api/creators`
- **Auth Scope:** Public
- **Description:** Faceted search and filtering across verified creator studios.
- **Query Parameters:**
  - `q`: Text search query against names, bio, and skills.
  - `specialization`: Array filter (e.g. `ai_film`, `product_ads`, `motion_graphics`).
  - `tool`: Array filter (e.g. `ComfyUI`, `Midjourney`, `Runway Gen-3`).
  - `contentType`: Array filter (`video`, `still`, `animation`).
  - `format`: Array filter (`9:16`, `16:9`, `1:1`).
  - `availability`: (`open`, `limited`, `booked`).
  - `maxPriceInr`: Number upper bound.
  - `verifiedToolsOnly`: Boolean.
  - `sort`: (`recommended`, `price_low`, `price_high`, `turnaround`).
- **Response Contract (200 OK):**
```json
{
  "creators": [
    {
      "id": "cr_01",
      "handle": "neura-cinema",
      "displayName": "Neura Cinema Studio",
      "headline": "Hyper-realistic commercial AI video & worldbuilding",
      "bio": "Specialized in cinematic camera control and consistent identity synthesis.",
      "location": "Bengaluru, India",
      "priceFromInr": 45000,
      "turnaroundDays": 5,
      "availability": "open",
      "specializations": ["ai_film", "product_ads"],
      "tools": [
        {
          "toolId": "comfyui",
          "name": "ComfyUI",
          "kind": "video",
          "usedFor": "Custom LoRA motion chaining",
          "verify": "evidence_attached"
        }
      ],
      "verification": {
        "tools": "reviewed",
        "workflow": "evidence_attached",
        "pastWork": "reviewed"
      },
      "portfolio": []
    }
  ],
  "total": 1,
  "relaxations": []
}
```

---

#### 2.2 `GET /api/creators/:handle`
- **Auth Scope:** Public
- **Description:** Retrieves complete creator profile dossier, tool verification proofs, and all portfolio pieces including iteration `keyTakes[]`.
- **Path Parameters:**
  - `handle`: Creator handle slug or unique ID.
- **Response Contract (200 OK):** Full `Creator` object (see Section 5 for schema).

---

#### 2.3 `POST /api/creators`
- **Auth Scope:** Creator / Admin (`Bearer <token>`)
- **Description:** Onboards or registers a new creator studio dossier.
- **Request Body:** Complete `Creator` onboarding payload.
- **Response Contract (201 Created):** Created `Creator` object with generated `id` and verification state.

---

#### 2.4 `PATCH /api/creators/:id`
- **Auth Scope:** Creator / Admin (`Bearer <token>`)
- **Description:** Updates creator profile metadata, pricing, availability status, or portfolio items.
- **Path Parameters:** `id`: Unique creator ID.
- **Request Body:** Partial update fields matching `CreatorSchema`.
- **Response Contract (200 OK):** Updated `Creator` object.

---

### Module 3: Production Briefs & Matchmaking (`/api/briefs`)

Handles AI-assisted brief synthesis from natural language, brief publishing, campaign lifecycle, and algorithmic creator ranking.

---

#### 3.1 `POST /api/briefs/draft`
- **Auth Scope:** Public / Brand
- **Description:** Natural language prompt parser that extracts structured campaign metadata, deliverables, suggested budget, and clarifying questions.
- **Request Body:**
```json
{
  "idea": "We need a 30s cinematic luxury perfume launch video set in a bioluminescent desert with 9:16 reels cuts."
}
```
- **Response Contract (200 OK):**
```json
{
  "draft": {
    "title": "Bioluminescent Desert Luxury Fragrance Commercial",
    "contentType": "video",
    "deliverables": [
      "1x 30s Master Commercial (16:9 4K)",
      "2x 15s Cutdowns (9:16 Social Reels)"
    ],
    "budget": 75000,
    "turnaroundDays": 7
  },
  "questions": [
    "Do you have a physical perfume bottle 3D CAD model or reference photos?",
    "Will you require an original synthetic AI voiceover soundtrack?"
  ]
}
```

---

#### 3.2 `POST /api/briefs`
- **Auth Scope:** Brand (`Bearer <token>`)
- **Description:** Publishes a confirmed production brief to the network.
- **Request Body:**
```json
{
  "title": "Cyber-Tea Launch Campaign",
  "brandName": "NexaWave Media",
  "objective": "Launch high-energy synthetic beverage visuals",
  "requirements": "Consistent glass refraction and splash dynamics",
  "contentType": "video",
  "styleTags": ["cyberpunk", "macro", "liquid_dynamics"],
  "referenceUrls": ["https://assets.retake.design/ref1.mp4"],
  "formats": [{ "aspectRatio": "9:16", "durationSec": 15 }],
  "deliverablesCount": 3,
  "preferredTools": ["ComfyUI", "Runway Gen-3"],
  "budgetInr": { "min": 50000, "max": 90000 },
  "commercialUse": {
    "uses": ["paid_social", "website"],
    "territory": "india",
    "termMonths": 12,
    "exclusivity": "category",
    "rightsTransfer": "license",
    "aiDisclosure": "must_label",
    "noModelTraining": true
  }
}
```
- **Response Contract (201 Created):** Full `Brief` object with assigned `id` and status `"open"`.

---

#### 3.3 `GET /api/briefs`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Lists briefs filtered by brand ownership, status (`draft`, `open`, `closed`), or public call sheets.
- **Query Parameters:** `status`, `brandId`, `limit`, `offset`.
- **Response Contract (200 OK):** `{"briefs": Brief[], "total": number}`.

---

#### 3.4 `GET /api/briefs/:id`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Retrieves detailed brief specifications, milestone allocations, and commercial use boundaries.
- **Path Parameters:** `id`: Unique brief ID.
- **Response Contract (200 OK):** Complete `Brief` object.

---

#### 3.5 `PATCH /api/briefs/:id`
- **Auth Scope:** Brand / Admin (`Bearer <token>`)
- **Description:** Modifies open brief parameters, deadline, budget, or updates status to `"closed"`.
- **Path Parameters:** `id`: Unique brief ID.
- **Request Body:** Partial `Brief` payload.
- **Response Contract (200 OK):** Updated `Brief` object.

---

#### 3.6 `GET /api/briefs/:id/matches`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Runs creator matchmaking algorithm against brief requirements and returns ranked creator scores.
- **Path Parameters:** `id`: Unique brief ID.
- **Response Contract (200 OK):**
```json
[
  {
    "creator": { "id": "cr_01", "displayName": "Neura Cinema Studio" },
    "score": 94,
    "reasons": [
      "Verified mastery in ComfyUI liquid LoRAs",
      "Turnaround time of 5 days matches target deadline",
      "Budget within target bracket"
    ]
  }
]
```

---

### Module 4: Communications & Messaging (`/api/requests`, `/api/threads`)

Facilitates structured inquiry requests (call sheets), negotiation threads, and media attachments with iteration take tags.

---

#### 4.1 `GET /api/requests`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Lists all incoming or outgoing production inquiries for the active user.
- **Query Parameters:** `status` (`pending`, `accepted`, `declined`).
- **Response Contract (200 OK):** `{"requests": CommunicationRequest[], "total": number}`.

---

#### 4.2 `POST /api/requests`
- **Auth Scope:** Brand (`Bearer <token>`)
- **Description:** Dispatches a structured production inquiry / call sheet invitation to a creator.
- **Request Body:**
```json
{
  "creatorId": "cr_01",
  "briefId": "br_4401",
  "projectTitle": "Cyber-Tea Launch Campaign",
  "proposedBudgetInr": 75000,
  "targetDeadline": "2026-11-01",
  "message": "We loved your bioluminescent take sequence and want you for our commercial spot."
}
```
- **Response Contract (201 Created):** `CommunicationRequest` object with `status: "pending"`.

---

#### 4.3 `PATCH /api/requests/:id`
- **Auth Scope:** Creator / Admin (`Bearer <token>`)
- **Description:** Accepts or declines an inquiry. Accepting automatically creates a corresponding `MessageThread`.
- **Path Parameters:** `id`: Request ID.
- **Request Body:**
```json
{
  "status": "accepted",
  "reason": "Available to start immediately."
}
```
- **Response Contract (200 OK):** Updated `CommunicationRequest` with newly linked `threadId`.

---

#### 4.4 `GET /api/threads`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Lists all conversation threads in which the user is a participant.
- **Response Contract (200 OK):** `{"threads": MessageThread[]}`.

---

#### 4.5 `GET /api/threads/:id`
- **Auth Scope:** Participant Only (`Bearer <token>`)
- **Description:** Retrieves message history and attached take assets for a thread.
- **Path Parameters:** `id`: Unique thread ID.
- **Response Contract (200 OK):** Complete `MessageThread` object with `messages[]`.

---

#### 4.6 `POST /api/threads/:id/messages`
- **Auth Scope:** Participant Only (`Bearer <token>`)
- **Description:** Posts a new message with optional take or prompt attachments.
- **Path Parameters:** `id`: Thread ID.
- **Request Body:**
```json
{
  "text": "Here is iteration Take #3 with adjusted specular lighting.",
  "attachments": [
    {
      "type": "take",
      "title": "Take #3 - Specular Adjustments",
      "takeNumber": 3,
      "url": "https://assets.retake.design/takes/cr01_take3.mp4",
      "details": "ComfyUI seed 994821034"
    }
  ]
}
```
- **Response Contract (201 Created):** Appended `Message` object.

---

### Module 5: Escrow, Payments & Studio Wallet (`/api/payments`)

Secures financial transactions by holding milestone funds in non-custodial multi-stage escrow until deliverables are verified.

---

#### 5.1 `GET /api/payments/wallet`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Fetches current wallet balance, locked escrow total, and available generation credits.
- **Response Contract (200 OK):**
```json
{
  "balanceInr": 1250000,
  "lockedEscrowInr": 150000,
  "credits": 500,
  "pendingPayoutsInr": 45000
}
```

---

#### 5.2 `GET /api/payments/transactions`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Retrieves ledger of deposits, escrow locks, escrow releases, and bank payouts.
- **Query Parameters:** `limit`, `offset`, `type`.
- **Response Contract (200 OK):**
```json
{
  "transactions": [
    {
      "id": "tx_8812",
      "type": "escrow_lock",
      "amountInr": 75000,
      "campaign": "Cyber-Tea Launch Campaign",
      "creatorOrBrand": "Neura Cinema Studio",
      "status": "completed",
      "date": "2026-10-12T14:30:00Z",
      "method": "Escrow"
    }
  ],
  "total": 1
}
```

---

#### 5.3 `POST /api/payments/deposit`
- **Auth Scope:** Brand / Admin (`Bearer <token>`)
- **Description:** Initiates wallet top-up via UPI or Card payment gateway.
- **Request Body:**
```json
{
  "amountInr": 100000,
  "method": "UPI",
  "vpa": "brand@okhdfcbank"
}
```
- **Response Contract (201 Created):** Transaction record with gateway redirect or confirmation.

---

#### 5.4 `POST /api/payments/escrow/lock`
- **Auth Scope:** Brand (`Bearer <token>`)
- **Description:** Locks required milestone funds into an escrow smart-vault for a brief.
- **Request Body:**
```json
{
  "briefId": "br_4401",
  "creatorId": "cr_01",
  "amountInr": 75000,
  "milestoneTitle": "Milestone 1: Take Iterations & Rough Cut"
}
```
- **Response Contract (201 Created):**
```json
{
  "success": true,
  "transactionId": "tx_8812",
  "lockedEscrowInr": 75000,
  "walletBalanceInr": 1175000
}
```

---

#### 5.5 `POST /api/payments/escrow/release`
- **Auth Scope:** Brand / Admin (`Bearer <token>`)
- **Description:** Releases milestone escrow funds directly to creator's available balance upon milestone sign-off.
- **Request Body:**
```json
{
  "briefId": "br_4401",
  "creatorId": "cr_01",
  "amountInr": 75000,
  "milestoneId": "ms_01"
}
```
- **Response Contract (200 OK):**
```json
{
  "success": true,
  "transactionId": "tx_8813",
  "releasedAmountInr": 75000,
  "payoutStatus": "transferred_to_creator"
}
```

---

### Module 6: Tracker & Deliverables Lifecycle (`/api/tracker`)

Synchronizes end-to-end production pipeline state (`invited` -> `proposal` -> `in_production` -> `review` -> `delivered`).

---

#### 6.1 `GET /api/tracker/:briefId`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Retrieves current production milestone stage, intermediate takes, and pending review feedback.
- **Path Parameters:** `briefId`: Unique brief ID.
- **Response Contract (200 OK):**
```json
{
  "id": "eng_901",
  "briefId": "br_4401",
  "creatorId": "cr_01",
  "stage": "in_production",
  "takes": [
    {
      "n": 1,
      "note": "Initial storyboard and prompt exploration",
      "tool": "Midjourney v6",
      "prompt": "Cyber-tea glass splash cinematic macro --ar 9:16",
      "mediaUrl": "https://assets.retake.design/take1.jpg",
      "status": "approved"
    },
    {
      "n": 2,
      "note": "Motion video generation with animated droplets",
      "tool": "Runway Gen-3",
      "mediaUrl": "https://assets.retake.design/take2.mp4",
      "status": "changes_requested"
    }
  ]
}
```

---

#### 6.2 `POST /api/tracker/:briefId/takes`
- **Auth Scope:** Creator Only (`Bearer <token>`)
- **Description:** Submits a new generation take for client review.
- **Path Parameters:** `briefId`: Unique brief ID.
- **Request Body:**
```json
{
  "n": 3,
  "note": "Adjusted droplet speed and lighting reflections",
  "tool": "ComfyUI + Wan2.1",
  "prompt": "Macro liquid splash neon backlight 4k 60fps",
  "mediaUrl": "https://assets.retake.design/take3.mp4"
}
```
- **Response Contract (201 Created):** Appended take record with status `"submitted"`.

---

#### 6.3 `PATCH /api/tracker/:briefId/takes/:n`
- **Auth Scope:** Brand / Admin (`Bearer <token>`)
- **Description:** Approves an intermediate take or requests visual revisions with timestamped notes.
- **Path Parameters:**
  - `briefId`: Unique brief ID.
  - `n`: Take index number (integer).
- **Request Body:**
```json
{
  "status": "approved",
  "feedback": "Lighting and speed are perfect. Proceed to master upscale."
}
```
- **Response Contract (200 OK):** Updated take object.

---

#### 6.4 `POST /api/tracker/:briefId/deliverables/approve`
- **Auth Scope:** Brand (`Bearer <token>`)
- **Description:** Final sign-off on master deliverables. Advances stage to `"delivered"`, triggers escrow payout release, and issues commercial rights certificate.
- **Path Parameters:** `briefId`: Unique brief ID.
- **Request Body:**
```json
{
  "masterPieceId": "mp_991",
  "clearanceConfirmed": true
}
```
- **Response Contract (200 OK):**
```json
{
  "success": true,
  "stage": "delivered",
  "certificateId": "RTK-CERT-148F-2026",
  "escrowPayoutReleased": true
}
```

---

### Module 7: Legal Clearance & Rights Certificates (`/api/rights`)

Generates and cryptographically verifies immutable Commercial Rights Clearance Certificates guaranteeing non-model-training compliance.

---

#### 7.1 `POST /api/rights/verify`
- **Auth Scope:** Authenticated (`Bearer <token>`)
- **Description:** Generates and cryptographically signs a commercial rights clearance certificate.
- **Request Body:**
```json
{
  "campaignTitle": "Cyber-Tea Launch Campaign",
  "brandName": "NexaWave Media",
  "creatorId": "cr_01",
  "commercialUse": {
    "uses": ["paid_social", "website"],
    "territory": "india",
    "termMonths": 12,
    "exclusivity": "category",
    "rightsTransfer": "license",
    "aiDisclosure": "must_label",
    "noModelTraining": true
  }
}
```
- **Response Contract (201 Created):**
```json
{
  "certificateId": "RTK-CERT-148F-2026",
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "issuedAt": "2026-10-13T20:00:00Z",
  "status": "VERIFIED_AUTHENTIC",
  "spec": {
    "campaignTitle": "Cyber-Tea Launch Campaign",
    "brandName": "NexaWave Media",
    "noModelTrainingWarranty": true
  }
}
```

---

#### 7.2 `GET /api/rights/certificates/:certId`
- **Auth Scope:** Public
- **Description:** Verifies authenticity of a clearance certificate and displays warranty clauses.
- **Path Parameters:** `certId`: Certificate identifier (e.g. `RTK-CERT-148F-2026`).
- **Response Contract (200 OK):** Full certificate specification with SHA-256 validation proof.

---

### Module 8: Platform Administration & Telemetry (`/api/admin`)

Provides platform telemetry, escrow health monitoring, audit logs, and development environment seed resets.

---

#### 8.1 `GET /api/admin/metrics`
- **Auth Scope:** Admin Only (`Bearer <token>`)
- **Description:** Returns aggregate platform metrics and financial indicators.
- **Response Contract (200 OK):**
```json
{
  "totalCreators": 48,
  "activeBriefs": 14,
  "totalEscrowInr": 1850000,
  "takesProducedToday": 142,
  "activeChannels": 29
}
```

---

#### 8.2 `GET /api/admin/audit-logs`
- **Auth Scope:** Admin Only (`Bearer <token>`)
- **Description:** Fetches system security, escrow movements, and authentication events.
- **Query Parameters:**
  - `limit`: Integer (default: 50).
  - `offset`: Integer (default: 0).
  - `tag`: (`SYSTEM`, `COMMS`, `ESCROW`, `AUTH`).
- **Response Contract (200 OK):**
```json
{
  "logs": [
    {
      "id": "log_101",
      "timestamp": "2026-10-13T19:55:00Z",
      "tag": "ESCROW",
      "severity": "info",
      "actor": "usr_1024",
      "message": "Escrow vault locked ₹75,000 for brief br_4401"
    }
  ],
  "total": 1
}
```

---

#### 8.3 `POST /api/admin/data/reset`
- **Auth Scope:** Admin Only (`Bearer <token>`)
- **Description:** Resets database tables back to default golden seed fixtures.
- **Request Body:** None
- **Response Contract (200 OK):**
```json
{
  "success": true,
  "message": "Demo database successfully restored to golden seed state"
}
```

---

## 4. Explicitly Excluded Routes & Client-Side Subsystems

> [!CAUTION]
> **CRITICAL ARCHITECTURAL BOUNDARY: STRICTLY EXCLUDED FROM BACKEND**
> The following **12 routes and client subsystems** are handled entirely inside the Next.js frontend application runtime. The backend service **MUST NOT** implement or intercept these routes. Attempting to proxy or serve these from the backend will disrupt Next.js App Router hydration and client state.

| Excluded Route / Subsystem | Classification | Architectural Justification (Why Excluded) |
| :--- | :--- | :--- |
| `GET /` | Next.js Page | Homepage & Screening Room showcase view. Rendered entirely by Next.js App Router (`app/page.tsx`). |
| `GET /discover` | Next.js Page | Creators browse catalog and search interface (`app/discover/page.tsx`). Fetches data via `GET /api/creators`. |
| `GET /briefs/new` | Next.js Page | Interactive brief drafting form and natural language pitch prompt editor (`app/briefs/new/page.tsx`). |
| `GET /briefs/:id` | Next.js Page | Brief dossier view, call sheet card renderer, and creator match ranking UI (`app/briefs/[id]/page.tsx`). |
| `GET /creators/:handle` | Next.js Page | Creator portfolio dossier page with interactive take scrubber controls (`app/creators/[handle]/page.tsx`). |
| `GET /dashboard` | Next.js Page | Role-adaptive client dashboard for active campaigns and milestones (`app/dashboard/page.tsx`). |
| `GET /tracker` | Next.js Page | Production pipeline milestone tracker & take reviewer UI (`app/tracker/page.tsx`). |
| `GET /messages` | Next.js Page | Communications inbox, negotiation threads, and media attachment manager (`app/messages/page.tsx`). |
| `GET /admin` | Next.js Page | Developer Platform Admin Console UI (`app/admin/page.tsx`). |
| `GET /studio` | Next.js Page | Director Studio, take scrubber sandbox, and ComfyUI topology viewer (`app/studio/page.tsx`). |
| **Web Audio Synthesizer** | Client Audio Engine | In-browser mechanical micro-clicks, pitch-modulated scrub ticks (1.35x/0.75x), and C5-E5-G5 harmonic legal chimes (`lib/client/audio.ts`). |
| **Theme Engine & Variables** | Client Style System | Dark/light mode switching via `data-theme` and `localStorage` (`lib/client/theme.ts`). Managed entirely with CSS custom properties. |

---

## 5. Data Contract Schemas & TypeScript Types Reference

All database models and backend payload validation must strictly conform to the Zod contract schemas located at [`frontend/lib/contract/schemas.ts`](file:///home/ghost/aiccm/frontend/lib/contract/schemas.ts).

### 5.1 Core Domain Entities

```typescript
// 1. Aspect Ratio & Content Types
export type AspectRatio = "9:16" | "1:1" | "4:5" | "16:9" | "21:9";
export type ContentType = "video" | "animation" | "still" | "audio" | "mixed";

// 2. Specializations
export type Specialization =
  | "ai_film"
  | "ai_animation"
  | "product_ads"
  | "motion_graphics"
  | "fashion_lookbook"
  | "music_video"
  | "social_shorts"
  | "brand_mascots";

// 3. Commercial Rights & Usage
export type Usage =
  | "organic_social"
  | "paid_social"
  | "broadcast_ctv"
  | "out_of_home"
  | "website"
  | "internal_only";

export interface CommercialUse {
  uses: Usage[];
  territory: "india" | "apac" | "global";
  termMonths: number;
  exclusivity: "none" | "category" | "full";
  rightsTransfer: "license" | "buyout";
  aiDisclosure: "must_label" | "creator_discretion";
  noModelTraining: boolean;
}

// 4. Verification State
export type VerifyState = "unverified" | "self_declared" | "evidence_attached" | "reviewed";

// 5. Creator Tool Profile
export interface CreatorTool {
  toolId: string;
  name: string;
  kind: "video" | "image" | "audio" | "llm" | "editing" | "upscale";
  usedFor: string;
  verify: VerifyState;
}

// 6. Generation Take
export interface Take {
  n: number;
  imageUrl: string;
  tool: string;
  prompt?: string;
  whatChanged: string;
}

// 7. Portfolio Piece
export interface PortfolioPiece {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  aspectRatio: AspectRatio;
  mediaUrl: string;
  posterUrl: string;
  toolsUsed: string[];
  takesCount: number;
  keyTakes: Take[];
  workflow: {
    order: number;
    tool: string;
    what: string;
    imageUrl?: string;
  }[];
  hoursSpent?: number;
  rights: "commercial_cleared" | "personal_only" | "client_owned";
  rightsBasis?: string;
  isSample: boolean;
}

// 8. Creator Master Profile
export interface Creator {
  id: string;
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  location?: string;
  avatarUrl?: string;
  specializations: Specialization[];
  skills: string[];
  tools: CreatorTool[];
  contentTypes: ContentType[];
  formats: AspectRatio[];
  turnaroundDays: number;
  priceFromInr: number;
  availability: "open" | "limited" | "booked";
  verification: {
    tools: VerifyState;
    workflow: VerifyState;
    pastWork: VerifyState;
  };
  portfolio: PortfolioPiece[];
  isSample: boolean;
}

// 9. Production Brief
export interface Brief {
  id: string;
  brandName: string;
  title: string;
  objective: string;
  requirements: string;
  contentType: ContentType;
  styleTags: string[];
  referenceUrls: string[];
  formats: {
    aspectRatio: AspectRatio;
    durationSec?: number;
  }[];
  deliverablesCount: number;
  preferredTools: string[];
  budgetInr?: {
    min: number;
    max: number;
  };
  deadline?: string;
  commercialUse: CommercialUse;
  status: "draft" | "open" | "closed";
  createdAt: string;
}

// 10. Communication Request & Thread
export type CommunicationStatus = "pending" | "accepted" | "declined" | "in_production" | "completed";

export interface CommunicationRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: "brand" | "creator";
  fromCompany?: string;
  toUserId: string;
  toUserName: string;
  toUserRole: "brand" | "creator";
  briefId?: string;
  projectTitle: string;
  proposedBudgetInr?: number;
  targetDeadline?: string;
  message: string;
  status: CommunicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: "brand" | "creator" | "admin";
  text: string;
  attachments?: {
    type: "take" | "prompt" | "brief" | "link";
    title: string;
    url?: string;
    takeNumber?: number;
    details?: string;
  }[];
  timestamp: string;
}

export interface MessageThread {
  id: string;
  requestId?: string;
  projectTitle: string;
  status: CommunicationStatus;
  participants: {
    id: string;
    name: string;
    role: "brand" | "creator" | "admin";
    company?: string;
    avatarUrl?: string;
  }[];
  budgetInr?: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: Record<string, number>;
  messages: Message[];
}
```

---

## 6. Verification Sign-Off & Handover Notice

> [!NOTE]
> **HANDOVER & INTEGRATION NOTICE**  
> This specification represents the complete, binding technical agreement between the Retake frontend and backend engineering teams.  
> - **All 35 backend endpoints** are documented with authentication scopes, payload shapes, and status code expectations.  
> - **All 12 frontend routes and client subsystems** are explicitly demarcated as excluded from backend routing.  
> - For schema extensions or contract modifications, update [`frontend/lib/contract/schemas.ts`](file:///home/ghost/aiccm/frontend/lib/contract/schemas.ts) in coordination with the Retake Architecture Core.
