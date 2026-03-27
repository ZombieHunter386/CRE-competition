import * as XLSX from 'xlsx'

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

export function xlsxBufferToLuckysheetData(buffer, fileName) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheets = workbook.SheetNames.map(name => ({
    name,
    celldata: xlsxSheetToLuckysheetCelldata(workbook.Sheets[name]),
    config: {},
  }))
  return { sheets, source: 'upload', fileName }
}
