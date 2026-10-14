# Redesign Plan: "Instagram Feed Meets Fiverr Marketplace"
**Repository Audit & Implementation Blueprint**

---

## 1. Stack Detection
- **Framework**: Next.js 16.4.0 (App Router), React 19.3.0
- **Styling System**: Tailwind CSS v4 (`@tailwindcss/turbopack`), custom CSS variables in `app/globals.css`
- **Iconography**: Custom inline SVG icon set (`components/icons.tsx`), zero third-party icon libraries
- **Test Setup**: Vitest 5.0.4 with JSDOM and `@testing-library/react` (12 test suites, 73 passing tests)
- **Local Dev Server**: Next.js dev running on port 3005 (`http://localhost:3005`)

---

## 2. Route List
All 11 application routes will be preserved without any modifications to URL structure or routing logic:

| Route Path | File Location | Purpose & Existing Functionality |
| :--- | :--- | :--- |
| `/` | `app/page.tsx` | Home visual feed, story rings, hero media take, interactive scrubber |
| `/discover` | `app/discover/page.tsx` | Marketplace browse, category chips, search bar, filter rail, relaxation banners |
| `/creators/[handle]` | `app/creators/[handle]/page.tsx` | Creator profile, 3-col portfolio grid, process proof, hire panel, take viewer |
| `/briefs/new` | `app/briefs/new/page.tsx` | Post a brief, AI natural language brief drafting, rights matrix, call sheet |
| `/briefs/[id]` | `app/briefs/[id]/page.tsx` | Brief details view, ranked creator matches, invite/hire trigger |
| `/briefs` | `app/briefs/page.tsx` | Briefs catalog and status listing |
| `/messages` | `app/messages/page.tsx` | Real-time direct communication threads, inbox, inquiry accept/decline |
| `/dashboard` | `app/dashboard/page.tsx` | Buyer (brand) & seller (creator) operations dashboard, balance, milestone escrow |
| `/tracker` | `app/tracker/page.tsx` | Order milestone progress tracker (invited → proposal → in_production → review → delivered) |
| `/studio` | `app/studio/page.tsx` | Director studio, keyboard-driven take scrubber, rights matrix certificate |
| `/admin` | `app/admin/page.tsx` | Admin & escrow operations console (secured behind PIN `0000` gate) |

---

## 3. Component Inventory

| Component Name | Source File | Current Render Output | Where It Is Used |
| :--- | :--- | :--- | :--- |
| `AppHeader` | `components/header.tsx` | Desktop left sidebar (244px) + mobile top/bottom bars | `app/layout.tsx` |
| `CreatorStories` | `components/creator-stories.tsx` | Horizontal scrollable story rings | `app/page.tsx` |
| `CreatorRow` | `components/creator-row.tsx` | Horizontal creator list row with media frames | `app/discover/page.tsx` |
| `FilterRail` | `components/filter-rail.tsx` | Left filter panel with tools, formats, price, availability | `app/discover/page.tsx` |
| `EmptyResults` | `components/empty-results.tsx` | 0-matches banner with filter relaxation actions | `app/discover/page.tsx` |
| `GradientMedia` | `components/gradient-media.tsx` | 4:5 / 16:10 visual media canvas with take badges | `app/page.tsx`, `components/take-viewer-modal.tsx` |
| `TakeViewerModal`| `components/take-viewer-modal.tsx` | Lightbox modal with take filmstrip & prompt telemetry | `app/page.tsx`, `app/discover/page.tsx` |
| `TakeScrubber` | `components/take-scrubber.tsx` | Live iteration scrubber with J/K shortcuts | `app/page.tsx`, `app/studio/page.tsx` |
| `CreatorActions` | `components/creator-actions.tsx` | "Invite to a brief" and "Message" profile buttons | `app/creators/[handle]/page.tsx` |
| `ScreeningRoom` | `components/screening-room.tsx` | Video/take inspection player | `app/creators/[handle]/page.tsx` |
| `CommunicationModal`| `components/communication-modal.tsx`| Direct collaboration proposal & messaging modal | Throughout app |
| `BriefDetailView` | `components/brief-detail-view.tsx` | Brief specification and matched creator cards | `app/briefs/[id]/page.tsx` |
| `RightsMatrix` | `components/rights-matrix.tsx` | Commercial usage, territory, term, and exclusivity matrix | `app/briefs/new/page.tsx`, `app/studio/page.tsx` |
| `CallSheet` | `components/call-sheet.tsx` | Pre-production call sheet review | `app/briefs/new/page.tsx` |
| `MessagesInbox` | `components/messages-inbox.tsx` | Conversation thread selector and message pane | `app/messages/page.tsx`, `app/dashboard/page.tsx` |
| `AdminPinGate` | `components/admin-pin-gate.tsx` | Passcode `0000` gate with brute-force lockout | `app/admin/page.tsx` |
| `OpenForWorkRail` | `components/open-for-work-rail.tsx` | Right rail for "Open to work this week" | `app/page.tsx` |
| `PaymentModal` | `components/payment-modal.tsx` | UPI Escrow deposit simulation modal | `app/dashboard/page.tsx` |
| `ThemeToggle` | `components/theme-toggle.tsx` | Theme mode toggle | `components/header.tsx` |
| `Icons` | `components/icons.tsx` | Inline SVG icon library | Throughout app |

