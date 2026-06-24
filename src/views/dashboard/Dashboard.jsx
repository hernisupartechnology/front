import React, { useEffect, useState } from 'react'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CWidgetStatsA,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChartPie, cilMoney, cilStorage, cilWarning } from '@coreui/icons'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const formatMoney = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    Number(value),
  )

const Dashboard = () => {
  const { rol } = useAuth()
  const [totalProductos, setTotalProductos] = useState(0)
  const [alertas, setAlertas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      const hoy = new Date()
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
      const fechaHoy = hoy.toISOString().slice(0, 10)

      const peticiones = [
        api.get('/productos', { params: { per_page: 1 } }),
        api.get('/productos/alertas'),
        api.get('/movimientos', { params: { per_page: 5 } }),
      ]

      if (rol === 'admin') {
        peticiones.push(
          api.get('/reportes/financiero', {
            params: { fecha_inicio: primerDiaMes, fecha_fin: fechaHoy },
          }),
        )
      }

      const resultados = await Promise.allSettled(peticiones)

      if (resultados[0].status === 'fulfilled') {
        setTotalProductos(resultados[0].value.data.meta.total)
      }
      if (resultados[1].status === 'fulfilled') {
        setAlertas(resultados[1].value.data.data)
      }
      if (resultados[2].status === 'fulfilled') {
        setMovimientos(resultados[2].value.data.data)
      }
      if (rol === 'admin' && resultados[3]?.status === 'fulfilled') {
        setBalance(resultados[3].value.data)
      }

      setLoading(false)
    }

    cargarDatos()
  }, [rol])

  if (loading) {
    return (
      <div className="text-center pt-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return (
    <>
      <CRow className="mb-4" xs={{ gutter: 4 }}>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            color="info"
            value={
              <>
                <CIcon icon={cilStorage} size="xl" className="me-2" />
                {totalProductos}
              </>
            }
            title="Total Productos"
          />
        </CCol>
        <CCol sm={6} lg={3}>
          <CWidgetStatsA
            color="warning"
            value={
              <>
                <CIcon icon={cilWarning} size="xl" className="me-2" />
                {alertas.length}
              </>
            }
            title="Alertas Activas"
          />
        </CCol>
        {rol === 'admin' && balance && (
          <>
            <CCol sm={6} lg={3}>
              <CWidgetStatsA
                color="success"
                value={
                  <>
                    <CIcon icon={cilMoney} size="xl" className="me-2" />
                    {formatMoney(balance.total_ingresos)}
                  </>
                }
                title="Total Ingresos"
              />
            </CCol>
            <CCol sm={6} lg={3}>
              <CWidgetStatsA
                color="primary"
                value={
                  <>
                    <CIcon icon={cilChartPie} size="xl" className="me-2" />
                    {formatMoney(balance.utilidad_neta)}
                  </>
                }
                title="Utilidad Neta"
              />
            </CCol>
          </>
        )}
      </CRow>

      <CRow>
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>Alertas de stock bajo</CCardHeader>
            <CCardBody>
              <CTable align="middle" hover responsive small>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>SKU</CTableHeaderCell>
                    <CTableHeaderCell>Producto</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Stock</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {alertas.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center text-body-secondary">
                        Sin alertas activas.
                      </CTableDataCell>
                    </CTableRow>
                  )}
                  {alertas.map((producto) => (
                    <CTableRow key={producto.id}>
                      <CTableDataCell>{producto.sku}</CTableDataCell>
                      <CTableDataCell>{producto.nombre}</CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CBadge color={producto.stock_agotado ? 'danger' : 'warning'}>
                          {producto.stock_actual}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader>Últimos movimientos del Kardex</CCardHeader>
            <CCardBody>
              <CTable align="middle" hover responsive small>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Producto</CTableHeaderCell>
                    <CTableHeaderCell>Tipo</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Cantidad</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {movimientos.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center text-body-secondary">
                        Sin movimientos registrados.
                      </CTableDataCell>
                    </CTableRow>
                  )}
                  {movimientos.map((mov) => (
                    <CTableRow key={mov.id}>
                      <CTableDataCell>{mov.producto?.nombre}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={mov.tipo === 'entrada' ? 'success' : 'secondary'}>
                          {mov.tipo}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{mov.cantidad}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
