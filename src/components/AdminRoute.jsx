import React from 'react'
import PropTypes from 'prop-types'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Bloquea el acceso a rutas exclusivas del rol 'admin'.
 * Si el usuario autenticado es operador, redirige a /dashboard.
 */
const AdminRoute = ({ children }) => {
  const { rol } = useAuth()

  if (rol !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
}

export default AdminRoute
