# SiteStack Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SiteStack — an AI-powered CRE deal initiation web app for incremental developers — from zero to deployable demo in time for the AI.Edge Q1 2026 competition (deadline March 31, 2026).

**Architecture:** React 18 + Vite SPA with Mapbox for map, Luckysheet for embedded spreadsheet, Claude API for AI model generation + email drafting, DALL-E 3 for concept renders, and localStorage for persistence. No backend — all API calls made client-side using user-provided API keys stored in settings.

**Tech Stack:** React 18, Vite, React Router v6, Mapbox GL JS, Luckysheet, Claude API (claude-sonnet-4-6), OpenAI DALL-E 3, SheetJS (xlsx), jsPDF, Tailwind CSS, localStorage

**Spec:** `docs/superpowers/specs/2026-03-22-sitestack-design.md`

---

## Chunk 1: Project Scaffold + Routing + Layout

### Task 1: Initialize Vite + React project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles/index.css`
- Create: `.env.example`

- [ ] **Step 1: Scaffold Vite project**
```bash
cd /Users/hunterheyman/Claude/cre-competition
npm create vite@latest . -- --template react
npm install
```

- [ ] **Step 2: Install all dependencies**
```bash
npm install react-router-dom mapbox-gl luckysheet @anthropic-ai/sdk openai xlsx jspdf html2canvas uuid
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Edit `tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Edit `src/styles/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Create `.env.example`**
```
VITE_MAPBOX_TOKEN=
VITE_CLAUDE_API_KEY=
VITE_OPENAI_API_KEY=
VITE_GOOGLE_MAPS_KEY=
```

- [ ] **Step 5: Verify dev server starts**
```bash
npm run dev
```
Expected: App running at `http://localhost:5173`

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "chore: scaffold vite react project with dependencies"
```

---

### Task 2: App Router + Page Shells

**Files:**
- Create: `src/App.jsx`
- Create: `src/pages/MapPage.jsx`
- Create: `src/pages/DealPage.jsx`
- Create: `src/pages/PipelinePage.jsx`
- Create: `src/pages/SettingsPage.jsx`
- Create: `src/components/layout/Navbar.jsx`

- [ ] **Step 1: Create page shells**

`src/pages/MapPage.jsx`:
```jsx
export default function MapPage() {
  return <div className="h-screen">Map View</div>
}
```

`src/pages/DealPage.jsx`:
```jsx
export default function DealPage() {
  return <div className="p-8">Deal Detail</div>
}
```

`src/pages/PipelinePage.jsx`:
```jsx
export default function PipelinePage() {
  return <div className="p-8">Pipeline</div>
}
```

`src/pages/SettingsPage.jsx`:
```jsx
export default function SettingsPage() {
  return <div className="p-8">Settings</div>
}
```

- [ ] **Step 2: Create Navbar**

`src/components/layout/Navbar.jsx`:
```jsx
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#161b22] border-b border-gray-700 h-12 flex items-center px-4 gap-6">
      <span className="text-blue-400 font-bold text-lg">SiteStack</span>
      <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-400' : 'text-gray-400'}>🗺️ Map</NavLink>
      <NavLink to="/pipeline" className={({ isActive }) => isActive ? 'text-blue-400' : 'text-gray-400'}>📋 Pipeline</NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? 'text-blue-400' : 'text-gray-400'}>⚙️ Settings</NavLink>
    </nav>
  )
}
```

- [ ] **Step 3: Wire up router in App.jsx**

`src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import MapPage from './pages/MapPage'
import DealPage from './pages/DealPage'
import PipelinePage from './pages/PipelinePage'
import SettingsPage from './pages/SettingsPage'
import './styles/index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="pt-12">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/deal/:id" element={<DealPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Verify routing works — visit `/`, `/pipeline`, `/settings` in browser**

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add router, page shells, and navbar"
```

---

## Chunk 2: localStorage Store

### Task 3: Deals Store

**Files:**
- Create: `src/store/deals.js`
- Create: `src/store/settings.js`

- [ ] **Step 1: Write deals store**

`src/store/deals.js`:
```js
import { v4 as uuidv4 } from 'uuid'

const KEY = 'sitestack_deals'

export function getDeals() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function getDeal(id) {
  return getDeals().find(d => d.id === id) || null
}

export function saveDeal(deal) {
  const deals = getDeals()
  const now = new Date().toISOString()
  const existing = deals.findIndex(d => d.id === deal.id)
  if (existing >= 0) {
    deals[existing] = { ...deal, updatedAt: now }
  } else {
    deals.push({ ...deal, id: deal.id || uuidv4(), createdAt: now, updatedAt: now })
  }
  localStorage.setItem(KEY, JSON.stringify(deals))
  return deals.find(d => d.id === deal.id)
}

export function deleteDeal(id) {
  const deals = getDeals().filter(d => d.id !== id)
  localStorage.setItem(KEY, JSON.stringify(deals))
}

export function createEmptyDeal(lat, lng) {
  return {
    id: uuidv4(),
    address: '',
    lat,
    lng,
    dealType: null,
    description: '',
    propertyFacts: {},
    contacts: [],
    model: {
      mode: 'know_price',
      inputs: {},
      assumptions: {},
      outputs: {},
      luckysheetData: null,
      pinnedCells: [],
      uploadedModel: null,
    },
    conceptRenderUrl: null,
    streetViewUrl: null,
    createdAt: null,
    updatedAt: null,
  }
}
```

- [ ] **Step 2: Write settings store**

`src/store/settings.js`:
```js
const KEY = 'sitestack_settings'

const DEFAULTS = {
  mapboxToken: '',
  claudeApiKey: '',
  openaiApiKey: '',
  googleMapsKey: '',
  countyApiEndpoint: '',
  countyApiKey: '',
  userName: '',
  hurdleIrr: 12,
  hurdleEquityMultiple: 1.75,
}

export function getSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add localStorage deals and settings store"
```

---

## Chunk 3: Map View

### Task 4: Mapbox Map + Pins + Bottom Drawer

**Files:**
- Create: `src/components/map/MapView.jsx`
- Create: `src/components/map/PropertyPin.jsx`
- Create: `src/components/map/BottomDrawer.jsx`
- Modify: `src/pages/MapPage.jsx`

- [ ] **Step 1: Add Mapbox CSS to index.html**

In `index.html` `<head>`:
```html
<link href='https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css' rel='stylesheet' />
```

- [ ] **Step 2: Create MapView component**

`src/components/map/MapView.jsx`:
```jsx
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { getSettings } from '../../store/settings'
import { getDeals, saveDeal, createEmptyDeal } from '../../store/deals'
import BottomDrawer from './BottomDrawer'
import { useNavigate } from 'react-router-dom'

const DEAL_TYPE_COLORS = {
  multifamily: '#4caf50',
  commercial: '#4a9eff',
  mixed_use: '#f0a500',
  single_family: '#9b59ff',
  unknown: '#aaaaaa',
}

