import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { getSettings } from '../../store/settings'
import { getDeals, saveDeal, createEmptyDeal } from '../../store/deals'
import BottomDrawer from './BottomDrawer'
import AddressSearch from './AddressSearch'
import { useNavigate, useLocation } from 'react-router-dom'

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
  const [pendingPin, setPendingPin] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Check token on every render (cheap localStorage read)
  const settings = getSettings()
  const token = settings.mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN
  const hasToken = !!token

  // Initialize map when token is available
  useEffect(() => {
    if (!token || !mapContainer.current) return
    if (map.current) return // already initialized

    mapboxgl.accessToken = token

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-87.6298, 41.8781], // Chicago default
      zoom: 12,
    })
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Click map to drop a pending pin (don't create deal immediately)
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat
      setPendingPin({ lat, lng })
      setSelectedDeal(null)
    })

    setDeals(getDeals())

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [token])

  // Refresh deals list when navigating back to map
  useEffect(() => {
    setDeals(getDeals())
  }, [location])

  // Pending pin marker
  const pendingMarkerRef = useRef(null)
  useEffect(() => {
    if (pendingMarkerRef.current) {
      pendingMarkerRef.current.remove()
      pendingMarkerRef.current = null
    }
    if (pendingPin && map.current) {
      const el = document.createElement('div')
      el.style.cssText = `
        width: 20px; height: 20px; border-radius: 50%;
        background: #ff6b35; border: 3px solid white;
        cursor: pointer; box-shadow: 0 0 8px rgba(255,107,53,0.6);
      `
      pendingMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([pendingPin.lng, pendingPin.lat])
        .addTo(map.current)
    }
  }, [pendingPin])

  function handleCreateDeal() {
    if (!pendingPin) return
    const deal = createEmptyDeal(pendingPin.lat, pendingPin.lng)
    saveDeal(deal)
    setDeals(getDeals())
    setPendingPin(null)
    navigate(`/deal/${deal.id}`)
  }

  function handleCancelPin() {
    setPendingPin(null)
  }

  // Add/update markers when deals change
  useEffect(() => {
    if (!map.current) return
    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}

    deals.forEach(deal => {
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
        setPendingPin(null)
      })
      markersRef.current[deal.id] = marker
    })
  }, [deals])

  // No token — show setup prompt
  if (!hasToken) {
    return (
      <div className="h-[calc(100vh-3rem)] bg-[#0d1117] flex items-center justify-center">
        <div className="bg-[#161b22] border border-gray-700 rounded-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-white text-xl font-bold mb-2">Map needs a Mapbox token</h2>
          <p className="text-gray-400 text-sm mb-4">
            Go to Settings and add your Mapbox token to enable the interactive map.
            Get a free token at mapbox.com.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Go to Settings →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-3rem)]">
      <AddressSearch onSelect={(feature) => {
        const [lng, lat] = feature.center
        map.current?.flyTo({ center: [lng, lat], zoom: 16 })
      }} />
      <div ref={mapContainer} className="w-full h-full" />

      {/* Pending pin confirmation */}
      {pendingPin && !selectedDeal && (
        <div className="absolute bottom-0 left-0 right-0 bg-[#161b22] border-t-2 border-orange-500 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-900 rounded-full flex items-center justify-center text-xl flex-shrink-0">📍</div>
          <div className="flex-1">
            <div className="text-white font-semibold">New property pin dropped</div>
            <div className="text-gray-400 text-sm">
              {pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}
            </div>
          </div>
          <button onClick={handleCreateDeal}
            className="bg-orange-500 hover:bg-orange-600 text-black font-bold px-5 py-2 rounded text-sm flex-shrink-0 transition-colors">
            Start Deal →
          </button>
          <button onClick={handleCancelPin}
            className="text-gray-500 hover:text-white ml-1 text-lg transition-colors">✕</button>
        </div>
      )}

      {/* Selected existing deal drawer */}
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
