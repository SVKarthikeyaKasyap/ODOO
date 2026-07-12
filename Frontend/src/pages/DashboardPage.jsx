import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleNavigateToVehicles() {
    navigate('/vehicles')
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Failed to logout', err)
    }
  }

  return (
    <div>
      <h2>Dashboard (TransitOps)</h2>
      {user ? (
        <div>
          <p><strong>Welcome back, {user.name}!</strong></p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <button onClick={handleNavigateToVehicles}>Vehicle Registry</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>No user profile loaded.</p>
      )}
    </div>
  )
}
