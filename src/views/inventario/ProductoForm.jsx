import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import api from '../../services/api'

const ESTADO_INICIAL = {
  sku: '',
  nombre: '',
  descripcion: '',
  precio_costo: '',
  precio_venta: '',
  stock_actual: '',
  stock_minimo: '',
}

/**
 * Modal de creación/edición de productos del catálogo de inventario.
 * Cuando `producto` viene con datos, opera en modo edición (PUT);
 * de lo contrario crea un nuevo registro (POST).
 *
 * El padre debe montar este componente solo mientras el modal está
 * abierto (renderizado condicional), para que el estado inicial se
 * derive una sola vez a partir de `producto` en cada apertura.
 */
const ProductoForm = ({ onClose, producto, onSaved }) => {
  const esEdicion = Boolean(producto)

  const [form, setForm] = useState(() =>
    producto
      ? {
          sku: producto.sku ?? '',
          nombre: producto.nombre ?? '',
          descripcion: producto.descripcion ?? '',
          precio_costo: producto.precio_costo ?? '',
          precio_venta: producto.precio_venta ?? '',
          stock_actual: producto.stock_actual ?? '',
          stock_minimo: producto.stock_minimo ?? '',
        }
      : ESTADO_INICIAL,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const handleChange = (campo) => (event) => {
    setForm((prev) => ({ ...prev, [campo]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      if (esEdicion) {
        await api.put(`/productos/${producto.id}`, form)
      } else {
        await api.post('/productos', form)
      }
      onSaved()
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <CModal visible onClose={onClose} alignment="center">
      <CForm onSubmit={handleSubmit}>
        <CModalHeader>
          <CModalTitle>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>SKU</CFormLabel>
            <CFormInput
              value={form.sku}
              onChange={handleChange('sku')}
              invalid={Boolean(errors.sku)}
              feedbackInvalid={errors.sku?.[0]}
              required
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Nombre</CFormLabel>
            <CFormInput
              value={form.nombre}
              onChange={handleChange('nombre')}
              invalid={Boolean(errors.nombre)}
              feedbackInvalid={errors.nombre?.[0]}
              required
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Descripción</CFormLabel>
            <CFormTextarea
              value={form.descripcion}
              onChange={handleChange('descripcion')}
              rows={2}
            />
          </div>
          <div className="row mb-3">
            <div className="col">
              <CFormLabel>Precio costo</CFormLabel>
              <CFormInput
                type="number"
                step="0.01"
                value={form.precio_costo}
                onChange={handleChange('precio_costo')}
                invalid={Boolean(errors.precio_costo)}
                feedbackInvalid={errors.precio_costo?.[0]}
                required
              />
            </div>
            <div className="col">
              <CFormLabel>Precio venta</CFormLabel>
              <CFormInput
                type="number"
                step="0.01"
                value={form.precio_venta}
                onChange={handleChange('precio_venta')}
                invalid={Boolean(errors.precio_venta)}
                feedbackInvalid={errors.precio_venta?.[0]}
                required
              />
            </div>
          </div>
          <div className="row mb-3">
            <div className="col">
              <CFormLabel>Stock actual</CFormLabel>
              <CFormInput
                type="number"
                value={form.stock_actual}
                onChange={handleChange('stock_actual')}
                invalid={Boolean(errors.stock_actual)}
                feedbackInvalid={errors.stock_actual?.[0]}
              />
            </div>
            <div className="col">
              <CFormLabel>Stock mínimo</CFormLabel>
              <CFormInput
                type="number"
                value={form.stock_minimo}
                onChange={handleChange('stock_minimo')}
                invalid={Boolean(errors.stock_minimo)}
                feedbackInvalid={errors.stock_minimo?.[0]}
              />
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </CButton>
          <CButton color="primary" type="submit" disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Guardar'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

ProductoForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  producto: PropTypes.object,
  onSaved: PropTypes.func.isRequired,
}

ProductoForm.defaultProps = {
  producto: null,
}

export default ProductoForm
