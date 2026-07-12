import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Failed to logout', err)
    }
  }

  // Supporting both capitalized and lowercase fields from Supabase
  const displayName = user ? (user.Name || user.name || 'User') : ''
  const displayEmail = user ? (user.Email || user.email || '') : ''
  const displayRole = user ? (user.Role || user.role || '') : ''

  return (
    <div>
      <h2>Dashboard (TransitOps)</h2>
      {user ? (
        <div>
          <p><strong>Welcome back, {displayName}!</strong></p>
          <p><strong>Email:</strong> {displayEmail}</p>
          <p><strong>Role:</strong> {displayRole}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>No user profile loaded.</p>
      )}
    </div>
  )
}
