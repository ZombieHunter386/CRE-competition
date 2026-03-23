import { useState } from 'react'
import ContactCard from './ContactCard'
import AddContactModal from './AddContactModal'
import BrokerEmailModal from '../model/BrokerEmailModal'

const ROLE_CHIPS = [
  { role: 'listing_broker', label: '🤝 Broker' },
  { role: 'attorney', label: '⚖️ Attorney' },
  { role: 'contractor', label: '🏗️ Contractor' },
  { role: 'custom', label: '+ Custom' },
]

export default function ContactsTab({ deal, onUpdate }) {
  const [editingContact, setEditingContact] = useState(null)
  const [addingRole, setAddingRole] = useState(null)
  const [emailContact, setEmailContact] = useState(null)

  function deleteContact(id) {
    onUpdate({ contacts: deal.contacts.filter(c => c.id !== id) })
  }

  function saveContact(contact) {
    const contacts = deal.contacts.some(c => c.id === contact.id)
      ? deal.contacts.map(c => c.id === contact.id ? contact : c)
      : [...deal.contacts, { ...contact, id: crypto.randomUUID() }]
    onUpdate({ contacts })
    setEditingContact(null)
    setAddingRole(null)
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      {deal.contacts.map(c => (
        <ContactCard
          key={c.id}
          contact={c}
          onEdit={setEditingContact}
          onDelete={deleteContact}
          onDraftEmail={setEmailContact}
        />
      ))}

      {/* Add contact row */}
      <div className="border border-dashed border-gray-700 rounded-lg p-3 flex items-center gap-3">
        <span className="text-gray-500 text-sm">+ Add Contact</span>
        <div className="flex gap-2 flex-wrap">
          {ROLE_CHIPS.map(({ role, label }) => (
            <button key={role} onClick={() => setAddingRole(role)}
              className="bg-[#161b22] border border-gray-600 text-gray-400 text-xs px-3 py-1 rounded hover:border-gray-400">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Email hint */}
      <div className="bg-green-950 border border-green-700 rounded-lg p-3 flex items-center gap-3 text-sm">
        <span className="text-xl">📧</span>
        <div>
          <strong className="text-green-400">Draft Email with Claude</strong>
          <div className="text-gray-400 text-xs mt-1">Click "Draft Email" on any contact — Claude uses their role and deal details to write tailored outreach.</div>
        </div>
      </div>

      {(editingContact || addingRole) && (
        <AddContactModal
          contact={editingContact}
          defaultRole={addingRole}
          onSave={saveContact}
          onClose={() => { setEditingContact(null); setAddingRole(null) }}
        />
      )}

      {emailContact && (
        <BrokerEmailModal
          contact={emailContact}
          deal={deal}
          onClose={() => setEmailContact(null)}
        />
      )}
    </div>
  )
}
