# BOE Model Tab Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken default-model approach with a clean upload-only, read-only Luckysheet viewer with a 3-step guided cell-selection flow for IRR, Equity Multiple, and Avg Cash on Cash.

**Architecture:** `ModelTab` manages all state (luckysheetData in React state only, pinnedCells + setupStep persisted via deal). `ModelViewer` is a pure renderer with no edit hooks. Guided setup intercepts cell clicks until all 3 key metrics are pinned, then unlocks free-form pinning.

**Tech Stack:** React 19, Luckysheet (CDN), xlsx (npm), Tailwind CSS

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/utils/luckysheetConfig.js` | Modify | `allowEdit: false`, `showFormulaBar: false` |
| `src/components/model/ModelViewer.jsx` | Modify | Remove `onCellUpdated` prop + `updated` hook; add destroy cleanup |
| `src/components/model/ReturnsBar.jsx` | Modify | Rename `isDefault` → `isGuided` throughout |
| `src/components/model/ModelTab.jsx` | Rewrite | New state, upload-only flow, guided setup, download |
| `public/models/default-model.xlsx` | Delete | No longer needed |

---

## Task 1: Make Luckysheet read-only

**Files:**
- Modify: `src/utils/luckysheetConfig.js`

- [ ] **Step 1: Edit luckysheetConfig.js**

Replace the file contents with:

```js
export const LUCKYSHEET_BASE_CONFIG = {
  lang: 'en',
  showinfobar: false,
  showsheetbar: true,
  showstatisticBar: false,
  sheetBottomConfig: false,
  allowEdit: false,
  enableAddRow: false,
  enableAddBackTop: false,
  userInfo: false,
  showToolbar: false,
  showFormulaBar: false,
  hook: {}, // populated by ModelViewer
}
```

- [ ] **Step 2: Verify**

Open the dev server at `http://localhost:5174`. Navigate to a deal → BOE Model tab. Load a model (if one is persisted from earlier testing). Confirm cells are not editable when clicked — the cursor should not turn into a text cursor, and typing should not insert text.

- [ ] **Step 3: Commit**

```bash
git add src/utils/luckysheetConfig.js
git commit -m "feat: make Luckysheet viewer read-only"
```

---

## Task 2: Clean up ModelViewer

**Files:**
- Modify: `src/components/model/ModelViewer.jsx`

- [ ] **Step 1: Rewrite ModelViewer.jsx**

```jsx
import { useEffect, useRef } from 'react'
import { LUCKYSHEET_BASE_CONFIG } from '../../utils/luckysheetConfig'
import '../../styles/model.css'

export default function ModelViewer({ modelData, onCellSelected }) {
  const containerRef = useRef(null)
  const initialized  = useRef(false)

  useEffect(() => {
    if (!modelData || !window.luckysheet || initialized.current) return
    initialized.current = true

    window.luckysheet.create({
      ...LUCKYSHEET_BASE_CONFIG,
      container: containerRef.current.id,
      data: modelData.sheets,
      hook: {
        cellSelected(r, c, v) {
          onCellSelected?.({ r, c, v, sheetName: window.luckysheet.getSheetName() })
        },
      },
    })

    return () => {
      try { window.luckysheet.destroy() } catch (_) {}
    }
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

- [ ] **Step 2: Verify**

Reload the dev server. Navigate to a deal → BOE Model tab. Confirm the viewer still renders. Confirm clicking a cell does not crash the app (check browser console for errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/model/ModelViewer.jsx
git commit -m "feat: remove edit hook from ModelViewer, add destroy cleanup"
```

---

## Task 3: Rename isDefault → isGuided in ReturnsBar

**Files:**
- Modify: `src/components/model/ReturnsBar.jsx`

- [ ] **Step 1: Edit ReturnsBar.jsx**

Replace the current file with:

