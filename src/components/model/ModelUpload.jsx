import { useRef } from 'react'
import { xlsxBufferToLuckysheetData } from '../../utils/xlsxParse'

export default function ModelUpload({ onModelLoaded }) {
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const modelData = xlsxBufferToLuckysheetData(ev.target.result, file.name)
      onModelLoaded(modelData)
    }
    reader.readAsArrayBuffer(file)
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
