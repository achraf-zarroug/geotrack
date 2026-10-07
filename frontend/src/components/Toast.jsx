import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'info' ? Info : CheckCircle2
        return (
          <div key={toast.id} className={`toast-card toast-${toast.type || 'success'}`}>
            <Icon size={18} className="toast-icon" />
            <div className="toast-message">{toast.message}</div>
            <button
              type="button"
              className="toast-close"
              onClick={() => onDismiss(toast.id)}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
