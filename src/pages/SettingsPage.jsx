import { useState } from 'react'
import { getSettings, saveSettings } from '../store/settings'

export default function SettingsPage() {
  const [form, setForm] = useState(getSettings())
  const [saved, setSaved] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleSave() {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SECTIONS = [
    {
      title: '🔑 API Keys',
      fields: [
        { key: 'mapboxToken', label: 'Mapbox Token', placeholder: 'pk.eyJ1...' },
      ]
    },
    {
      title: '📊 Hurdle Rates',
      fields: [
        { key: 'hurdleIrr', label: 'Target IRR (%)', type: 'number' },
        { key: 'hurdleEquityMultiple', label: 'Target Equity Multiple', type: 'number' },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 max-w-2xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">⚙️ Settings</h1>
      <div className="flex flex-col gap-6">
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-[#161b22] border border-gray-700 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">{section.title}</h2>
            <div className="flex flex-col gap-3">
              {section.fields.map(field => (
                <div key={field.key}>
                  <label className="text-gray-400 text-sm block mb-1">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={form[field.key]}
                    onChange={e => set(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-900 border border-gray-600 text-white text-sm px-3 py-2 rounded outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={handleSave}
          className="bg-blue-600 text-white py-3 rounded-xl font-bold text-base">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
        <p className="text-gray-600 text-xs text-center">All keys stored in your browser only. Never sent to any server.</p>
      </div>
    </div>
  )
}
