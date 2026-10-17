import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  className = '',
  titleClassName = '',
}: {
  eyebrow: string
  title: ReactNode
  description?: string
  actions?: ReactNode
  className?: string
  titleClassName?: string
}) {
  return (
    <div className={`mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="max-w-3xl">
        <p className="connect-eyebrow">{eyebrow}</p>
        <h1 className={`mt-3 font-clash text-[clamp(2.35rem,5.4vw,4.3rem)] font-medium leading-[1.02] tracking-[-0.045em] text-white ${titleClassName}`}>
          {title}
        </h1>
        {description && <p className="mt-4 max-w-xl text-sm leading-6 text-[#aab6c2] sm:text-[15px]">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`connect-panel ${className}`}>{children}</section>
}

export function Field({
  label,
  hint,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[12px] font-medium text-[#d8e2e9]">{label}</span>
      <input className="connect-input" {...props} />
      {hint && <span className="mt-1.5 block text-[11px] leading-5 text-[#82919e]">{hint}</span>}
    </label>
  )
}

export function TextField({
  label,
  hint,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[12px] font-medium text-[#d8e2e9]">{label}</span>
      <textarea className="connect-input min-h-28 resize-y" {...props} />
      {hint && <span className="mt-1.5 block text-[11px] leading-5 text-[#82919e]">{hint}</span>}
    </label>
  )
}

export function Button({
  children,
  loading,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'primary' | 'secondary' | 'quiet' }) {
  return (
    <button
      className={`connect-button connect-button-${variant} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  )
}

export function Feedback({ message, kind = 'error' }: { message: string; kind?: 'error' | 'success' | 'info' }) {
  const Icon = kind === 'success' ? CheckCircle2 : kind === 'error' ? AlertCircle : CheckCircle2
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`connect-feedback connect-feedback-${kind}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const tone = status === 'APPROVED' || status === 'RESOLVED'
    ? 'positive'
    : status === 'REJECTED' || status === 'SUSPENDED' || status === 'DISMISSED'
      ? 'negative'
      : 'pending'
  const labels: Record<string, string> = {
    PENDING: 'Being checked',
    APPROVED: 'Profile is public',
    REJECTED: 'Update needed',
    SUSPENDED: 'Temporarily hidden',
    OPEN: 'Received',
    IN_REVIEW: 'Being reviewed',
    RESOLVED: 'Resolved',
    DISMISSED: 'Closed',
  }
  const label = labels[status] ?? status.replaceAll('_', ' ').toLowerCase()
  return <span className={`connect-status connect-status-${tone}`}>{label}</span>
}