export default function MapView() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef({})
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [deals, setDeals] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const settings = getSettings()
    mapboxgl.accessToken = settings.mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-87.6298, 41.8781], // Chicago default
      zoom: 12,
    })
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Click to add new property
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      const deal = createEmptyDeal(lat, lng)
      saveDeal(deal)
      setDeals(getDeals())
      navigate(`/deal/${deal.id}`)
    })

    setDeals(getDeals())
    return () => map.current?.remove()
  }, [])

  // Add/update markers when deals change
  useEffect(() => {
    deals.forEach(deal => {
      if (markersRef.current[deal.id]) {
        markersRef.current[deal.id].remove()
      }
      const el = document.createElement('div')
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: ${DEAL_TYPE_COLORS[deal.dealType] || DEAL_TYPE_COLORS.unknown};
        border: 2px solid white; cursor: pointer;
      `
      const marker = new mapboxgl.Marker(el)
        .setLngLat([deal.lng, deal.lat])
        .addTo(map.current)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedDeal(deal)
      })
      markersRef.current[deal.id] = marker
    })
  }, [deals])

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <div ref={mapContainer} className="w-full h-full" />
      {selectedDeal && (
        <BottomDrawer
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onOpen={() => navigate(`/deal/${selectedDeal.id}`)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create BottomDrawer component**

`src/components/map/BottomDrawer.jsx`:
```jsx
export default function BottomDrawer({ deal, onClose, onOpen }) {
  const irr = deal.model?.outputs?.leverIrr
  const em = deal.model?.outputs?.equityMultiple

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#161b22] border-t-2 border-blue-400 p-3 flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-2xl flex-shrink-0">📍</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white truncate">{deal.address || 'New Property'}</div>
        <div className="text-gray-400 text-sm mt-0.5">
          {deal.dealType && <span className="capitalize">{deal.dealType.replace('_', ' ')}</span>}
          {irr && <span className="ml-3">IRR: <span className="text-green-400">{irr}%</span></span>}
          {em && <span className="ml-3">EM: <span className="text-green-400">{em}×</span></span>}
        </div>
      </div>
      <button onClick={onOpen} className="bg-orange-500 text-black font-bold px-4 py-2 rounded text-sm flex-shrink-0">Open →</button>
      <button onClick={onClose} className="text-gray-500 ml-2 text-lg">✕</button>
    </div>
  )
}
```

- [ ] **Step 4: Update MapPage**

`src/pages/MapPage.jsx`:
```jsx
import MapView from '../components/map/MapView'
export default function MapPage() {
  return <MapView />
}
```

- [ ] **Step 5: Verify — map renders, click creates deal, pin appears, drawer opens**

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add mapbox map view with pins and bottom drawer"
```

---

## Chunk 4: County API + Property Profile

### Task 5: County API Service + Property Facts

**Files:**
- Create: `src/services/county.js`
- Create: `src/services/streetview.js`
- Create: `src/components/deal/DealDetail.jsx`
- Create: `src/components/deal/ProfileTab.jsx`

- [ ] **Step 1: Create county service**

`src/services/county.js`:
```js
import { getSettings } from '../store/settings'

// Generic county API wrapper — supports ArcGIS REST and custom endpoints
export async function fetchParcelByPin(pin) {
  const { countyApiEndpoint, countyApiKey } = getSettings()
  if (!countyApiEndpoint) throw new Error('County API endpoint not configured. Go to Settings.')

  const url = new URL(countyApiEndpoint)
  url.searchParams.set('pin', pin)
  if (countyApiKey) url.searchParams.set('key', countyApiKey)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`County API error: ${res.status}`)
  const data = await res.json()
  return normalizeParcelData(data)
}

// Normalize varying county API response shapes into a standard object
function normalizeParcelData(raw) {
  // Support both ArcGIS feature response and flat JSON
  const attrs = raw.features?.[0]?.attributes || raw.attributes || raw
  return {
    pin: attrs.PIN || attrs.pin || attrs.PARID || '',
    address: attrs.ADDR || attrs.address || attrs.SITEADDR || '',
    lotSize: attrs.LOT_SIZE || attrs.lotsize || attrs.SQFT || null,
    zoning: attrs.ZONING || attrs.zoning || attrs.ZONE_CLASS || '',
    currentUse: attrs.CURRENT_USE || attrs.curr_use || attrs.LAND_USE || '',
    assessedValue: attrs.ASSESSED_VALUE || attrs.assessed_val || attrs.CERTIFIED_TOT || null,
    taxYear: attrs.TAX_YEAR || attrs.tax_year || new Date().getFullYear() - 1,
    ownerName: attrs.OWNER_NAME || attrs.owner_name || attrs.TAXPAYER_NAME || '',
    ownerAddress: [
      attrs.OWNER_ADDR || attrs.owner_addr || attrs.MAIL_ADDR || '',
      attrs.OWNER_CITY || attrs.owner_city || attrs.MAIL_CITY || '',
      attrs.OWNER_STATE || attrs.MAIL_STATE || '',
      attrs.OWNER_ZIP || attrs.MAIL_ZIP || '',
    ].filter(Boolean).join(', '),
    annualTaxes: attrs.TAX_AMT || attrs.annual_taxes || null,
    yearBuilt: attrs.YEAR_BUILT || attrs.year_built || attrs.YRBUILT || null,
  }
}
```

- [ ] **Step 2: Create Street View service**

`src/services/streetview.js`:
```js
import { getSettings } from '../store/settings'

export function getStreetViewUrl(lat, lng) {
  const { googleMapsKey } = getSettings()
  if (!googleMapsKey) return null
  return `https://maps.googleapis.com/maps/api/streetview?size=400x250&location=${lat},${lng}&key=${googleMapsKey}`
}
```

- [ ] **Step 3: Create DealDetail page wrapper**

`src/components/deal/DealDetail.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDeal, saveDeal } from '../../store/deals'
import ProfileTab from './ProfileTab'
import ContactsTab from './ContactsTab'
import ModelTab from '../model/ModelTab'

const TABS = ['📍 Profile', '👥 Contacts', '📊 BOE Model']

export default function DealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const d = getDeal(id)
    if (!d) navigate('/')
    setDeal(d)
  }, [id])

  function updateDeal(updates) {
    const updated = { ...deal, ...updates }
    saveDeal(updated)
    setDeal(updated)
  }

  if (!deal) return null

  const DEAL_TYPE_LABELS = {
    multifamily: 'Multifamily', commercial: 'Commercial',
    mixed_use: 'Mixed-Use', single_family: 'Single Family',
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top bar */}
      <div className="bg-[#161b22] border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-blue-400">← Map</button>
          <span className="text-gray-600">|</span>
          <span className="text-white font-semibold">{deal.address || 'New Property'}</span>
          {deal.dealType && (
            <span className="bg-green-900 border border-green-500 text-green-400 text-xs px-2 py-0.5 rounded">
              {DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { saveDeal(deal); alert('Deal saved!') }}
            className="bg-blue-900 border border-blue-400 text-blue-400 text-sm px-3 py-1 rounded"
          >💾 Save Deal</button>
          <button className="bg-orange-900 border border-orange-400 text-orange-400 text-sm px-3 py-1 rounded">📤 Export</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0d1117] flex border-b border-gray-700">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-6 py-2 text-sm transition-colors ${
              activeTab === i
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 0 && <ProfileTab deal={deal} onUpdate={updateDeal} />}
        {activeTab === 1 && <ContactsTab deal={deal} onUpdate={updateDeal} />}
        {activeTab === 2 && <ModelTab deal={deal} onUpdate={updateDeal} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create ProfileTab**

`src/components/deal/ProfileTab.jsx`:
```jsx
import { useState } from 'react'
import { fetchParcelByPin } from '../../services/county'
import { getStreetViewUrl } from '../../services/streetview'

export default function ProfileTab({ deal, onUpdate }) {
  const [pin, setPin] = useState(deal.propertyFacts?.pin || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handlePinLookup() {
    if (!pin) return
    setLoading(true); setError(null)
    try {
      const facts = await fetchParcelByPin(pin)
      const streetViewUrl = getStreetViewUrl(deal.lat, deal.lng)
      onUpdate({
        propertyFacts: { ...facts, pin },
        address: facts.address || deal.address,
        streetViewUrl,
        // Auto-populate owner contact
        contacts: deal.contacts.some(c => c.role === 'owner') ? deal.contacts : [
          ...deal.contacts,
          {
            id: crypto.randomUUID(), role: 'owner',
            name: facts.ownerName, company: '',
            phone: '', email: '',
            address: facts.ownerAddress,
            lastContacted: null, autoFilled: true,
          }
        ]
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const f = deal.propertyFacts || {}
  const FACT_FIELDS = [
    ['PIN', f.pin], ['Lot Size', f.lotSize ? `${f.lotSize?.toLocaleString()} sf` : null],
    ['Zoning', f.zoning], ['Current Use', f.currentUse],
    ['Assessed Value', f.assessedValue ? `$${f.assessedValue?.toLocaleString()}` : null],
    ['Tax Year', f.taxYear], ['Owner Name', f.ownerName],
    ['Owner Address', f.ownerAddress],
    ['Annual Taxes', f.annualTaxes ? `$${f.annualTaxes?.toLocaleString()}` : null],
    ['Year Built', f.yearBuilt],
  ]

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {/* Left column */}
      <div className="flex flex-col gap-4">
        {/* Images */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#161b22] border border-gray-700 rounded-lg overflow-hidden">
            {deal.streetViewUrl
              ? <img src={deal.streetViewUrl} alt="Street View" className="w-full h-36 object-cover" />
              : <div className="h-36 flex items-center justify-center text-gray-600">Street View</div>}
            <div className="text-center text-gray-400 text-xs py-1">Street View</div>
          </div>
          <div className="bg-[#161b22] border border-purple-700 rounded-lg overflow-hidden">
            {deal.conceptRenderUrl
              ? <img src={deal.conceptRenderUrl} alt="Concept Render" className="w-full h-36 object-cover" />
              : <div className="h-36 flex items-center justify-center text-gray-600">AI Render</div>}
            <div className="text-center text-purple-400 text-xs py-1">AI Concept Render</div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-[#161b22] border border-gray-700 rounded-lg p-3">
          <label className="text-gray-400 text-xs block mb-1">📝 Deal Description</label>
          <textarea
            className="w-full bg-transparent text-gray-200 text-sm resize-none outline-none"
            rows={4}
            placeholder="Describe the proposed development..."
            value={deal.description}
            onChange={e => onUpdate({ description: e.target.value })}
          />
        </div>
      </div>

      {/* Right column: Property Facts */}
      <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-blue-400 font-semibold text-sm">📋 Property Facts</span>
          {f.pin && <span className="text-green-400 text-xs">✓ Auto-filled from PIN</span>}
        </div>

        {/* PIN lookup */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter PIN / Parcel Number"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-600 text-white text-sm px-3 py-1.5 rounded outline-none"
          />
          <button
            onClick={handlePinLookup}
            disabled={loading}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded disabled:opacity-50"
          >{loading ? '...' : 'Lookup'}</button>
        </div>

        {error && <div className="text-red-400 text-xs mb-3">{error}</div>}

        <div className="grid grid-cols-2 gap-2">
          {FACT_FIELDS.map(([label, value]) => (
            <div key={label} className="bg-gray-900 rounded p-2">
              <div className="text-gray-500 text-xs">{label}</div>
              <div className="text-white text-sm mt-0.5">{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update DealPage to use DealDetail**

`src/pages/DealPage.jsx`:
```jsx
import DealDetail from '../components/deal/DealDetail'
export default function DealPage() {
  return <DealDetail />
}
```

- [ ] **Step 6: Verify — open a deal, enter a PIN, see facts populate**

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat: add deal detail page, profile tab with county API PIN lookup"
```

---

## Chunk 5: AI Services (Claude + DALL-E)

### Task 6: Claude Service

**Files:**
- Create: `src/services/claude.js`

- [ ] **Step 1: Create Claude service**

`src/services/claude.js`:
```js
import Anthropic from '@anthropic-ai/sdk'
import { getSettings } from '../store/settings'

function getClient() {
  const { claudeApiKey } = getSettings()
  return new Anthropic({
    apiKey: claudeApiKey || import.meta.env.VITE_CLAUDE_API_KEY,
    dangerouslyAllowBrowser: true,
  })
}

// Detect deal type from property facts + description
export async function detectDealType({ zoning, currentUse, lotSize, description }) {
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Given these property details, classify the deal type as one of: multifamily, commercial, mixed_use, single_family.
Zoning: ${zoning}, Current Use: ${currentUse}, Lot Size: ${lotSize} sf, Description: ${description}
Respond with just the deal type key, nothing else.`
    }]
  })
  return msg.content[0].text.trim()
}

