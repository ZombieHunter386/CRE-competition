import { getSettings } from '../../store/settings'

export default function ReturnsBar({ outputs, pinnedCells, onUnpin, onExportExcel, onExportPdf }) {
  const { hurdleIrr, hurdleEquityMultiple } = getSettings()
  const pencils = outputs?.leverIrr >= hurdleIrr && outputs?.equityMultiple >= hurdleEquityMultiple

  const fmt = (v, fn) => (v != null && !isNaN(v)) ? fn(v) : '—'
  const DEFAULT_PINS = [
    { label: 'Levered IRR', key: 'leverIrr', format: v => fmt(v, v => `${v.toFixed(1)}%`), green: true },
    { label: 'Equity Multiple', key: 'equityMultiple', format: v => fmt(v, v => `${v.toFixed(2)}×`), green: true },
    { label: 'Cash-on-Cash Yr 1', key: 'cashOnCash', format: v => fmt(v, v => `${v.toFixed(1)}%`) },
    { label: 'NOI', key: 'noi', format: v => fmt(v, v => `$${v.toLocaleString()}`) },
    { label: 'Total Dev Cost', key: 'totalDevCost', format: v => fmt(v, v => `$${(v / 1e6).toFixed(1)}M`) },
    { label: 'Cost/Unit', key: 'costPerUnit', format: v => fmt(v, v => `$${Math.round(v / 1000)}K`) },
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
