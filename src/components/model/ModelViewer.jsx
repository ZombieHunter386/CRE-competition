import { useEffect, useRef } from 'react'
import { LUCKYSHEET_BASE_CONFIG } from '../../utils/luckysheetConfig'
import '../../styles/model.css'

export default function ModelViewer({ modelData, onCellSelected }) {
  const containerRef        = useRef(null)
  const initialized         = useRef(false)
  const onCellSelectedRef   = useRef(onCellSelected)
  onCellSelectedRef.current = onCellSelected

  useEffect(() => {
    if (!modelData || !window.luckysheet || initialized.current) return
    initialized.current = true

    window.luckysheet.create({
      ...LUCKYSHEET_BASE_CONFIG,
      container: containerRef.current.id,
      data: modelData.sheets,
    })

    // Luckysheet's cellMousedown hook does not fire with allowEdit:false.
    // Instead, observe the selection highlight box — it moves on every cell click.
    let observer = null
    const attachObserver = () => {
      const selBox = document.getElementById('luckysheet-cell-selected')
      if (!selBox) return
      observer = new MutationObserver(() => {
        const sheets = window.luckysheet?.getAllSheets?.() || []
        const sheet  = sheets.find(s => s.status === 1) || sheets[0]
        if (!sheet) return
        const sel = sheet.luckysheet_select_save?.[0]
        if (!sel) return
        const r = sel.row_focus ?? sel.row?.[0]
        const c = sel.column_focus ?? sel.column?.[0]
        if (r == null || c == null) return
        const v = sheet.data?.[r]?.[c]
        onCellSelectedRef.current?.({ r, c, v, sheetName: sheet.name })
      })
      observer.observe(selBox, { attributes: true, attributeFilter: ['style'] })
    }
    // Luckysheet renders asynchronously; wait for the DOM element to appear
    const t = setTimeout(attachObserver, 500)

    return () => {
      initialized.current = false
      clearTimeout(t)
      observer?.disconnect()
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
