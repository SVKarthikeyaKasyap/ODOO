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

  return (
    <div>
      <h2>Maintenance Log</h2>
      <form onSubmit={handleSubmit}>
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
          <label htmlFor="Issue Description">Issue Description:</label>
          <textarea
            id="Issue Description"
            name="Issue Description"
            value={form['Issue Description']}
            onChange={updateField}
            placeholder="Describe the issue"
            required
          />
        </div>

        <div>
          <label htmlFor="Maintenance Date">Maintenance Date:</label>
          <input
            id="Maintenance Date"
            name="Maintenance Date"
            type="date"
            value={form['Maintenance Date']}
            onChange={updateField}
            required
          />
        </div>

        <div>
          <label htmlFor="Estimated Cost">Estimated Cost:</label>
          <input
            id="Estimated Cost"
            name="Estimated Cost"
            type="number"
            value={form['Estimated Cost']}
            onChange={updateField}
            placeholder="Enter estimated cost"
          />
        </div>

        <div>
          <label htmlFor="Status">Status:</label>
          <select id="Status" name="Status" value={form.Status} onChange={updateField}>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}

        <div>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Maintenance'}
          </button>
        </div>
      </form>
    </div>
  )
}
