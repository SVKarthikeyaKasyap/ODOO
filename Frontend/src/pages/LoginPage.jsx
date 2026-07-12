import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [blockedEmail, setBlockedEmail] = useState('')
  const [verificationSuccess, setVerificationSuccess] = useState('')
  const [sendingVerification, setSendingVerification] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
    setVerificationSuccess('')
    setBlockedEmail('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setVerificationSuccess('')
    setBlockedEmail('')
    setLoading(true)

    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to login right now'
      setError(msg)
      // If user is blocked, store their email to allow manual resending
      if (msg.toLowerCase().includes('blocked')) {
        setBlockedEmail(form.email)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    setSendingVerification(true)
    setVerificationSuccess('')
    setError('')
    try {
      const api = (await import('../services/api')).api
      const response = await api.post('/auth/send-verification', { email: blockedEmail })
      setVerificationSuccess(response.data.message || 'Verification email resent via Gmail SMTP!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification email')
    } finally {
      setSendingVerification(false)
    }
  }

  return (
    <div>
      <h2>Login</h2>
      
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}
      {verificationSuccess ? <p style={{ color: 'green', fontWeight: 'bold' }}>{verificationSuccess}</p> : null}

      <form onSubmit={handleSubmit}>
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
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            placeholder="Enter your password"
            required
          />
        </div>

        <div>
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </div>
      </form>

      {blockedEmail ? (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid orange', borderRadius: '4px', backgroundColor: '#fffbe6' }}>
          <p style={{ margin: '0 0 10px 0' }}>An unblocking email has been triggered for your account.</p>
          <button onClick={handleResendVerification} disabled={sendingVerification}>
            {sendingVerification ? 'Sending...' : 'Resend Unblocking Email'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
