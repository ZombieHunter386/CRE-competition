import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDeal, saveDeal } from '../../store/deals'
import ProfileTab from './ProfileTab'
import ContactsTab from './ContactsTab'
import ModelTab from '../model/ModelTab'

const TABS = ['📍 Profile', '👥 Contacts', '📊 BOE Model']

export default function DealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const d = getDeal(id)
    if (!d) navigate('/')
    setDeal(d)
  }, [id])

  function updateDeal(updates) {
    const updated = { ...deal, ...updates }
    saveDeal(updated)
    setDeal(updated)
  }

  if (!deal) return null

  const DEAL_TYPE_LABELS = {
    multifamily: 'Multifamily', commercial: 'Commercial',
    mixed_use: 'Mixed-Use', single_family: 'Single Family',
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top bar */}
      <div className="bg-[#161b22] border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-blue-400">← Map</button>
          <span className="text-gray-600">|</span>
          <span className="text-white font-semibold">{deal.address || 'New Property'}</span>
          {deal.dealType && (
            <span className="bg-green-900 border border-green-500 text-green-400 text-xs px-2 py-0.5 rounded">
              {DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { saveDeal(deal); alert('Deal saved!') }}
            className="bg-blue-900 border border-blue-400 text-blue-400 text-sm px-3 py-1 rounded"
          >💾 Save Deal</button>
          <button className="bg-orange-900 border border-orange-400 text-orange-400 text-sm px-3 py-1 rounded">📤 Export</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#0d1117] flex border-b border-gray-700">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-6 py-2 text-sm transition-colors ${
              activeTab === i
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 0 && <ProfileTab deal={deal} onUpdate={updateDeal} />}
        {activeTab === 1 && <ContactsTab deal={deal} onUpdate={updateDeal} />}
        {activeTab === 2 && <ModelTab deal={deal} onUpdate={updateDeal} />}
      </div>
    </div>
  )
}
