import { getSettings } from '../../store/settings'

// Format a raw cell value based on the label
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
        {pinnedCells.map((pin, i) => {
          const isKey = i < 3 // first 3 are the default IRR / EM / CoC pins
          return (
            <div key={pin.id}
              className={`relative border rounded-lg px-3 py-1.5 text-center min-w-[100px] ${
                isKey ? 'bg-green-950 border-green-600' : 'bg-[#0d1117] border-gray-700'
              }`}>
              <div className="text-gray-500 text-xs">{pin.label}</div>
              <div className={`font-bold text-sm ${isKey ? 'text-green-400' : 'text-white'}`}>
                {formatPin(pin.label, pin.value)}
              </div>
              {i >= 3 && (
                <button onClick={() => onUnpin(pin.id)}
                  className="absolute -top-1 -right-1 text-gray-600 text-xs hover:text-red-400">✕</button>
              )}
            </div>
          )
        })}

        {/* Add-pin hint */}
        <div className="border border-dashed border-gray-700 rounded-lg px-3 py-1.5 text-center min-w-[80px]">
          <div className="text-gray-600 text-xs">+ Pin a cell</div>
          <div className="text-gray-700 text-xs">highlight in model</div>
        </div>

        {/* Pencils indicator */}
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
