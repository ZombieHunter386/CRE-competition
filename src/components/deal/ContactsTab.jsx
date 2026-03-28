import { useState } from 'react'
import ContactCard from './ContactCard'
import AddContactModal from './AddContactModal'

const ROLE_CHIPS = [
  { role: 'listing_broker', label: '🤝 Broker' },
  { role: 'attorney', label: '⚖️ Attorney' },
  { role: 'contractor', label: '🏗️ Contractor' },
  { role: 'custom', label: '+ Custom' },
]

export default function ContactsTab({ deal, onUpdate }) {
  const [editingContact, setEditingContact] = useState(null)
  const [addingRole, setAddingRole] = useState(null)

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

{(editingContact || addingRole) && (
        <AddContactModal
          contact={editingContact}
          defaultRole={addingRole}
          onSave={saveContact}
          onClose={() => { setEditingContact(null); setAddingRole(null) }}
        />
      )}

    </div>
  )
}
