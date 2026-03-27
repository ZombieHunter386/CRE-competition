import { useState, useRef } from 'react'
import ReturnsBar from './ReturnsBar'
import ModelViewer from './ModelViewer'
import ModelUpload from './ModelUpload'
import { xlsxBufferToLuckysheetData } from '../../utils/xlsxParse'
import { exportToExcel, exportToPdf } from '../../utils/export'

const DEFAULT_PINS = {
  acquisition: [],
  development: [],
}

export default function ModelTab({ deal, onUpdate }) {
  const [modelSource, setModelSource] = useState(
    deal.model?.uploadedModel ? 'upload' : null
  )
  const [loading, setLoading] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)

  const modelData = deal.model?.luckysheetData
  const outputs = deal.model?.outputs || {}
  const pinnedCells = deal.model?.pinnedCells || []

  async function loadDefault(type) {
    setLoading(true)
    try {
      const res = await fetch(`/models/default-${type}.xlsx`)
      if (!res.ok) throw new Error(`Template not found (${res.status})`)
      const buf = await res.arrayBuffer()
      const data = xlsxBufferToLuckysheetData(buf, `default-${type}.xlsx`)
      const autoPins = DEFAULT_PINS[type].map(p => ({ ...p, id: crypto.randomUUID(), value: null }))
      onUpdate({
        model: {
          ...deal.model,
          luckysheetData: data,
          uploadedModel: data.fileName,
          pinnedCells: autoPins,
        }
      })
      setModelSource(type)
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
        outputs={outputs}
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
            {/* 3-source selector */}
            <div className="flex bg-[#0d1117] border border-gray-700 rounded overflow-hidden text-xs">
              <button
                onClick={() => loadDefault('acquisition')}
                disabled={loading}
                className={`px-3 py-1.5 transition-colors disabled:opacity-50 ${modelSource === 'acquisition' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}>
                📊 Default Acquisition
              </button>
              <button
                onClick={() => loadDefault('development')}
                disabled={loading}
                className={`px-3 py-1.5 transition-colors disabled:opacity-50 ${modelSource === 'development' ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-gray-200'}`}>
                🏗️ Default Development
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
            onUpdate({ model: { ...deal.model, luckysheetData: data, uploadedModel: data.fileName } })
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
                onUpdate({ model: { ...deal.model, luckysheetData: { ...modelData, sheets: allSheets } } })
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
