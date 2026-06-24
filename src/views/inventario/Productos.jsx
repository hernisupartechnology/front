import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilPlus, cilTrash } from '@coreui/icons'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import ProductoForm from './ProductoForm'

const formatMoney = (value) => `$${Number(value).toLocaleString('es-CO')}`

const Productos = ({ soloAlertas }) => {
  const { rol } = useAuth()
  const esAdmin = rol === 'admin'

  const [productos, setProductos] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)

  const cargarProductos = async (page = 1) => {
    setLoading(true)
    if (soloAlertas) {
      const { data } = await api.get('/productos/alertas')
      setProductos(data.data)
    } else {
      const { data } = await api.get('/productos', { params: { page } })
      setProductos(data.data)
      setMeta(data.meta)
    }
    setLoading(false)
  }

  useEffect(() => {
    const cargarInicial = async () => {
      if (soloAlertas) {
        const { data } = await api.get('/productos/alertas')
        setProductos(data.data)
      } else {
        const { data } = await api.get('/productos', { params: { page: 1 } })
        setProductos(data.data)
        setMeta(data.meta)
      }
      setLoading(false)
    }
    cargarInicial()
  }, [soloAlertas])

  const abrirCrear = () => {
    setProductoEditar(null)
    setModalVisible(true)
  }

  const abrirEditar = (producto) => {
    setProductoEditar(producto)
    setModalVisible(true)
  }

  const handleSaved = () => {
    setModalVisible(false)
    cargarProductos(meta.current_page)
  }

  const handleEliminar = async (producto) => {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) {
      return
    }
    await api.delete(`/productos/${producto.id}`)
    cargarProductos(meta.current_page)
  }

  return (
    <CCard>
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>{soloAlertas ? 'Alertas de Stock Bajo' : 'Catálogo de Productos'}</span>
        {esAdmin && (
          <CButton color="primary" size="sm" onClick={abrirCrear}>
            <CIcon icon={cilPlus} className="me-1" />
            Nuevo producto
          </CButton>
        )}
      </CCardHeader>
      <CCardBody>
        {loading ? (
          <div className="text-center py-4">
            <CSpinner color="primary" />
          </div>
        ) : (
          <>
            <CTable align="middle" hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>SKU</CTableHeaderCell>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Precio costo</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Precio venta</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">Stock</CTableHeaderCell>
                  {esAdmin && <CTableHeaderCell className="text-center">Acciones</CTableHeaderCell>}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {productos.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={esAdmin ? 6 : 5} className="text-center text-body-secondary">
                      No hay productos registrados.
                    </CTableDataCell>
                  </CTableRow>
                )}
                {productos.map((producto) => (
                  <CTableRow key={producto.id}>
                    <CTableDataCell>{producto.sku}</CTableDataCell>
                    <CTableDataCell>{producto.nombre}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      {formatMoney(producto.precio_costo)}
                    </CTableDataCell>
                    <CTableDataCell className="text-end">
                      {formatMoney(producto.precio_venta)}
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CBadge color={producto.en_alerta ? 'danger' : 'success'}>
                        {producto.stock_actual}
                      </CBadge>
                    </CTableDataCell>
                    {esAdmin && (
                      <CTableDataCell className="text-center">
                        <CButton
                          color="info"
                          variant="ghost"
                          size="sm"
                          className="me-1"
                          onClick={() => abrirEditar(producto)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminar(producto)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    )}
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            {!soloAlertas && (
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
                    onClick={() => cargarProductos(meta.current_page - 1)}
                  >
                    Anterior
                  </CButton>
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => cargarProductos(meta.current_page + 1)}
                  >
                    Siguiente
                  </CButton>
                </div>
              </div>
            )}
          </>
        )}
      </CCardBody>

      {modalVisible && (
        <ProductoForm
          key={productoEditar?.id ?? 'nuevo'}
          onClose={() => setModalVisible(false)}
          producto={productoEditar}
          onSaved={handleSaved}
        />
      )}
    </CCard>
  )
}

Productos.propTypes = {
  soloAlertas: PropTypes.bool,
}

Productos.defaultProps = {
  soloAlertas: false,
}

export default Productos
