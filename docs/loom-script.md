# SiteStack — Loom Video Script (3-5 min)

## 1. The Problem (30s)
> "I used to work as a multifamily development analyst at Hines. Now I'm an urban planner and aspiring incremental developer. The problem? The institutional tools — CoStar, Argus, RealPage — cost thousands of dollars a month. Small developers are flying blind. I built SiteStack to change that: a free, AI-powered deal initiation tool that gives incremental developers the same analytical rigor as institutional players, using nothing but public data and Claude."

## 2. Map View (30s)
- Open SiteStack at the live URL
- Show the dark Mapbox map centered on Chicago
- Use the address search bar: type "2400 S Michigan Ave, Chicago" — show autocomplete results, select it, watch map fly to the location
- Click the map to drop a pin on the property — it navigates straight to the deal detail page
> "Every deal starts here. One click and I'm in."

## 3. Profile Tab (60s)
- On the Profile tab, enter a real Cook County PIN (e.g. 17-22-427-001-0000)
- Click Lookup — watch the property facts auto-fill: owner name, mailing address, zoning, lot size, assessed value, annual taxes, year built
> "This is pulling from the Cook County Assessor API. No CoStar needed — just a parcel number."
- Point out the Street View image (loaded from Google Maps Static API)
- Click "Generate AI Concept Render"
> "This is where it gets interesting. Before calling DALL-E, Claude infers the actual zoning standards for this district — max height, setbacks, ground floor use requirements — and builds the render prompt from those constraints. The result respects what can actually be built here."
- Show the concept render appear

## 4. Contacts Tab (30s)
- Switch to Contacts tab
- Show the owner contact auto-populated from county tax data (green "Auto-filled" badge)
- Click "+ Add Contact" → select Listing Broker → fill in a broker name and company
- Click "Draft Email" on the broker
> "Claude writes tailored outreach using the contact's role and the deal details — not a generic template."
- Show the drafted email appear in the modal

## 5. BOE Model Tab (90s)

**Mode A — Know the Price:**
- Switch to BOE Model tab
- Enter: Asking Price $1,200,000 | GFA 8,000 sf | Units 8 | Retail SF 1,200
- Click "Build Model with Claude"
> "Claude is pulling market rent from HUD Fair Market Rents, construction costs from RSMeans regional estimates, vacancy from Census ACS data. Every assumption is sourced."
- Watch the Luckysheet model appear with A.CRE institutional formatting — navy headers, blue inputs, black formulas
- Click on a source link (e.g. "🤖 HUD FMR") — it opens the actual HUD data page
- Click on a cell to select it — show the formula bar update with the cell reference and formula
- Click "📌 Pin to Returns Bar" — show the cell appear in the returns bar
- Edit an input cell in the model — show the returns bar update live
> "Two-way sync. Edit the model, the returns bar updates. It's a real spreadsheet."

**Mode B — Solve for Price:**
- Click "Mode B — Solve for Price"
- Enter Target IRR: 15% | Target Equity Multiple: 1.8x
> "Instead of asking 'what are my returns at this price', Mode B asks 'what's the most I can pay to hit my target returns?' This is how incremental developers actually think."
- Click Re-run Claude — show the max purchase price appear
- Download the .xlsx file

## 6. Pipeline (30s)
- Navigate to Pipeline
- Show all saved deals in the table with IRR, equity multiple, NOI, TDC
- Click a column header to sort
- Change a deal status to "Active" using the dropdown
- Click Export Excel
> "Your whole deal pipeline, exportable, in one place."

## 7. Wrap (30s)
> "All of this uses only free, public data — no CoStar, no paid databases, no backend server. Just Claude AI, public records APIs, and a developer who knows what questions to ask. SiteStack gives the $0 incremental developer the same analytical starting point as a firm spending $50,000 a year on institutional tools. That's the unlock."
