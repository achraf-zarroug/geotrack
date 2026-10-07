import { useState, useEffect } from 'react'
import { X, MapPin, Save, AlertCircle, Sparkles } from 'lucide-react'

const KNOWN_CITIES = [
  { name: 'Zarzis', lat: 33.5030, lng: 11.1120 },
  { name: 'Djerba', lat: 33.8076, lng: 10.8451 },
  { name: 'Gabès', lat: 33.8815, lng: 10.0982 },
  { name: 'Médenine', lat: 33.3549, lng: 10.5055 },
  { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { name: 'Sfax', lat: 34.7406, lng: 10.7603 },
  { name: 'Sousse', lat: 35.8256, lng: 10.6084 },
  { name: 'Bizerte', lat: 37.2744, lng: 9.8739 }
]

const SITE_TYPES = [
  'Industriel',
  'Technique',
  'Logistique',
  'Contrôle',
  'Commercial',
  'Recherche',
  'Siège'
]

export default function SiteModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
  pickedLocation = null,
  onStartPickingLocation = null
}) {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    type: 'Industriel',
    status: 'active',
    latitude: '',
    longitude: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        city: initialData.city || '',
        type: initialData.type || 'Industriel',
        status: initialData.status || 'active',
        latitude: initialData.latitude !== null && initialData.latitude !== undefined ? initialData.latitude : '',
        longitude: initialData.longitude !== null && initialData.longitude !== undefined ? initialData.longitude : ''
      })
    } else {
      setFormData({
        name: '',
        city: '',
        type: 'Industriel',
        status: 'active',
        latitude: '',
        longitude: ''
      })
    }
    setErrors({})
  }, [initialData, isOpen])

  // Sync picked location if user clicked the map
  useEffect(() => {
    if (pickedLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: pickedLocation.latitude,
        longitude: pickedLocation.longitude
      }))
    }
  }, [pickedLocation])

  if (!isOpen) return null

  function handleCitySelect(c) {
    setFormData(prev => ({
      ...prev,
      city: c.name,
      // Auto-populate coords if empty
      latitude: prev.latitude === '' ? c.lat : prev.latitude,
      longitude: prev.longitude === '' ? c.lng : prev.longitude
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})

    const validation = {}
    if (!formData.name.trim()) validation.name = 'Le nom du site est requis'
    if (!formData.city.trim()) validation.city = 'La ville est requise'
    if (!formData.type.trim()) validation.type = 'Le type est requis'

    if (formData.latitude !== '' && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      validation.latitude = 'Latitude invalide (-90 à 90)'
    }
    if (formData.longitude !== '' && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      validation.longitude = 'Longitude invalide (-180 à 180)'
    }

    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        name: formData.name.trim(),
        city: formData.city.trim(),
        type: formData.type.trim(),
        status: formData.status,
        latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null
      })
      onClose()
    } catch (err) {
      setErrors({ form: err.message || 'Une erreur est survenue' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>{isEditing ? 'Modifier le site' : 'Ajouter un nouveau site'}</h3>
            <p className="modal-subtitle">
              {isEditing ? `Mise à jour des données du site #${initialData?.id}` : 'Renseignez les détails géographiques et opérationnels'}
            </p>
          </div>
          <button type="button" className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errors.form && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nom du site <span className="req">*</span></label>
            <input
              type="text"
              placeholder="Ex. Centre Technique Zarzis"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'input-error' : ''}
              autoFocus
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ville <span className="req">*</span></label>
              <input
                type="text"
                placeholder="Ex. Zarzis, Djerba, Tunis..."
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className={errors.city ? 'input-error' : ''}
              />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label>Type d'installation <span className="req">*</span></label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                {SITE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick city suggestions */}
          <div className="city-chips">
            <span className="chips-label"><Sparkles size={13} /> Suggestions rapides :</span>
            {KNOWN_CITIES.map(c => (
              <button
                key={c.name}
                type="button"
                className={`chip ${formData.city === c.name ? 'active' : ''}`}
                onClick={() => handleCitySelect(c)}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Statut opérationnel</label>
            <div className="status-radio-group">
              <label className={`radio-pill ${formData.status === 'active' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={() => setFormData({ ...formData, status: 'active' })}
                />
                <span className="dot dot-active"></span> Actif
              </label>
              <label className={`radio-pill ${formData.status === 'inactive' ? 'inactive' : ''}`}>
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={() => setFormData({ ...formData, status: 'inactive' })}
                />
                <span className="dot dot-inactive"></span> Inactif
              </label>
            </div>
          </div>

          <div className="coords-section">
            <div className="coords-header">
              <label><MapPin size={15} /> Coordonnées GPS (Optionnel)</label>
              {onStartPickingLocation && (
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => onStartPickingLocation(formData.latitude, formData.longitude)}
                >
                  Sélectionner sur la carte 📍
                </button>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude (ex. 33.503)"
                  value={formData.latitude}
                  onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                  className={errors.latitude ? 'input-error' : ''}
                />
                {errors.latitude && <span className="field-error">{errors.latitude}</span>}
              </div>
              <div className="form-group">
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude (ex. 11.112)"
                  value={formData.longitude}
                  onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                  className={errors.longitude ? 'input-error' : ''}
                />
                {errors.longitude && <span className="field-error">{errors.longitude}</span>}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Save size={16} />
              {submitting ? 'Enregistrement...' : isEditing ? 'Sauvegarder' : 'Créer le site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
