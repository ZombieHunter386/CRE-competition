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
        cellMousedown(_, cellBounds, sheetData) {
          const r = cellBounds?.r
          const c = cellBounds?.c
          if (r == null || c == null || r < 0 || c < 0) return
          const v = sheetData?.data?.[r]?.[c]
          onCellSelected?.({ r, c, v, sheetName: window.luckysheet.getSheetName() })
        },
      },
    })

    return () => {
      initialized.current = false
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
