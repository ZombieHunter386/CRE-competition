const ROLE_ICONS = {
  owner: '🏠', listing_broker: '🤝', buyers_broker: '🏦',
  attorney: '⚖️', contractor: '🏗️', custom: '👤',
}

export default function ContactCard({ contact, onEdit, onDelete }) {
  return (
    <div className="bg-[#161b22] border border-gray-700 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-900 border border-purple-500 flex items-center justify-center text-lg flex-shrink-0">
            {ROLE_ICONS[contact.role] || '👤'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold">{contact.name || 'Unnamed'}</span>
              <span className="bg-purple-900 border border-purple-500 text-purple-300 text-xs px-2 py-0.5 rounded capitalize">
                {contact.role?.replace('_', ' ')}
              </span>
              {contact.company && <span className="text-gray-400 text-sm">{contact.company}</span>}
              {contact.autoFilled && (
                <span className="bg-green-900 border border-green-500 text-green-400 text-xs px-2 py-0.5 rounded">✓ Auto-filled</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
              {contact.address && (
                <div><div className="text-gray-500 text-xs">Address</div><div className="text-gray-300">{contact.address}</div></div>
              )}
              {contact.phone && (
                <div><div className="text-gray-500 text-xs">Phone</div><div className="text-gray-300">{contact.phone}</div></div>
              )}
              {contact.email && (
                <div><div className="text-gray-500 text-xs">Email</div>
                  <a href={`mailto:${contact.email}`} className="text-blue-400">{contact.email}</a>
                </div>
              )}
              {contact.lastContacted && (
                <div><div className="text-gray-500 text-xs">Last Contacted</div><div className="text-gray-300">{contact.lastContacted}</div></div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
<button onClick={() => onEdit(contact)} className="bg-blue-900 border border-blue-500 text-blue-400 text-xs px-2 py-1 rounded">✏️ Edit</button>
          <button onClick={() => onDelete(contact.id)} className="text-gray-600 text-xs px-1">✕</button>
        </div>
      </div>
    </div>
  )
}
