/**
 * Sidebar Navigation Configuration — UparContable MVP
 *
 * Estructura fija del negocio (Dashboard, Inventario, Movimientos, Contabilidad).
 * Los ítems marcados con `adminOnly: true` se filtran en `getNavItems(rol)`.
 *
 * @module _nav
 */

import CIcon from '@coreui/icons-react'
import {
  cilChartPie,
  cilMoney,
  cilSpeedometer,
  cilStorage,
  cilSwapVertical,
  cilWarning,
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Inventario',
    to: '/inventario',
    icon: <CIcon icon={cilStorage} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Catálogo de Productos',
        to: '/inventario/productos',
      },
      {
        component: CNavItem,
        name: 'Alertas de Stock Bajo',
        to: '/inventario/alertas',
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Movimientos',
    to: '/kardex/movimientos',
    icon: <CIcon icon={cilSwapVertical} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Contabilidad',
    to: '/caja',
    icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Historial de Caja',
        to: '/caja/flujo',
      },
      {
        component: CNavItem,
        name: 'Registro de Egresos',
        to: '/caja/egresos',
        adminOnly: true,
      },
      {
        component: CNavItem,
        name: 'Reporte Financiero',
        to: '/reportes/financiero',
        icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
        adminOnly: true,
      },
    ],
  },
]

/**
 * Quita el flag `adminOnly` del objeto del ítem: es solo una instrucción de
 * filtrado para esta función, no una prop válida de CNavItem/CNavGroup.
 * AppSidebarNav.jsx esparce el resto de propiedades del ítem directamente
 * sobre el DOM, así que dejarlo pasar genera un warning de React.
 */
const limpiarFlag = ({ adminOnly, ...item }) => item

/**
 * Filtra el menú lateral según el rol del usuario autenticado.
 * Filtra tanto ítems de primer nivel como ítems dentro de `items` (submenús)
 * marcados con `adminOnly: true`.
 *
 * @param {string|null} rol - Slug del rol actual ('admin' | 'operador').
 * @returns {Array<Object>} Navegación filtrada.
 */
export const getNavItems = (rol) =>
  _nav
    .filter((item) => !item.adminOnly || rol === 'admin')
    .map((item) =>
      item.items
        ? limpiarFlag({
            ...item,
            items: item.items
              .filter((sub) => !sub.adminOnly || rol === 'admin')
              .map(limpiarFlag),
          })
        : limpiarFlag(item),
    )

export default _nav
