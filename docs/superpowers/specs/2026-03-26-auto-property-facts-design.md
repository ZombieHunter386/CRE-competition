# Auto Property Facts Lookup on Location Set

**Date:** 2026-03-26
**Status:** Approved

## Summary

When a user pins a location on the map and opens the deal detail page, the Property Facts section automatically runs the county parcel lookup — no manual PIN/address entry required. This uses Mapbox reverse geocoding to convert the deal's lat/lng into a street address, then passes it to the existing Cook County API lookup.

## Architecture

No new components or routes. Two targeted changes:

1. **`src/services/county.js`** — add `reverseGeocode(lat, lng, token)` export
2. **`src/components/deal/ProfileTab.jsx`** — add `useEffect` that auto-triggers on mount

## New Function: `reverseGeocode`

**File:** `src/services/county.js`

```js
export async function reverseGeocode(lat, lng, token) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&limit=1&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Reverse geocode failed')
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) throw new Error('No address found at this location')
  // Return just the street address (e.g. "1234 W MAIN ST")
  // feature.text = street name, feature.address = house number
  return `${feature.address || ''} ${feature.text || ''}`.trim()
}
```

The street-only portion (no city/state/zip) is passed to `fetchParcelByPin`, which already does a case-insensitive LIKE match on `prop_address_full`.

## ProfileTab Auto-Trigger

**File:** `src/components/deal/ProfileTab.jsx`

Add a `useEffect` with this logic:

```
on mount:
  if deal.lat AND deal.lng AND propertyFacts is empty:
    get mapbox token from getSettings()
    if no token: return (silent no-op)
    set isLoading = true
    address = await reverseGeocode(deal.lat, deal.lng, token)
    facts = await fetchParcelByPin(address)
    onUpdate({ propertyFacts: { ...facts, pin: facts.pin }, ... })
  catch any error:
    silent no-op (leave form empty for manual entry)
  finally:
    set isLoading = false
```

**Trigger condition:** `deal.lat && deal.lng && !deal.propertyFacts?.pin`
Using `pin` as the presence check — if a PIN exists, facts have already been fetched.

**Settings:** Call `getSettings()` inside the effect to get `mapboxToken`. This is consistent with how other parts of the app access settings (no prop drilling).

**Loading state:** Reuses the existing `isLoading` state already wired to the spinner and disabled lookup button in ProfileTab. No new UI elements needed.

**Error handling:** All errors caught silently. The manual lookup input/button remains fully functional as a fallback. No toast or error message on auto-lookup failure — the user can just type manually.

## Data Flow

```
MapView: user clicks → pendingPin {lat, lng}
  → "Start Deal" → createEmptyDeal(lat, lng) → navigate /deal/:id

ProfileTab mounts:
  deal.lat + deal.lng + no propertyFacts.pin
  → reverseGeocode(lat, lng, mapboxToken) → "1234 W MAIN ST"
  → fetchParcelByPin("1234 W MAIN ST") → parcel data
  → onUpdate({ propertyFacts }) → saveDeal() → re-render with facts
```

## What Does Not Change

- MapView.jsx — no changes
- The manual PIN/address lookup input and button — unchanged, always available
- Error display for manual lookups — unchanged
- All other ProfileTab behavior — unchanged

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Mapbox token missing | Silent no-op, manual lookup available |
| Location outside Cook County | `fetchParcelByPin` throws, caught silently |
| Parcel not found at address | Caught silently, manual entry available |
| Deal already has propertyFacts.pin | Effect skips (condition not met) |
| User manually runs lookup before auto completes | Race condition avoided by `pin` check on mount only |
