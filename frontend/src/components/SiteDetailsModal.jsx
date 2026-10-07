import { X, MapPin, Calendar, Clock, Edit3, Trash2, Building2 } from 'lucide-react'

export default function SiteDetailsModal({
  site,
  onClose,
  onEdit,
  onDelete,
  onFocusMap
}) {
  if (!site) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-details">
        <div className="modal-header">
          <div className="details-header-title">
            <span className={`status-tag ${site.status}`}>
              <span className={`dot dot-${site.status}`}></span>
              {site.status === 'active' ? 'Site Actif' : 'Site Inactif'}
            </span>
            <span className="site-id-badge">ID #{site.id}</span>
          </div>
          <button type="button" className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="details-body">
          <h2 className="details-title">{site.name}</h2>
          
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label"><Building2 size={15} /> Type d'installation</span>
              <span className="detail-value">{site.type}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><MapPin size={15} /> Ville & Région</span>
              <span className="detail-value">{site.city}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Coordonnées GPS</span>
              <span className="detail-value font-mono">
                {site.latitude && site.longitude
                  ? `${parseFloat(site.latitude).toFixed(6)}, ${parseFloat(site.longitude).toFixed(6)}`
                  : 'Non spécifiées'}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Calendar size={15} /> Date d'enregistrement</span>
              <span className="detail-value text-muted">
                {site.created_at ? new Date(site.created_at).toLocaleString('fr-FR') : '—'}
              </span>
            </div>
          </div>

          {site.latitude && site.longitude && onFocusMap && (
            <div className="details-map-action">
              <button
                type="button"
                className="btn-outline-primary"
                onClick={() => {
                  onFocusMap(site)
                  onClose()
                }}
              >
                <MapPin size={16} /> Voir l'emplacement sur la carte interactive
              </button>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-danger-outline"
            onClick={() => {
              onDelete(site)
              onClose()
            }}
          >
            <Trash2 size={16} /> Supprimer
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onEdit(site)
              onClose()
            }}
          >
            <Edit3 size={16} /> Modifier
          </button>
        </div>
      </div>
    </div>
  )
}
