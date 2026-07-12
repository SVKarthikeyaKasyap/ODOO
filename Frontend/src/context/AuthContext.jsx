import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      try {
        const response = await api.get('/auth/profile')
        if (isMounted) {
          setUser(response.data.payload)
        }
      } catch {
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(values) {
    const response = await api.post('/auth/login', values)
    if (response.data?.payload?.token) {
      localStorage.setItem('authToken', response.data.payload.token)
    }
    setUser(response.data.payload.user)
    return response.data.payload.user
  }

  async function logout() {
    await api.post('/auth/logout')
    localStorage.removeItem('authToken')
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, setUser, loading, login, logout, isAuthenticated: Boolean(user) }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