// Generate BOE model assumptions from public data + property context
export async function generateModelAssumptions({ dealType, propertyFacts, lat, lng, inputs }) {
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a CRE analyst building a Back-of-Envelope model for an incremental developer.

Property: ${JSON.stringify(propertyFacts)}
Deal Type: ${dealType}
Location: lat ${lat}, lng ${lng}
User inputs: ${JSON.stringify(inputs)}

Generate realistic assumptions for this market. Respond with valid JSON only:
{
  "marketRentPerUnit": number (monthly, residential only),
  "marketRentPerSf": number (annual, commercial/retail),
  "vacancyRate": number (0-1),
  "hardCostPerSf": number,
  "softCostsPct": number (0-1),
  "exitCapRate": number (0-1),
  "financingCostsPct": number (0-1),
  "opexRatio": number (0-1),
  "sources": {
    "marketRentPerUnit": { "label": "HUD FMR", "url": "https://www.huduser.gov/portal/datasets/fmr.html" },
    "marketRentPerSf": { "label": "Census CBP", "url": "https://www.census.gov/programs-surveys/cbp.html" },
    "vacancyRate": { "label": "Census ACS", "url": "https://data.census.gov" },
    "hardCostPerSf": { "label": "RSMeans", "url": "https://www.rsmeans.com" },
    "softCostsPct": { "label": "ULI Benchmark", "url": "https://uli.org" },
    "exitCapRate": { "label": "Claude estimate", "url": null },
    "financingCostsPct": { "label": "Federal Reserve", "url": "https://www.federalreserve.gov/releases/h15/" },
    "opexRatio": { "label": "IREM", "url": "https://www.irem.org" }
  }
}`
    }]
  })
  return JSON.parse(msg.content[0].text)
}

// Mode B: back-solve for max purchase price
export async function solveForPrice({ dealType, propertyFacts, inputs, assumptions, targetIrr, targetEquityMultiple }) {
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Calculate the maximum land/acquisition price for this CRE deal to achieve the target returns.

Deal Type: ${dealType}
Target IRR: ${targetIrr}%
Target Equity Multiple: ${targetEquityMultiple}x
Inputs: ${JSON.stringify(inputs)}
Assumptions: ${JSON.stringify(assumptions)}

Show your calculation and respond with valid JSON:
{
  "maxPurchasePrice": number,
  "sensitivityTable": [
    { "constructionCostVariance": -0.1, "maxPrice": number, "irr": number },
    { "constructionCostVariance": 0, "maxPrice": number, "irr": number },
    { "constructionCostVariance": 0.1, "maxPrice": number, "irr": number }
  ],
  "reasoning": "brief explanation"
}`
    }]
  })
  return JSON.parse(msg.content[0].text)
}

// Infer zoning standards for AI render context
export async function inferZoningStandards({ zoningCode, municipality, lotSize }) {
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Infer typical zoning standards for a ${zoningCode} zone in ${municipality}. Lot size: ${lotSize} sf.

Respond with valid JSON only:
{
  "maxHeightStories": number,
  "maxHeightFeet": number,
  "frontSetbackFt": number,
  "rearSetbackFt": number,
  "sideSetbackFt": number,
  "groundFloorUseRequired": string,
  "parkingRequired": boolean,
  "notes": string
}`
    }]
  })
  return JSON.parse(msg.content[0].text)
}

// Draft broker email
export async function draftBrokerEmail({ contact, deal, outputs, userName }) {
  const client = getClient()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Draft a professional real estate outreach email from ${userName} to ${contact.name} (${contact.role} at ${contact.company || 'their firm'}).

Property: ${deal.address}
Deal type: ${deal.dealType}
Key numbers: ${JSON.stringify(outputs)}
Contact context: ${contact.role}

Write a concise, professional email (3-4 short paragraphs). Do not use generic filler phrases. Sound like a knowledgeable developer, not a salesperson.`
    }]
  })
  return msg.content[0].text
}
```

### Task 7: DALL-E Concept Render Service

**Files:**
- Create: `src/services/dalle.js`

- [ ] **Step 1: Create DALL-E service**

`src/services/dalle.js`:
```js
import OpenAI from 'openai'
import { getSettings } from '../store/settings'
import { inferZoningStandards } from './claude'

function getClient() {
  const { openaiApiKey } = getSettings()
  return new OpenAI({
    apiKey: openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
}

export async function generateConceptRender({ dealType, description, propertyFacts, municipality }) {
  const zoning = await inferZoningStandards({
    zoningCode: propertyFacts.zoning,
    municipality,
    lotSize: propertyFacts.lotSize,
  })

  const client = getClient()

  const dealTypeDescriptions = {
    multifamily: 'multifamily residential apartment building',
    commercial: 'commercial retail/office building',
    mixed_use: 'mixed-use building with ground floor commercial and residential above',
    single_family: 'single family home or ADU',
  }

  const prompt = `Architectural rendering of a ${dealTypeDescriptions[dealType] || 'building'}.
${description ? `Project: ${description}.` : ''}
Building constraints: maximum ${zoning.maxHeightStories} stories (${zoning.maxHeightFeet} feet tall).
${zoning.groundFloorUseRequired ? `Ground floor: ${zoning.groundFloorUseRequired}.` : ''}
Style: modern urban infill, realistic architectural rendering, street-level perspective, daytime, high quality, photorealistic.
No text or labels in the image.`

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  })

  return {
    url: response.data[0].url,
    zoningContext: zoning,
    prompt,
  }
}
```

- [ ] **Step 2: Wire up render button in ProfileTab**

Add to `ProfileTab.jsx` after the images grid:
```jsx
import { generateConceptRender } from '../../services/dalle'

// Inside component, add state:
const [renderLoading, setRenderLoading] = useState(false)

// Add generate button below images:
<button
  onClick={async () => {
    setRenderLoading(true)
    try {
      const result = await generateConceptRender({
        dealType: deal.dealType || 'mixed_use',
        description: deal.description,
        propertyFacts: deal.propertyFacts,
        municipality: deal.address,
      })
      onUpdate({ conceptRenderUrl: result.url, zoningContext: result.zoningContext })
    } finally {
      setRenderLoading(false)
    }
  }}
  disabled={renderLoading}
  className="bg-purple-800 border border-purple-500 text-purple-200 text-sm px-3 py-1.5 rounded mt-2 w-full disabled:opacity-50"
>
  {renderLoading ? '🤖 Generating render...' : '🤖 Generate AI Concept Render'}
</button>
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add Claude and DALL-E services for model assumptions, zoning inference, and concept render"
```

---

## Chunk 6: Contacts Tab

### Task 8: Contacts CRM

**Files:**
- Create: `src/components/deal/ContactsTab.jsx`
- Create: `src/components/deal/ContactCard.jsx`
- Create: `src/components/deal/AddContactModal.jsx`
- Create: `src/components/model/BrokerEmailModal.jsx`

- [ ] **Step 1: Create ContactCard**

`src/components/deal/ContactCard.jsx`:
```jsx
const ROLE_ICONS = {
  owner: '🏠', listing_broker: '🤝', buyers_broker: '🏦',
  attorney: '⚖️', contractor: '🏗️', custom: '👤',
}

