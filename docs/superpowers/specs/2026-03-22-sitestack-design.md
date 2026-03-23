# SiteStack — Design Spec

**Version:** 1.0
**Date:** 2026-03-22
**Competition:** AI.Edge Q1 2026 Build Competition (deadline March 31, 2026)

---

## Overview

SiteStack is an AI-powered deal initiation tool for incremental real estate developers. It enables a user with no access to institutional tools (CoStar, Argus, RealPage) to discover properties on a map, pull public data automatically via PIN/parcel number, run a Back-of-Envelope (BOE) financial model powered by Claude AI, manage deal contacts in a lightweight CRM, and draft broker outreach — all in one web app.

**Target user:** Incremental developer — doing smaller residential, commercial, or mixed-use deals without institutional resources.

**Competition angle:** Democratizes CRE deal analysis using only public data sources and AI, giving small developers the same analytical rigor as institutional players.

---

## Core User Flow

```
Map View → Pin Property → Property Profile (auto-fill via PIN)
       → Deal Contacts (owner auto-filled from tax data)
       → BOE Model (AI fills assumptions, two-way sync spreadsheet)
       → Save Deal → Export / Broker Email
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| Routing | React Router v6 |
| Map | Mapbox GL JS (free tier) |
| Spreadsheet viewer | Luckysheet (open source, Excel-like) |
| AI model builder | Claude API (`claude-sonnet-4-6`) |
| AI concept render | OpenAI DALL-E 3 |
| Excel export | SheetJS (`xlsx`) |
| PDF export | jsPDF + html2canvas |
| Styling | Tailwind CSS |
| Persistence | localStorage |
| County data | Configurable REST API (user sets endpoint) |
| Rent data | HUD Fair Market Rents API |
| Demographics | Census Bureau API |
| Street View | Google Maps Static API |

---

## Feature Inventory

### 1. Map View
- Full-screen Mapbox map as the default/home view
- Top nav: SiteStack logo | Map | Pipeline | ⚙️ Settings
- Pins on map for all saved deals (color-coded by deal type)
- Click map to add a new property (drop a pin, open profile flow)
- Search bar to jump to an address
- Bottom drawer: previews the currently selected deal (address, deal type, key returns)
  - "Open →" button navigates to full deal detail page
  - Drawer collapses when no deal is selected

### 2. Deal Detail Page
Three-tab layout: **Profile | Contacts | BOE Model**

Top bar (persistent across tabs):
- Back arrow → Map
- Address + deal type badge
- Save Deal button
- Export button (dropdown: Excel model, PDF summary, share link)

#### 2a. Profile Tab
- Street View image (Google Maps Static API via lat/lng)
- AI Concept Render (DALL-E 3, zoning-constrained — see section 5)
- Deal description field (user-written, freeform text)
- Property Facts panel (auto-filled from county API via PIN):
  - PIN, Lot Size, Zoning, Current Use, Assessed Value, Tax Year, Owner Name, Owner Address, Annual Taxes, Year Built

#### 2b. Contacts Tab
- Multiple contact cards per deal
- Contact roles: Owner/Seller, Listing Broker, Buyer's Broker, Attorney, Contractor, Custom
- Owner name + mailing address auto-populated from county tax data when PIN is entered
- Per-contact fields: Name, Role, Company, Phone, Email, Last Contacted
- "Draft Email" button on each contact (opens broker email flow using Claude)
- "Add Contact" row with role quick-chips
- No notes field

#### 2c. BOE Model Tab
Top strip:
- Deal type badge (auto-detected by Claude, user can override)
- Mode toggle: **Mode A — Know the Price** | **Mode B — Solve for Price**
- Re-run Claude button

Returns Bar (synced live with model):
- User-customizable — highlight any cell in the model → "Pin to Returns Bar" button appears in formula bar
- Each pinned metric shows label, value, cell reference (e.g. `[Returns!C42]`), and ✕ to remove
- Default pins: Levered IRR, Equity Multiple, Cash-on-Cash Yr 1, NOI, Total Dev Cost, Cost/Unit
- Pencils / Doesn't Pencil indicator (based on user-set hurdle rates)
- Export buttons: .xlsx, PDF

Model section (takes up majority of screen):
- Model source toggle: AI-Generated | Upload My Own
- Upload panel (visible in Upload mode): file picker for .xlsx, parses and displays in viewer
- Tab bar: Sources & Uses | Income & Expenses | Cash Flow | Returns
- Formula bar with cell reference + formula display + "Pin to Returns Bar" button when cell selected
- **Luckysheet embedded spreadsheet** — white background, no grid lines, A.CRE institutional design (see section 6)
- Two-way sync: edit spreadsheet cell → returns bar updates instantly; change mode/deal-type → model regenerates

---

## Section 3: Deal Types

Four supported deal types, each with a distinct BOE model structure:

| Deal Type | Key Metrics |
|---|---|
| Small Multifamily (2–20 units) | Units, avg rent/unit, hard cost/unit, NOI, cap rate, IRR |
| Small Commercial (retail/office) | NRA, rent/sf/yr, vacancy, hard cost/sf, NOI, cap rate, IRR |
| Mixed-Use | Residential units + retail/office sf combined |
| Single Family / ADU | Simpler model: acquisition + construction vs. ARV or rental income |

Claude auto-detects deal type from: zoning code, current use, lot size, and user's deal description. User can override via dropdown.

---

## Section 4: BOE Model Modes

### Mode A — Know the Price
**Inputs (user provides):**
- Asking price / acquisition cost
- GFA (gross floor area, sf)
- Units (if residential)
- Retail SF (if mixed-use/commercial)
- Hold period (years)
- Equity % (LTV)

**AI-filled assumptions (Claude):**
- Market rent per unit or per sf (from HUD FMR + Census CBP)
- Hard cost per sf (from RSMeans regional estimates)
- Soft costs % (ULI benchmarks)
- Vacancy rate (Census ACS)
- Exit cap rate (market-derived)
- Financing costs (current Fed rate context)
- Operating expense ratio

**Outputs:**
- Levered IRR
- Equity Multiple
- Cash-on-Cash (Year 1)
- Stabilized NOI
- Total Development Cost
- Cost per Unit (if residential)

### Mode B — Solve for Price
**Inputs (user provides):**
- Target Levered IRR (e.g. 15%)
- Target Equity Multiple (e.g. 1.8×)
- All other inputs same as Mode A (GFA, units, hold period, equity %)

**AI fills same assumptions as Mode A.**

**Output:**
- Maximum purchase price to hit target returns
- Sensitivity table: price vs. IRR at ±10% construction cost variance

---

## Section 5: AI Concept Render

When a deal is created/updated, Claude is called to infer zoning standards before calling DALL-E 3.

**Step 1 — Zoning standard inference (Claude):**
Input: zoning code (e.g. B3-3), municipality (e.g. Chicago, IL), lot size
Claude returns:
- Max height (stories + feet)
- Front/rear/side setbacks
- Ground floor use requirements
- Parking requirements (if any)
- Approximate FAR

**Step 2 — DALL-E 3 prompt construction:**
Claude generates a DALL-E prompt that incorporates:
- Deal type and proposed use
- Height/massing constraints from zoning
- Lot size and shape
- Neighborhood context (urban/suburban/rural from location)
- Architectural style: "modern urban infill, realistic architectural rendering, street-level perspective"

**Step 3 — Render:**
DALL-E 3 generates a 1024×1024 concept rendering.
Image is saved to deal record and displayed in Profile tab alongside Street View.

---

## Section 6: Model Design (A.CRE Standards)

The embedded Luckysheet spreadsheet follows A.CRE (Adventures in CRE) institutional formatting:

| Element | Style |
|---|---|
| Background | White (#ffffff) |
| Grid lines | None |
| Font | Calibri 10pt |
| Section headers | Dark navy fill (#1a3a6b), white bold uppercase text |
| Sub-headers | Light blue fill (#dce6f1), navy bold text |
| Input cells (B column) | Blue font (#1a56db), bold |
| Calculated cells (C column) | Black font (#111111) |
| Total rows | Double top+bottom border (#1a3a6b), bold black |
| Indented line items | 14px left padding |
| Alternating row shading | White / #f9f9f9 |
| AI-sourced values | Blue font + `🤖 [Source Name] ↗` link in Source column |
| Selected cell highlight | Blue outline + light blue fill (#e8f0fe) |

**Sheet tabs (per deal type — Mixed-Use example):**
1. Sources & Uses
2. Income & Expenses
3. Cash Flow (annual, 5-year hold)
4. Returns (IRR, equity multiple, cash-on-cash)

Claude generates the model as a structured JSON object that Luckysheet renders with real formulas. Every formula is visible in the formula bar.

**Two-way sync implementation:**
- Luckysheet `cellUpdated` event → recalculate returns → update Returns Bar state
- Returns Bar input changes → update corresponding Luckysheet cell via `luckysheet.setCellValue()`

---

## Section 7: Source Links

Every AI-filled assumption in the model has a clickable source link in the Source column. Links open in a new tab.

| Assumption | Source | Link target |
|---|---|---|
| Market rent (residential) | HUD Fair Market Rents | HUD FMR data page for that metro |
| Market rent (commercial) | Census County Business Patterns | Census CBP query for that county |
| Hard cost / sf | RSMeans regional estimate | RSMeans online (or NAHB cost data) |
| Soft costs % | ULI benchmarks | ULI publication reference |
| Vacancy rate | Census ACS | Census ACS table for that tract |
| Exit cap rate | Claude estimate | Claude's reasoning (modal tooltip) |
| Financing costs | Federal Reserve | Fed Funds rate page |

---

## Section 8: Contacts CRM

Each deal stores a contacts array. Each contact object:

```json
{
  "id": "uuid",
  "role": "listing_broker",
  "name": "Mike Torres",
  "company": "CBRE Chicago",
  "phone": "(312) 555-0192",
  "email": "m.torres@cbre.com",
  "lastContacted": "2026-03-18",
  "autoFilled": false
}
```

Owner contact is auto-created when county API returns owner name + mailing address. `autoFilled: true` shows a green badge.

**Broker Email Draft:**
Clicking "Draft Email" on any contact opens a modal. Claude is called with:
- Contact name, role, company
- Deal address, deal type, asking price or target price
- Key model outputs (IRR, equity multiple)
- User's name (from settings)

Claude returns a draft email. User can edit and copy.

---

## Section 9: Save / Load Deals

All deals stored in `localStorage` under key `sitestack_deals`.

Deal object schema:

```json
{
  "id": "uuid",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "address": "123 Main St, Chicago IL 60601",
  "lat": 41.8781,
  "lng": -87.6298,
  "dealType": "mixed_use",
  "description": "...",
  "propertyFacts": { ... },
  "contacts": [ ... ],
  "model": {
    "mode": "know_price",
    "inputs": { ... },
    "assumptions": { ... },
    "outputs": { ... },
    "luckysheetData": { ... },
    "pinnedCells": [ { "label": "Levered IRR", "sheet": "Returns", "row": 42, "col": 3 } ],
    "uploadedModel": null
  },
  "conceptRenderUrl": "data:image/png;base64,...",
  "streetViewUrl": "https://..."
}
```

---

## Section 10: Pipeline Summary

Route: `/pipeline`

Table view of all saved deals with columns:
- Address
- Deal Type
- Lot Size
- Asking Price (or Max Price if Mode B)
- Total Dev Cost
- Levered IRR
- Equity Multiple
- NOI
- Cost/Unit
- Status (user-set: Tracking / Active / Pass)

Sortable columns. Export entire pipeline → Excel or PDF.

---

## Section 11: Export

**Single deal — Excel (.xlsx):**
Uses SheetJS to write the Luckysheet model data to a real .xlsx file with A.CRE formatting preserved (cell colors, bold, borders).

**Single deal — PDF:**
Uses jsPDF + html2canvas to render:
- Page 1: Property profile (address, facts, street view, concept render)
- Page 2: Deal contacts
- Page 3+: BOE model (each sheet tab as a page)

**Pipeline — Excel:**
One row per deal, all key metrics as columns.

**Pipeline — PDF:**
Table format, one page if possible.

**Share link:**
Deal data serialized to URL-safe base64 and appended as query param. Recipient can open the link and see the deal (read-only).

---

## Section 12: Settings

Route: `/settings`

- **County API:** Endpoint URL + API key (saved to localStorage)
- **User name:** For broker email signature
- **Hurdle rates:** Target IRR + equity multiple (used for Pencils/Doesn't Pencil indicator)
- **API keys:** Claude API key, OpenAI API key, Mapbox token, Google Maps API key (all stored in localStorage, never sent to a backend)

---

## File Structure

```
cre-competition/
├── index.html
├── vite.config.js
├── package.json
├── tailwind.config.js
├── .env.example
├── src/
│   ├── main.jsx                        # React root
│   ├── App.jsx                         # Router setup
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx              # Top nav (Map / Pipeline / Settings)
│   │   │   └── ExportMenu.jsx          # Shared export dropdown
│   │   ├── map/
│   │   │   ├── MapView.jsx             # Mapbox map, pins, click handler
│   │   │   ├── PropertyPin.jsx         # Custom Mapbox marker by deal type
│   │   │   └── BottomDrawer.jsx        # Selected deal preview + Open button
│   │   ├── deal/
│   │   │   ├── DealDetail.jsx          # Tab container + top bar
│   │   │   ├── ProfileTab.jsx          # Street view, render, facts panel
│   │   │   ├── ContactsTab.jsx         # Contact cards + add contact
│   │   │   ├── ContactCard.jsx         # Single contact card
│   │   │   └── AddContactModal.jsx     # Add/edit contact form
│   │   ├── model/
│   │   │   ├── ModelTab.jsx            # Mode toggle + returns bar + model
│   │   │   ├── ReturnsBar.jsx          # Pinned cells bar, live sync
│   │   │   ├── ModelViewer.jsx         # Luckysheet wrapper + two-way sync
│   │   │   ├── ModelUpload.jsx         # Upload .xlsx, parse with SheetJS
│   │   │   └── BrokerEmailModal.jsx    # Claude-drafted email modal
│   │   └── pipeline/
│   │       └── PipelineSummary.jsx     # All deals table + export
│   ├── services/
│   │   ├── claude.js                   # Claude API: model builder, email draft, zoning inference
│   │   ├── dalle.js                    # DALL-E 3: concept render
│   │   ├── county.js                   # County assessor API (configurable endpoint)
│   │   ├── hud.js                      # HUD FMR API (market rents)
│   │   ├── census.js                   # Census ACS + CBP (vacancy, commercial rents)
│   │   └── streetview.js               # Google Maps Static API (street view image)
│   ├── utils/
│   │   ├── modelBuilder.js             # BOE model JSON generation (inputs → Luckysheet data)
│   │   ├── modelSolver.js              # Mode B back-solver (target returns → max price)
│   │   ├── export.js                   # SheetJS + jsPDF export logic
│   │   ├── luckysheetConfig.js         # A.CRE style config for Luckysheet
│   │   └── shareLink.js                # Serialize/deserialize deal to URL
│   ├── store/
│   │   ├── deals.js                    # localStorage CRUD for deals
│   │   └── settings.js                 # localStorage for API keys + user prefs
│   └── styles/
│       ├── index.css                   # Tailwind base
│       └── model.css                   # Luckysheet A.CRE overrides
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-03-22-sitestack-design.md
│       └── plans/
│           └── 2026-03-22-sitestack-plan.md
└── public/
    └── sitestack-logo.svg
```

---

## Out of Scope (v1 / Competition)

- User authentication / backend
- Detailed institutional model (BOE only)
- Multi-user collaboration
- Mobile app
- Paid data sources (CoStar, Argus)
- Automated comp pulling
- Zoning variance/entitlement workflow

---

## Competition Submission Notes

**Title:** SiteStack — AI Deal Initiation for Incremental Developers
**CRE Problem Solved:** Incremental developers lack access to institutional tools for deal screening and underwriting. SiteStack uses public data + Claude AI to give small developers the same analytical rigor as large firms — for free.
**Key differentiators:**
1. AI fills model assumptions from public data sources with direct source links
2. Concept render respects actual zoning massing standards
3. End-to-end flow: discover → underwrite → contact → outreach in one tool
4. Solve for max price (not just returns) — unique to how small developers think
