export async function generateConceptRender({ dealType, description, municipality, propertyFacts }) {
  const params = deriveParams(dealType, description, propertyFacts, municipality)
  const svg = buildingSVG(params)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return { url }
}

// ─── Parameter derivation from county data + description ─────────────────────

function deriveParams(dealType, description, facts, location) {
  const desc = (description || '').toLowerCase()
  const zoning = (facts?.zoning || '').toLowerCase()
  const currentUse = (facts?.currentUse || '').toLowerCase()
  const lotSize = parseFloat(facts?.lotSize) || 6000
  const yearBuilt = parseInt(facts?.yearBuilt) || 2005
  const assessedValue = parseFloat(facts?.assessedValue) || 0

  // Floor count — description first, then zoning, then deal type default
  let floors = null
  const floorMatch = desc.match(/(\d+)[\s-]*(story|stories|floor|floors)/i)
  if (floorMatch) floors = parseInt(floorMatch[1])
  if (!floors) {
    if (/dx|downtown/.test(zoning)) floors = 12
    else if (/b3|pd|mx/.test(zoning)) floors = 9
    else if (/b2|c2/.test(zoning)) floors = 7
    else if (/b1|c1/.test(zoning)) floors = 5
    else if (/r4|rm/.test(zoning)) floors = 6
    else if (/r3/.test(zoning)) floors = 4
    else if (/r2/.test(zoning)) floors = 3
    else if (/r1|sfr|rs/.test(zoning)) floors = 2
    else floors = { multifamily: 6, commercial: 5, mixed_use: 8, single_family: 2 }[dealType] || 6
  }
  floors = Math.max(1, Math.min(floors, 18))

  // Building width from lot size (sq ft → SVG px)
  let bWidth = lotSize < 3000 ? 160
    : lotSize < 6000 ? 220
    : lotSize < 10000 ? 280
    : lotSize < 20000 ? 340
    : lotSize < 40000 ? 400 : 450
  if (dealType === 'single_family') bWidth = Math.min(bWidth, 240)

  // Era from year built, overridden by description keywords
  let era = yearBuilt < 1940 ? 'classical'
    : yearBuilt < 1970 ? 'midcentury'
    : yearBuilt < 2000 ? 'postmodern'
    : 'contemporary'
  if (/brick|traditional|classic/.test(desc)) era = 'classical'
  if (/glass|curtain|modern|contemporary/.test(desc)) era = 'contemporary'
  if (/industrial|loft/.test(desc)) era = 'industrial'
  if (/luxury|high.end|premium/.test(desc)) era = 'luxury'

  const palettes = {
    classical:    { body: '#5a4a3a', accent: '#c8a96e', window: '#c8e8f8', trim: '#8a7060' },
    midcentury:   { body: '#3a4a3a', accent: '#7eb87e', window: '#c0dce0', trim: '#5a6a5a' },
    postmodern:   { body: '#3a3a4a', accent: '#9888cc', window: '#b8c8e8', trim: '#5a5a7a' },
    contemporary: { body: '#2d3a5a', accent: '#4a90d9', window: '#d4e8f7', trim: '#3a5a8a' },
    industrial:   { body: '#3a3530', accent: '#d4832e', window: '#a8c0c8', trim: '#5a5040' },
    luxury:       { body: '#1a2535', accent: '#c9a84c', window: '#e8f4ff', trim: '#2a4060' },
  }
  const palette = { ...palettes[era] || palettes.contemporary }
  if (/brick/.test(desc)) { palette.body = '#7a4a38'; palette.accent = '#c8a060' }
  if (/concrete/.test(desc)) { palette.body = '#4a4a4a'; palette.accent = '#8a8a9a' }
  if (/steel/.test(desc)) { palette.body = '#3a4a5a'; palette.accent = '#8ab0d0' }

  // Ground floor treatment
  let groundFloor = 'residential'
  if (dealType === 'mixed_use' || dealType === 'commercial') groundFloor = 'retail'
  if (/parking|garage/.test(desc + currentUse)) groundFloor = 'parking'
  if (/retail|shop|restaurant/.test(desc)) groundFloor = 'retail'

  // Roof style
  let roofStyle = floors > 8 ? 'setback' : 'flat'
  if (dealType === 'single_family') roofStyle = 'pitched'
  if (/rooftop|roof deck|amenity/.test(desc)) roofStyle = 'amenity'
  if (/setback|stepback/.test(desc)) roofStyle = 'setback'
  if (era === 'classical' && dealType !== 'single_family') roofStyle = 'cornice'

  // Window style
  let windowStyle = 'standard'
  if (era === 'contemporary' || era === 'luxury') windowStyle = 'tall'
  if (era === 'classical') windowStyle = 'arched'
  if (dealType === 'commercial' && era !== 'classical') windowStyle = 'curtain'

  // Features
  const features = {
    balconies: /balcon|terrace/.test(desc) || (dealType === 'multifamily' && floors > 3),
    awnings: groundFloor === 'retail',
    rooftopDeck: /rooftop|roof deck/.test(desc) || roofStyle === 'amenity',
    podium: floors > 6 && dealType !== 'single_family',
  }

  // Quality from assessed value per sf
  let quality = 0.5
  if (assessedValue && lotSize) {
    const vpsf = assessedValue / lotSize
    quality = vpsf > 100 ? 0.9 : vpsf > 50 ? 0.7 : vpsf > 20 ? 0.5 : 0.3
  }
  if (era === 'luxury') quality = Math.max(quality, 0.85)

  return { dealType, floors, bWidth, era, palette, groundFloor, roofStyle, windowStyle, features, quality, location }
}

