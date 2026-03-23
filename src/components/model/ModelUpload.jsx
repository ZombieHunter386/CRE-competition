import { useRef } from 'react'
import * as XLSX from 'xlsx'

export default function ModelUpload({ onModelLoaded }) {
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const workbook = XLSX.read(ev.target.result, { type: 'binary' })
      const sheets = workbook.SheetNames.map(name => ({
        name,
        celldata: xlsxSheetToLuckysheetCelldata(workbook.Sheets[name]),
        config: {},
      }))
      onModelLoaded({ sheets, source: 'upload', fileName: file.name })
    }
    reader.readAsBinaryString(file)
  }

  function xlsxSheetToLuckysheetCelldata(sheet) {
    const celldata = []
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1')
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddr = XLSX.utils.encode_cell({ r, c })
        const cell = sheet[cellAddr]
        if (cell) {
          celldata.push({ r, c, v: { v: cell.v, f: cell.f, ct: { t: cell.t === 'n' ? 'n' : 'g' } } })
        }
      }
    }
    return celldata
  }

  return (
    <div className="bg-yellow-950 border border-yellow-700 rounded-lg p-3 flex items-center gap-3 text-sm mb-2">
      <span className="text-xl">📁</span>
      <span className="text-gray-300 flex-1">Upload your own .xlsx model — SiteStack will display it here and let you pin any cell to your returns bar.</span>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      <button onClick={() => fileRef.current.click()}
        className="bg-white border border-gray-400 text-gray-700 px-3 py-1.5 rounded text-sm flex-shrink-0">Choose File</button>
    </div>
  )
}
