// Cell style factories
const HEADER_STYLE = {
  bg: '#1a3a6b', fc: '#ffffff', bold: true,
  fs: 10, ff: 'Calibri', vt: 0, ht: 0,
}
const SUBHEADER_STYLE = {
  bg: '#dce6f1', fc: '#1a3a6b', bold: true,
  fs: 10, ff: 'Calibri',
}
const INPUT_STYLE = {
  fc: '#1a56db', bold: true, fs: 10, ff: 'Calibri',
  ht: 2, // right align
}
const CALC_STYLE = {
  fc: '#111111', fs: 10, ff: 'Calibri', ht: 2,
}
const TOTAL_STYLE = {
  fc: '#111111', bold: true, fs: 10, ff: 'Calibri', ht: 2,
  bl: 2, // top border
  borderType: { b_c: '#1a3a6b', b_s: '2', t_c: '#1a3a6b', t_s: '2' },
}
const ALT_ROW_BG = '#f9f9f9'

function cell(v, style = {}, formula = null) {
  return { v, mc: null, ct: { fa: 'General', t: 'n' }, ...style, f: formula }
}

function headerRow(label) {
  return [cell(''), cell(label, HEADER_STYLE), cell('', HEADER_STYLE), cell('', HEADER_STYLE), cell('', HEADER_STYLE)]
}

function subheaderRow(label) {
  return [cell(''), cell(label, SUBHEADER_STYLE), cell('', SUBHEADER_STYLE), cell('', SUBHEADER_STYLE), cell('', SUBHEADER_STYLE)]
}

function dataRow(label, inputVal, formula, sourceLabel, sourceUrl, rowBg) {
  const bg = rowBg ? { bg: ALT_ROW_BG } : {}
  return [
    cell('', bg),
    cell(label, { ...bg, fc: '#222222', fs: 10, ff: 'Calibri', indent: 1 }),
    cell(inputVal, { ...INPUT_STYLE, ...bg }),
    cell(null, { ...CALC_STYLE, ...bg }, formula),
    cell(sourceLabel ? `🤖 ${sourceLabel}` : '', { ...bg, fc: '#1a56db', fs: 9, link: sourceUrl }),
  ]
}

function totalRow(label, formula) {
  return [
    cell(''),
    cell(label, { ...TOTAL_STYLE, ht: 0 }),
    cell('', TOTAL_STYLE),
    cell(null, TOTAL_STYLE, formula),
    cell('', TOTAL_STYLE),
  ]
}

export function buildMixedUseModel(inputs, assumptions) {
  const { askingPrice, gfa, units, retailSf, holdPeriod, equityPct } = inputs
  const { hardCostPerSf, softCostsPct, financingCostsPct, marketRentPerUnit,
    marketRentPerSf, vacancyRate, exitCapRate, opexRatio, sources } = assumptions

  const sourcesUsesData = [
    headerRow('SOURCES & USES'),
    subheaderRow('Development Costs'),
    dataRow('Land / Acquisition', askingPrice, null, null, null, false),
    dataRow('Hard Costs', hardCostPerSf, `=B4*${gfa}`, sources?.hardCostPerSf?.label, sources?.hardCostPerSf?.url, true),
    dataRow('Soft Costs', softCostsPct, `=C4*B5`, sources?.softCostsPct?.label, sources?.softCostsPct?.url, false),
    dataRow('Financing Costs', financingCostsPct, `=(B3+C4+C5)*B6`, sources?.financingCostsPct?.label, sources?.financingCostsPct?.url, true),
    totalRow('Total Development Cost', '=B3+C4+C5+C6'),
    ['', '', '', '', ''],
    subheaderRow('Capital Structure'),
    dataRow('Equity (%)', equityPct, null, null, null, false),
    dataRow('Equity ($)', null, '=C7*B10', null, null, true),
    dataRow('Debt ($)', null, '=C7*(1-B10)', null, null, false),
    totalRow('Total Capitalization', '=C11+C12'),
  ]

  const incomeData = [
    headerRow('INCOME & EXPENSES'),
    subheaderRow('Residential Income'),
    dataRow('Units', units, null, null, null, false),
    dataRow('Avg Rent / Unit / Month', marketRentPerUnit, null, sources?.marketRentPerUnit?.label, sources?.marketRentPerUnit?.url, true),
    dataRow('Vacancy Rate', vacancyRate, null, sources?.vacancyRate?.label, sources?.vacancyRate?.url, false),
    dataRow('Gross Residential Income (Annual)', null, '=B3*B4*12', null, null, true),
    totalRow('Effective Residential Income', '=C6*(1-B5)'),
    ['', '', '', '', ''],
    subheaderRow('Retail Income'),
    dataRow('Retail SF', retailSf, null, null, null, false),
    dataRow('Retail Rent / sf / yr', marketRentPerSf, null, sources?.marketRentPerSf?.label, sources?.marketRentPerSf?.url, true),
    dataRow('Retail Vacancy', vacancyRate, null, null, null, false),
    totalRow('Effective Retail Income', '=B10*B11*(1-B12)'),
    ['', '', '', '', ''],
    subheaderRow('Operating Expenses'),
    dataRow('Opex Ratio', opexRatio, null, null, null, false),
    totalRow('Total Opex', '=(C7+C13)*B16'),
    ['', '', '', '', ''],
    totalRow('Net Operating Income (NOI)', '=C7+C13-C17'),
  ]

  // Convert 2D arrays to Luckysheet celldata format
  function toCellData(rows) {
    const celldata = []
    rows.forEach((row, r) => {
      row.forEach((cellObj, c) => {
        if (cellObj && (cellObj.v !== undefined || cellObj.f)) {
          celldata.push({ r, c, v: cellObj })
        }
      })
    })
    return celldata
  }

  return {
    sheets: [
      {
        name: 'Sources & Uses',
        celldata: toCellData(sourcesUsesData),
        config: { columnlen: { 0: 30, 1: 220, 2: 130, 3: 180, 4: 130 } },
      },
      {
        name: 'Income & Expenses',
        celldata: toCellData(incomeData),
        config: { columnlen: { 0: 30, 1: 220, 2: 130, 3: 180, 4: 130 } },
      },
      {
        name: 'Cash Flow',
        celldata: [],
        config: {},
      },
      {
        name: 'Returns',
        celldata: [],
        config: {},
      },
    ]
  }
}
