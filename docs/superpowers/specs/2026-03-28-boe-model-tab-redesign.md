# BOE Model Tab Redesign
**Date:** 2026-03-28
**Status:** Approved

## Problem

The current BOE Model tab ships a "Default Model" button that loads a 28-sheet, 285k-formula Excel file. Because the xlsx was saved without cached formula values, all auto-pinned returns (IRR, EM, Avg CoC) show "—". In-browser formula recalculation via Luckysheet is unreliable for complex CRE models, and incorrect return values would misinform deal decisions. The "Upload My Own" flow also has bugs (remount guard prevents re-initialization, localStorage overflow from storing large luckysheetData).

## Decision

Remove the default model entirely. Replace with a read-only upload-only viewer. After upload, guide the user through selecting the 3 key return cells (IRR, EM, Avg CoC) before allowing free-form pinning.

---

## Architecture

### What is removed
- `DEFAULT_PINS` constant and `loadDefault()` function in `ModelTab.jsx`
- "Default Model" button from the model toolbar
- `modelSource` state (no longer needed — one source: upload)
- `onCellUpdated` hook in `ModelViewer` (read-only = no live edit refresh)
- `xlsxBufferToLuckysheetData` result stored in the deal / localStorage

### What is kept
- Luckysheet viewer for navigation and cell selection
- Custom formula bar (cell reference + value/formula display)
- `ReturnsBar` component (unchanged)
- `ModelUpload` component (minor UX improvements only)
- Pin-to-Returns-Bar system

### What is added
- Guided 3-step setup flow after upload (select IRR → EM → Avg CoC cells)
- "⬇ Download .xlsx" button (reconstructs from in-memory ArrayBuffer)
- Re-upload prompt on return visits showing the previous filename

---

## Components

### `ModelTab.jsx`
Central state manager. Key changes:

**State:**
```
luckysheetData   — local React state only (not persisted)
viewerKey        — integer, increments on each new upload to force ModelViewer remount
```

**Deal fields used (persisted to localStorage):**
```
deal.model.pinnedCells    — [{id, label, sheetName, row, col, value, isGuided}]
deal.model.uploadedModel  — filename string for re-upload prompt
deal.model.setupStep      — 0–3 (0=not started, 3=complete)
```

**Module-level variable:**
```
rawBufferStore: Map<dealId, ArrayBuffer>  — original file buffer for download
```

**Behavior:**
- If `luckysheetData` is null and `uploadedModel` is set → show re-upload prompt with filename
- If `luckysheetData` is null and `uploadedModel` is not set → show ModelUpload
- If `luckysheetData` is set and `setupStep < 3` → show ModelViewer + guided setup banner
- If `luckysheetData` is set and `setupStep === 3` → show ModelViewer + formula bar + pin button
- On new upload: clear `pinnedCells`, reset `setupStep` to 0, increment `viewerKey`

### `ModelViewer.jsx`
Minor changes only:
- Remove `onCellUpdated` prop and the `updated` Luckysheet hook
- Keep `cellSelected` hook unchanged

### `luckysheetConfig.js`
- `allowEdit: false` (was `true`)
- `showFormulaBar: false` (was `true` — we use our own)

### `ModelUpload.jsx`
- No structural changes
- Called on initial upload and re-upload

---

## Guided Setup Flow

After a file is uploaded, `setupStep` starts at 0 and a banner appears above the viewer:

| Step | `setupStep` | Banner text |
|------|-------------|-------------|
| 1 | 0 | "Step 1 of 3 — Click the cell in your model that contains your **IRR**" |
| 2 | 1 | "Step 2 of 3 — Click the cell containing your **Equity Multiple**" |
| 3 | 2 | "Step 3 of 3 — Click the cell containing your **Avg Cash on Cash**" |
| Done | 3 | Banner hidden |

**Guided pin labels and formats:**
```
Step 1 → label: "IRR",              format: % (value × 100, toFixed 1)
Step 2 → label: "Equity Multiple",  format: × (toFixed 2)
Step 3 → label: "Avg Cash on Cash", format: % (value × 100, toFixed 1)
```

When the user clicks a cell during setup:
1. The cell is auto-pinned with the guided label (`isGuided: true`, no delete button)
2. `setupStep` increments by 1
3. `onUpdate` saves `pinnedCells` and `setupStep` to the deal

After `setupStep === 3`, the standard formula bar and "📌 Pin to Returns Bar" button become active for free-form custom pins.

---

## Pin Persistence

`pinnedCells` is the only model data saved to localStorage. Each pin:
```js
{
  id: uuid,
  label: string,
  sheetName: string,
  row: number,      // 0-indexed
  col: number,      // 0-indexed
  value: number|string|null,
  isGuided: boolean // true = no delete button (replaces isDefault)
}
```

`extractPinnedValues` is unchanged — it reads `celldata[].v.v` from the parsed luckysheet data. User-uploaded Excel files always have cached formula values, so pins will show real numbers.

---

## Download

A "⬇ Download .xlsx" button appears in the model toolbar once a file is loaded.

```js
function downloadModel() {
  const buf = rawBufferStore.get(deal.id)
  if (!buf) return
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = deal.model.uploadedModel || 'model.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}
```

Download is only available while the session is active. After page refresh the user must re-upload (by design — luckysheetData is not persisted).

---

## localStorage Strategy

| Data | Storage | Reason |
|------|---------|--------|
| `luckysheetData` | React state only | Too large (can exceed 5MB localStorage limit) |
| `ArrayBuffer` | Module-level Map | Binary, not JSON-serializable |
| `pinnedCells` | localStorage via deal | Small, must survive sessions |
| `uploadedModel` (filename) | localStorage via deal | Small, used for re-upload prompt |
| `setupStep` | localStorage via deal | Small, resumes guided setup on re-upload |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/model/ModelTab.jsx` | Major rewrite — remove default model, add guided setup, fix state |
| `src/utils/luckysheetConfig.js` | `allowEdit: false`, `showFormulaBar: false` |
| `src/components/model/ModelViewer.jsx` | Remove `onCellUpdated`, keep `cellSelected` |
| `src/components/model/ModelUpload.jsx` | Minor UX only (no structural change) |
| `src/components/model/ReturnsBar.jsx` | Rename `isDefault` → `isGuided` |
| `public/models/default-model.xlsx` | Delete |

---

## Out of Scope

- In-browser formula recalculation
- Server-side calculation
- Saving edits back to xlsx (read-only by design)
- Multiple model uploads per deal
