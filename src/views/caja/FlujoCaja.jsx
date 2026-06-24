import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import EgresoForm from './EgresoForm'

const formatMoney = (value) => `$${Number(value).toLocaleString('es-CO')}`

const FILTROS_INICIALES = { tipo: '', fecha_inicio: '', fecha_fin: '' }

const FlujoCaja = ({ tipoInicial }) => {
  const { rol } = useAuth()
  const esAdmin = rol === 'admin'

  const [transacciones, setTransacciones] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIALES, tipo: tipoInicial })
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)

  const armarParams = (page, filtrosActuales) => {
    const params = { page }
    if (filtrosActuales.tipo) params.tipo = filtrosActuales.tipo
    if (filtrosActuales.fecha_inicio) params.fecha_inicio = filtrosActuales.fecha_inicio
    if (filtrosActuales.fecha_fin) params.fecha_fin = filtrosActuales.fecha_fin
    return params
  }

  const cargarTransacciones = async (page = 1, filtrosActuales = filtros) => {
    setLoading(true)
    const { data } = await api.get('/caja', { params: armarParams(page, filtrosActuales) })
    setTransacciones(data.data)
    setMeta(data.meta)
    setLoading(false)
  }

  useEffect(() => {
    const cargarInicial = async () => {
      const { data } = await api.get('/caja', {
        params: armarParams(1, { ...FILTROS_INICIALES, tipo: tipoInicial }),
      })
      setTransacciones(data.data)
      setMeta(data.meta)
      setLoading(false)
    }
    cargarInicial()
  }, [tipoInicial])

  const handleFiltroChange = (campo) => (event) => {
    const nuevosFiltros = { ...filtros, [campo]: event.target.value }
    setFiltros(nuevosFiltros)
    cargarTransacciones(1, nuevosFiltros)
  }

  const handleSaved = () => {
    setModalVisible(false)
    cargarTransacciones(1)
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>{tipoInicial === 'egreso' ? 'Registro de Egresos' : 'Historial de Caja'}</span>
        {esAdmin && (
          <CButton color="primary" size="sm" onClick={() => setModalVisible(true)}>
            <CIcon icon={cilPlus} className="me-1" />
            Registrar egreso
          </CButton>
        )}
      </CCardHeader>
      <CCardBody>
        <CRow className="mb-3">
          <CCol sm={3}>
            <CFormSelect value={filtros.tipo} onChange={handleFiltroChange('tipo')}>
              <option value="">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </CFormSelect>
          </CCol>
          <CCol sm={3}>
            <CFormInput
              type="date"
              value={filtros.fecha_inicio}
              onChange={handleFiltroChange('fecha_inicio')}
              placeholder="Fecha inicio"
            />
          </CCol>
          <CCol sm={3}>
            <CFormInput
              type="date"
              value={filtros.fecha_fin}
              onChange={handleFiltroChange('fecha_fin')}
              placeholder="Fecha fin"
            />
          </CCol>
        </CRow>

        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
          </div>
        ) : (
          <>
            <CTable align="middle" hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Fecha</CTableHeaderCell>
                  <CTableHeaderCell>Tipo</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Monto</CTableHeaderCell>
                  <CTableHeaderCell>Concepto</CTableHeaderCell>
                  <CTableHeaderCell>Registrado por</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {transacciones.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={5} className="text-center text-body-secondary">
                      No hay transacciones registradas.
                    </CTableDataCell>
                  </CTableRow>
                )}
                {transacciones.map((trx) => (
                  <CTableRow key={trx.id}>
                    <CTableDataCell>
                      {new Date(trx.fecha_transaccion).toLocaleDateString('es-CO')}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={trx.tipo === 'ingreso' ? 'success' : 'danger'}>
                        {trx.tipo}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-end">{formatMoney(trx.monto)}</CTableDataCell>
                    <CTableDataCell>{trx.concepto}</CTableDataCell>
                    <CTableDataCell>{trx.registrado_por?.nombre}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="text-body-secondary small">
                Página {meta.current_page} de {meta.last_page}
              </span>
              <div>
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  className="me-2"
                  disabled={meta.current_page <= 1}
                  onClick={() => cargarTransacciones(meta.current_page - 1)}
                >
                  Anterior
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => cargarTransacciones(meta.current_page + 1)}
                >
                  Siguiente
                </CButton>
              </div>
            </div>
          </>
        )}
      </CCardBody>

      {esAdmin && modalVisible && (
        <EgresoForm onClose={() => setModalVisible(false)} onSaved={handleSaved} />
      )}
    </CCard>
  )
}

FlujoCaja.propTypes = {
  tipoInicial: PropTypes.oneOf(['', 'ingreso', 'egreso']),
}

FlujoCaja.defaultProps = {
  tipoInicial: '',
}

export default FlujoCaja
