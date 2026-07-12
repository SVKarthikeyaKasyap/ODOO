import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function RegisterPage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DRIVER' })
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', role: '' })
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const nextFieldErrors = { name: '', email: '', password: '', role: '' }

    const normalizedName = form.name.trim()
    const normalizedEmail = form.email.trim().toLowerCase()
    const normalizedPassword = String(form.password || '')
    const selectedRole = form.role

    if (!normalizedName) {
      nextFieldErrors.name = 'Please enter your name'
    }

    if (!normalizedEmail) {
      nextFieldErrors.email = 'Please enter your email'
    }

    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextFieldErrors.email = 'Please enter a valid email address'
    }

    if (!normalizedPassword) {
      nextFieldErrors.password = 'Please enter your password'
    }

    if (/^\d/.test(normalizedName)) {
      nextFieldErrors.name = 'Name cannot start with a number'
    }

    if (/^\d/.test(normalizedEmail)) {
      nextFieldErrors.email = 'Email cannot start with a number'
    }

    if (normalizedName.length < 2) {
      nextFieldErrors.name = 'Name must be at least 2 characters'
    }

    if (normalizedPassword.length > 0 && normalizedPassword.length < 6) {
      nextFieldErrors.password = 'Password must be at least 6 characters'
    }

    if (nextFieldErrors.name || nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setFieldErrors({ name: '', email: '', password: '', role: '' })
    setLoading(true)

    try {
      await register({ ...form, name: normalizedName, email: normalizedEmail, password: normalizedPassword, role: selectedRole })
      await login({ email: normalizedEmail, password: normalizedPassword })
      navigate('/dashboard')
    } catch (err) {
      const message = err.response?.data?.message
        || (err.code === 'ERR_NETWORK'
          ? 'Cannot reach the backend server right now'
          : 'Unable to create account right now')

      if (/name/i.test(message)) {
        setFieldErrors((current) => ({ ...current, name: message }))
      } else if (/email|user already exists/i.test(message)) {
        setFieldErrors((current) => ({ ...current, email: message }))
      } else if (/password/i.test(message)) {
        setFieldErrors((current) => ({ ...current, password: message }))
      } else {
        setFormError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={updateField}
            placeholder="Your full name"
            required
          />
          {fieldErrors.name ? <p style={{ color: 'red' }}>{fieldErrors.name}</p> : null}
        </div>

        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            placeholder="you@example.com"
            required
          />
          {fieldErrors.email ? <p style={{ color: 'red' }}>{fieldErrors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            placeholder="Create a password"
            required
          />
          {fieldErrors.password ? <p style={{ color: 'red' }}>{fieldErrors.password}</p> : null}
        </div>

        <div>
          <label htmlFor="role">Role:</label>
          <select id="role" name="role" value={form.role} onChange={updateField}>
            <option value="DRIVER">Driver</option>
            <option value="FLEET_MANAGER">Fleet Manager</option>
            <option value="SAFETY_OFFICER">Safety Officer</option>
            <option value="FINANCIAL_ANALYST">Financial Analyst</option>
          </select>
        </div>

        {formError ? <p style={{ color: 'red' }}>{formError}</p> : null}

        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </div>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  )
}