```jsx
import { getSettings } from '../../store/settings'

function formatPin(label, value) {
  if (value == null || isNaN(value)) return '—'
  const l = label.toLowerCase()
  if (l.includes('irr') || l.includes('cash on cash') || l.includes('coc'))
    return `${(value * 100).toFixed(1)}%`
  if (l.includes('multiple') || l.includes('em'))
    return `${Number(value).toFixed(2)}×`
  return String(value)
}

export default function ReturnsBar({ pinnedCells, onUnpin, onExportExcel, onExportPdf }) {
  const { hurdleIrr, hurdleEquityMultiple } = getSettings()

  const irrPin = pinnedCells.find(p => p.label.toLowerCase().includes('irr'))
  const emPin  = pinnedCells.find(p => p.label.toLowerCase().includes('multiple'))
  const irrVal = irrPin?.value != null ? irrPin.value * 100 : null
  const emVal  = emPin?.value ?? null
  const pencils = irrVal != null && emVal != null
    && irrVal >= hurdleIrr && emVal >= hurdleEquityMultiple

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
        {pinnedCells.map((pin) => (
          <div key={pin.id}
            className={`relative border rounded-lg px-3 py-1.5 text-center min-w-[100px] ${
              pin.isGuided ? 'bg-green-950 border-green-600' : 'bg-[#0d1117] border-gray-700'
            }`}>
            <div className="text-gray-500 text-xs">{pin.label}</div>
            <div className={`font-bold text-sm ${pin.isGuided ? 'text-green-400' : 'text-white'}`}>
              {formatPin(pin.label, pin.value)}
            </div>
            {!pin.isGuided && (
              <button onClick={() => onUnpin(pin.id)}
                className="absolute -top-1 -right-1 text-gray-600 text-xs hover:text-red-400">✕</button>
            )}
          </div>
        ))}

        {pinnedCells.length === 0 && (
          <div className="border border-dashed border-gray-700 rounded-lg px-3 py-1.5 text-center min-w-[80px]">
            <div className="text-gray-600 text-xs">+ Pin a cell</div>
            <div className="text-gray-700 text-xs">highlight in model</div>
          </div>
        )}

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

- [ ] **Step 2: Verify**

Reload the dev server. Navigate to a deal → BOE Model tab. The Returns Bar should render without errors. "Doesn't Pencil" should show. Open browser console — no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/model/ReturnsBar.jsx
git commit -m "feat: rename isDefault to isGuided in ReturnsBar"
```

---

## Task 4: Rewrite ModelTab

**Files:**
- Modify: `src/components/model/ModelTab.jsx`

This is the core task. It removes all default-model logic and replaces it with the upload-only flow, guided setup, and download.

- [ ] **Step 1: Rewrite ModelTab.jsx**

