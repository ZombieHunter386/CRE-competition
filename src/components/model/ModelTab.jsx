import { useState } from 'react'
import ReturnsBar from './ReturnsBar'
import ModelViewer from './ModelViewer'
import ModelUpload from './ModelUpload'
import { xlsxBufferToLuckysheetData } from '../../utils/xlsxParse'
import { exportToExcel, exportToPdf } from '../../utils/export'

// Summary sheet: U14=IRR, U15=Equity Multiple, U16=Avg Cash on Cash
// U = col 20 (0-indexed), rows 13/14/15 (0-indexed)
const DEFAULT_PINS = [
  { label: 'IRR',                sheetName: 'Summary', row: 13, col: 20 },
  { label: 'Equity Multiple',    sheetName: 'Summary', row: 14, col: 20 },
  { label: 'Avg Cash on Cash',   sheetName: 'Summary', row: 15, col: 20 },
]

function extractPinnedValues(luckysheetData, pins) {
  if (!luckysheetData?.sheets) return pins
  return pins.map(p => {
    const sheet = luckysheetData.sheets.find(s => s.name?.toLowerCase() === p.sheetName?.toLowerCase())
    if (!sheet) return { ...p, value: null }
    // getAllSheets() returns data[r][c] (2D sparse array)
    if (sheet.data) {
      const cell = sheet.data[p.row]?.[p.col]
      return { ...p, value: cell?.v ?? null }
    }
    // xlsxBufferToLuckysheetData returns celldata [{r, c, v: {v, f}}]
    const cell = sheet.celldata?.find(c => c.r === p.row && c.c === p.col)
    return { ...p, value: cell?.v?.v ?? null }
  })
}

export default function ModelTab({ deal, onUpdate }) {
  const [modelSource, setModelSource] = useState(
    deal.model?.luckysheetData?.source ?? null
  )
  const [loading, setLoading] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)

  const modelData   = deal.model?.luckysheetData
  const pinnedCells = deal.model?.pinnedCells || []

  async function loadDefault() {
    setLoading(true)
    try {
      const res = await fetch('/models/default-model.xlsx')
      if (!res.ok) throw new Error(`Template not found (${res.status})`)
      const buf = await res.arrayBuffer()
      const data = { ...xlsxBufferToLuckysheetData(buf, 'default-model.xlsx'), source: 'default' }
      const autoPins = extractPinnedValues(data,
        DEFAULT_PINS.map(p => ({ ...p, id: crypto.randomUUID(), isDefault: true }))
      )
      onUpdate({
        model: {
          ...deal.model,
          luckysheetData: data,
          uploadedModel: data.fileName,
          pinnedCells: autoPins,
        }
      })
      setModelSource('default')
    } catch (e) {
      alert(`Could not load default template: ${e.message}`)
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

  return (
    <div className="p-4">
      {/* Returns bar */}
      <ReturnsBar
        pinnedCells={pinnedCells}
        onUnpin={unpinCell}
        onExportExcel={() => exportToExcel(deal)}
        onExportPdf={() => exportToPdf(deal)}
      />

      {/* Model section */}
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        {/* Model toolbar */}
        <div className="bg-[#161b22] px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-sm">Model</span>
            {/* 2-source selector */}
            <div className="flex bg-[#0d1117] border border-gray-700 rounded overflow-hidden text-xs">
              <button
                onClick={loadDefault}
                disabled={loading}
                className={`px-3 py-1.5 transition-colors disabled:opacity-50 ${modelSource === 'default' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}>
                📊 Default Model
              </button>
              <button
                onClick={() => setModelSource('upload')}
                className={`px-3 py-1.5 transition-colors ${modelSource === 'upload' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}>
                📁 Upload My Own
              </button>
            </div>
            {loading && <span className="text-gray-400 text-xs">Loading...</span>}
          </div>
        </div>

        {/* Upload panel — only when Upload My Own is selected */}
        {modelSource === 'upload' && (
          <ModelUpload onModelLoaded={(data) => {
            const uploadData = { ...data, source: 'upload' }
            onUpdate({ model: { ...deal.model, luckysheetData: uploadData, uploadedModel: uploadData.fileName, pinnedCells: [] } })
            setModelSource('upload')
          }} />
        )}

        {/* Formula bar */}
        <div className="bg-[#161b22] border-b border-gray-700 px-3 py-1.5 flex items-center gap-2 text-xs">
          <span className="bg-[#0d1117] border border-gray-600 rounded px-2 py-0.5 text-gray-400 font-mono min-w-[40px] text-center">
            {selectedCell ? `${String.fromCharCode(65 + selectedCell.c)}${selectedCell.r + 1}` : ''}
          </span>
          <span className="text-gray-500">fx</span>
          <span className="text-blue-400 font-mono flex-1">
            {selectedCell?.v?.f || selectedCell?.v?.v || ''}
          </span>
          {selectedCell && (
            <button onClick={pinCell}
              className="bg-blue-600 text-white px-3 py-0.5 rounded text-xs font-semibold flex-shrink-0">
              📌 Pin to Returns Bar
            </button>
          )}
        </div>

        {/* Model viewer or placeholder */}
        {modelData
          ? <ModelViewer
              modelData={modelData}
              onCellSelected={handleCellSelected}
              onCellUpdated={(allSheets) => {
                const updatedData = { ...modelData, sheets: allSheets }
                const refreshed   = extractPinnedValues(updatedData, pinnedCells)
                onUpdate({ model: { ...deal.model, luckysheetData: updatedData, pinnedCells: refreshed } })
              }}
            />
          : <div className="h-48 flex items-center justify-center text-gray-500 bg-[#0d1117] text-sm">
              Select a model template above or upload your own to get started.
            </div>
        }

        {/* Legend */}
        <div className="bg-[#161b22] border-t border-gray-700 px-4 py-2 flex gap-5 text-xs text-gray-500">
          <span><span className="text-blue-400 font-bold">■</span> Blue = input (editable)</span>
          <span><span className="text-white font-bold">■</span> Black = formula</span>
          <span className="ml-auto text-blue-400 font-semibold">⟳ Edit any cell → returns bar updates instantly</span>
        </div>
      </div>
    </div>
  )
}
