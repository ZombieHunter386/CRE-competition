import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { getSettings } from '../../store/settings'
import { getDeals, saveDeal, createEmptyDeal } from '../../store/deals'
import BottomDrawer from './BottomDrawer'
import { useNavigate } from 'react-router-dom'

const DEAL_TYPE_COLORS = {
  multifamily: '#4caf50',
  commercial: '#4a9eff',
  mixed_use: '#f0a500',
  single_family: '#9b59ff',
  unknown: '#aaaaaa',
}

export default function MapView() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef({})
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [deals, setDeals] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const settings = getSettings()
    mapboxgl.accessToken = settings.mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-87.6298, 41.8781], // Chicago default
      zoom: 12,
    })
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Click to add new property
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      const deal = createEmptyDeal(lat, lng)
      saveDeal(deal)
      setDeals(getDeals())
      navigate(`/deal/${deal.id}`)
    })

    setDeals(getDeals())
    return () => map.current?.remove()
  }, [])

  // Add/update markers when deals change
  useEffect(() => {
    deals.forEach(deal => {
      if (markersRef.current[deal.id]) {
        markersRef.current[deal.id].remove()
      }
      const el = document.createElement('div')
      el.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: ${DEAL_TYPE_COLORS[deal.dealType] || DEAL_TYPE_COLORS.unknown};
        border: 2px solid white; cursor: pointer;
      `
      const marker = new mapboxgl.Marker(el)
        .setLngLat([deal.lng, deal.lat])
        .addTo(map.current)
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedDeal(deal)
      })
      markersRef.current[deal.id] = marker
    })
  }, [deals])

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <div ref={mapContainer} className="w-full h-full" />
      {selectedDeal && (
        <BottomDrawer
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onOpen={() => navigate(`/deal/${selectedDeal.id}`)}
        />
      )}
    </div>
  )
}
