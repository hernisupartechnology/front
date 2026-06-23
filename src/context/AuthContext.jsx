import React, { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'
import api from '../services/api'

const AuthContext = createContext(undefined)

/**
 * Provee el estado global de autenticación: usuario, token y rol.
 * Persiste la sesión en localStorage para sobrevivir recargas de página.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout')
      }
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }
  }

  const value = {
    user,
    token,
    rol: user?.rol ?? null,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
