import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored && stored !== 'undefined') {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    } else if (stored === 'undefined') {
      localStorage.removeItem('user')
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const data = await authService.login(email, password)
    const { token, ...user } = data
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    setUser(user)
    return data
  }

  async function register(name, email, password) {
    const data = await authService.register(name, email, password)
    const { token, ...user } = data
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    setUser(user)
    return data
  }

  function logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
