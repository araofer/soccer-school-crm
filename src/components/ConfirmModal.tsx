import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const confirmBg =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : variant === 'warning'
        ? 'bg-amber-600 hover:bg-amber-700 text-white'
        : 'bg-emerald-600 hover:bg-emerald-700 text-white'

  const iconBg =
    variant === 'danger'
      ? 'bg-rose-100 text-rose-600'
      : variant === 'warning'
        ? 'bg-amber-100 text-amber-600'
        : 'bg-emerald-100 text-emerald-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className={`rounded-2xl p-3 ${iconBg}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Confirmação de segurança</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition shadow-sm ${confirmBg} disabled:opacity-50`}
          >
            {isLoading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
