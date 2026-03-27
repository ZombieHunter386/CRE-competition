const ADDRESSES_API   = 'https://datacatalog.cookcountyil.gov/resource/3723-97qp.json'
const ASSESSED_API    = 'https://datacatalog.cookcountyil.gov/resource/uzyt-m557.json'
const RES_CHARS_API   = 'https://datacatalog.cookcountyil.gov/resource/x54s-btds.json'
const CONDO_CHARS_API = 'https://datacatalog.cookcountyil.gov/resource/3r7i-mrz4.json'
const COMM_CHARS_API  = 'https://datacatalog.cookcountyil.gov/resource/csik-bsws.json'

function isPin(input) {
  return /^\d{2}-?\d{2}-?\d{3}-?\d{3}-?\d{4}$/.test(input.trim()) ||
    /^\d{10,14}$/.test(input.replace(/-/g, '').trim())
}

function normalizePin(input) {
  return input.replace(/-/g, '').trim().padStart(14, '0')
}

function dashedPin(pin14) {
  return `${pin14.slice(0,2)}-${pin14.slice(2,4)}-${pin14.slice(4,7)}-${pin14.slice(7,10)}-${pin14.slice(10,14)}`
}

async function socrata(url, where, select = '') {
  const u = new URL(url)
  u.searchParams.set('$where', where)
  u.searchParams.set('$order', 'year DESC')
  u.searchParams.set('$limit', '1')
  if (select) u.searchParams.set('$select', select)
  const res = await fetch(u.toString())
  if (!res.ok) throw new Error(`Cook County API error: ${res.status}`)
  const rows = await res.json()
  return rows[0] || null
}

export async function fetchParcelByPin(query) {
  const trimmed = query.trim()
  if (!trimmed) throw new Error('Enter a PIN or address to search.')

  let pin, addrRow

  if (isPin(trimmed)) {
    pin = normalizePin(trimmed)
    // Fetch address + assessed + residential chars in parallel
    ;[addrRow] = await Promise.all([
      socrata(ADDRESSES_API, `pin='${pin}'`,
        'pin,prop_address_full,prop_address_city_name,prop_address_state,prop_address_zipcode_1,owner_address_name,owner_address_full,owner_address_city_name,owner_address_state,owner_address_zipcode_1,year'),
    ])
  } else {
    const escaped = trimmed.toUpperCase().replace(/'/g, "''")
    addrRow = await socrata(ADDRESSES_API,
      `upper(prop_address_full) like '%${escaped}%'`,
      'pin,prop_address_full,prop_address_city_name,prop_address_state,prop_address_zipcode_1,owner_address_name,owner_address_full,owner_address_city_name,owner_address_state,owner_address_zipcode_1,year')
    if (!addrRow) throw new Error('No parcel found for that address.')
    pin = addrRow.pin
  }

  if (!addrRow) throw new Error('No parcel found for that PIN.')

  // Fetch assessed + all three chars datasets in parallel
  const [assessedRow, resCharsRow, condoCharsRow, commCharsRow] = await Promise.all([
    socrata(ASSESSED_API,    `pin='${pin}' AND certified_tot is not null`,
      'pin,year,class,certified_tot,township_name'),
    socrata(RES_CHARS_API,   `pin='${pin}'`,
      'pin,year,char_land_sf,char_yrblt,char_bldg_sf,char_use'),
    socrata(CONDO_CHARS_API, `pin='${pin}'`,
      'pin,year,char_land_sf,char_building_sf,char_unit_sf'),
    socrata(COMM_CHARS_API,  `keypin='${dashedPin(pin)}'`,
      'keypin,year,landsf,yearbuilt,bldgsf,property_type_use'),
  ])

  const charsRow = resCharsRow || condoCharsRow || commCharsRow || {}
  const isComm   = !resCharsRow && !condoCharsRow && !!commCharsRow

  return normalizeParcelData(addrRow, assessedRow || {}, charsRow, isComm)
}

function normalizeParcelData(a, v, c, isComm) {
  const address = [
    a.prop_address_full,
    a.prop_address_city_name,
    a.prop_address_state || 'IL',
    a.prop_address_zipcode_1,
  ].filter(Boolean).join(', ')

  const ownerAddress = [
    a.owner_address_full,
    a.owner_address_city_name,
    a.owner_address_state,
    a.owner_address_zipcode_1,
  ].filter(Boolean).join(', ')

  return {
    pin:           a.pin || '',
    address,
    lotSize:       isComm
      ? (c.landsf    ? Math.round(parseFloat(c.landsf))    : null)
      : (c.char_land_sf ? Math.round(parseFloat(c.char_land_sf)) : null),
    zoning:        v.class || '',
    currentUse:    isComm ? (c.property_type_use || '') : (v.township_name || ''),
    assessedValue: parseFloat(v.certified_tot) || null,
    taxYear:       v.year || a.year || new Date().getFullYear(),
    ownerName:     a.owner_address_name || '',
    ownerAddress,
    annualTaxes:   null,
    yearBuilt:     isComm
      ? (c.yearbuilt  ? parseInt(c.yearbuilt)  : null)
      : (c.char_yrblt ? parseInt(c.char_yrblt) : null),
  }
}

export async function reverseGeocode(lat, lng, token) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&limit=1&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`)
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) throw new Error('No address found at this location')
  // Extract just the street address (house number + street name)
  // Cook County LIKE query handles partial match — no city/state needed
  return `${feature.address || ''} ${feature.text || ''}`.trim()
}
