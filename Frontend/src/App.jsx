import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { VehicleRegistryPage } from './pages/VehicleRegistryPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <div>
        <h1>TransitOps Portal</h1>
        <Routes>
          <Route path="/" element={<VehicleRegistryPage />} />
          <Route path="/vehicles" element={<VehicleRegistryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
