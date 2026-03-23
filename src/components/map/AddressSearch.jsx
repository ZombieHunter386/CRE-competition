import { useState } from 'react'
import { getSettings } from '../../store/settings'

export default function AddressSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  async function search(q) {
    setQuery(q)
    if (q.length < 3) { setResults([]); return }
    const { mapboxToken } = getSettings()
    const token = mapboxToken || import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) return
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&types=address&limit=5`
    )
    const data = await res.json()
    setResults(data.features || [])
  }

  return (
    <div className="absolute top-3 left-3 z-10 w-72">
      <input
        type="text" value={query} onChange={e => search(e.target.value)}
        placeholder="Search address..."
        className="w-full bg-[#161b22] border border-gray-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
      />
      {results.length > 0 && (
        <div className="mt-1 bg-[#161b22] border border-gray-600 rounded-lg overflow-hidden shadow-xl">
          {results.map(r => (
            <div key={r.id} onClick={() => { onSelect(r); setResults([]); setQuery(r.place_name) }}
              className="px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0">
              {r.place_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
