import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export function VehicleRegistryPage() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    Name: '',
    Email: '',
    Role: 'Driver',
    'Registration Number': '',
    'Vehicle Name': '',
    Type: '',
    'Maximum Load Capacity': '',
    Odometer: '',
    'Acquisition Cost': '',
    Status: 'Available'
  })
  const [editingRegistrationNumber, setEditingRegistrationNumber] = useState(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

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

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function startEdit(vehicle) {
    setEditingRegistrationNumber(vehicle['Registration Number'])
    setForm({
      Name: vehicle.Name || '',
      Email: vehicle.Email || '',
      Role: vehicle.Role || 'Driver',
      'Registration Number': vehicle['Registration Number'] || '',
      'Vehicle Name': vehicle['Vehicle Name'] || '',
      Type: vehicle.Type || '',
      'Maximum Load Capacity': vehicle['Maximum Load Capacity'] || '',
      Odometer: vehicle.Odometer || '',
      'Acquisition Cost': vehicle['Acquisition Cost'] || '',
      Status: vehicle.Status || 'Available'
    })
  }

  function cancelEdit() {
    setEditingRegistrationNumber(null)
    setForm({
      Name: '',
      Email: '',
      Role: 'Driver',
      'Registration Number': '',
      'Vehicle Name': '',
      Type: '',
      'Maximum Load Capacity': '',
      Odometer: '',
      'Acquisition Cost': '',
      Status: 'Available'
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    try {
      if (editingRegistrationNumber) {
        await api.put(`/vehicles/${editingRegistrationNumber}`, form)
      } else {
        await api.post('/vehicles', form)
      }
      
      setForm({
        Name: '',
        Email: '',
        Role: 'Driver',
        'Registration Number': '',
        'Vehicle Name': '',
        Type: '',
        'Maximum Load Capacity': '',
        Odometer: '',
        'Acquisition Cost': '',
        Status: 'Available'
      })
      setEditingRegistrationNumber(null)
      loadVehicles()
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Unable to save vehicle right now')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDelete(registrationNumber) {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return
    }

    try {
      await api.delete(`/vehicles/${registrationNumber}`)
      loadVehicles()
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete vehicle right now')
    }
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      textAlign: 'center',
      whiteSpace: 'nowrap'
    }

    const statusColors = {
      'Available': { backgroundColor: '#d4edda', color: '#155724' },
      'On Trip': { backgroundColor: '#d1ecf1', color: '#0c5460' },
      'In Shop': { backgroundColor: '#fff3cd', color: '#856404' },
      'Retired': { backgroundColor: '#e2e3e5', color: '#383d41' }
    }

    return { ...baseStyle, ...statusColors[status] }
  }

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '24px'
  }

  const contentStyle = {
    maxWidth: '1400px',
    margin: '0 auto'
  }

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '28px'
  }

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    padding: '24px',
    marginBottom: '24px'
  }

  const formTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '20px'
  }

  const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  }

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column'
  }

  const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#333333',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  const inputStyle = {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d0d7de',
    borderRadius: '8px',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
    outline: 'none'
  }

  const buttonGroupStyle = {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  }

  const buttonStyle = (bgColor) => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: bgColor,
    color: '#ffffff'
  })

  const messageStyle = (type) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    backgroundColor: type === 'error' ? '#f8d7da' : '#d4edda',
    color: type === 'error' ? '#721c24' : '#155724',
    border: `1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'}`
  })

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    backgroundColor: '#ffffff'
  }

  const theadStyle = {
    backgroundColor: '#f5f7fa',
    position: 'sticky',
    top: 0,
    zIndex: 1
  }

  const thStyle = {
    padding: '14px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#1a1a1a',
    borderBottom: '2px solid #d0d7de'
  }

  const tdStyle = (index) => ({
    padding: '14px',
    borderBottom: '1px solid #e1e4e8',
    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
  })

  const actionButtonStyle = (color) => ({
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#ffffff',
    backgroundColor: color,
    marginRight: '6px'
  })

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Vehicle Registry</h1>

        <div style={cardStyle}>
          <h2 style={formTitleStyle}>{editingRegistrationNumber ? '✏️ Edit Vehicle' : '➕ Add New Vehicle'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={formGridStyle}>
              <div style={fieldStyle}>
                <label htmlFor="Name" style={labelStyle}>Name</label>
                <input
                  id="Name"
                  name="Name"
                  type="text"
                  value={form.Name}
                  onChange={updateField}
                  placeholder="Enter name"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Email" style={labelStyle}>Email</label>
                <input
                  id="Email"
                  name="Email"
                  type="email"
                  value={form.Email}
                  onChange={updateField}
                  placeholder="example@domain.com"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Role" style={labelStyle}>Role</label>
                <input
                  id="Role"
                  name="Role"
                  type="text"
                  value="Driver"
                  style={{ ...inputStyle, backgroundColor: '#f5f7fa', cursor: 'not-allowed' }}
                  readOnly
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Registration Number" style={labelStyle}>Registration Number</label>
                <input
                  id="Registration Number"
                  name="Registration Number"
                  type="text"
                  value={form['Registration Number']}
                  onChange={updateField}
                  placeholder="e.g., DL-01-ABC-1234"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Vehicle Name" style={labelStyle}>Vehicle Name</label>
                <input
                  id="Vehicle Name"
                  name="Vehicle Name"
                  type="text"
                  value={form['Vehicle Name']}
                  onChange={updateField}
                  placeholder="e.g., Truck A"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Type" style={labelStyle}>Type</label>
                <input
                  id="Type"
                  name="Type"
                  type="text"
                  value={form.Type}
                  onChange={updateField}
                  placeholder="e.g., Truck, Van"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Maximum Load Capacity" style={labelStyle}>Maximum Load Capacity</label>
                <input
                  id="Maximum Load Capacity"
                  name="Maximum Load Capacity"
                  type="text"
                  value={form['Maximum Load Capacity']}
                  onChange={updateField}
                  placeholder="e.g., 5000 kg"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Odometer" style={labelStyle}>Odometer</label>
                <input
                  id="Odometer"
                  name="Odometer"
                  type="number"
                  value={form.Odometer}
                  onChange={updateField}
                  placeholder="Current reading"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Acquisition Cost" style={labelStyle}>Acquisition Cost</label>
                <input
                  id="Acquisition Cost"
                  name="Acquisition Cost"
                  type="number"
                  value={form['Acquisition Cost']}
                  onChange={updateField}
                  placeholder="Cost in currency"
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Status" style={labelStyle}>Status</label>
                <select
                  id="Status"
                  name="Status"
                  value={form.Status}
                  onChange={updateField}
                  style={inputStyle}
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            {createError && <div style={messageStyle('error')}>{createError}</div>}

            <div style={buttonGroupStyle}>
              <button
                type="submit"
                disabled={createLoading}
                style={{
                  ...buttonStyle(editingRegistrationNumber ? '#ff9800' : '#4CAF50'),
                  opacity: createLoading ? 0.7 : 1,
                  cursor: createLoading ? 'not-allowed' : 'pointer'
                }}
                onMouseOver={(e) => !createLoading && (e.target.style.opacity = '0.9')}
                onMouseOut={(e) => (e.target.style.opacity = '1')}
              >
                {createLoading ? 'Saving...' : (editingRegistrationNumber ? 'Update Vehicle' : 'Add Vehicle')}
              </button>
              {editingRegistrationNumber && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={buttonStyle('#6c757d')}
                  onMouseOver={(e) => (e.target.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.target.style.opacity = '1')}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={cardStyle}>
          <h2 style={formTitleStyle}>📋 Vehicle List</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <p>Loading vehicles...</p>
            </div>
          ) : error ? (
            <div style={messageStyle('error')}>{error}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead style={theadStyle}>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Registration Number</th>
                    <th style={thStyle}>Vehicle Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Max Load</th>
                    <th style={thStyle}>Odometer</th>
                    <th style={thStyle}>Cost</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length > 0 ? (
                    vehicles.map((vehicle, index) => (
                      <tr key={vehicle['Registration Number']}>
                        <td style={tdStyle(index)}>{vehicle.Name}</td>
                        <td style={tdStyle(index)}>{vehicle.Email}</td>
                        <td style={tdStyle(index)}>{vehicle.Role}</td>
                        <td style={tdStyle(index)}>{vehicle['Registration Number']}</td>
                        <td style={tdStyle(index)}>{vehicle['Vehicle Name']}</td>
                        <td style={tdStyle(index)}>{vehicle.Type}</td>
                        <td style={tdStyle(index)}>{vehicle['Maximum Load Capacity']}</td>
                        <td style={tdStyle(index)}>{vehicle.Odometer}</td>
                        <td style={tdStyle(index)}>₹{vehicle['Acquisition Cost']}</td>
                        <td style={tdStyle(index)}>
                          <span style={getStatusBadgeStyle(vehicle.Status)}>
                            {vehicle.Status}
                          </span>
                        </td>
                        <td style={tdStyle(index)}>
                          <button
                            onClick={() => startEdit(vehicle)}
                            style={actionButtonStyle('#ff9800')}
                            onMouseOver={(e) => (e.target.opacity = '0.9')}
                            onMouseOut={(e) => (e.target.opacity = '1')}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle['Registration Number'])}
                            style={actionButtonStyle('#f44336')}
                            onMouseOver={(e) => (e.target.opacity = '0.9')}
                            onMouseOut={(e) => (e.target.opacity = '1')}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" style={{ ...tdStyle(0), textAlign: 'center', fontStyle: 'italic', color: '#999' }}>
                        No vehicles found. Add your first vehicle above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}