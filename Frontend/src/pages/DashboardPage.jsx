import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { DriverManagement } from '../components/diver_management/DriverManagement.jsx'
import './DashboardPage.css'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' or 'drivers'

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
  const displayRole = user ? (user.Role || user.role || 'Admin') : ''

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>TransitOps Portal</h2>
        </div>
        <div className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </div>
          <div 
            className={`nav-item ${activeTab === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('drivers')}
          >
            Driver Management
          </div>
        </div>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="content-header">
          <h1>{activeTab === 'overview' ? 'Overview' : 'Driver Management'}</h1>
        </div>

        {activeTab === 'overview' && (
          <div className="overview-panel">
            <div className="welcome-card">
              <h2>Welcome back, {displayName}!</h2>
              <p>You have full access to the smart transportation fleet portal.</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="label">Active Vehicles</span>
                <span className="value">12</span>
              </div>
              <div className="stat-card">
                <span className="label">Managed Drivers</span>
                <span className="value">5</span>
              </div>
              <div className="stat-card">
                <span className="label">On-Going Trips</span>
                <span className="value">3</span>
              </div>
            </div>

            <div className="profile-card">
              <h3>My Profile Information</h3>
              <div className="profile-details">
                <div className="profile-row">
                  <span className="field">Name:</span>
                  <span className="val">{displayName}</span>
                </div>
                <div className="profile-row">
                  <span className="field">Email:</span>
                  <span className="val">{displayEmail}</span>
                </div>
                <div className="profile-row">
                  <span className="field">Role:</span>
                  <span className="val">{displayRole}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && <DriverManagement />}
      </div>
    </div>
  )
}