```jsx
import { useRef, useState } from 'react'
import ReturnsBar from './ReturnsBar'
import ModelViewer from './ModelViewer'
import { xlsxBufferToLuckysheetData } from '../../utils/xlsxParse'
import { exportToExcel, exportToPdf } from '../../utils/export'

// In-memory store: raw ArrayBuffer keyed by deal ID
// Not persisted — user must re-upload after page refresh
const rawBufferStore = new Map()

const GUIDED_LABELS  = ['IRR', 'Equity Multiple', 'Avg Cash on Cash']
const GUIDED_BANNERS = [
  'Step 1 of 3 — Click the cell in your model that contains your IRR',
  'Step 2 of 3 — Click the cell containing your Equity Multiple',
  'Step 3 of 3 — Click the cell containing your Avg Cash on Cash',
]

export default function ModelTab({ deal, onUpdate }) {
  const fileRef = useRef()
  const [luckysheetData, setLuckysheetData] = useState(null)
  const [viewerKey, setViewerKey]           = useState(0)
  const [selectedCell, setSelectedCell]     = useState(null)

  const pinnedCells   = deal.model?.pinnedCells   || []
  const setupStep     = deal.model?.setupStep     ?? 0
  const uploadedModel = deal.model?.uploadedModel ?? null

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    // Reset input so the same file can be re-uploaded
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buf  = ev.target.result
      const data = xlsxBufferToLuckysheetData(buf, file.name)
      rawBufferStore.set(deal.id, buf)
      setLuckysheetData(data)
      setViewerKey(k => k + 1)
      setSelectedCell(null)
      onUpdate({
        model: {
          ...deal.model,
          uploadedModel: file.name,
          pinnedCells:   [],
          setupStep:     0,
        },
      })
    }
    reader.readAsArrayBuffer(file)
  }

  function handleCellSelected(cellInfo) {
    setSelectedCell(cellInfo)
    // During guided setup, each cell click auto-pins the next required metric
    const step = deal.model?.setupStep ?? 0
    if (step < 3) {
      const newPin = {
        id:        crypto.randomUUID(),
        label:     GUIDED_LABELS[step],
        sheetName: cellInfo.sheetName,
        row:       cellInfo.r,
        col:       cellInfo.c,
        value:     cellInfo.v?.v ?? null,
        isGuided:  true,
      }
      onUpdate({
        model: {
          ...deal.model,
          pinnedCells: [...(deal.model?.pinnedCells || []), newPin],
          setupStep:   step + 1,
        },
      })
    }
  }

  function pinCell() {
    if (!selectedCell) return
    const label = prompt('Label for this pinned metric:')
    if (!label) return
    const newPin = {
      id:        crypto.randomUUID(),
      label,
      sheetName: selectedCell.sheetName,
      row:       selectedCell.r,
      col:       selectedCell.c,
      value:     selectedCell.v?.v ?? null,
      isGuided:  false,
    }
    onUpdate({ model: { ...deal.model, pinnedCells: [...pinnedCells, newPin] } })
  }

  function unpinCell(id) {
    onUpdate({ model: { ...deal.model, pinnedCells: pinnedCells.filter(p => p.id !== id) } })
  }

  function downloadModel() {
    const buf = rawBufferStore.get(deal.id)
    if (!buf) return
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = uploadedModel || 'model.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4">
      <ReturnsBar
        pinnedCells={pinnedCells}
        onUnpin={unpinCell}
        onExportExcel={() => exportToExcel(deal)}
        onExportPdf={() => exportToPdf(deal)}
      />

      <div className="border border-gray-700 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="bg-[#161b22] px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">Model</span>
            {uploadedModel && (
              <span className="text-gray-500 text-xs truncate max-w-[200px]">{uploadedModel}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {luckysheetData && (
              <button
                onClick={downloadModel}
                className="text-gray-400 hover:text-gray-200 text-xs px-3 py-1.5 border border-gray-700 rounded transition-colors">
                ⬇ Download .xlsx
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current.click()}
              className="text-gray-400 hover:text-gray-200 text-xs px-3 py-1.5 border border-gray-700 rounded transition-colors">
              {luckysheetData ? '🔄 Re-upload' : '📁 Upload Model'}
            </button>
          </div>
        </div>

        {/* Guided setup banner — shown until all 3 metrics are pinned */}
        {luckysheetData && setupStep < 3 && (
          <div className="bg-blue-950 border-b border-blue-700 px-4 py-2.5 flex items-center gap-3">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded shrink-0">
              {setupStep + 1}/3
            </span>
            <span className="text-blue-300 text-sm">{GUIDED_BANNERS[setupStep]}</span>
          </div>
        )}

        {/* Formula bar — only visible after guided setup is complete */}
        {luckysheetData && setupStep === 3 && (
          <div className="bg-[#161b22] border-b border-gray-700 px-3 py-1.5 flex items-center gap-2 text-xs">
            <span className="bg-[#0d1117] border border-gray-600 rounded px-2 py-0.5 text-gray-400 font-mono min-w-[40px] text-center">
              {selectedCell
                ? `${String.fromCharCode(65 + selectedCell.c)}${selectedCell.r + 1}`
                : ''}
            </span>
            <span className="text-gray-500">fx</span>
            <span className="text-blue-400 font-mono flex-1">
              {selectedCell?.v?.f || selectedCell?.v?.v || ''}
            </span>
            {selectedCell && (
              <button
                onClick={pinCell}
                className="bg-blue-600 text-white px-3 py-0.5 rounded text-xs font-semibold shrink-0">
                📌 Pin to Returns Bar
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        {luckysheetData ? (
          <ModelViewer
            key={viewerKey}
            modelData={luckysheetData}
            onCellSelected={handleCellSelected}
          />
        ) : (
          <div className="h-48 flex flex-col items-center justify-center gap-2 bg-[#0d1117] text-sm">
            {uploadedModel ? (
              <>
                <span className="text-gray-500">
                  Last model: <span className="text-gray-300">{uploadedModel}</span>
                </span>
                <span className="text-gray-600 text-xs">Upload your model to continue</span>
              </>
            ) : (
              <span className="text-gray-500">Upload your .xlsx model to get started.</span>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="bg-[#161b22] border-t border-gray-700 px-4 py-2 flex gap-5 text-xs text-gray-500">
          <span><span className="text-blue-400 font-bold">■</span> Blue = input</span>
          <span><span className="text-white font-bold">■</span> Black = formula</span>
          {setupStep === 3 && (
            <span className="ml-auto text-blue-400 font-semibold">
              ✦ Highlight any cell → Pin to Returns Bar
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify — empty state**

Reload the dev server. Navigate to a new deal → BOE Model tab. Confirm:
- Returns Bar renders with no pins ("+ Pin a cell" placeholder) and "Doesn't Pencil"
- Toolbar shows "Model" label + "📁 Upload Model" button
- Content area shows "Upload your .xlsx model to get started."
- No errors in browser console

- [ ] **Step 3: Verify — upload flow**

Upload any `.xlsx` file. Confirm:
- Spreadsheet loads in the viewer
- Guided setup banner appears: "1/3 — Step 1 of 3 — Click the cell in your model that contains your IRR"
- Formula bar is NOT visible yet
- Toolbar shows filename + "⬇ Download .xlsx" + "🔄 Re-upload" buttons

- [ ] **Step 4: Verify — guided setup**

Click any cell in the viewer. Confirm:
- Returns Bar gains one pin card labeled "IRR" with the cell's value
- Banner advances to "2/3 — Step 2 of 3 — Click the cell containing your Equity Multiple"

Click a second cell. Confirm:
- "Equity Multiple" pin appears in Returns Bar
- Banner advances to "3/3"

Click a third cell. Confirm:
- "Avg Cash on Cash" pin appears
- Banner disappears
- Formula bar becomes visible
- Pencils/Doesn't Pencil indicator updates based on values vs hurdle rates

- [ ] **Step 5: Verify — custom pin**

After setup, click a cell. Confirm:
- Formula bar shows the cell reference and value
- "📌 Pin to Returns Bar" button appears
- Clicking it prompts for a label, then adds a custom pin with an ✕ delete button

- [ ] **Step 6: Commit**

```bash
git add src/components/model/ModelTab.jsx
git commit -m "feat: rewrite ModelTab — upload-only, guided IRR/EM/CoC setup, download"
```

---

## Task 5: Delete default model + verify full flow

**Files:**
- Delete: `public/models/default-model.xlsx`

- [ ] **Step 1: Delete the file**

```bash
rm public/models/default-model.xlsx
```

- [ ] **Step 2: Verify no broken references**

```bash
grep -r "default-model" src/
```

Expected output: empty (no references remain)

- [ ] **Step 3: Full end-to-end browser verification**

Reload the dev server. Go through the complete flow:

1. Navigate to Pipeline → open a deal → BOE Model tab
2. Confirm no "Default Model" button anywhere in the UI
3. Upload an xlsx file → spreadsheet loads
4. Complete the 3-step guided setup by clicking 3 cells
5. Confirm Returns Bar shows IRR, Equity Multiple, Avg Cash on Cash with real values
6. Confirm Pencils/Doesn't Pencil updates correctly
7. Click "⬇ Download .xlsx" → file downloads with the original filename
8. Navigate away (click Profile tab) and back to BOE Model tab → guided pins still show in Returns Bar (they persisted via localStorage), but viewer shows re-upload prompt (luckysheetData is in-memory only)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove default-model.xlsx, complete BOE model tab redesign"
```
