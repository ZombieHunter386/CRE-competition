const KEY = 'sitestack_settings'

const DEFAULTS = {
  mapboxToken: '',
  claudeApiKey: '',
  openaiApiKey: '',
  googleMapsKey: '',
  countyApiEndpoint: '',
  countyApiKey: '',
  userName: '',
  hurdleIrr: 12,
  hurdleEquityMultiple: 1.75,
}

export function getSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
