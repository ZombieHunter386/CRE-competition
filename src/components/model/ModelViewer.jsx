import { useEffect, useRef } from 'react'
import { LUCKYSHEET_BASE_CONFIG } from '../../utils/luckysheetConfig'
import '../../styles/model.css'

export default function ModelViewer({ modelData, onCellSelected, onCellUpdated }) {
  const containerRef = useRef(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!modelData || !window.luckysheet || initialized.current) return
    initialized.current = true

    window.luckysheet.create({
      ...LUCKYSHEET_BASE_CONFIG,
      container: containerRef.current.id,
      data: modelData.sheets,
      gridColor: '#ffffff', // hides grid lines
      hook: {
        cellSelected(r, c, v) {
          onCellSelected?.({ r, c, v, sheetName: window.luckysheet.getSheetName() })
        },
        updated(operate) {
          const allData = window.luckysheet.getAllSheets()
          onCellUpdated?.(allData)
        },
      },
    })
  }, [modelData])

  return (
    <div
      id="luckysheet-container"
      ref={containerRef}
      style={{ width: '100%', height: '520px' }}
    />
  )
}
