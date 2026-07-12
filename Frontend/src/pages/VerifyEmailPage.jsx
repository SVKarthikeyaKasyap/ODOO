import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../services/api'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error')
        setMessage('Missing verification token')
        return
      }

      try {
        const response = await api.get(`/auth/verify?token=${token}`)
        setStatus('success')
        setMessage(response.data.message || 'Your email has been verified successfully!')
      } catch (err) {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification link is invalid or expired')
      }
    }

    verify()
  }, [token])

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Email Verification</h2>
      
      {status === 'verifying' && <p>Verifying your email... Please wait.</p>}
      
      {status === 'success' && (
        <div>
          <p style={{ color: 'green', fontWeight: 'bold' }}>{message}</p>
          <p>You can now close this tab or return to the login page.</p>
          <Link to="/login" style={{ textDecoration: 'underline', color: '#1a73e8' }}>Go to Login</Link>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>
          <p>Please request a new verification link from the login page.</p>
          <Link to="/login" style={{ textDecoration: 'underline', color: '#1a73e8' }}>Go to Login</Link>
        </div>
      )}
    </div>
  )
}