---

## 4. Current Style System vs. New Tokens

### Current System
- Hardcoded dark backgrounds (`#09090b`), off-white panels, mixed borders (`#3f3f46`), and ad-hoc Tailwind classes.
- Gradients used broadly across surfaces.

### New Instagram Meets Fiverr Token Architecture
Exact design tokens defined in `app/globals.css`:
```css
:root {
  /* Specified palette */
  --bg: #FAFAFA;                 /* page background */
  --surface: #FFFFFF;            /* cards, modals, navbar, sidebar */
  --border: #DBDBDB;             /* dividers and card borders */
  --text: #262626;              /* primary text */
  --text-secondary: #8E8E8E;    /* LARGE text, icons, disabled only */
  --link: #0095F6;              /* large links, icons, focus ring */
  --accent: #FCAF45;            /* badges, stars, highlights */
  --gradient-primary: linear-gradient(45deg, #405DE6, #C13584, #FD1D1D);

  /* Derived tokens, required for WCAG 2.2 AA contrast */
  --text-secondary-aa: #6B6B6B;  /* secondary text 16px and below (5.3:1 on white, 5.1:1 on bg) */
  --link-aa: #0074CC;            /* link text and button fills with white text (4.8:1) */
  --link-aa-hover: #005FA8;      /* hover state (6.6:1) */
  --control-border: #8E8E8E;     /* input, checkbox, radio boundaries (3.3:1) */
  --danger-aa: #C41A1A;          /* errors (6.0:1 on white) */
  --success-aa: #1B7F3B;         /* available / success (5.1:1 on white) */
  --gradient-text-safe: linear-gradient(45deg, #405DE6, #C13584); /* safe behind white text */
  --gradient-ring: linear-gradient(45deg, #FCAF45, #FD1D1D 35%, #C13584 70%, #405DE6); /* story ring only */
}
```

### Strict 5 Allowed Uses of Gradient:
1. **Story ring** around creator avatars (`--gradient-ring`)
2. **Wordmark** text (`retake`)
3. **Post a brief** compose action (center tab on mobile, button in sidebar on desktop)
4. **Active indicator** (2px underline under active category or tab, progress segments)
5. **Featured badge outline**

---

## 5. Mapping Table

