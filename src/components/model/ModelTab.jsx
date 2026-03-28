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
