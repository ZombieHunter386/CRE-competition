import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#161b22] border-b border-gray-700 h-12 flex items-center px-4 gap-6">
      <span className="text-blue-400 font-bold text-lg">SiteStack</span>
      <NavLink to="/" className={({ isActive }) => isActive ? 'text-blue-400' : 'text-gray-400'}>🗺️ Map</NavLink>
      <NavLink to="/pipeline" className={({ isActive }) => isActive ? 'text-blue-400' : 'text-gray-400'}>📋 Pipeline</NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? 'text-blue-400' : 'text-gray-400'}>⚙️ Settings</NavLink>
    </nav>
  )
}
