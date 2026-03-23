import { v4 as uuidv4 } from 'uuid'

const KEY = 'sitestack_deals'

export function getDeals() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

export function getDeal(id) {
  return getDeals().find(d => d.id === id) || null
}

export function saveDeal(deal) {
  const deals = getDeals()
  const now = new Date().toISOString()
  const existing = deals.findIndex(d => d.id === deal.id)
  if (existing >= 0) {
    deals[existing] = { ...deal, updatedAt: now }
  } else {
    deals.push({ ...deal, id: deal.id || uuidv4(), createdAt: now, updatedAt: now })
  }
  localStorage.setItem(KEY, JSON.stringify(deals))
  return deals.find(d => d.id === deal.id)
}

export function deleteDeal(id) {
  const deals = getDeals().filter(d => d.id !== id)
  localStorage.setItem(KEY, JSON.stringify(deals))
}

export function createEmptyDeal(lat, lng) {
  return {
    id: uuidv4(),
    address: '',
    lat,
    lng,
    dealType: null,
    description: '',
    propertyFacts: {},
    contacts: [],
    model: {
      mode: 'know_price',
      inputs: {},
      assumptions: {},
      outputs: {},
      luckysheetData: null,
      pinnedCells: [],
      uploadedModel: null,
    },
    conceptRenderUrl: null,
    streetViewUrl: null,
    createdAt: null,
    updatedAt: null,
  }
}
