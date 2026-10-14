# Retake — Design Plan

## 1. Concept: The Grading Suite

Colourists grade footage in rooms painted neutral grey so nothing but the picture carries colour. We borrow that.
The Retake interface is neutral grey. The only colour on any page is the creators' work, plus two tiny functional signals:
1. The on-air `tally` red (`#E8341C`) — primary actions, open-for-work indicators, "needs your answer" markers.
2. The verified `bar` green (`#0B7A43`) — verified evidence checks.

Boldness is concentrated in one signature element: the **Take Scrubber**. Everything else is quiet, disciplined, and razor-sharp.

---

## 2. Design Tokens

| Token | Hex | Role | Contrast Ratio |
|---|---|---|---|
| `surround` | `#B9B9B9` | Page background canvas | 10.4:1 vs black text |
| `panel` | `#E5E5E5` | Surfaces, rows, call sheet cards | 15.7:1 vs black text |
| `ink` | `#000000` | Primary text, screening room floor | Maximum |
| `paper` | `#FFFFFF` | Form inputs, text on ink black | High |
| `muted` | `#3D3D3D` | Secondary captions, metadata | 5.5:1 on surround, 9:1 on panel |
| `tally` | `#E8341C` | Primary buttons, open status, gap warnings | 4.9:1 with black text (never white text) |
| `bar` | `#0B7A43` | Evidence-verified marks | 4.3:1 on panel, 5.4:1 on paper |

### Structural Constraints
- **Radii**: Media frames `0px` (square cinema crop). Controls and inputs `3px`. Tally status dot `50%` (circle).
- **Shadows**: Strict `none` (zero box-shadows anywhere). Elevation is defined purely by value contrast (`surround` vs `panel` vs `ink`).
- **Dividers**: 1px `ink` rules used sparingly.

---

## 3. Typography

