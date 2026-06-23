import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import api from '../../services/api'

const ESTADO_INICIAL = {
  producto_id: '',
  tipo: 'entrada',
  cantidad: '',
  motivo: '',
}

/**
 * Modal para registrar un movimiento manual de inventario.
 * En salidas, si el motivo empieza con "venta" el backend genera
 * automáticamente un ingreso en el flujo de caja.
 *
 * El padre debe montar este componente solo mientras el modal está
 * abierto (renderizado condicional), para que el formulario inicie
 * limpio en cada apertura.
 */
const MovimientoForm = ({ onClose, onSaved }) => {
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [errors, setErrors] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/productos', { params: { per_page: 100 } }).then(({ data }) => {
      setProductos(data.data)
    })
  }, [])

  const handleChange = (campo) => (event) => {
    setForm((prev) => ({ ...prev, [campo]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    setErrorGeneral('')
    try {
      await api.post('/movimientos', form)
      onSaved()
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrorGeneral(err.response?.data?.message ?? 'No se pudo registrar el movimiento.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <CModal visible onClose={onClose} alignment="center">
      <CForm onSubmit={handleSubmit}>
        <CModalHeader>
          <CModalTitle>Registrar movimiento</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {errorGeneral && <CAlert color="danger">{errorGeneral}</CAlert>}

          <div className="mb-3">
            <CFormLabel>Producto</CFormLabel>
            <CFormSelect
              value={form.producto_id}
              onChange={handleChange('producto_id')}
              invalid={Boolean(errors.producto_id)}
              required
            >
              <option value="">Selecciona un producto...</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.sku} — {producto.nombre} (stock: {producto.stock_actual})
                </option>
              ))}
            </CFormSelect>
            {errors.producto_id && <CFormFeedback invalid>{errors.producto_id[0]}</CFormFeedback>}
          </div>

          <div className="mb-3">
            <CFormLabel>Tipo de movimiento</CFormLabel>
            <CFormSelect value={form.tipo} onChange={handleChange('tipo')} required>
              <option value="entrada">Entrada (reabastecimiento)</option>
              <option value="salida">Salida (venta o baja)</option>
            </CFormSelect>
          </div>

          <div className="mb-3">
            <CFormLabel>Cantidad</CFormLabel>
            <CFormInput
              type="number"
              min="1"
              value={form.cantidad}
              onChange={handleChange('cantidad')}
              invalid={Boolean(errors.cantidad)}
              feedbackInvalid={errors.cantidad?.[0]}
              required
            />
          </div>

          <div className="mb-3">
            <CFormLabel>Motivo</CFormLabel>
            <CFormInput
              value={form.motivo}
              onChange={handleChange('motivo')}
              placeholder={
                form.tipo === 'salida' ? 'ej: venta_factura_001 o baja_dano' : 'ej: compra_proveedor'
              }
              invalid={Boolean(errors.motivo)}
              feedbackInvalid={errors.motivo?.[0]}
              required
            />
            {form.tipo === 'salida' && (
              <div className="form-text">
                Si el motivo empieza con &quot;venta&quot;, se registrará automáticamente un ingreso
                en el flujo de caja.
              </div>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </CButton>
          <CButton color="primary" type="submit" disabled={saving}>
            {saving ? <CSpinner size="sm" /> : 'Registrar'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

MovimientoForm.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}

export default MovimientoForm
