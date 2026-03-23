import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import MapPage from './pages/MapPage'
import DealPage from './pages/DealPage'
import PipelinePage from './pages/PipelinePage'
import SettingsPage from './pages/SettingsPage'
import './styles/index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="pt-12">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/deal/:id" element={<DealPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