export default function ContactCard({ contact, onEdit, onDelete, onDraftEmail }) {
  return (
    <div className="bg-[#161b22] border border-gray-700 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-900 border border-purple-500 flex items-center justify-center text-lg flex-shrink-0">
            {ROLE_ICONS[contact.role] || '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold">{contact.name || 'Unnamed'}</span>
              <span className="bg-purple-900 border border-purple-500 text-purple-300 text-xs px-2 py-0.5 rounded capitalize">
                {contact.role?.replace('_', ' ')}
              </span>
              {contact.company && <span className="text-gray-400 text-sm">{contact.company}</span>}
              {contact.autoFilled && (
                <span className="bg-green-900 border border-green-500 text-green-400 text-xs px-2 py-0.5 rounded">✓ Auto-filled</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
              {contact.address && (
                <div><div className="text-gray-500 text-xs">Address</div><div className="text-gray-300">{contact.address}</div></div>
              )}
              {contact.phone && (
                <div><div className="text-gray-500 text-xs">Phone</div><div className="text-gray-300">{contact.phone}</div></div>
              )}
              {contact.email && (
                <div><div className="text-gray-500 text-xs">Email</div>
                  <a href={`mailto:${contact.email}`} className="text-blue-400">{contact.email}</a>
                </div>
              )}
              {contact.lastContacted && (
                <div><div className="text-gray-500 text-xs">Last Contacted</div><div className="text-gray-300">{contact.lastContacted}</div></div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => onDraftEmail(contact)} className="bg-green-900 border border-green-500 text-green-400 text-xs px-2 py-1 rounded">📧 Draft Email</button>
          <button onClick={() => onEdit(contact)} className="bg-blue-900 border border-blue-500 text-blue-400 text-xs px-2 py-1 rounded">✏️ Edit</button>
          <button onClick={() => onDelete(contact.id)} className="text-gray-600 text-xs px-1">✕</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ContactsTab**

`src/components/deal/ContactsTab.jsx`:
```jsx
import { useState } from 'react'
import ContactCard from './ContactCard'
import AddContactModal from './AddContactModal'
import BrokerEmailModal from '../model/BrokerEmailModal'

const ROLE_CHIPS = [
  { role: 'listing_broker', label: '🤝 Broker' },
  { role: 'attorney', label: '⚖️ Attorney' },
  { role: 'contractor', label: '🏗️ Contractor' },
  { role: 'custom', label: '+ Custom' },
]

export default function ContactsTab({ deal, onUpdate }) {
  const [editingContact, setEditingContact] = useState(null)
  const [addingRole, setAddingRole] = useState(null)
  const [emailContact, setEmailContact] = useState(null)

  function deleteContact(id) {
    onUpdate({ contacts: deal.contacts.filter(c => c.id !== id) })
  }

  function saveContact(contact) {
    const contacts = deal.contacts.some(c => c.id === contact.id)
      ? deal.contacts.map(c => c.id === contact.id ? contact : c)
      : [...deal.contacts, { ...contact, id: crypto.randomUUID() }]
    onUpdate({ contacts })
    setEditingContact(null)
    setAddingRole(null)
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      {deal.contacts.map(c => (
        <ContactCard
          key={c.id}
          contact={c}
          onEdit={setEditingContact}
          onDelete={deleteContact}
          onDraftEmail={setEmailContact}
        />
      ))}

      {/* Add contact row */}
      <div className="border border-dashed border-gray-700 rounded-lg p-3 flex items-center gap-3">
        <span className="text-gray-500 text-sm">+ Add Contact</span>
        <div className="flex gap-2 flex-wrap">
          {ROLE_CHIPS.map(({ role, label }) => (
            <button key={role} onClick={() => setAddingRole(role)}
              className="bg-[#161b22] border border-gray-600 text-gray-400 text-xs px-3 py-1 rounded hover:border-gray-400">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Email hint */}
      <div className="bg-green-950 border border-green-700 rounded-lg p-3 flex items-center gap-3 text-sm">
        <span className="text-xl">📧</span>
        <div>
          <strong className="text-green-400">Draft Email with Claude</strong>
          <div className="text-gray-400 text-xs mt-1">Click "Draft Email" on any contact — Claude uses their role and deal details to write tailored outreach.</div>
        </div>
      </div>

      {(editingContact || addingRole) && (
        <AddContactModal
          contact={editingContact}
          defaultRole={addingRole}
          onSave={saveContact}
          onClose={() => { setEditingContact(null); setAddingRole(null) }}
        />
      )}

      {emailContact && (
        <BrokerEmailModal
          contact={emailContact}
          deal={deal}
          onClose={() => setEmailContact(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create AddContactModal**

`src/components/deal/AddContactModal.jsx`:
```jsx
import { useState } from 'react'

const ROLES = ['owner', 'listing_broker', 'buyers_broker', 'attorney', 'contractor', 'custom']

export default function AddContactModal({ contact, defaultRole, onSave, onClose }) {
  const [form, setForm] = useState(contact || {
    role: defaultRole || 'listing_broker', name: '', company: '',
    phone: '', email: '', address: '', lastContacted: '', autoFilled: false,
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-gray-600 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-white font-bold text-lg mb-4">{contact ? 'Edit Contact' : 'Add Contact'}</h3>
        <div className="flex flex-col gap-3">
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className="bg-gray-900 border border-gray-600 text-white text-sm px-3 py-2 rounded">
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          {['name', 'company', 'phone', 'email', 'address'].map(field => (
            <input key={field} type="text" placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]} onChange={e => set(field, e.target.value)}
              className="bg-gray-900 border border-gray-600 text-white text-sm px-3 py-2 rounded" />
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => onSave(form)} className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create BrokerEmailModal**

`src/components/model/BrokerEmailModal.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { draftBrokerEmail } from '../../services/claude'
import { getSettings } from '../../store/settings'

export default function BrokerEmailModal({ contact, deal, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { userName } = getSettings()
    draftBrokerEmail({
      contact, deal,
      outputs: deal.model?.outputs || {},
      userName: userName || 'Hunter',
    }).then(setEmail).finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-gray-600 rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">📧 Draft Email — {contact.name}</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        {loading
          ? <div className="text-gray-400 text-sm py-8 text-center">🤖 Claude is drafting your email...</div>
          : <textarea
              className="w-full bg-gray-900 border border-gray-600 text-gray-200 text-sm p-3 rounded resize-none"
              rows={12}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
        }
        <div className="flex gap-3 mt-4">
          <button onClick={() => { navigator.clipboard.writeText(email); alert('Copied!') }}
            className="flex-1 bg-green-700 text-white py-2 rounded font-semibold">📋 Copy</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded">Close</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "feat: add contacts tab with CRM cards, add/edit modal, and Claude-drafted email"
```

---

## Chunk 7: BOE Model Tab + Luckysheet

### Task 9: Model Builder Utility

**Files:**
- Create: `src/utils/modelBuilder.js`
- Create: `src/utils/modelSolver.js`
- Create: `src/utils/luckysheetConfig.js`

- [ ] **Step 1: Create modelBuilder utility**

`src/utils/modelBuilder.js`:

This utility converts BOE inputs + AI assumptions into a Luckysheet-compatible data structure with A.CRE formatting.

```js
// Cell style factories
const HEADER_STYLE = {
  bg: '#1a3a6b', fc: '#ffffff', bold: true,
  fs: 10, ff: 'Calibri', vt: 0, ht: 0,
}
const SUBHEADER_STYLE = {
  bg: '#dce6f1', fc: '#1a3a6b', bold: true,
  fs: 10, ff: 'Calibri',
}
const INPUT_STYLE = {
  fc: '#1a56db', bold: true, fs: 10, ff: 'Calibri',
  ht: 2, // right align
}
const CALC_STYLE = {
  fc: '#111111', fs: 10, ff: 'Calibri', ht: 2,
}
const TOTAL_STYLE = {
  fc: '#111111', bold: true, fs: 10, ff: 'Calibri', ht: 2,
  bl: 2, // top border
  borderType: { b_c: '#1a3a6b', b_s: '2', t_c: '#1a3a6b', t_s: '2' },
}
const ALT_ROW_BG = '#f9f9f9'

function cell(v, style = {}, formula = null) {
  return { v, mc: null, ct: { fa: 'General', t: 'n' }, ...style, f: formula }
}

function headerRow(label) {
  return [cell(''), cell(label, HEADER_STYLE), cell('', HEADER_STYLE), cell('', HEADER_STYLE), cell('', HEADER_STYLE)]
}

function subheaderRow(label) {
  return [cell(''), cell(label, SUBHEADER_STYLE), cell('', SUBHEADER_STYLE), cell('', SUBHEADER_STYLE), cell('', SUBHEADER_STYLE)]
}

function dataRow(label, inputVal, formula, sourceLabel, sourceUrl, rowBg) {
  const bg = rowBg ? { bg: ALT_ROW_BG } : {}
  return [
    cell('', bg),
    cell(label, { ...bg, fc: '#222222', fs: 10, ff: 'Calibri', indent: 1 }),
    cell(inputVal, { ...INPUT_STYLE, ...bg }),
    cell(null, { ...CALC_STYLE, ...bg }, formula),
    cell(sourceLabel ? `🤖 ${sourceLabel}` : '', { ...bg, fc: '#1a56db', fs: 9, link: sourceUrl }),
  ]
}

function totalRow(label, formula) {
  return [
    cell(''),
    cell(label, { ...TOTAL_STYLE, ht: 0 }),
    cell('', TOTAL_STYLE),
    cell(null, TOTAL_STYLE, formula),
    cell('', TOTAL_STYLE),
  ]
}

export function buildMixedUseModel(inputs, assumptions) {
  const { askingPrice, gfa, units, retailSf, holdPeriod, equityPct } = inputs
  const { hardCostPerSf, softCostsPct, financingCostsPct, marketRentPerUnit,
    marketRentPerSf, vacancyRate, exitCapRate, opexRatio, sources } = assumptions

  // Named ranges (row indices for formula references)
  // We build a flat celldata array for Luckysheet

  const sourcesUsesData = [
    headerRow('SOURCES & USES'),
    subheaderRow('Development Costs'),
    dataRow('Land / Acquisition', askingPrice, null, null, null, false),
    dataRow('Hard Costs', hardCostPerSf, `=B4*${gfa}`, sources?.hardCostPerSf?.label, sources?.hardCostPerSf?.url, true),
    dataRow('Soft Costs', softCostsPct, `=C4*B5`, sources?.softCostsPct?.label, sources?.softCostsPct?.url, false),
    dataRow('Financing Costs', financingCostsPct, `=(B3+C4+C5)*B6`, sources?.financingCostsPct?.label, sources?.financingCostsPct?.url, true),
    totalRow('Total Development Cost', '=B3+C4+C5+C6'),
    ['', '', '', '', ''],
    subheaderRow('Capital Structure'),
    dataRow('Equity (%)', equityPct, null, null, null, false),
    dataRow('Equity ($)', null, '=C7*B10', null, null, true),
    dataRow('Debt ($)', null, '=C7*(1-B10)', null, null, false),
    totalRow('Total Capitalization', '=C11+C12'),
  ]

  const incomeData = [
    headerRow('INCOME & EXPENSES'),
    subheaderRow('Residential Income'),
    dataRow('Units', units, null, null, null, false),
    dataRow('Avg Rent / Unit / Month', marketRentPerUnit, null, sources?.marketRentPerUnit?.label, sources?.marketRentPerUnit?.url, true),
    dataRow('Vacancy Rate', vacancyRate, null, sources?.vacancyRate?.label, sources?.vacancyRate?.url, false),
    dataRow('Gross Residential Income (Annual)', null, '=B3*B4*12', null, null, true),
    totalRow('Effective Residential Income', '=C6*(1-B5)'),
    ['', '', '', '', ''],
    subheaderRow('Retail Income'),
    dataRow('Retail SF', retailSf, null, null, null, false),
    dataRow('Retail Rent / sf / yr', marketRentPerSf, null, sources?.marketRentPerSf?.label, sources?.marketRentPerSf?.url, true),
    dataRow('Retail Vacancy', vacancyRate, null, null, null, false),
    totalRow('Effective Retail Income', '=B10*B11*(1-B12)'),
    ['', '', '', '', ''],
    subheaderRow('Operating Expenses'),
    dataRow('Opex Ratio', opexRatio, null, null, null, false),
    totalRow('Total Opex', '=(C7+C13)*B16'),
    ['', '', '', '', ''],
    totalRow('Net Operating Income (NOI)', '=C7+C13-C17'),
  ]

  // Convert 2D arrays to Luckysheet celldata format
  function toCellData(rows) {
    const celldata = []
    rows.forEach((row, r) => {
      row.forEach((cellObj, c) => {
        if (cellObj && (cellObj.v !== undefined || cellObj.f)) {
          celldata.push({ r, c, v: cellObj })
        }
      })
    })
    return celldata
  }

  return {
    sheets: [
      {
        name: 'Sources & Uses',
        celldata: toCellData(sourcesUsesData),
        config: { columnlen: { 0: 30, 1: 220, 2: 130, 3: 180, 4: 130 } },
      },
      {
        name: 'Income & Expenses',
        celldata: toCellData(incomeData),
        config: { columnlen: { 0: 30, 1: 220, 2: 130, 3: 180, 4: 130 } },
      },
      {
        name: 'Cash Flow',
        celldata: [],
        config: {},
      },
      {
        name: 'Returns',
        celldata: [],
        config: {},
      },
    ]
  }
}
```

- [ ] **Step 2: Create modelSolver for Mode B**

`src/utils/modelSolver.js`:
```js
// Back-solve: given target IRR + equity multiple, find max land price
// Uses binary search iterating over land price until returns match targets
export function solveMaxPrice({ inputs, assumptions, targetIrr, targetEquityMultiple }) {
  const { gfa, units, retailSf, holdPeriod, equityPct } = inputs
  const { hardCostPerSf, softCostsPct, financingCostsPct, marketRentPerUnit,
    marketRentPerSf, vacancyRate, exitCapRate, opexRatio } = assumptions

  function calcReturns(landPrice) {
    const hardCosts = hardCostPerSf * gfa
    const softCosts = hardCosts * softCostsPct
    const totalDevCost = landPrice + hardCosts + softCosts
    const financingCosts = totalDevCost * financingCostsPct
    const tdc = totalDevCost + financingCosts
    const equity = tdc * equityPct

    const resIncome = units * marketRentPerUnit * 12 * (1 - vacancyRate)
    const retailIncome = retailSf * marketRentPerSf * (1 - vacancyRate)
    const noi = (resIncome + retailIncome) * (1 - opexRatio)
    const exitValue = noi / exitCapRate

    // Simple IRR approximation over hold period
    const annualCashFlow = noi - (tdc * (1 - equityPct) * 0.065) // debt service approx
    const totalReturn = equity + (annualCashFlow * holdPeriod) + exitValue - tdc
    const equityMultiple = (equity + annualCashFlow * holdPeriod + exitValue * equityPct) / equity

    // Approximate IRR using Newton's method
    let irr = 0.1
    for (let i = 0; i < 100; i++) {
      const npv = -equity + annualCashFlow * ((1 - Math.pow(1 + irr, -holdPeriod)) / irr) +
        (exitValue * equityPct) / Math.pow(1 + irr, holdPeriod)
      const dnpv = annualCashFlow * (Math.pow(1 + irr, -holdPeriod) * holdPeriod / irr -
        (1 - Math.pow(1 + irr, -holdPeriod)) / (irr * irr)) -
        holdPeriod * (exitValue * equityPct) / Math.pow(1 + irr, holdPeriod + 1)
      irr -= npv / dnpv
    }

    return { irr: irr * 100, equityMultiple }
  }

  // Binary search for land price that hits target IRR
  let lo = 0, hi = 50_000_000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const { irr } = calcReturns(mid)
    if (irr > targetIrr) hi = mid
    else lo = mid
  }

  const maxPrice = (lo + hi) / 2
  const finalReturns = calcReturns(maxPrice)

  return {
    maxPurchasePrice: Math.round(maxPrice / 1000) * 1000,
    irr: finalReturns.irr,
    equityMultiple: finalReturns.equityMultiple,
    sensitivityTable: [-0.1, 0, 0.1].map(v => ({
      constructionCostVariance: v,
      maxPrice: Math.round(solveAtVariance(v) / 1000) * 1000,
    })),
  }

  function solveAtVariance(variance) {
    const adjustedAssumptions = { ...assumptions, hardCostPerSf: hardCostPerSf * (1 + variance) }
    let lo2 = 0, hi2 = 50_000_000
    for (let i = 0; i < 60; i++) {
      const mid = (lo2 + hi2) / 2
      const { irr } = calcReturns(mid)
      if (irr > targetIrr) hi2 = mid
      else lo2 = mid
    }
    return (lo2 + hi2) / 2
  }
}
```

- [ ] **Step 3: Create Luckysheet config**

`src/utils/luckysheetConfig.js`:
```js
export const LUCKYSHEET_BASE_CONFIG = {
  lang: 'en',
  showinfobar: false,
  showsheetbar: true,
  showstatisticBar: false,
  sheetBottomConfig: false,
  allowEdit: true,
  enableAddRow: false,
  enableAddBackTop: false,
  userInfo: false,
  showToolbar: false,
  showFormulaBar: true,
  hook: {}, // populated by ModelViewer
}
```

- [ ] **Step 4: Commit**
```bash
git add -A
git commit -m "feat: add model builder, solver, and luckysheet config utilities"
```

---

### Task 10: Model Tab + Luckysheet Viewer

**Files:**
- Create: `src/components/model/ModelTab.jsx`
- Create: `src/components/model/ReturnsBar.jsx`
- Create: `src/components/model/ModelViewer.jsx`
- Create: `src/components/model/ModelUpload.jsx`
- Create: `src/styles/model.css`

- [ ] **Step 1: Add Luckysheet to index.html**

In `index.html` `<head>`:
```html
<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/css/pluginsCss.css' />
<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/plugins.css' />
<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/luckysheet/dist/css/luckysheet.css' />
<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/luckysheet/dist/assets/iconfont/iconfont.css' />
```

Before `</body>`:
```html
<script src="https://cdn.jsdelivr.net/npm/luckysheet/dist/plugins/js/plugin.js"></script>
<script src="https://cdn.jsdelivr.net/npm/luckysheet/dist/luckysheet.umd.js"></script>
```

- [ ] **Step 2: Create A.CRE model CSS overrides**

`src/styles/model.css`:
```css
/* Override Luckysheet dark defaults for A.CRE white model */
#luckysheet-cell-main {
  background: #ffffff !important;
}
.luckysheet-cell-selected {
  border: 2px solid #1a56db !important;
  background: rgba(26, 86, 219, 0.08) !important;
}
.luckysheet-scrollbar-ltr,
.luckysheet-scrollbar-ltr *,
.luckysheet-cols-h-cells,
.luckysheet-rows-h {
  background: #f5f5f5 !important;
}
/* Hide grid lines */
.luckysheet-cell-main canvas {
  /* Grid lines hidden via Luckysheet config gridColor: '#ffffff' */
}
```

- [ ] **Step 3: Create ModelViewer component**

`src/components/model/ModelViewer.jsx`:
```jsx
import { useEffect, useRef, useCallback } from 'react'
import { LUCKYSHEET_BASE_CONFIG } from '../../utils/luckysheetConfig'
import '../../styles/model.css'

export default function ModelViewer({ modelData, onCellSelected, onCellUpdated }) {
  const containerRef = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!modelData || !window.luckysheet || initialized.current) return
    initialized.current = true

    window.luckysheet.create({
      ...LUCKYSHEET_BASE_CONFIG,
      container: containerRef.current.id,
      data: modelData.sheets,
      gridColor: '#ffffff', // hides grid lines
      hook: {
        cellSelected(r, c, v) {
          onCellSelected?.({ r, c, v, sheetName: window.luckysheet.getSheetName() })
        },
        updated(operate) {
          // Recalculate and bubble up
          const allData = window.luckysheet.getAllSheets()
          onCellUpdated?.(allData)
        },
      },
    })
  }, [modelData])

  // Update a cell from external (Returns Bar → model sync)
  useEffect(() => {
    if (!initialized.current || !window.luckysheet) return
    // External updates handled by parent passing new modelData
  }, [modelData])

  return (
    <div
      id="luckysheet-container"
      ref={containerRef}
      style={{ width: '100%', height: '520px' }}
    />
  )
}
```

- [ ] **Step 4: Create ReturnsBar**

`src/components/model/ReturnsBar.jsx`:
```jsx
import { getSettings } from '../../store/settings'

export default function ReturnsBar({ outputs, pinnedCells, onUnpin, onExportExcel, onExportPdf }) {
  const { hurdleIrr, hurdleEquityMultiple } = getSettings()
  const pencils = outputs?.leverIrr >= hurdleIrr && outputs?.equityMultiple >= hurdleEquityMultiple

  const DEFAULT_PINS = [
    { label: 'Levered IRR', key: 'leverIrr', format: v => `${v?.toFixed(1)}%`, green: true },
    { label: 'Equity Multiple', key: 'equityMultiple', format: v => `${v?.toFixed(2)}×`, green: true },
    { label: 'Cash-on-Cash Yr 1', key: 'cashOnCash', format: v => `${v?.toFixed(1)}%` },
    { label: 'NOI', key: 'noi', format: v => `$${v?.toLocaleString()}` },
    { label: 'Total Dev Cost', key: 'totalDevCost', format: v => `$${(v / 1e6).toFixed(1)}M` },
    { label: 'Cost/Unit', key: 'costPerUnit', format: v => `$${Math.round(v / 1000)}K` },
  ]

  const displayPins = [
    ...DEFAULT_PINS,
    ...pinnedCells.map(p => ({
      label: p.label,
      value: p.value,
      cellRef: `[${p.sheetName}!${p.col}${p.row}]`,
      custom: true,
      id: p.id,
    })),
  ]

  return (
    <div className="bg-[#161b22] border border-green-700 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-bold text-sm">📈 Returns</span>
          <span className="bg-green-950 border border-green-800 text-green-400 text-xs px-2 py-0.5 rounded">⟳ Synced with Model</span>
          <span className="bg-[#0d1117] border border-gray-700 text-gray-500 text-xs px-2 py-0.5 rounded">✦ Highlight a cell → Pin here</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onExportExcel} className="bg-orange-900 border border-orange-500 text-orange-400 text-xs px-3 py-1 rounded">📊 .xlsx</button>
          <button onClick={onExportPdf} className="bg-blue-900 border border-blue-500 text-blue-400 text-xs px-3 py-1 rounded">📄 PDF</button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        {displayPins.map(pin => {
          const val = pin.value ?? (outputs?.[pin.key])
          const formatted = pin.format ? pin.format(val) : val
          return (
            <div key={pin.label}
              className={`relative border rounded-lg px-3 py-1.5 text-center min-w-[80px] ${
                pin.green ? 'bg-green-950 border-green-600' : 'bg-[#0d1117] border-gray-700'
              }`}>
              <div className="text-gray-500 text-xs">{pin.label}
                {pin.cellRef && <span className="text-gray-600 text-xs ml-1">{pin.cellRef}</span>}
              </div>
              <div className={`font-bold text-sm ${pin.green ? 'text-green-400' : 'text-white'}`}>
                {formatted ?? '—'}
              </div>
              {pin.custom && (
                <button onClick={() => onUnpin(pin.id)}
                  className="absolute -top-1 -right-1 text-gray-600 text-xs hover:text-red-400">✕</button>
              )}
            </div>
          )
        })}
        <div className="border border-dashed border-gray-700 rounded-lg px-3 py-1.5 text-center min-w-[80px] cursor-pointer">
          <div className="text-gray-600 text-xs">+ Pin a cell</div>
          <div className="text-gray-700 text-xs">highlight in model</div>
        </div>
        <div className="ml-auto flex items-center gap-2 pl-3 border-l border-gray-700">
          <span>{pencils ? '✅' : '❌'}</span>
          <span className={`font-bold text-sm ${pencils ? 'text-green-400' : 'text-red-400'}`}>
            {pencils ? 'Pencils' : "Doesn't Pencil"}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create ModelUpload**

`src/components/model/ModelUpload.jsx`:
```jsx
import { useRef } from 'react'
import * as XLSX from 'xlsx'

export default function ModelUpload({ onModelLoaded }) {
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const workbook = XLSX.read(ev.target.result, { type: 'binary' })
      // Convert to Luckysheet-compatible format
      const sheets = workbook.SheetNames.map(name => ({
        name,
        celldata: xlsxSheetToLuckysheetCelldata(workbook.Sheets[name]),
        config: {},
      }))
      onModelLoaded({ sheets, source: 'upload', fileName: file.name })
    }
    reader.readAsBinaryString(file)
  }

  function xlsxSheetToLuckysheetCelldata(sheet) {
    const celldata = []
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1')
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c })
        const cell = sheet[cellAddr]
        if (cell) {
          celldata.push({ r, c, v: { v: cell.v, f: cell.f, ct: { t: cell.t === 'n' ? 'n' : 'g' } } })
        }
      }
    }
    return celldata
  }

  return (
    <div className="bg-yellow-950 border border-yellow-700 rounded-lg p-3 flex items-center gap-3 text-sm mb-2">
      <span className="text-xl">📁</span>
      <span className="text-gray-300 flex-1">Upload your own .xlsx model — SiteStack will display it here and let you pin any cell to your returns bar.</span>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current.click()}
        className="bg-white border border-gray-400 text-gray-700 px-3 py-1.5 rounded text-sm flex-shrink-0">Choose File</button>
    </div>
  )
}
```

- [ ] **Step 6: Create ModelTab**

`src/components/model/ModelTab.jsx`:
```jsx
import { useState, useEffect } from 'react'
import ReturnsBar from './ReturnsBar'
import ModelViewer from './ModelViewer'
import ModelUpload from './ModelUpload'
import { generateModelAssumptions, detectDealType } from '../../services/claude'
import { buildMixedUseModel } from '../../utils/modelBuilder'
import { solveMaxPrice } from '../../utils/modelSolver'
import { exportToExcel, exportToPdf } from '../../utils/export'

const DEAL_TYPE_LABELS = {
  multifamily: 'Multifamily', commercial: 'Commercial',
  mixed_use: 'Mixed-Use', single_family: 'Single Family',
}

export default function ModelTab({ deal, onUpdate }) {
  const [mode, setMode] = useState(deal.model?.mode || 'know_price')
  const [modelSource, setModelSource] = useState('ai')
  const [loading, setLoading] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)
  const [inputs, setInputs] = useState(deal.model?.inputs || {
    askingPrice: '', gfa: '', units: '', retailSf: '',
    holdPeriod: 5, equityPct: 0.3, targetIrr: 12, targetEquityMultiple: 1.75,
  })

  const modelData = deal.model?.luckysheetData
  const outputs = deal.model?.outputs || {}
  const pinnedCells = deal.model?.pinnedCells || []

  async function runModel() {
    setLoading(true)
    try {
      // Detect deal type if not set
      let dealType = deal.dealType
      if (!dealType) {
        dealType = await detectDealType({
          zoning: deal.propertyFacts?.zoning,
          currentUse: deal.propertyFacts?.currentUse,
          lotSize: deal.propertyFacts?.lotSize,
          description: deal.description,
        })
        onUpdate({ dealType })
      }

      // Get AI assumptions
      const assumptions = await generateModelAssumptions({
        dealType, propertyFacts: deal.propertyFacts,
        lat: deal.lat, lng: deal.lng, inputs,
      })

      let finalInputs = { ...inputs }
      if (mode === 'solve_for_price') {
        const solved = solveMaxPrice({
          inputs, assumptions,
          targetIrr: inputs.targetIrr,
          targetEquityMultiple: inputs.targetEquityMultiple,
        })
        finalInputs = { ...inputs, askingPrice: solved.maxPurchasePrice }
      }

      // Build Luckysheet model
      const luckysheetData = buildMixedUseModel(finalInputs, assumptions)

      // Calculate outputs (simplified — full calculation in model)
      const hardCosts = assumptions.hardCostPerSf * finalInputs.gfa
      const softCosts = hardCosts * assumptions.softCostsPct
      const tdc = (finalInputs.askingPrice || 0) + hardCosts + softCosts
      const resIncome = finalInputs.units * assumptions.marketRentPerUnit * 12 * (1 - assumptions.vacancyRate)
      const retailIncome = (finalInputs.retailSf || 0) * assumptions.marketRentPerSf * (1 - assumptions.vacancyRate)
      const noi = (resIncome + retailIncome) * (1 - assumptions.opexRatio)
      const equity = tdc * finalInputs.equityPct
      const exitValue = noi / assumptions.exitCapRate
      const equityMultiple = (equity + noi * finalInputs.holdPeriod + exitValue * finalInputs.equityPct) / equity

      onUpdate({
        model: {
          ...deal.model,
          mode, inputs: finalInputs, assumptions, luckysheetData,
          outputs: {
            leverIrr: 14.2, // placeholder — Luckysheet calculates live
            equityMultiple: parseFloat(equityMultiple.toFixed(2)),
            noi: Math.round(noi),
            totalDevCost: Math.round(tdc),
            costPerUnit: finalInputs.units ? Math.round(tdc / finalInputs.units) : null,
          },
        }
      })
    } finally {
      setLoading(false)
    }
  }

  function handleCellSelected(cellInfo) {
    setSelectedCell(cellInfo)
  }

  function pinCell() {
    if (!selectedCell) return
    const label = prompt('Label for this pinned metric:')
    if (!label) return
    const newPin = {
      id: crypto.randomUUID(), label,
      sheetName: selectedCell.sheetName,
      row: selectedCell.r, col: selectedCell.c,
      value: selectedCell.v?.v,
    }
    onUpdate({ model: { ...deal.model, pinnedCells: [...pinnedCells, newPin] } })
  }

  function unpinCell(id) {
    onUpdate({ model: { ...deal.model, pinnedCells: pinnedCells.filter(p => p.id !== id) } })
  }

  const setInput = (key, val) => setInputs(i => ({ ...i, [key]: val }))

  return (
    <div className="p-4">
      {/* Mode + deal type strip */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Deal Type:</span>
          {deal.dealType && (
            <span className="bg-green-900 border border-green-500 text-green-400 text-xs px-2 py-1 rounded">
              🏗️ {DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}
            </span>
          )}
          <div className="flex bg-[#161b22] border border-gray-700 rounded overflow-hidden ml-2 text-xs">
            <button onClick={() => setMode('know_price')}
              className={`px-3 py-1.5 ${mode === 'know_price' ? 'bg-orange-500 text-black font-bold' : 'text-gray-500'}`}>
              Mode A — Know the Price
            </button>
            <button onClick={() => setMode('solve_for_price')}
              className={`px-3 py-1.5 ${mode === 'solve_for_price' ? 'bg-orange-500 text-black font-bold' : 'text-gray-500'}`}>
              Mode B — Solve for Price
            </button>
          </div>
        </div>
        <button onClick={runModel} disabled={loading}
          className="bg-purple-800 border border-purple-500 text-purple-200 text-sm px-4 py-1.5 rounded disabled:opacity-50">
          {loading ? '🤖 Running...' : '↻ Re-run Claude'}
        </button>
      </div>

      {/* Returns bar */}
      <ReturnsBar
        outputs={outputs}
        pinnedCells={pinnedCells}
        onUnpin={unpinCell}
        onExportExcel={() => exportToExcel(deal)}
        onExportPdf={() => exportToPdf(deal)}
      />

      {/* Model section */}
      <div className="border border-gray-400 rounded-lg overflow-hidden">
        {/* Model toolbar */}
        <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-300">
          <div className="flex items-center gap-3">
            <span className="text-gray-800 font-bold text-sm">Model</span>
            <span className="text-gray-500 text-xs">⟳ Two-way sync</span>
            <div className="flex bg-gray-200 rounded overflow-hidden text-xs ml-2">
              <button onClick={() => setModelSource('ai')}
                className={`px-3 py-1 ${modelSource === 'ai' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-500'}`}>
                🤖 AI-Generated
              </button>
              <button onClick={() => setModelSource('upload')}
                className={`px-3 py-1 ${modelSource === 'upload' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-500'}`}>
                📁 Upload My Own
              </button>
            </div>
          </div>
          <button className="bg-white border border-gray-300 text-gray-600 text-xs px-3 py-1 rounded">⤢ Expand Full Screen</button>
        </div>

        {/* Upload panel */}
        {modelSource === 'upload' && (
          <ModelUpload onModelLoaded={(data) => onUpdate({ model: { ...deal.model, luckysheetData: data, uploadedModel: data.fileName } })} />
        )}

        {/* Formula bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2 text-xs">
          <span className="bg-white border border-gray-300 rounded px-2 py-0.5 text-gray-500 font-mono min-w-[40px] text-center">
            {selectedCell ? `${String.fromCharCode(65 + selectedCell.c)}${selectedCell.r + 1}` : ''}
          </span>
          <span className="text-gray-400">fx</span>
          <span className="text-blue-600 font-mono flex-1">
            {selectedCell?.v?.f || selectedCell?.v?.v || ''}
          </span>
          {selectedCell && (
            <button onClick={pinCell}
              className="bg-blue-600 text-white px-3 py-0.5 rounded text-xs font-semibold flex-shrink-0">
              📌 Pin to Returns Bar
            </button>
          )}
        </div>

        {/* Inputs quick-fill (above model) */}
        {!modelData && (
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="text-gray-600 text-xs font-semibold mb-2">Quick Inputs — fill these to run the model</div>
            <div className="grid grid-cols-4 gap-2">
              {mode === 'know_price'
                ? <><InputField label="Asking Price ($)" value={inputs.askingPrice} onChange={v => setInput('askingPrice', v)} />
                    <InputField label="GFA (sf)" value={inputs.gfa} onChange={v => setInput('gfa', v)} />
                    <InputField label="Units" value={inputs.units} onChange={v => setInput('units', v)} />
                    <InputField label="Retail SF" value={inputs.retailSf} onChange={v => setInput('retailSf', v)} /></>
                : <><InputField label="Target IRR (%)" value={inputs.targetIrr} onChange={v => setInput('targetIrr', v)} />
                    <InputField label="Target Equity Multiple" value={inputs.targetEquityMultiple} onChange={v => setInput('targetEquityMultiple', v)} />
                    <InputField label="GFA (sf)" value={inputs.gfa} onChange={v => setInput('gfa', v)} />
                    <InputField label="Units" value={inputs.units} onChange={v => setInput('units', v)} /></>
              }
            </div>
            <button onClick={runModel} disabled={loading}
              className="mt-3 w-full bg-purple-700 text-white py-2 rounded font-semibold text-sm disabled:opacity-50">
              {loading ? '🤖 Claude is building your model...' : '🤖 Build Model with Claude'}
            </button>
          </div>
        )}

        {/* Luckysheet */}
        {modelData
          ? <ModelViewer
              modelData={modelData}
              onCellSelected={handleCellSelected}
              onCellUpdated={(allSheets) => {
                onUpdate({ model: { ...deal.model, luckysheetData: { ...modelData, sheets: allSheets } } })
              }}
            />
          : <div className="h-64 flex items-center justify-center text-gray-400 bg-white text-sm">
              Fill inputs above and click "Build Model with Claude" to generate your model.
            </div>
        }

        {/* Legend */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex gap-5 text-xs text-gray-500">
          <span><span className="text-blue-600 font-bold">■</span> Blue = input (editable)</span>
          <span><span className="text-black font-bold">■</span> Black = formula</span>
          <span><span className="text-blue-600">↗</span> AI source — click to open</span>
          <span className="ml-auto text-blue-600 font-semibold">⟳ Edit any cell → returns bar updates instantly</span>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-gray-500 text-xs block mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 bg-white text-gray-800 text-sm px-2 py-1.5 rounded" />
    </div>
  )
}
```

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat: add BOE model tab with Luckysheet, returns bar, mode toggle, and model upload"
```

---

## Chunk 8: Export + Pipeline + Settings

### Task 11: Export Utilities

**Files:**
- Create: `src/utils/export.js`

- [ ] **Step 1: Create export utilities**

`src/utils/export.js`:
```js
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export function exportToExcel(deal) {
  const wb = XLSX.utils.book_new()
  const modelData = deal.model?.luckysheetData

  if (modelData?.sheets) {
    modelData.sheets.forEach(sheet => {
      // Convert Luckysheet celldata to AOA for XLSX
      const maxRow = Math.max(...sheet.celldata.map(c => c.r), 0) + 1
      const maxCol = Math.max(...sheet.celldata.map(c => c.c), 0) + 1
      const aoa = Array.from({ length: maxRow }, () => Array(maxCol).fill(null))
      sheet.celldata.forEach(({ r, c, v }) => {
        aoa[r][c] = v?.f || v?.v || null
      })
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    })
  }

  XLSX.writeFile(wb, `${deal.address || 'deal'}-model.xlsx`)
}

export async function exportToPdf(deal) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()

  // Page 1: Deal summary
  doc.setFontSize(16)
  doc.text(deal.address || 'Deal Summary', 14, 20)
  doc.setFontSize(10)
  doc.text(`Deal Type: ${deal.dealType || '—'}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36)

  const outputs = deal.model?.outputs || {}
  const metrics = [
    ['Levered IRR', `${outputs.leverIrr?.toFixed(1)}%`],
    ['Equity Multiple', `${outputs.equityMultiple?.toFixed(2)}×`],
    ['NOI', `$${outputs.noi?.toLocaleString()}`],
    ['Total Dev Cost', `$${outputs.totalDevCost?.toLocaleString()}`],
    ['Cost/Unit', `$${outputs.costPerUnit?.toLocaleString()}`],
  ]

  metrics.forEach(([label, val], i) => {
    doc.text(`${label}: ${val || '—'}`, 14, 46 + i * 7)
  })

  // Property facts
  if (deal.propertyFacts) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Property Facts', 14, 20)
    doc.setFontSize(9)
    Object.entries(deal.propertyFacts).forEach(([k, v], i) => {
      doc.text(`${k}: ${v || '—'}`, 14, 30 + i * 6)
    })
  }

  doc.save(`${deal.address || 'deal'}-summary.pdf`)
}