// ─── SVG Builder ─────────────────────────────────────────────────────────────

function buildingSVG(p) {
  const W = 800, H = 500, groundY = 400
  const { floors, bWidth, palette: pal, era, groundFloor, roofStyle, windowStyle, features, location } = p

  const groundFloorH = 58
  const upperFloorH = Math.min(48, (groundY - groundFloorH - 60) / Math.max(floors - 1, 1))
  const bHeight = groundFloorH + (floors - 1) * upperFloorH
  const bX = (W - bWidth) / 2
  const bY = groundY - bHeight

  // ── Windows ──────────────────────────────────────────────────────────────
  const winCols = Math.max(2, Math.floor(bWidth / 52))
  const winGapX = (bWidth - 20) / winCols
  const isArched = windowStyle === 'arched'
  const isCurtain = windowStyle === 'curtain'
  const isTall = windowStyle === 'tall'
  const winW = isCurtain ? winGapX - 4 : Math.min(32, winGapX - 14)
  const winH = isTall ? upperFloorH - 8 : isArched ? 30 : 20

  let windows = ''
  for (let row = 0; row < floors - 1; row++) {
    for (let col = 0; col < winCols; col++) {
      const wx = bX + 10 + col * winGapX + (winGapX - winW) / 2
      const wy = bY + (row * upperFloorH) + (upperFloorH - winH) / 2
      const lit = (row * winCols + col * 3 + 7) % 5 !== 0
      const wFill = lit ? pal.window : '#1a2a3a'

      if (isCurtain) {
        windows += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${winW.toFixed(1)}" height="${winH.toFixed(1)}"
          fill="${wFill}" stroke="${pal.trim}" stroke-width="0.5" opacity="0.92"/>`
      } else if (isArched) {
        const cx = wx + winW / 2, ry = wy + winH * 0.35
        windows += `<path d="M${wx},${wy + winH} L${wx},${ry} Q${cx},${wy - 4} ${wx + winW},${ry} L${wx + winW},${wy + winH} Z"
          fill="${wFill}" stroke="${pal.accent}" stroke-width="0.8"/>`
      } else {
        windows += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${winW.toFixed(1)}" height="${winH.toFixed(1)}" rx="1.5"
          fill="${wFill}" stroke="${pal.trim}" stroke-width="0.8"/>`
        if (lit) windows += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${winW.toFixed(1)}" height="3" rx="1"
          fill="${pal.window}" opacity="0.5"/>`
      }

      // Balconies
      if (features.balconies && row % 2 === 0 && col % 2 === 0 && p.dealType !== 'commercial') {
        const bx = wx - 3, by2 = wy + winH
        windows += `<rect x="${bx}" y="${by2}" width="${winW + 6}" height="5" fill="${pal.trim}" rx="1"/>
          <line x1="${bx + 2}" y1="${by2}" x2="${bx + 2}" y2="${by2 + 5}" stroke="${pal.accent}" stroke-width="0.8"/>
          <line x1="${bx + winW + 3}" y1="${by2}" x2="${bx + winW + 3}" y2="${by2 + 5}" stroke="${pal.accent}" stroke-width="0.8"/>`
      }
    }
  }

  // ── Ground floor ──────────────────────────────────────────────────────────
  let groundFloorSVG = ''
  if (groundFloor === 'retail') {
    const bayW = bWidth / Math.min(4, winCols) - 6
    const numBays = Math.floor(bWidth / (bayW + 6))
    for (let i = 0; i < numBays; i++) {
      const sx = bX + 4 + i * (bWidth / numBays)
      groundFloorSVG += `<rect x="${sx + 2}" y="${groundY - groundFloorH + 6}" width="${bWidth / numBays - 8}" height="${groundFloorH - 10}"
        fill="#0d1e30" stroke="${pal.accent}" stroke-width="1" rx="1"/>
        <rect x="${sx + 2}" y="${groundY - groundFloorH + 6}" width="${bWidth / numBays - 8}" height="8"
        fill="${pal.accent}" opacity="0.3" rx="1"/>`
      if (features.awnings) {
        groundFloorSVG += `<path d="M${sx + 1},${groundY - groundFloorH + 6} L${sx - 4},${groundY - groundFloorH - 4} L${sx + bWidth / numBays - 3},${groundY - groundFloorH - 4} L${sx + bWidth / numBays - 3},${groundY - groundFloorH + 6} Z"
          fill="${pal.accent}" opacity="0.6"/>`
      }
    }
  } else if (groundFloor === 'parking') {
    groundFloorSVG += `<rect x="${bX + 4}" y="${groundY - groundFloorH + 4}" width="${bWidth - 8}" height="${groundFloorH - 8}"
      fill="#0a1520" stroke="${pal.trim}" stroke-width="1" rx="1"/>
      <line x1="${bX + bWidth * 0.2}" y1="${groundY - groundFloorH + 4}" x2="${bX + bWidth * 0.2}" y2="${groundY - 4}" stroke="${pal.trim}" stroke-width="1" stroke-dasharray="4,3"/>
      <line x1="${bX + bWidth * 0.5}" y1="${groundY - groundFloorH + 4}" x2="${bX + bWidth * 0.5}" y2="${groundY - 4}" stroke="${pal.trim}" stroke-width="1.5" stroke-dasharray="4,3"/>
      <line x1="${bX + bWidth * 0.8}" y1="${groundY - groundFloorH + 4}" x2="${bX + bWidth * 0.8}" y2="${groundY - 4}" stroke="${pal.trim}" stroke-width="1" stroke-dasharray="4,3"/>`
  } else {
    // Residential lobby
    const dW = 44, dH = groundFloorH - 10
    const dX = bX + bWidth / 2 - dW / 2
    groundFloorSVG += `<rect x="${dX}" y="${groundY - groundFloorH + 6}" width="${dW}" height="${dH}"
      fill="#0d1e30" stroke="${pal.accent}" stroke-width="1.5" rx="2"/>
      <line x1="${bX + bWidth / 2}" y1="${groundY - groundFloorH + 6}" x2="${bX + bWidth / 2}" y2="${groundY}" stroke="${pal.trim}" stroke-width="0.8"/>`
    // Side windows
    for (let side = 0; side < 2; side++) {
      const wx = side === 0 ? bX + 16 : bX + bWidth - 44
      groundFloorSVG += `<rect x="${wx}" y="${groundY - groundFloorH + 10}" width="28" height="${groundFloorH - 18}"
        fill="${pal.window}" stroke="${pal.trim}" stroke-width="0.8" rx="1" opacity="0.8"/>`
    }
  }

  // ── Floor lines ───────────────────────────────────────────────────────────
  let floorLines = ''
  for (let i = 1; i < floors; i++) {
    const fy = bY + i * upperFloorH
    floorLines += `<line x1="${bX}" y1="${fy}" x2="${bX + bWidth}" y2="${fy}" stroke="${pal.trim}" stroke-width="0.5" opacity="0.4"/>`
  }

  // ── Roof ──────────────────────────────────────────────────────────────────
  let roof = ''
  if (roofStyle === 'pitched') {
    const px = bX + bWidth / 2
    const ph = 55 + floors * 5
    roof = `<polygon points="${bX - 8},${bY} ${bX + bWidth + 8},${bY} ${px},${bY - ph}"
      fill="${pal.body}" stroke="${pal.accent}" stroke-width="1.5"/>
      <polygon points="${bX - 8},${bY} ${px},${bY - ph} ${px},${bY}"
      fill="black" opacity="0.15"/>
      <line x1="${px}" y1="${bY - ph}" x2="${px}" y2="${bY}" stroke="${pal.accent}" stroke-width="0.8" opacity="0.5"/>`
  } else if (roofStyle === 'setback') {
    const sw = bWidth * 0.65, sx = bX + (bWidth - sw) / 2
    const sw2 = sw * 0.55, sx2 = bX + (bWidth - sw2) / 2
    roof = `<rect x="${sx}" y="${bY - 26}" width="${sw}" height="30" fill="${pal.body}" stroke="${pal.accent}" stroke-width="1" rx="1"/>
      <rect x="${sx2}" y="${bY - 50}" width="${sw2}" height="28" fill="${pal.body}" stroke="${pal.accent}" stroke-width="1" rx="1"/>
      <rect x="${bX + bWidth * 0.42}" y="${bY - 62}" width="14" height="16" fill="#334" rx="1"/>
      <rect x="${bX + bWidth * 0.58}" y="${bY - 58}" width="10" height="12" fill="#334" rx="1"/>`
    if (features.rooftopDeck) {
      roof += `<rect x="${sx + 8}" y="${bY - 30}" width="${sw - 16}" height="8" fill="${pal.accent}" opacity="0.4" rx="1"/>
        <line x1="${sx + 12}" y1="${bY - 30}" x2="${sx + 12}" y2="${bY - 38}" stroke="${pal.accent}" stroke-width="1.5" opacity="0.6"/>
        <line x1="${sx + sw - 12}" y1="${bY - 30}" x2="${sx + sw - 12}" y2="${bY - 38}" stroke="${pal.accent}" stroke-width="1.5" opacity="0.6"/>`
    }
  } else if (roofStyle === 'cornice') {
    roof = `<rect x="${bX - 8}" y="${bY - 14}" width="${bWidth + 16}" height="18" fill="${pal.accent}" opacity="0.7" rx="1"/>
      <rect x="${bX - 4}" y="${bY - 22}" width="${bWidth + 8}" height="10" fill="${pal.body}" stroke="${pal.accent}" stroke-width="1"/>`
  } else {
    // Flat + mechanical equipment
    roof = `<rect x="${bX - 4}" y="${bY - 10}" width="${bWidth + 8}" height="13" fill="${pal.accent}" opacity="0.5" rx="1"/>
      <rect x="${bX + bWidth * 0.35}" y="${bY - 26}" width="18" height="18" fill="#2a3040" rx="1"/>
      <rect x="${bX + bWidth * 0.55}" y="${bY - 22}" width="12" height="14" fill="#2a3040" rx="1"/>
      <circle cx="${bX + bWidth * 0.25}" cy="${bY - 18}" r="4" fill="#1a2030" stroke="${pal.trim}" stroke-width="1"/>`
    if (features.rooftopDeck) {
      roof += `<rect x="${bX + 16}" y="${bY - 28}" width="${bWidth - 32}" height="20" fill="${pal.accent}" opacity="0.15" rx="2"/>
        <rect x="${bX + 16}" y="${bY - 28}" width="${bWidth - 32}" height="3" fill="${pal.accent}" opacity="0.4" rx="1"/>
        <line x1="${bX + 20}" y1="${bY - 10}" x2="${bX + 20}" y2="${bY - 28}" stroke="${pal.accent}" stroke-width="1" opacity="0.5"/>
        <line x1="${bX + bWidth - 20}" y1="${bY - 10}" x2="${bX + bWidth - 20}" y2="${bY - 28}" stroke="${pal.accent}" stroke-width="1" opacity="0.5"/>`
    }
  }

  // ── Neighboring buildings (scaled to not compete) ─────────────────────────
  const nb = `
    <rect x="30" y="${groundY - 160}" width="100" height="160" fill="#141c28" stroke="#1e2a3a" stroke-width="1"/>
    ${[...Array(12)].map((_, i) => {
      const row = Math.floor(i / 3), col = i % 3
      const lit2 = i % 4 !== 1
      return `<rect x="${50 + col * 26}" y="${groundY - 145 + row * 36}" width="18" height="14"
        fill="${lit2 ? '#1e3a5a' : '#0d1520'}" stroke="#1e2a3a" stroke-width="0.5"/>`
    }).join('')}
    <rect x="${W - 150}" y="${groundY - 200}" width="120" height="200" fill="#141c28" stroke="#1e2a3a" stroke-width="1"/>
    ${[...Array(15)].map((_, i) => {
      const row = Math.floor(i / 3), col = i % 3
      const lit2 = i % 3 !== 2
      return `<rect x="${W - 135 + col * 30}" y="${groundY - 185 + row * 36}" width="20" height="14"
        fill="${lit2 ? '#d4e8f7' : '#0d1520'}" stroke="#1e2a3a" stroke-width="0.5" opacity="${lit2 ? 0.4 : 1}"/>`
    }).join('')}`

  // ── Era badge ─────────────────────────────────────────────────────────────
  const eraLabel = { classical: 'CLASSICAL', midcentury: 'MID-CENTURY', postmodern: 'POSTMODERN', contemporary: 'CONTEMPORARY', industrial: 'INDUSTRIAL', luxury: 'LUXURY' }[era] || ''
  const locationLine = location ? `<text x="${W / 2}" y="${H - 10}" text-anchor="middle" fill="#4a6a8a" font-size="10" font-family="monospace">${location.slice(0, 70)}</text>` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#03080f"/>
      <stop offset="65%" stop-color="#0d1e35"/>
      <stop offset="100%" stop-color="#1a3050"/>
    </linearGradient>
    <linearGradient id="gnd" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#181828"/>
      <stop offset="100%" stop-color="#0a0a14"/>
    </linearGradient>
    <linearGradient id="bldg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${pal.body}"/>
      <stop offset="40%" stop-color="${pal.body}"/>
      <stop offset="100%" stop-color="${pal.trim}" stop-opacity="0.6"/>
    </linearGradient>
    <filter id="softglow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>

  <!-- Stars -->
  ${Array.from({length: 50}, (_, i) => {
    const sx = (i * 163 + 40) % (W - 30) + 15
    const sy = (i * 97 + 15) % (groundY - 100)
    const r = i % 7 === 0 ? 1.5 : 1
    return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="white" opacity="${0.2 + (i % 4) * 0.1}"/>`
  }).join('')}

  <!-- Neighbor buildings -->
  ${nb}

  <!-- Building shadow -->
  <rect x="${bX + 10}" y="${bY + 12}" width="${bWidth}" height="${bHeight}" fill="black" opacity="0.35" rx="2"/>

  <!-- Main building -->
  <rect x="${bX}" y="${bY}" width="${bWidth}" height="${bHeight}" fill="url(#bldg)" rx="2"/>

  <!-- Facade overlay for depth -->
  <rect x="${bX}" y="${bY}" width="${bWidth}" height="${bHeight}" fill="url(#sky)" opacity="0.08" rx="2"/>

  <!-- Vertical accent strips -->
  <rect x="${bX}" y="${bY}" width="5" height="${bHeight}" fill="${pal.accent}" opacity="0.45" rx="1"/>
  <rect x="${bX + bWidth - 5}" y="${bY}" width="5" height="${bHeight}" fill="${pal.accent}" opacity="0.25" rx="1"/>

  <!-- Floor lines -->
  ${floorLines}

  <!-- Windows -->
  ${windows}

  <!-- Ground floor -->
  ${groundFloorSVG}

  <!-- Roof -->
  ${roof}

  <!-- Building outline glow -->
  <rect x="${bX}" y="${bY}" width="${bWidth}" height="${bHeight}" fill="none"
    stroke="${pal.accent}" stroke-width="1.5" rx="2" opacity="0.5"/>

  <!-- Ground plane -->
  <rect x="0" y="${groundY}" width="${W}" height="${H - groundY}" fill="url(#gnd)"/>
  <line x1="0" y1="${groundY}" x2="${W}" y2="${groundY}" stroke="${pal.accent}" stroke-width="0.5" opacity="0.3"/>
  <line x1="0" y1="${groundY + 28}" x2="${W}" y2="${groundY + 28}" stroke="#1a2a3a" stroke-width="0.5" stroke-dasharray="25,18"/>

  <!-- Sidewalk detail -->
  <line x1="${bX - 20}" y1="${groundY + 2}" x2="${bX + bWidth + 20}" y2="${groundY + 2}" stroke="${pal.accent}" stroke-width="1" opacity="0.2"/>

  <!-- Labels -->
  <text x="${W / 2}" y="${H - 28}" text-anchor="middle" fill="${pal.accent}" font-size="11"
    font-family="monospace" font-weight="bold" opacity="0.7">
    AI CONCEPT RENDER  ·  ${floors} FL  ·  ${eraLabel}  ·  ${Math.round(p.bWidth * 3.2).toLocaleString()} SF EST.
  </text>
  ${locationLine}
</svg>`
}