| Existing Component / Page | New Design Element | Changes Required |
| :--- | :--- | :--- |
| `components/header.tsx` | Responsive Shell (Sidebar on desktop 244px, Tab bar on mobile 56-68px) | Update sidebar width to 244px with wordmark, Home, Browse, Post a brief (gradient compose), Orders, Messages, Profile, and Buying/Selling toggle. On mobile: bottom tab bar with 5 tabs and central gradient compose button. |
| Category filter chips | `components/category-strip.tsx` (New) | Horizontal scrollable strip of service categories ("AI Film", "AI Animation", "Product Ads", "Motion Graphics", "Fashion Lookbooks", "Music Video", "Social Shorts", "Brand Mascots") with 2px gradient active underline. |
| `components/creator-row.tsx` | `components/gig-card.tsx` (New) | 4:5 cover media star, verified tools badge, story-ring avatar, creator name + headline, tool chips (max 3), "No reviews yet" or rating, turnaround ("4-day delivery"), price ("From ₹25,000"), and separate [Hire] button. `CreatorRow` acts as backwards-compatible adapter. |
| `components/creator-stories.tsx`| Story Ring Row | 3px `--gradient-ring` with 3px white gap for new work, neutral `--border` ring for seen work. Accessible names: "Name, new work". |
| `app/creators/[handle]/page.tsx`| Instagram-Style Grid Profile + Fiverr Action Panel | Header with large story-ring avatar, handle, verified badge, [Hire / Invite] (`--link-aa`) + [Message], bio, stats row. Sticky hire action panel on desktop. 4 tabs: Portfolio, Process, Tools, Rights. 3-column portfolio grid below. |
| `components/filter-rail.tsx` | Slide-over / docked filter panel | Docked left on desktop (3-4 col grid), slide-over/bottom sheet on mobile/tablet. Checkbox/radio borders use `--control-border`. Active chips above results. |
| `app/page.tsx` (Home) | Visual Feed of Gig Cards | Story ring row at top, category strip, single-column visual feed of gig cards (max width 630px), optional right rail for "Open for work" creators. |
| `app/discover/page.tsx` (Browse)| Marketplace Search & Grid | Sticky top search bar, category strip, docked filter panel, 3-4 column gig card grid with live count and relaxation banners. |
| `app/briefs/new/page.tsx` & modals | Stepper Brief-to-Hire Modal / Page | 3-step wizard (Details, Rights, Review) with Fiverr-style right summary panel (creator, price, delivery, formats). |
| `app/tracker/page.tsx` | Order Tracker | Progress tracker through existing `Engagement` stages: Invited → Proposal → In Production → Review → Delivered. |
| `app/dashboard/page.tsx` | Buyer & Seller Dashboard | Clean white card surfaces, tabs for briefs, milestones, inquiries, and earnings/escrow. |

---

## 6. Flagged Items ("Cannot Map" List)

1. **Ratings & Numeric Reviews**:
   - *Why*: The data schema `CreatorSchema` does not include numeric ratings (e.g. 4.9) or review counts.
   - *Action taken*: Display "No reviews yet" in `--text-secondary-aa` or omit stars. We strictly do **not** invent fake reviews.
   - *Needed for full support*: A rating/review model in the shared data contract.
2. **Price Packages / Tiers (Basic / Standard / Premium)**:
   - *Why*: The schema only provides `priceFromInr` (e.g. 25,000) and `turnaroundDays` (e.g. 4).
   - *Action taken*: Render "From ₹25,000" and "4-day delivery" clearly on gig cards and hire panels.
   - *Needed for full support*: Tiered deliverables data in `CreatorSchema`.
3. **Seller Levels (e.g. Level 1 / Top Rated)**:
   - *Why*: No seller gamification tier exists in the database.
   - *Action taken*: Leverage `verification.tools` ("Verified tools") and `isSample` badges.
4. **Saved / Favorite Creators Backend Persistence**:
   - *Why*: No backend database table for saved favorites.
   - *Action taken*: In-memory / `localStorage` save state on cards.

---

## 7. Implementation Phase Plan

- **Phase 1 (P1)**: Design tokens, CSS variables, typography, and responsive shell (navbar, desktop 244px sidebar, mobile bottom tab bar, category strip).
- **Phase 2 (P2)**: Shared components (`GigCard`, `StoryRing`, `Rating`, `Badge`, `CategoryStrip`, `FilterPanel`, portfolio grid, empty/loading skeletons).
- **Phase 3 (P3)**: Home feed (visual feed of gig cards + stories) and Browse/Search page (`/discover`).
- **Phase 4 (P4)**: Creator profile (`/creators/[handle]`), 3-col portfolio grid, sticky hire panel, and take viewer modal.
- **Phase 5 (P5)**: Brief-to-hire stepper flow (`/briefs/new`, `/briefs/[id]`, `CommunicationModal`).
- **Phase 6 (P6)**: Buyer and Seller dashboards (`/dashboard`, `/tracker`, `/messages`).
- **Phase 7 (P7)**: WCAG 2.2 AA contrast verification, keyboard navigation pass, responsive testing (375px, 768px, 1440px), test suite execution, and final documentation.
