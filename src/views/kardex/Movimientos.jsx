import React, { useEffect, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
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
import MovimientoForm from './MovimientoForm'

const Movimientos = () => {
  const [movimientos, setMovimientos] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [tipo, setTipo] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)

  const cargarMovimientos = async (page = 1, filtroTipo = tipo) => {
    setLoading(true)
    const { data } = await api.get('/movimientos', {
      params: { page, ...(filtroTipo ? { tipo: filtroTipo } : {}) },
    })
    setMovimientos(data.data)
    setMeta(data.meta)
    setLoading(false)
  }

  useEffect(() => {
    const cargarInicial = async () => {
      const { data } = await api.get('/movimientos', { params: { page: 1 } })
      setMovimientos(data.data)
      setMeta(data.meta)
      setLoading(false)
    }
    cargarInicial()
  }, [])

  const handleFiltroChange = (event) => {
    const nuevoTipo = event.target.value
    setTipo(nuevoTipo)
    cargarMovimientos(1, nuevoTipo)
  }

  const handleSaved = () => {
    setModalVisible(false)
    cargarMovimientos(1)
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>Kardex de Movimientos</span>
        <CButton color="primary" size="sm" onClick={() => setModalVisible(true)}>
          <CIcon icon={cilPlus} className="me-1" />
          Registrar movimiento
        </CButton>
      </CCardHeader>
      <CCardBody>
        <CRow className="mb-3">
          <CCol sm={4}>
            <CFormSelect value={tipo} onChange={handleFiltroChange}>
              <option value="">Todos los tipos</option>
              <option value="entrada">Entradas</option>
              <option value="salida">Salidas</option>
            </CFormSelect>
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
                  <CTableHeaderCell>Producto</CTableHeaderCell>
                  <CTableHeaderCell>Tipo</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Cantidad</CTableHeaderCell>
                  <CTableHeaderCell>Motivo</CTableHeaderCell>
                  <CTableHeaderCell>Responsable</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {movimientos.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center text-body-secondary">
                      No hay movimientos registrados.
                    </CTableDataCell>
                  </CTableRow>
                )}
                {movimientos.map((mov) => (
                  <CTableRow key={mov.id}>
                    <CTableDataCell>
                      {new Date(mov.registrado_en).toLocaleString('es-CO')}
                    </CTableDataCell>
                    <CTableDataCell>{mov.producto?.nombre}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={mov.tipo === 'entrada' ? 'success' : 'secondary'}>
                        {mov.tipo}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">{mov.cantidad}</CTableDataCell>
                    <CTableDataCell>{mov.motivo}</CTableDataCell>
                    <CTableDataCell>{mov.responsable?.nombre}</CTableDataCell>
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
                  onClick={() => cargarMovimientos(meta.current_page - 1)}
                >
                  Anterior
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => cargarMovimientos(meta.current_page + 1)}
                >
                  Siguiente
                </CButton>
              </div>
            </div>
          </>
        )}
      </CCardBody>

      {modalVisible && (
        <MovimientoForm onClose={() => setModalVisible(false)} onSaved={handleSaved} />
      )}
    </CCard>
  )
}

export default Movimientos
