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

  return (
    <div>
      <h2>Vehicle Registry</h2>

      <div>
        <h3>{editingRegistrationNumber ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="Name">Name:</label>
            <input
              id="Name"
              name="Name"
              type="text"
              value={form.Name}
              onChange={updateField}
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label htmlFor="Email">Email:</label>
            <input
              id="Email"
              name="Email"
              type="email"
              value={form.Email}
              onChange={updateField}
              placeholder="example@domain.com"
              required
            />
          </div>

          <div>
            <label htmlFor="Role">Role:</label>
            <input
              id="Role"
              name="Role"
              type="text"
              value="Driver"
              readOnly
            />
          </div>

          <div>
            <label htmlFor="Registration Number">Registration Number:</label>
            <input
              id="Registration Number"
              name="Registration Number"
              type="text"
              value={form['Registration Number']}
              onChange={updateField}
              placeholder="Enter registration number"
              required
            />
          </div>

          <div>
            <label htmlFor="Vehicle Name">Vehicle Name:</label>
            <input
              id="Vehicle Name"
              name="Vehicle Name"
              type="text"
              value={form['Vehicle Name']}
              onChange={updateField}
              placeholder="Enter vehicle name"
              required
            />
          </div>

          <div>
            <label htmlFor="Type">Type:</label>
            <input
              id="Type"
              name="Type"
              type="text"
              value={form.Type}
              onChange={updateField}
              placeholder="Enter vehicle type"
              required
            />
          </div>

          <div>
            <label htmlFor="Maximum Load Capacity">Maximum Load Capacity:</label>
            <input
              id="Maximum Load Capacity"
              name="Maximum Load Capacity"
              type="text"
              value={form['Maximum Load Capacity']}
              onChange={updateField}
              placeholder="Enter maximum load capacity"
              required
            />
          </div>

          <div>
            <label htmlFor="Odometer">Odometer:</label>
            <input
              id="Odometer"
              name="Odometer"
              type="number"
              value={form.Odometer}
              onChange={updateField}
              placeholder="Enter odometer reading"
              required
            />
          </div>

          <div>
            <label htmlFor="Acquisition Cost">Acquisition Cost:</label>
            <input
              id="Acquisition Cost"
              name="Acquisition Cost"
              type="number"
              value={form['Acquisition Cost']}
              onChange={updateField}
              placeholder="Enter acquisition cost"
              required
            />
          </div>

          <div>
            <label htmlFor="Status">Status:</label>
            <select
              id="Status"
              name="Status"
              value={form.Status}
              onChange={updateField}
            >
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {createError ? <p style={{ color: 'red' }}>{createError}</p> : null}

          <div>
            <button type="submit" disabled={createLoading}>
              {createLoading ? 'Saving...' : (editingRegistrationNumber ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
            {editingRegistrationNumber && (
              <button type="button" onClick={cancelEdit} style={{ marginLeft: '10px' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registration Number</th>
                <th>Vehicle Name</th>
                <th>Type</th>
                <th>Maximum Load Capacity</th>
                <th>Odometer</th>
                <th>Acquisition Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <tr key={vehicle['Registration Number']}>
                    <td>{vehicle.Name}</td>
                    <td>{vehicle.Email}</td>
                    <td>{vehicle.Role}</td>
                    <td>{vehicle['Registration Number']}</td>
                    <td>{vehicle['Vehicle Name']}</td>
                    <td>{vehicle.Type}</td>
                    <td>{vehicle['Maximum Load Capacity']}</td>
                    <td>{vehicle.Odometer}</td>
                    <td>{vehicle['Acquisition Cost']}</td>
                    <td>{vehicle.Status}</td>
                    <td>
                      <button onClick={() => startEdit(vehicle)}>Edit</button>
                      <button onClick={() => handleDelete(vehicle['Registration Number'])} style={{ marginLeft: '10px', color: 'red' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11">No vehicles found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}