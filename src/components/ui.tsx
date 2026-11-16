import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { BackIcon } from './icons'

// ---------- Capçalera de pantalla ----------

export function ScreenHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="screen-header">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Tornar">
          <BackIcon />
        </button>
      ) : (
        <span className="icon-btn-placeholder" />
      )}
      <h1>{title}</h1>
      {right ?? <span className="icon-btn-placeholder" />}
    </header>
  )
}

// ---------- Finestra modal ----------

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// ---------- Avisos breus (toasts) ----------

const ToastContext = createContext<(msg: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const show = useCallback((m: string) => {
    setMsg(m)
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 3500)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

// ---------- Barra de progrés ----------

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress" aria-hidden="true">
      <div className="progress-fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}
