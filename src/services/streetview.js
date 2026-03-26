export function getStreetViewUrl(lat, lng) {
  if (!lat || !lng) return null
  return `https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&output=svembed`
}
