import { useState } from 'react'
import { api } from '../services/api.js'

export function MaintenancePage() {
  const [form, setForm] = useState({
    'Registration Number': '',
    'Vehicle Name': '',
    'Issue Description': '',
    'Maintenance Date': '',
    'Estimated Cost': '',
    Status: 'Pending'
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await api.post('/maintenance', form)
      setSuccess('Maintenance record created and vehicle status updated to In Shop.')
      setForm({
        'Registration Number': '',
        'Vehicle Name': '',
        'Issue Description': '',
        'Maintenance Date': '',
        'Estimated Cost': '',
        Status: 'Pending'
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save maintenance record right now')
    } finally {
      setSubmitting(false)
    }
  }

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '24px'
  }

  const contentStyle = {
    maxWidth: '900px',
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
    padding: '24px'
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

  const textareaStyle = {
    ...inputStyle,
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit'
  }

  const buttonStyle = {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#4CAF50',
    color: '#ffffff',
    marginTop: '16px'
  }

  const messageStyle = (type) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    backgroundColor: type === 'error' ? '#f8d7da' : '#d4edda',
    color: type === 'error' ? '#721c24' : '#155724',
    border: `1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'}`
  })

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>🔧 Maintenance Log</h1>

        <div style={cardStyle}>
          <form onSubmit={handleSubmit}>
            <div style={formGridStyle}>
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
                <label htmlFor="Maintenance Date" style={labelStyle}>Maintenance Date</label>
                <input
                  id="Maintenance Date"
                  name="Maintenance Date"
                  type="date"
                  value={form['Maintenance Date']}
                  onChange={updateField}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="Estimated Cost" style={labelStyle}>Estimated Cost</label>
                <input
                  id="Estimated Cost"
                  name="Estimated Cost"
                  type="number"
                  value={form['Estimated Cost']}
                  onChange={updateField}
                  placeholder="Optional"
                  style={inputStyle}
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
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div style={fieldStyle}>
              <label htmlFor="Issue Description" style={labelStyle}>Issue Description</label>
              <textarea
                id="Issue Description"
                name="Issue Description"
                value={form['Issue Description']}
                onChange={updateField}
                placeholder="Describe the maintenance issue in detail..."
                style={textareaStyle}
                required
              />
            </div>

            {error && <div style={messageStyle('error')}>{error}</div>}
            {success && <div style={messageStyle('success')}>{success}</div>}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...buttonStyle,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#45a049')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
            >
              {submitting ? 'Saving...' : 'Save Maintenance'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
