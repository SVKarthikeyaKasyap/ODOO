import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Verification states
  const [infoMessage, setInfoMessage] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [etherealLink, setEtherealLink] = useState('')

  useEffect(() => {
    const verified = searchParams.get('verified')
    const err = searchParams.get('error')
    if (verified === 'true') {
      setInfoMessage('Email verified successfully! You can now log in.')
      setError('')
      setSearchParams({})
    } else if (err) {
      setError(err)
      setInfoMessage('')
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
    setInfoMessage('')
    setShowResend(false)
    setEtherealLink('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setInfoMessage('')
    setShowResend(false)
    setEtherealLink('')
    setLoading(true)

    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Unable to login right now'
      setError(errMsg)
      if (errMsg === 'Email not verified') {
        setShowResend(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSendVerification() {
    setSendingEmail(true)
    setError('')
    setInfoMessage('')
    setEtherealLink('')

    try {
      const response = await api.post('/auth/send-verification', { email: form.email })
      setInfoMessage('Verification email sent! Check your inbox.')
      setShowResend(false)
      if (response.data?.result?.previewUrl) {
        setEtherealLink(response.data.result.previewUrl)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification email')
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div>
      <h2>Login</h2>
      
      {infoMessage ? <p style={{ color: 'green', fontWeight: 'bold' }}>{infoMessage}</p> : null}
      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      {showResend ? (
        <div style={{ marginBottom: '15px' }}>
          <button type="button" onClick={handleSendVerification} disabled={sendingEmail}>
            {sendingEmail ? 'Sending...' : 'Send Verification Email'}
          </button>
        </div>
      ) : null}

      {etherealLink ? (
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed blue' }}>
          <p><strong>Development Mode:</strong> Click below to preview the Ethereal test email:</p>
          <a href={etherealLink} target="_blank" rel="noopener noreferrer">Open Test Email Inbox</a>
        </div>
      ) : null}

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
    </div>
  )
}
