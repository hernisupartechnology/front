import React from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Bloquea el acceso a rutas que requieren sesión iniciada.
 * Si no hay token, redirige a /login.
 */
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
}

export default ProtectedRoute
