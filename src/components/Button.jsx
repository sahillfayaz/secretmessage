export default function Button({ children, className = '', variant = 'primary', ...props }) {
  const styles = variant === 'primary' ? 'bg-teal-700 text-white shadow-[0_10px_22px_-12px_rgba(15,118,110,.9)] hover:bg-teal-800 disabled:bg-teal-300 dark:disabled:bg-teal-950' : variant === 'danger' ? 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300' : 'border bg-white text-slate-800 hover:bg-slate-50 dark:bg-[#172323] dark:text-slate-100 dark:hover:bg-[#203333]'
  return <button className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${styles} ${className}`} {...props}>{children}</button>
}