- Single typeface family: **Archivo** (Google Font variable axes: `wght` 400–800, `wdth` 62–110).
- Monospace stack: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` strictly for generation prompts and seed parameters.
- Text scale:
  - Display headline: 112px (56px mobile), `wdth: 62–68`, `wght: 800`, line-height: 0.95.
  - Page title: 56px (40px mobile), `wdth: 66–72`, `wght: 800`.
  - Section title: 32px, `wdth: 75`, `wght: 700`.
  - Lead: 22px, `wdth: 100`, `wght: 400`.
  - Body: 17px, line-height 1.5, max 68ch.
  - UI labels: 14–17px, `wdth: 100–110`, tabular figures.

---

## 4. Five ASCII Wireframes

### Wireframe 1: Home
```
┌────────────────────────────────────────────────────────────────────────┐
│ Retake ●               Find creators    Post a brief    For creators   │
├────────────────────────────────┬───────────────────────────────────────┤
│ Every AI piece is              │ ┌───────────────────────────────────┐ │
│ somebody's 23rd take.          │ │        MediaFrame (4:5)           │ │
│                                │ └───────────────────────────────────┘ │
│ Retake shows the takes, tools   │ ●─────┬─────┬─────┬─────●             │
│ and prompts behind AI work,    │ Take 1  Take 4  Take 9  Take 23 final │
│ so you hire on process.        │ Take 9 of 23 · Kling                  │
│                                │ Prompt: luxury perfume ad...          │
│ [Find a creator]  [Post brief] │ What changed: Rim light and droplets  │
├────────────────────────────────┴───────────────────────────────────────┤
│ 3 Full-Width Creator Rows (Mira, Arjun, Sofia)                         │
├────────────────────────────────────────────────────────────────────────┤
│ Two Doors: [ I'm hiring ]    |    [ I make things with AI ]            │
└────────────────────────────────────────────────────────────────────────┘
```

### Wireframe 2: Discover (Faceted Search & Relaxations)
```
┌─────────────────┬──────────────────────────────────────────────────────┐
│ Sticky Rail     │ 7 creators   [Runway ×] [9:16 ×] [Verified ×]        │
│ Search input    │ Sort: Best match | Fastest | Newest                  │
│ ─────────────── ├──────────────────────────────────────────────────────┤
│ Specializations │ Mira Okonkwo           ┌────┐ ┌──────┐ ┌──┐          │
│ Tools (counts)  │ AI filmmaker for...    │4:5 │ │16:9  │ │11│          │
│ Content type    │ Runway ✓ Kling ✓       └────┘ └──────┘ └──┘          │
│ Formats         │ From ₹25,000, 4 days                                 │
│ Price slider    │ ● Open for work  Sample                              │
│ Availability    ├──────────────────────────────────────────────────────┤
│ Verified only   │ [Empty state exit if 0 matches:                      │
│                 │  Nothing matches all 2 filters.                      │
│                 │  Drop Runway (2) | Drop 9:16 (2) | Clear all]        │
└─────────────────┴──────────────────────────────────────────────────────┘
```

### Wireframe 3: Creator Profile & Screening Room
```
┌────────────────────────────────────────────────────────────────────────┐
│ Mira Okonkwo  @mira-okonkwo  ● Open for work    [Invite to a brief]    │
│ AI filmmaker for beauty and fragrance · Lagos, Nigeria                 │
├────────────────────────────────────────────────────────────────────────┤
│ SCREENING ROOM (FULL BLEED INK #000000)                                │
│ ┌───────────────────────────────────────┐  Basalt, a fragrance still   │
│ │ MediaFrame (4:5)                      │  23 takes · 14 hours         │
│ └───────────────────────────────────────┘  Commercial cleared          │
│ ●─────┬─────┬─────┬─────●                 [Filmstrip of other pieces] │
│ Take 9 of 23 · Kling · Prompt details                                  │
├────────────────────────────────────────────────────────────────────────┤
│ Process: 1. Midjourney comp  2. Lighting refinement  3. Magnific 4k    │
│ Tool Stack: Table with Tools, Kinds, Used For, Verification checkmarks │
│ Rights Basis: Generated on paid plans with commercial license.         │
│ Verification Evidence Signals: Tools ✓  Workflow ✓  Past Work ✓        │
└────────────────────────────────────────────────────────────────────────┘
```

### Wireframe 4: Brief Builder & Live Call Sheet
```
┌─ Start with Rough Idea ────────────────────────────────────────────────┐
│ [Three Instagram Reels for our monsoon sneaker drop, premium feel]     │
│ [Build my brief]   or  [Start from blank]                              │
├────────────────────────────────────┬───────────────────────────────────┤
│ Campaign Details                   │ CALL SHEET (Live Document)        │
│ Content Type (Video/Anim/Still)    │ Title: Monsoon sneaker drop       │
│ Aspect Ratio Picker (to scale)     │ 9 of 12 fields filled             │
│ ┌──┐ ┌──┐ ┌────┐ ┌─────┐ ┌──────┐  │ ▌ Needs your answer: Budget range │
│ │916 │11│ │4:5 │ │16:9 │ │21:9  │  │ ▌ Needs your answer: Deadline     │
│ └──┘ └──┘ └────┘ └─────┘ └──────┘  │ Commercial Use Summary:           │
│ Rights Matrix (Interactive grid)   │ Paid social in India, 12 months   │
│ Budget & Deadline inputs           │ [Publish brief]                   │
└────────────────────────────────────┴───────────────────────────────────┘
```

### Wireframe 5: Brief Detail with Ranked Matches & Engagement Tracker
```
┌────────────────────────────────────┬───────────────────────────────────┤
│ Monsoon Sneaker Drop               │ Ranked Matches (4 Creators)       │
│ Brand: Stride Studio               │ 1. Mira Okonkwo   Score: 94%      │
│ Status: Open · 3 deliverables      │    - Works in 4:5 and video       │
│ Budget: ₹20,000 – ₹40,000          │    - Covers preferred Runway tool │
│ Deadline: 7 days                   │    - 4-day turnaround fits 7 days │
│ Commercial: Paid social, India     │    [Invite to brief]              │
│ ────────────────────────────────── │ 2. Arjun Patel    Score: 82%      │
│ Lightweight Tracker (P3):          │    - Works in 9:16 format         │
│ [x] Invited                        │ 3. Dev Verma      Score: 68%      │
│ [ ] Proposal                       │    - Above budget (₹90k)          │
│ [ ] In production                  │ 4. Sofia Chen     Score: 45%      │
│ [ ] Review (Takes 1-3)             │    - Booked, no format overlap    │
│ [ ] Delivered                      │                                   │
└────────────────────────────────────┴───────────────────────────────────┘
```

---

## 5. Principles & Banned Tells

- **Grey Discipline**: Zero gradient blobs, zero cream backgrounds, zero soft box shadows.
- **Left Alignment**: Natural documentary reading flow, no centered heroes.
- **Copy Restraint**: Direct, human, specific. No marketing buzzwords (`revolutionize`, `cutting-edge`, `unleash`, `supercharge`).
- **Native Range Controls**: Styled HTML5 `<input type="range">` ensures full accessibility (arrow keys, screen readers, keyboard navigation).
