import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeals, deleteDeal } from '../../store/deals'
import { exportPipelineToExcel } from '../../utils/export'

const STATUS_OPTIONS = ['Tracking', 'Active', 'Pass']

export default function PipelineSummary() {
  const [deals, setDeals] = useState([])
  const [sortKey, setSortKey] = useState('updatedAt')
  const [sortDir, setSortDir] = useState('desc')
  const navigate = useNavigate()

  useEffect(() => { setDeals(getDeals()) }, [])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function getVal(deal, k) {
    const map = {
      address: deal.address, dealType: deal.dealType,
      irr: deal.model?.outputs?.leverIrr,
      equityMultiple: deal.model?.outputs?.equityMultiple,
      noi: deal.model?.outputs?.noi,
      totalDevCost: deal.model?.outputs?.totalDevCost,
      updatedAt: deal.updatedAt,
    }
    return map[k] ?? 0
  }

  const sorted = [...deals].sort((a, b) => {
    const av = getVal(a, sortKey), bv = getVal(b, sortKey)
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const COLS = [
    { key: 'address', label: 'Address' },
    { key: 'dealType', label: 'Type' },
    { key: 'irr', label: 'IRR' },
    { key: 'equityMultiple', label: 'Eq. Multiple' },
    { key: 'noi', label: 'NOI' },
    { key: 'totalDevCost', label: 'TDC' },
    { key: 'updatedAt', label: 'Updated' },
  ]

  return (
    <div className="min-h-screen bg-[#0d1117] p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-2xl font-bold">📋 Deal Pipeline</h1>
        <div className="flex gap-3">
          <button onClick={() => exportPipelineToExcel(deals)}
            className="bg-orange-900 border border-orange-500 text-orange-400 px-4 py-2 rounded text-sm">📊 Export Excel</button>
          <button onClick={() => navigate('/')}
            className="bg-blue-900 border border-blue-500 text-blue-400 px-4 py-2 rounded text-sm">+ New Deal</button>
        </div>
      </div>

      {deals.length === 0
        ? <div className="text-center text-gray-500 py-20">No deals yet — click a location on the map to get started.</div>
        : <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  {COLS.map(col => (
                    <th key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="text-left text-gray-400 font-semibold px-3 py-2 cursor-pointer hover:text-white select-none">
                      {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th className="text-gray-400 font-semibold px-3 py-2">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(deal => {
                  const o = deal.model?.outputs || {}
                  return (
                    <tr key={deal.id} className="border-b border-gray-800 hover:bg-gray-900 cursor-pointer"
                      onClick={() => navigate(`/deal/${deal.id}`)}>
                      <td className="px-3 py-2 text-white">{deal.name || deal.address || 'Untitled'}</td>
                      <td className="px-3 py-2 text-gray-300 capitalize">{deal.dealType?.replace('_', ' ') || '—'}</td>
                      <td className="px-3 py-2 text-green-400 font-semibold">{o.leverIrr ? `${o.leverIrr.toFixed(1)}%` : '—'}</td>
                      <td className="px-3 py-2 text-green-400 font-semibold">{o.equityMultiple ? `${o.equityMultiple.toFixed(2)}×` : '—'}</td>
                      <td className="px-3 py-2 text-white">{o.noi ? `$${Math.round(o.noi).toLocaleString()}` : '—'}</td>
                      <td className="px-3 py-2 text-white">{o.totalDevCost ? `$${(o.totalDevCost / 1e6).toFixed(1)}M` : '—'}</td>
                      <td className="px-3 py-2 text-gray-400 text-xs">{deal.updatedAt?.slice(0, 10) || '—'}</td>
                      <td className="px-3 py-2">
                        <select className="bg-transparent text-xs border border-gray-700 rounded px-1 py-0.5"
                          onClick={e => e.stopPropagation()}
                          defaultValue="Tracking">
                          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={e => { e.stopPropagation(); deleteDeal(deal.id); setDeals(getDeals()) }}
                          className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}
