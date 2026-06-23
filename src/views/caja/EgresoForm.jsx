import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import api from '../../services/api'

const ESTADO_INICIAL = {
  monto: '',
  concepto: '',
  fecha_transaccion: '',
}

/**
 * Modal para registrar un egreso manual directo en el flujo de caja
 * (arriendos, servicios, nómina, etc). Solo accesible para el rol admin.
 *
 * El padre debe montar este componente solo mientras el modal está
 * abierto (renderizado condicional), para que el formulario inicie
 * limpio en cada apertura.
 */
const EgresoForm = ({ onClose, onSaved }) => {
  const [form, setForm] = useState(ESTADO_INICIAL)
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
      const payload = { ...form }
      if (!payload.fecha_transaccion) {
        delete payload.fecha_transaccion
      }
      await api.post('/caja/egreso', payload)
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
          <CModalTitle>Registrar egreso</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-3">
            <CFormLabel>Monto</CFormLabel>
            <CFormInput
              type="number"
              step="0.01"
              value={form.monto}
              onChange={handleChange('monto')}
              invalid={Boolean(errors.monto)}
              feedbackInvalid={errors.monto?.[0]}
              required
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Concepto</CFormLabel>
            <CFormInput
              value={form.concepto}
              onChange={handleChange('concepto')}
              placeholder="ej: Pago arriendo local"
              invalid={Boolean(errors.concepto)}
              feedbackInvalid={errors.concepto?.[0]}
              required
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Fecha de transacción (opcional)</CFormLabel>
            <CFormInput
              type="date"
              value={form.fecha_transaccion}
              onChange={handleChange('fecha_transaccion')}
              invalid={Boolean(errors.fecha_transaccion)}
              feedbackInvalid={errors.fecha_transaccion?.[0]}
            />
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

EgresoForm.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}

export default EgresoForm
