import React, { useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from '@coreui/react'
import api from '../../services/api'

const primerDiaMes = () => {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10)
}

const hoyISO = () => new Date().toISOString().slice(0, 10)

const formatMoney = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    Number(value),
  )

/**
 * Selector de rango de fechas + balance financiero consolidado.
 * Restringido al rol admin a nivel de ruta (ver routes.js / AppContent.jsx).
 */
const ReporteFinanciero = () => {
  const [fechaInicio, setFechaInicio] = useState(primerDiaMes())
  const [fechaFin, setFechaFin] = useState(hoyISO())
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const consultar = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/reportes/financiero', {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      })
      setBalance(data)
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo generar el reporte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CCard>
      <CCardHeader>Reporte Financiero</CCardHeader>
      <CCardBody>
        <CForm onSubmit={consultar}>
          <CRow className="mb-4 align-items-end">
            <CCol sm={4}>
              <CFormLabel>Desde</CFormLabel>
              <CFormInput
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </CCol>
            <CCol sm={4}>
              <CFormLabel>Hasta</CFormLabel>
              <CFormInput
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </CCol>
            <CCol sm={4}>
              <CButton color="primary" type="submit" disabled={loading}>
                {loading ? <CSpinner size="sm" /> : 'Generar reporte'}
              </CButton>
            </CCol>
          </CRow>
        </CForm>

        {error && <CAlert color="danger">{error}</CAlert>}

        {balance && (
          <CRow>
            <CCol sm={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <div className="text-body-secondary small">Total ingresos</div>
                  <div className="fs-4 fw-semibold text-success">
                    {formatMoney(balance.total_ingresos)}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol sm={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <div className="text-body-secondary small">Total egresos</div>
                  <div className="fs-4 fw-semibold text-danger">
                    {formatMoney(balance.total_egresos)}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol sm={4}>
              <CCard className="mb-3">
                <CCardBody>
                  <div className="text-body-secondary small">Utilidad neta</div>
                  <div className="fs-4 fw-semibold">{formatMoney(balance.utilidad_neta)}</div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ReporteFinanciero
