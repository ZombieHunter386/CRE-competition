import { useState } from 'react'

const ROLES = ['owner', 'listing_broker', 'buyers_broker', 'attorney', 'contractor', 'custom']

export default function AddContactModal({ contact, defaultRole, onSave, onClose }) {
  const [form, setForm] = useState(contact || {
    role: defaultRole || 'listing_broker', name: '', company: '',
    phone: '', email: '', address: '', lastContacted: '', autoFilled: false,
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#161b22] border border-gray-600 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-white font-bold text-lg mb-4">{contact ? 'Edit Contact' : 'Add Contact'}</h3>
        <div className="flex flex-col gap-3">
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className="bg-gray-900 border border-gray-600 text-white text-sm px-3 py-2 rounded">
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
          </select>
          {['name', 'company', 'phone', 'email', 'address'].map(field => (
            <input key={field} type="text" placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={form[field]} onChange={e => set(field, e.target.value)}
              className="bg-gray-900 border border-gray-600 text-white text-sm px-3 py-2 rounded" />
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => onSave(form)} className="flex-1 bg-blue-600 text-white py-2 rounded font-semibold">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  )
}
