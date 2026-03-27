# Auto Property Facts Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user pins a location on the map and opens the deal page, the Property Facts section automatically reverse geocodes the lat/lng and runs the Cook County parcel lookup — no manual entry required.

**Architecture:** Add `reverseGeocode(lat, lng, token)` to `src/services/county.js` that calls the Mapbox Geocoding API and returns a street address string. Then add a `useEffect` in `ProfileTab.jsx` that fires on mount when the deal has coordinates but no `propertyFacts.pin`, calling `reverseGeocode` then `fetchParcelByPin` and updating the deal.

**Tech Stack:** React (useEffect, useState), Mapbox Geocoding REST API, existing Cook County Socrata API via `fetchParcelByPin`

---

## File Map

| File | Change |
|------|--------|
| `src/services/county.js` | Add `reverseGeocode` export (new function at bottom of file) |
| `src/components/deal/ProfileTab.jsx` | Add `useEffect` auto-trigger + import `reverseGeocode` and `getSettings` |

---

## Task 1: Add `reverseGeocode` to county.js

**Files:**
- Modify: `src/services/county.js` (append to end of file)

- [ ] **Step 1: Add the `reverseGeocode` function**

Open `src/services/county.js` and append this export at the end of the file (after line 106):

```js
export async function reverseGeocode(lat, lng, token) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&limit=1&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Reverse geocode failed')
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) throw new Error('No address found at this location')
  // Extract just the street address (house number + street name)
  // Cook County LIKE query handles partial match — no city/state needed
  return `${feature.address || ''} ${feature.text || ''}`.trim()
}
```

- [ ] **Step 2: Verify in browser console**

With the dev server running at http://localhost:5174, open browser DevTools → Console and run:

```js
import('/src/services/county.js').then(m => {
  m.reverseGeocode(41.8827, -87.6233, 'YOUR_TOKEN').then(console.log).catch(console.error)
})
```

Expected output: a street address string like `"233 S WACKER DR"` (or similar for the Willis Tower area).

- [ ] **Step 3: Commit**

```bash
git add src/services/county.js
git commit -m "feat: add reverseGeocode to county service"
```

---

## Task 2: Auto-trigger property facts in ProfileTab

**Files:**
- Modify: `src/components/deal/ProfileTab.jsx`

- [ ] **Step 1: Add imports at the top of ProfileTab.jsx**

The current imports (lines 1-4) are:
```js
import { useState } from 'react'
import { fetchParcelByPin } from '../../services/county'
import { getStreetViewUrl } from '../../services/streetview'
import { generateConceptRender } from '../../services/gemini-image'
```

Replace with:
```js
import { useState, useEffect } from 'react'
import { fetchParcelByPin, reverseGeocode } from '../../services/county'
import { getStreetViewUrl } from '../../services/streetview'
import { generateConceptRender } from '../../services/gemini-image'
import { getSettings } from '../../store/settings'
```

- [ ] **Step 2: Add the auto-trigger useEffect**

After the existing state declarations (after line 11, before `async function handlePinLookup`), insert this `useEffect`:

```js
  useEffect(() => {
    if (!deal.lat || !deal.lng || deal.propertyFacts?.pin) return
    const { mapboxToken } = getSettings()
    if (!mapboxToken) return
    setLoading(true)
    reverseGeocode(deal.lat, deal.lng, mapboxToken)
      .then(address => fetchParcelByPin(address))
      .then(facts => {
        const streetViewUrl = getStreetViewUrl(deal.lat, deal.lng)
        onUpdate({
          propertyFacts: { ...facts, pin: facts.pin },
          address: facts.address || deal.address,
          streetViewUrl,
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
      })
      .catch(() => { /* silent — leave form empty for manual entry */ })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Verify loading state wires up correctly**

The `loading` state is already used at line 137 to disable the Lookup button and show `'...'` text. No extra UI changes needed — the spinner/disabled state will show automatically during the auto-lookup.

Check that `loading` state declaration at line 8 is:
```js
const [loading, setLoading] = useState(false)
```
It is. No change needed.

- [ ] **Step 4: Commit**

```bash
git add src/components/deal/ProfileTab.jsx
git commit -m "feat: auto-trigger property facts lookup on deal open"
```

---

## Task 3: Browser Verification

- [ ] **Step 1: Open the app at http://localhost:5174**

- [ ] **Step 2: Click a location in the Chicago area on the map**

A pending pin (orange circle) should appear.

- [ ] **Step 3: Click "Start Deal →"**

App navigates to `/deal/:id` and lands on the Profile tab.

- [ ] **Step 4: Confirm auto-lookup fires**

Within 1-3 seconds the Lookup button should show `'...'` (disabled/loading), then the Property Facts grid should populate with PIN, address, lot size, zoning, assessed value, owner name, etc.

The Street View iframe should also load.

The Contacts tab should have an owner contact auto-filled.

- [ ] **Step 5: Confirm manual lookup still works**

Clear the PIN field, type a different address (e.g. `123 N WACKER`) and click Lookup. It should work independently.

- [ ] **Step 6: Confirm re-opening a deal does NOT re-trigger**

Navigate back to the map, click the existing deal marker, open it. Since `deal.propertyFacts.pin` is now set, the `useEffect` condition should be false and no re-fetch occurs.

- [ ] **Step 7: Final commit if any fixes were made**

```bash
git add -p
git commit -m "fix: <describe any fixes>"
```
