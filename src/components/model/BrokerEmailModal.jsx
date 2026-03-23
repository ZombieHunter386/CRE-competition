import { useState, useEffect } from 'react'
import { draftBrokerEmail } from '../../services/claude'
import { getSettings } from '../../store/settings'

export default function BrokerEmailModal({ contact, deal, onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { userName } = getSettings()
    draftBrokerEmail({
      contact, deal,
      outputs: deal.model?.outputs || {},
      userName: userName || 'Hunter',
    }).then(setEmail).finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-gray-600 rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold text-lg">📧 Draft Email — {contact.name}</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        {loading
          ? <div className="text-gray-400 text-sm py-8 text-center">🤖 Claude is drafting your email...</div>
          : <textarea
              className="w-full bg-gray-900 border border-gray-600 text-gray-200 text-sm p-3 rounded resize-none"
              rows={12}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
        }
        <div className="flex gap-3 mt-4">
          <button onClick={() => { navigator.clipboard.writeText(email); alert('Copied!') }}
            className="flex-1 bg-green-700 text-white py-2 rounded font-semibold">📋 Copy</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded">Close</button>
        </div>
      </div>
    </div>
  )
}
