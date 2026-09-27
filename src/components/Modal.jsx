import Button from './Button'
export default function Modal({ open, title, children, onClose, onConfirm, confirmText = 'Confirm' }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"><h2 id="modal-title" className="text-lg font-bold">{title}</h2><div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{children}</div><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm}>{confirmText}</Button></div></div></div>
}
