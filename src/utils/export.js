import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

export function exportToExcel(deal) {
  const wb = XLSX.utils.book_new()
  const modelData = deal.model?.luckysheetData

  if (modelData?.sheets) {
    modelData.sheets.forEach(sheet => {
      const maxRow = Math.max(...sheet.celldata.map(c => c.r), 0) + 1
      const maxCol = Math.max(...sheet.celldata.map(c => c.c), 0) + 1
      const aoa = Array.from({ length: maxRow }, () => Array(maxCol).fill(null))
      sheet.celldata.forEach(({ r, c, v }) => {
        aoa[r][c] = v?.f || v?.v || null
      })
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    })
  }

  XLSX.writeFile(wb, `${deal.address || 'deal'}-model.xlsx`)
}

export async function exportToPdf(deal) {
  const doc = new jsPDF('p', 'mm', 'a4')

  doc.setFontSize(16)
  doc.text(deal.address || 'Deal Summary', 14, 20)
  doc.setFontSize(10)
  doc.text(`Deal Type: ${deal.dealType || '—'}`, 14, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36)

  const outputs = deal.model?.outputs || {}
  const metrics = [
    ['Levered IRR', `${outputs.leverIrr?.toFixed(1)}%`],
    ['Equity Multiple', `${outputs.equityMultiple?.toFixed(2)}×`],
    ['NOI', `$${outputs.noi?.toLocaleString()}`],
    ['Total Dev Cost', `$${outputs.totalDevCost?.toLocaleString()}`],
    ['Cost/Unit', `$${outputs.costPerUnit?.toLocaleString()}`],
  ]

  metrics.forEach(([label, val], i) => {
    doc.text(`${label}: ${val || '—'}`, 14, 46 + i * 7)
  })

  if (deal.propertyFacts) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Property Facts', 14, 20)
    doc.setFontSize(9)
    Object.entries(deal.propertyFacts).forEach(([k, v], i) => {
      doc.text(`${k}: ${v || '—'}`, 14, 30 + i * 6)
    })
  }

  doc.save(`${deal.address || 'deal'}-summary.pdf`)
}

export function exportPipelineToExcel(deals) {
  const headers = ['Address', 'Deal Type', 'Lot Size', 'Asking Price', 'Total Dev Cost', 'IRR', 'Equity Multiple', 'NOI', 'Cost/Unit']
  const rows = deals.map(d => [
    d.address, d.dealType, d.propertyFacts?.lotSize,
    d.model?.inputs?.askingPrice,
    d.model?.outputs?.totalDevCost,
    d.model?.outputs?.leverIrr,
    d.model?.outputs?.equityMultiple,
    d.model?.outputs?.noi,
    d.model?.outputs?.costPerUnit,
  ])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline')
  XLSX.writeFile(wb, 'sitestack-pipeline.xlsx')
}
