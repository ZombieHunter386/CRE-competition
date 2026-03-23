export default function BottomDrawer({ deal, onClose, onOpen }) {
  const irr = deal.model?.outputs?.leverIrr
  const em = deal.model?.outputs?.equityMultiple

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#161b22] border-t-2 border-blue-400 p-3 flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-2xl flex-shrink-0">📍</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white truncate">{deal.address || 'New Property'}</div>
        <div className="text-gray-400 text-sm mt-0.5">
          {deal.dealType && <span className="capitalize">{deal.dealType.replace('_', ' ')}</span>}
          {irr && <span className="ml-3">IRR: <span className="text-green-400">{irr}%</span></span>}
          {em && <span className="ml-3">EM: <span className="text-green-400">{em}×</span></span>}
        </div>
      </div>
      <button onClick={onOpen} className="bg-orange-500 text-black font-bold px-4 py-2 rounded text-sm flex-shrink-0">Open →</button>
      <button onClick={onClose} className="text-gray-500 ml-2 text-lg">✕</button>
    </div>
  )
}
