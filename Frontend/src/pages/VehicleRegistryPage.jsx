import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

export function VehicleRegistryPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadVehicles() {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/vehicles')
      setVehicles(response.data.payload)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to fetch vehicles right now')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Failed to logout', err)
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  return (
    <div>
      <h2>Vehicle Registry</h2>
      
      {user ? (
        <div>
          <p><strong>Welcome back, {user.name}!</strong></p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>No user profile loaded.</p>
      )}

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Registration Number</th>
                <th>Vehicle Model</th>
                <th>Vehicle Type</th>
                <th>Maximum Load Capacity</th>
                <th>Odometer</th>
                <th>Acquisition Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.registration_number}</td>
                    <td>{vehicle.vehicle_model}</td>
                    <td>{vehicle.vehicle_type}</td>
                    <td>{vehicle.maximum_load_capacity}</td>
                    <td>{vehicle.odometer}</td>
                    <td>{vehicle.acquisition_cost}</td>
                    <td>{vehicle.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No vehicles found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}