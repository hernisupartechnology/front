/**
 * Application Routes Configuration
 *
 * Defines all protected routes in the application using React lazy loading
 * for code splitting and performance optimization.
 *
 * Each route object contains:
 * - path: URL path for the route
 * - name: Human-readable name for breadcrumbs
 * - element: Lazy-loaded React component
 * - exact: (optional) Requires exact path match
 *
 * @module routes
 */

import React from 'react'

// UparContable MVP
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Productos = React.lazy(() => import('./views/inventario/Productos'))
const Movimientos = React.lazy(() => import('./views/kardex/Movimientos'))
const FlujoCaja = React.lazy(() => import('./views/caja/FlujoCaja'))
const ReporteFinanciero = React.lazy(() => import('./views/reportes/ReporteFinanciero'))

// Variantes que reutilizan un componente existente con un prop distinto.
// Se usa React.createElement (no JSX) porque este archivo es .js, no .jsx.
const AlertasStock = React.lazy(() =>
  import('./views/inventario/Productos').then((m) => ({
    default: () => React.createElement(m.default, { soloAlertas: true }),
  })),
)
const RegistroEgresos = React.lazy(() =>
  import('./views/caja/FlujoCaja').then((m) => ({
    default: () => React.createElement(m.default, { tipoInicial: 'egreso' }),
  })),
)

/**
 * Array of route configuration objects
 *
 * @type {Array<Object>}
 * @property {string} path - URL path pattern
 * @property {string} name - Display name for breadcrumbs and navigation
 * @property {React.LazyExoticComponent} element - Lazy-loaded component
 * @property {boolean} [exact] - Whether to match path exactly
 *
 * @example
 * // Route renders when URL matches '/dashboard'
 * { path: '/dashboard', name: 'Dashboard', element: Dashboard }
 *
 * @example
 * // Route with exact match required
 * { path: '/base', name: 'Base', element: Cards, exact: true }
 */
export const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/inventario/productos', name: 'Catálogo de Productos', element: Productos },
  { path: '/inventario/alertas', name: 'Alertas de Stock Bajo', element: AlertasStock },
  { path: '/kardex/movimientos', name: 'Movimientos', element: Movimientos },
  { path: '/caja/flujo', name: 'Historial de Caja', element: FlujoCaja },
  {
    path: '/caja/egresos',
    name: 'Registro de Egresos',
    element: RegistroEgresos,
    adminOnly: true,
  },
  {
    path: '/reportes/financiero',
    name: 'Reporte Financiero',
    element: ReporteFinanciero,
    adminOnly: true,
  },
]

export default routes
