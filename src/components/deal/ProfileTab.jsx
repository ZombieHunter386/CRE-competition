import { useState, useEffect } from 'react'
import { fetchParcelByPin, reverseGeocode } from '../../services/county'
import { getStreetViewUrl } from '../../services/streetview'
import { getSettings } from '../../store/settings'

export default function ProfileTab({ deal, onUpdate }) {
  const [pin, setPin] = useState(deal.propertyFacts?.pin || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!deal.lat || !deal.lng || deal.propertyFacts?.pin) return
    const { mapboxToken } = getSettings()
    if (!mapboxToken) return
    setLoading(true)
    reverseGeocode(deal.lat, deal.lng, mapboxToken)
      .then(address => fetchParcelByPin(address))
      .then(facts => {
        const streetViewUrl = getStreetViewUrl(deal.lat, deal.lng)
        const contacts = deal.contacts || []
        setPin(facts.pin || '')
        onUpdate({
          propertyFacts: { ...facts },
          address: facts.address || deal.address,
          streetViewUrl,
          contacts: contacts.some(c => c.role === 'owner') ? contacts : [
            ...contacts,
            {
              id: crypto.randomUUID(), role: 'owner',
              name: facts.ownerName, company: '',
              phone: '', email: '',
              address: facts.ownerAddress,
              lastContacted: null, autoFilled: true,
            }
          ]
        })
      })
      .catch(() => { /* silent — leave form empty for manual entry */ })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePinLookup() {
    if (!pin) return
    setLoading(true); setError(null)
    try {
      const facts = await fetchParcelByPin(pin)
      const streetViewUrl = getStreetViewUrl(deal.lat, deal.lng)
      onUpdate({
        propertyFacts: { ...facts, pin },
        address: facts.address || deal.address,
        streetViewUrl,
        // Auto-populate owner contact
        contacts: deal.contacts.some(c => c.role === 'owner') ? deal.contacts : [
          ...deal.contacts,
          {
            id: crypto.randomUUID(), role: 'owner',
            name: facts.ownerName, company: '',
            phone: '', email: '',
            address: facts.ownerAddress,
            lastContacted: null, autoFilled: true,
          }
        ]
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const f = deal.propertyFacts || {}
  const FACT_FIELDS = [
    ['PIN', f.pin], ['Lot Size', f.lotSize ? `${f.lotSize?.toLocaleString()} sf` : null],
    ['Property Type', f.zoning], ['Neighborhood', f.currentUse],
    ['Assessed Value', f.assessedValue ? `$${f.assessedValue?.toLocaleString()}` : null],
    ['Tax Year', f.taxYear], ['Owner Name', f.ownerName],
    ['Owner Address', f.ownerAddress],
    ['Year Built', f.yearBuilt],
  ]

  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {/* Left column */}
      <div className="flex flex-col gap-4">
        {/* Street View */}
        <div className="bg-[#161b22] border border-gray-700 rounded-lg overflow-hidden">
          {deal.streetViewUrl
            ? <iframe src={deal.streetViewUrl} title="Street View" className="w-full h-36 border-0" allowFullScreen />
            : <div className="h-36 flex items-center justify-center text-gray-600">Street View</div>}
          <div className="text-center text-gray-400 text-xs py-1">Street View</div>
        </div>

        {/* Description */}
        <div className="bg-[#161b22] border border-gray-700 rounded-lg p-3">
          <label className="text-gray-400 text-xs block mb-1">📝 Deal Description</label>
          <textarea
            className="w-full bg-transparent text-gray-200 text-sm resize-none outline-none"
            rows={4}
            placeholder="Describe the proposed development..."
            value={deal.description}
            onChange={e => onUpdate({ description: e.target.value })}
          />
        </div>
      </div>

      {/* Right column: Property Facts */}
      <div className="bg-[#161b22] border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-blue-400 font-semibold text-sm">📋 Property Facts</span>
          {f.pin && <span className="text-green-400 text-xs">✓ Auto-filled from PIN</span>}
        </div>

        {/* PIN lookup */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter PIN (e.g. 14-21-101-001-0000) or Address"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-600 text-white text-sm px-3 py-1.5 rounded outline-none"
          />
          <button
            onClick={handlePinLookup}
            disabled={loading}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded disabled:opacity-50"
          >{loading ? '...' : 'Lookup'}</button>
        </div>

        {error && <div className="text-red-400 text-xs mb-3">{error}</div>}

        <div className="grid grid-cols-2 gap-2">
          {FACT_FIELDS.map(([label, value]) => (
            <div key={label} className="bg-gray-900 rounded p-2">
              <div className="text-gray-500 text-xs">{label}</div>
              <div className="text-white text-sm mt-0.5">{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
