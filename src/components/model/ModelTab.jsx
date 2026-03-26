import { useState } from 'react'
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

      const luckysheetData = buildMixedUseModel(finalInputs, assumptions)

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
        <div className="flex items-center gap-2 flex-wrap">
          {deal.dealType && (
            <span className="bg-green-900 border border-green-500 text-green-400 text-xs px-2 py-1 rounded">
              🏗️ {DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}
            </span>
          )}
          <div className="flex bg-[#161b22] border border-gray-700 rounded overflow-hidden text-xs">
            <button onClick={() => setMode('know_price')}
              className={`px-3 py-1.5 transition-colors ${mode === 'know_price' ? 'bg-orange-500 text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
              Mode A — Know the Price
            </button>
            <button onClick={() => setMode('solve_for_price')}
              className={`px-3 py-1.5 transition-colors ${mode === 'solve_for_price' ? 'bg-orange-500 text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
              Mode B — Solve for Price
            </button>
          </div>
          <button onClick={runModel} disabled={loading}
            className="bg-purple-800 border border-purple-500 text-purple-200 text-xs px-3 py-1.5 rounded disabled:opacity-50 hover:bg-purple-700 transition-colors">
            {loading ? '🤖 Running...' : '↻ Re-run Claude'}
          </button>
        </div>
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
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        {/* Model toolbar */}
        <div className="bg-[#161b22] px-4 py-2 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-sm">Model</span>
            <span className="text-gray-500 text-xs">⟳ Two-way sync</span>
            <div className="flex bg-[#0d1117] border border-gray-700 rounded overflow-hidden text-xs ml-2">
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
        </div>

        {/* Upload panel */}
        {modelSource === 'upload' && (
          <ModelUpload onModelLoaded={(data) => onUpdate({ model: { ...deal.model, luckysheetData: data, uploadedModel: data.fileName } })} />
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

        {/* Inputs quick-fill */}
        {!modelData && (
          <div className="bg-[#0d1117] border-b border-gray-700 p-4">
            <div className="text-gray-400 text-xs font-semibold mb-3">Quick Inputs — fill these to run the model</div>
            <div className="grid grid-cols-4 gap-3">
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
              className="mt-4 w-full bg-purple-700 hover:bg-purple-600 text-white py-2.5 rounded font-semibold text-sm disabled:opacity-50 transition-colors">
              {loading ? '🤖 Claude is building your model...' : '🤖 Build Model with Claude'}
            </button>
          </div>
        )}

        {/* Luckysheet — keep white bg for spreadsheet readability (A.CRE standard) */}
        {modelData
          ? <ModelViewer
              modelData={modelData}
              onCellSelected={handleCellSelected}
              onCellUpdated={(allSheets) => {
                onUpdate({ model: { ...deal.model, luckysheetData: { ...modelData, sheets: allSheets } } })
              }}
            />
          : <div className="h-48 flex items-center justify-center text-gray-500 bg-[#0d1117] text-sm">
              Fill inputs above and click "Build Model with Claude" to generate your model.
            </div>
        }

        {/* Legend */}
        <div className="bg-[#161b22] border-t border-gray-700 px-4 py-2 flex gap-5 text-xs text-gray-500">
          <span><span className="text-blue-400 font-bold">■</span> Blue = input (editable)</span>
          <span><span className="text-white font-bold">■</span> Black = formula</span>
          <span><span className="text-blue-400">↗</span> AI source — click to open</span>
          <span className="ml-auto text-blue-400 font-semibold">⟳ Edit any cell → returns bar updates instantly</span>
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
        className="w-full border border-gray-600 bg-gray-900 text-white text-sm px-2 py-1.5 rounded outline-none focus:border-blue-500" />
    </div>
  )
}
