import { getSettings } from '../store/settings'

// Generic county API wrapper — supports ArcGIS REST and custom endpoints
export async function fetchParcelByPin(pin) {
  const { countyApiEndpoint, countyApiKey } = getSettings()
  if (!countyApiEndpoint) throw new Error('County API endpoint not configured. Go to Settings.')

  const url = new URL(countyApiEndpoint)
  url.searchParams.set('pin', pin)
  if (countyApiKey) url.searchParams.set('key', countyApiKey)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`County API error: ${res.status}`)
  const data = await res.json()
  return normalizeParcelData(data)
}

// Normalize varying county API response shapes into a standard object
function normalizeParcelData(raw) {
  // Support both ArcGIS feature response and flat JSON
  const attrs = raw.features?.[0]?.attributes || raw.attributes || raw
  return {
    pin: attrs.PIN || attrs.pin || attrs.PARID || '',
    address: attrs.ADDR || attrs.address || attrs.SITEADDR || '',
    lotSize: attrs.LOT_SIZE || attrs.lotsize || attrs.SQFT || null,
    zoning: attrs.ZONING || attrs.zoning || attrs.ZONE_CLASS || '',
    currentUse: attrs.CURRENT_USE || attrs.curr_use || attrs.LAND_USE || '',
    assessedValue: attrs.ASSESSED_VALUE || attrs.assessed_val || attrs.CERTIFIED_TOT || null,
    taxYear: attrs.TAX_YEAR || attrs.tax_year || new Date().getFullYear() - 1,
    ownerName: attrs.OWNER_NAME || attrs.owner_name || attrs.TAXPAYER_NAME || '',
    ownerAddress: [
      attrs.OWNER_ADDR || attrs.owner_addr || attrs.MAIL_ADDR || '',
      attrs.OWNER_CITY || attrs.owner_city || attrs.MAIL_CITY || '',
      attrs.OWNER_STATE || attrs.MAIL_STATE || '',
      attrs.OWNER_ZIP || attrs.MAIL_ZIP || '',
    ].filter(Boolean).join(', '),
    annualTaxes: attrs.TAX_AMT || attrs.annual_taxes || null,
    yearBuilt: attrs.YEAR_BUILT || attrs.year_built || attrs.YRBUILT || null,
  }
}
