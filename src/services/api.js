import axios from 'axios'

/**
 * Cliente Axios base para consumir la API de Laravel (UparContable).
 *
 * - Inyecta el Bearer token de Sanctum en cada petición (interceptor de request).
 * - Si el backend responde 401 (token inválido o expirado), limpia la sesión
 *   local y redirige a /login (interceptor de response).
 */
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.hash = '#/login'
    }
    return Promise.reject(error)
  },
)

export default api
