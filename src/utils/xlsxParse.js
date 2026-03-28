import * as XLSX from 'xlsx'

function xlsxSheetToLuckysheetCelldata(sheet) {
  const celldata = []
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1')
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[cellAddr]
      if (cell) {
        celldata.push({
          r,
          c,
          v: {
            v: cell.v,
            m: cell.w,
            ct: { t: cell.t === 'n' ? 'n' : 'g', fa: cell.z || 'General' },
          },
        })
      }
    }
  }
  return celldata
}

export function xlsxBufferToLuckysheetData(buffer, fileName) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheets = workbook.SheetNames.map(name => {
    const sheet = workbook.Sheets[name]

    const merge = {}
    for (const m of sheet['!merges'] || []) {
      const key = `${m.s.r}_${m.s.c}`
      merge[key] = { r: m.s.r, c: m.s.c, rs: m.e.r - m.s.r + 1, cs: m.e.c - m.s.c + 1 }
    }

    const columnlen = {}
    for (let i = 0; i < (sheet['!cols'] || []).length; i++) {
      const col = sheet['!cols'][i]
      if (col?.wpx) columnlen[i] = col.wpx
    }

    return {
      name,
      celldata: xlsxSheetToLuckysheetCelldata(sheet),
      config: { merge, columnlen },
    }
  })
  return { sheets, source: 'upload', fileName }
}
