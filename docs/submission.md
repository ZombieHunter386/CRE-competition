# Competition Submission — SiteStack

**Title:** SiteStack — AI Deal Initiation for Incremental Developers

**Short Description:**
SiteStack is a free, AI-powered web app that lets incremental real estate developers screen and underwrite deals using only public data. Drop a pin on a map, enter a parcel number, and Claude builds your Back-of-Envelope model — filling in market rents from HUD Fair Market Rents, construction costs from RSMeans regional benchmarks, and vacancy rates from Census ACS data. Every AI assumption is sourced with a clickable link. The concept render respects actual zoning massing standards. Solve for returns (Mode A) or solve for max acquisition price (Mode B). Manage deal contacts, draft broker outreach with Claude, save your pipeline, and export to Excel — all in one free tool.

**Purpose Statement (CRE Problem Solved):**
Incremental developers — people doing their first few deals without institutional backing — are locked out of the tools that large firms use to screen and underwrite opportunities. CoStar costs $500+/month. Argus requires specialized training. Deal analysis stays in messy Excel files without institutional discipline.

SiteStack democratizes deal initiation using AI + free public APIs, giving the small developer the same analytical rigor as a Hines or CBRE for free. The key insight: most of the data that goes into a back-of-envelope model (market rents, construction costs, vacancy, zoning, ownership) is already publicly available — it just takes institutional knowledge to know where to look and how to interpret it. Claude bridges that gap.

**Key Differentiators:**
1. **Sourced AI assumptions** — Every Claude-generated assumption (rent, cost/sf, vacancy, cap rate) includes a clickable link to the public data source. No black box.
2. **Zoning-constrained concept renders** — Before calling DALL-E, Claude infers actual zoning standards (max height, setbacks, ground floor use) for the specific municipality and district. Renders reflect what can actually be built.
3. **End-to-end flow** — Discover → Underwrite → Contact → Outreach in one tool. No switching between map, spreadsheet, email client, and contact list.
4. **Solve for price** — Mode B back-solves for the maximum acquisition price to hit target returns. This is how incremental developers actually think about deals.

**Tools Used:**
- Claude API (`claude-sonnet-4-6`) — deal type detection, model assumption generation, zoning inference, back-solver reasoning, broker email drafting
- OpenAI DALL-E 3 — AI concept renders constrained by zoning standards
- React 19 + Vite — SPA, no backend
- Mapbox GL JS — interactive property map
- Luckysheet — embedded institutional-quality spreadsheet (A.CRE design standards)
- HUD Fair Market Rents API, Census Bureau ACS/CBP, County Assessor REST APIs, Google Maps Static API
- SheetJS (xlsx) — Excel export + upload
- jsPDF — PDF export
- All persistence via localStorage — zero server costs

**Live Demo:** https://zombiehunter386.github.io/CRE-competition/

**GitHub:** https://github.com/ZombieHunter386/CRE-competition

**Build Time:** ~9 days (March 22-31, 2026)

**Builder Background:** Former multifamily development analyst (Hines), now urban planner — built this as a tool I'd actually use.
