import { AlertTriangle, Trash2, X } from 'lucide-react'

export default function ConfirmDeleteModal({
  isOpen,
  site,
  onClose,
  onConfirm,
  deleting = false
}) {
  if (!isOpen || !site) return null

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-confirm">
        <div className="modal-header">
          <div className="delete-icon-wrapper">
            <AlertTriangle size={24} className="text-danger" />
          </div>
          <button type="button" className="icon-btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="confirm-body">
          <h3>Supprimer ce site ?</h3>
          <p>
            Êtes-vous sûr de vouloir supprimer définitivement le site <strong>« {site.name} »</strong> (#{site.id}) ?
            Cette action le retirera également de l'index Elasticsearch.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={deleting}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => onConfirm(site.id)}
            disabled={deleting}
          >
            <Trash2 size={16} />
            {deleting ? 'Suppression...' : 'Confirmer la suppression'}
          </button>
        </div>
      </div>
    </div>
  )
}