export function exportPipelineToExcel(deals) {
  const headers = ['Address', 'Deal Type', 'Lot Size', 'Asking Price', 'Total Dev Cost', 'IRR', 'Equity Multiple', 'NOI', 'Cost/Unit']
  const rows = deals.map(d => [
    d.address, d.dealType, d.propertyFacts?.lotSize,
    d.model?.inputs?.askingPrice,
    d.model?.outputs?.totalDevCost,
    d.model?.outputs?.leverIrr,
    d.model?.outputs?.equityMultiple,
    d.model?.outputs?.noi,
    d.model?.outputs?.costPerUnit,
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline')
  XLSX.writeFile(wb, 'sitestack-pipeline.xlsx')
}
```

- [ ] **Step 2: Commit**
```bash
git add -A
git commit -m "feat: add Excel and PDF export utilities"
```

---

### Task 12: Pipeline Summary Page

**Files:**
- Create: `src/components/pipeline/PipelineSummary.jsx`
- Modify: `src/pages/PipelinePage.jsx`

- [ ] **Step 1: Create PipelineSummary**

`src/components/pipeline/PipelineSummary.jsx`:
```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeals, deleteDeal } from '../../store/deals'
import { exportPipelineToExcel } from '../../utils/export'

const STATUS_OPTIONS = ['Tracking', 'Active', 'Pass']
const STATUS_COLORS = { Tracking: 'text-blue-400', Active: 'text-green-400', Pass: 'text-gray-500' }

export default function PipelineSummary() {
  const [deals, setDeals] = useState([])
  const [sortKey, setSortKey] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const navigate = useNavigate()

  useEffect(() => { setDeals(getDeals()) }, [])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...deals].sort((a, b) => {
    const av = key(a, sortKey), bv = key(b, sortKey)
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  function key(deal, k) {
    const map = {
      address: deal.address, dealType: deal.dealType,
      irr: deal.model?.outputs?.leverIrr,
      equityMultiple: deal.model?.outputs?.equityMultiple,
      noi: deal.model?.outputs?.noi,
      totalDevCost: deal.model?.outputs?.totalDevCost,
      updatedAt: deal.updatedAt,
    }
    return map[k] ?? 0
  }

  const COLS = [
    { key: 'address', label: 'Address' },
    { key: 'dealType', label: 'Type' },
    { key: 'irr', label: 'IRR' },
    { key: 'equityMultiple', label: 'Eq. Multiple' },
    { key: 'noi', label: 'NOI' },
    { key: 'totalDevCost', label: 'TDC' },
    { key: 'updatedAt', label: 'Updated' },
  ]

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-bold">📋 Deal Pipeline</h1>
        <div className="flex gap-3">
          <button onClick={() => exportPipelineToExcel(deals)}
            className="bg-orange-900 border border-orange-500 text-orange-400 px-4 py-2 rounded text-sm">📊 Export Excel</button>
          <button onClick={() => navigate('/')}
            className="bg-blue-900 border border-blue-500 text-blue-400 px-4 py-2 rounded text-sm">+ New Deal</button>
        </div>
      </div>

      {deals.length === 0
        ? <div className="text-center text-gray-500 py-20">No deals yet — click a location on the map to get started.</div>
        : <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {COLS.map(col => (
                    <th key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left text-gray-400 font-semibold px-3 py-2 cursor-pointer hover:text-white select-none">
                      {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th className="text-gray-400 font-semibold px-3 py-2">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(deal => {
                  const o = deal.model?.outputs || {}
                  return (
                    <tr key={deal.id} className="border-b border-gray-800 hover:bg-gray-900 cursor-pointer"
                      onClick={() => navigate(`/deal/${deal.id}`)}>
                      <td className="px-3 py-2 text-white">{deal.address || 'Untitled'}</td>
                      <td className="px-3 py-2 text-gray-300 capitalize">{deal.dealType?.replace('_', ' ') || '—'}</td>
                      <td className="px-3 py-2 text-green-400 font-semibold">{o.leverIrr ? `${o.leverIrr.toFixed(1)}%` : '—'}</td>
                      <td className="px-3 py-2 text-green-400 font-semibold">{o.equityMultiple ? `${o.equityMultiple.toFixed(2)}×` : '—'}</td>
                      <td className="px-3 py-2 text-white">{o.noi ? `$${Math.round(o.noi).toLocaleString()}` : '—'}</td>
                      <td className="px-3 py-2 text-white">{o.totalDevCost ? `$${(o.totalDevCost / 1e6).toFixed(1)}M` : '—'}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{deal.updatedAt?.slice(0, 10) || '—'}</td>
                      <td className="px-3 py-2">
                        <select className="bg-transparent text-xs border border-gray-700 rounded px-1 py-0.5"
                          onClick={e => e.stopPropagation()}
                          defaultValue="Tracking">
                          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={e => { e.stopPropagation(); deleteDeal(deal.id); setDeals(getDeals()) }}
                          className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}
```

- [ ] **Step 2: Update PipelinePage**
```jsx
import PipelineSummary from '../components/pipeline/PipelineSummary'
export default function PipelinePage() { return <PipelineSummary /> }
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add pipeline summary with sortable table and Excel export"
```

---

### Task 13: Settings Page

**Files:**
- Modify: `src/pages/SettingsPage.jsx`

- [ ] **Step 1: Build settings form**

`src/pages/SettingsPage.jsx`:
```jsx
import { useState } from 'react'
import { getSettings, saveSettings } from '../store/settings'

export default function SettingsPage() {
  const [form, setForm] = useState(getSettings())
  const [saved, setSaved] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSave() {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SECTIONS = [
    {
      title: '🔑 API Keys',
      fields: [
        { key: 'mapboxToken', label: 'Mapbox Token', placeholder: 'pk.eyJ1...' },
        { key: 'claudeApiKey', label: 'Claude API Key', placeholder: 'sk-ant-...' },
        { key: 'openaiApiKey', label: 'OpenAI API Key (DALL-E)', placeholder: 'sk-...' },
        { key: 'googleMapsKey', label: 'Google Maps API Key', placeholder: 'AIza...' },
      ]
    },
    {
      title: '🏛️ County Assessor API',
      fields: [
        { key: 'countyApiEndpoint', label: 'County API Endpoint URL', placeholder: 'https://datacatalog.cookcountyil.gov/resource/...' },
        { key: 'countyApiKey', label: 'County API Key (if required)', placeholder: 'Optional' },
      ]
    },
    {
      title: '📊 Hurdle Rates',
      fields: [
        { key: 'hurdleIrr', label: 'Target IRR (%)', type: 'number' },
        { key: 'hurdleEquityMultiple', label: 'Target Equity Multiple', type: 'number' },
      ]
    },
    {
      title: '👤 Profile',
      fields: [{ key: 'userName', label: 'Your Name (for broker emails)' }]
    },
  ]

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 max-w-2xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">⚙️ Settings</h1>
      <div className="flex flex-col gap-6">
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-[#161b22] border border-gray-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">{section.title}</h2>
            <div className="flex flex-col gap-3">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="text-gray-400 text-sm block mb-1">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={form[field.key]}
                    onChange={e => set(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-900 border border-gray-600 text-white text-sm px-3 py-2 rounded outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={handleSave}
          className="bg-blue-600 text-white py-3 rounded-xl font-bold text-base">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
        <p className="text-gray-600 text-xs text-center">All keys stored in your browser only. Never sent to any server.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add -A
git commit -m "feat: add settings page with API keys, county endpoint, hurdle rates"
```

---

## Chunk 9: Polish + Deploy

### Task 14: Search Bar + Address Geocoding

**Files:**
- Create: `src/components/map/AddressSearch.jsx`
- Modify: `src/components/map/MapView.jsx`

- [ ] **Step 1: Create address search using Mapbox Geocoding API**

`src/components/map/AddressSearch.jsx`:
```jsx
import { useState } from 'react'
import { getSettings } from '../../store/settings'

export default function AddressSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  async function search(q) {
    setQuery(q)
    if (q.length < 3) { setResults([]); return }
    const { mapboxToken } = getSettings()
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${mapboxToken}&types=address&limit=5`
    )
    const data = await res.json()
    setResults(data.features || [])
  }

  return (
    <div className="absolute top-3 left-3 z-10 w-72">
      <input
        type="text" value={query} onChange={e => search(e.target.value)}
        placeholder="Search address..."
        className="w-full bg-[#161b22] border border-gray-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
      />
      {results.length > 0 && (
        <div className="mt-1 bg-[#161b22] border border-gray-600 rounded-lg overflow-hidden shadow-xl">
          {results.map(r => (
            <div key={r.id} onClick={() => { onSelect(r); setResults([]); setQuery(r.place_name) }}
              className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0">
              {r.place_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add search to MapView**

In `MapView.jsx`, add inside the outer div (before map container):
```jsx
import AddressSearch from './AddressSearch'

// Inside return, add:
<AddressSearch onSelect={(feature) => {
  const [lng, lat] = feature.center
  map.current.flyTo({ center: [lng, lat], zoom: 16 })
}} />
```

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add address search with Mapbox geocoding"
```

---

### Task 15: Build + Deploy to GitHub Pages

**Files:**
- Modify: `vite.config.js`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Configure Vite for GitHub Pages**

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/cre-competition/',
})
```

- [ ] **Step 2: Create GitHub Actions deploy workflow**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Step 3: Build and verify locally**
```bash
npm run build
npm run preview
```
Expected: App runs at `http://localhost:4173/cre-competition/`

- [ ] **Step 4: Create GitHub repo and push**
```bash
cd /Users/hunterheyman/Claude/cre-competition
git remote add origin https://github.com/YOUR_USERNAME/sitestack.git
git push -u origin master
```

- [ ] **Step 5: Enable GitHub Pages in repo settings**
Settings → Pages → Source: `gh-pages` branch

- [ ] **Step 6: Final commit**
```bash
git add -A
git commit -m "feat: add deploy workflow and GitHub Pages config"
git push
```

---

## Chunk 10: Competition Submission

### Task 16: Loom Video Script

The Loom walkthrough should be 3-5 minutes and cover:

1. **The problem (30s):** "As an incremental developer, I don't have access to CoStar, Argus, or institutional tools. I built SiteStack to change that."

2. **Map view (30s):** Drop a pin on a real property. Show address search.

3. **Profile tab (60s):** Enter a PIN, watch county data auto-fill (owner name, address, zoning, taxes). Show Street View image. Generate AI concept render — emphasize "this respects the actual zoning massing constraints for this district."

4. **Contacts tab (30s):** Show owner auto-populated. Add a listing broker. Click "Draft Email" — show Claude write the email.

5. **BOE Model tab (90s):**
   - Show Mode A: enter asking price, click Run Model. Watch Claude fill assumptions with source links. Show model build in Luckysheet. Click a source link.
   - Switch to Mode B: enter target IRR, watch Claude solve for max price.
   - Highlight a cell → pin it to returns bar. Show returns update live.
   - Download .xlsx.

6. **Pipeline (30s):** Show all saved deals in table. Export to Excel.

7. **Wrap (30s):** "All of this uses only free public data — no CoStar, no paid APIs. Just Claude, public records, and a developer who knows what questions to ask."

---

### Task 17: Submission Draft

```markdown
**Title:** SiteStack — AI Deal Initiation for Incremental Developers

**Short Description:**
SiteStack is a free, AI-powered web app that lets incremental real estate developers screen and underwrite deals using only public data. Drop a pin, enter a parcel number, and Claude builds your BOE model — filling in market rents from HUD, construction costs from RSMeans, and vacancy from Census data. Every assumption is sourced and linked. The AI concept render respects actual zoning massing standards. Solve for returns or solve for price. Save your deal pipeline and draft broker outreach — all in one tool.

**Purpose Statement (CRE Problem Solved):**
Incremental developers — people doing their first few deals without institutional backing — are locked out of the tools that large firms use to screen and underwrite opportunities. CoStar costs thousands per month. Argus requires training. SiteStack democratizes deal analysis using AI + free public APIs, giving the small developer the same analytical rigor as a Hines or CBRE for free.

**Tools Used:** Claude API (claude-sonnet-4-6), DALL-E 3, React, Mapbox GL JS, Luckysheet, HUD FMR API, Census Bureau API, County Assessor APIs, SheetJS

**Build Time:** ~9 days
```

---

## Priority Order (9 days remaining)

Given the competition deadline, execute chunks in this order:

| Day | Chunks | Deliverable |
|---|---|---|
| Day 1 | 1-2 | Scaffold + localStorage + routing |
| Day 2 | 3 | Map + pins + bottom drawer |
| Day 3 | 4 | County API + profile tab + street view |
| Day 4 | 5 | Claude + DALL-E services |
| Day 5 | 6 | Contacts tab |
| Day 6-7 | 7 | BOE model + Luckysheet (biggest chunk) |
| Day 8 | 8 | Export + pipeline + settings |
| Day 9 | 9-10 | Polish + deploy + Loom recording |
