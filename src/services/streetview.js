import { getSettings } from '../store/settings'

export function getStreetViewUrl(lat, lng) {
  const { googleMapsKey } = getSettings()
  if (!googleMapsKey) return null
  return `https://maps.googleapis.com/maps/api/streetview?size=400x250&location=${lat},${lng}&key=${googleMapsKey}`
}
