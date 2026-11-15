import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown, ImagePlus, RefreshCw, Trash2, X } from 'lucide-react'
import { cn, readImage } from '../lib/format'
import type { EstadoCita } from '../context/DataContext'

/* ---------- Botones ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'carbon'
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong',
  ghost: 'text-muted hover:text-fg hover:bg-surface-3',
  danger: 'text-danger border border-line bg-surface hover:bg-danger-soft hover:border-danger/30',
  carbon: 'bg-carbon text-carbon-fg hover:bg-carbon-2 dark:bg-fg dark:text-bg dark:hover:bg-fg/90',
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:size-4',
        size === 'sm' && 'h-8 px-3 text-[13px]',
        size === 'md' && 'h-9 px-3.5 text-[13px]',
        size === 'lg' && 'h-11 px-5 text-sm',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function IconButton({ className, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn('inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent [&_svg]:size-[18px]', className)}
      {...props}
    />
  )
}

/* ---------- Estructura ---------- */

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-2xl border border-line bg-surface', className)}>{children}</section>
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-6 pb-1 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, description, actions, kicker }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; kicker?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {kicker && <div className="mb-2 text-[13px] font-semibold text-muted">{kicker}</div>}
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[11px] font-bold uppercase tracking-[0.12em] text-subtle', className)}>{children}</p>
}

export function Stat({ label, value, foot, accent }: { label: string; value: ReactNode; foot?: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
        {accent && <span className="size-1.5 rounded-full bg-accent" />}
        {label}
      </p>
      <p className="tabular mt-2 text-[28px] font-bold leading-none tracking-tight">{value}</p>
      {foot && <p className="mt-2 text-xs text-subtle">{foot}</p>}
    </div>
  )
}

export function EmptyState({ icon, title, text, action, className }: { icon: ReactNode; title: string; text?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-full border border-line text-subtle [&>svg]:size-5">{icon}</div>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[13px] text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Avatar({ text, size = 'md', tone = 'neutral', className }: { text: string; size?: 'sm' | 'md' | 'lg' | 'xl'; tone?: 'neutral' | 'accent' | 'carbon' | 'solid'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        size === 'sm' && 'size-8 text-[11px]',
        size === 'md' && 'size-10 text-[13px]',
        size === 'lg' && 'size-12 text-sm',
        size === 'xl' && 'size-16 text-lg',
        tone === 'neutral' && 'bg-surface-3 text-fg',
        tone === 'accent' && 'bg-accent-soft text-accent-soft-fg',
        tone === 'carbon' && 'bg-carbon text-carbon-fg dark:bg-surface-3 dark:text-fg',
        tone === 'solid' && 'bg-accent text-accent-fg',
        className,
      )}
    >
      {text}
    </span>
  )
}

/* ---------- Insignias ---------- */

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline'
const tones: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-muted',
  accent: 'bg-accent-soft text-accent-soft-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  outline: 'border border-line text-muted',
}

export function Badge({ tone = 'neutral', dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold [&_svg]:size-3', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export const estadoCitaUI: Record<EstadoCita, { label: string; tone: Tone }> = {
  programada: { label: 'Programada', tone: 'outline' },
  atendida: { label: 'Atendida', tone: 'success' },
  sin_diagnostico: { label: 'Sin diagnóstico', tone: 'warning' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
}

export function EstadoCitaBadge({ estado }: { estado: EstadoCita }) {
  return <Badge tone={estadoCitaUI[estado].tone} dot>{estadoCitaUI[estado].label}</Badge>
}

/* ---------- Escala de dolor ---------- */

const tonoDolor = (v: number) => (v >= 7 ? 'bg-danger' : v >= 4 ? 'bg-accent' : 'bg-success')

export function PainMeter({ value, compact }: { value: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-[2px]">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={cn('rounded-[2px]', compact ? 'h-2.5 w-1' : 'h-3 w-1.5', i < value ? tonoDolor(value) : 'bg-surface-3')} />
        ))}
      </span>
      <span className="tabular text-xs font-bold">{value}</span>
    </span>
  )
}

/** Selector sobre Catalogo.EscalaDolor. */
export function PainPicker({ options, value, onChange }: { options: { id: number; valor: number }[]; value: number; onChange: (id: number) => void }) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            type="button"
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'tabular h-10 rounded-lg border text-sm font-bold transition-colors',
              on ? cn(tonoDolor(o.valor), 'border-transparent text-white') : 'border-line text-muted hover:border-line-strong hover:text-fg',
            )}
          >
            {o.valor}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Formularios ---------- */

const field =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-subtle transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:bg-surface-2 disabled:text-muted'

export function Field({ label, children, className, hint, required }: { label: string; children: ReactNode; className?: string; hint?: ReactNode; required?: boolean }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-[13px] font-semibold">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-subtle">{hint}</span>}
    </label>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, 'min-h-[92px] resize-y py-2.5 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cn(field, 'h-10 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </span>
  )
}

export function Segmented<T extends string | number>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; count?: number }[]; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-lg bg-surface-3 p-[3px]', className)}>
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-semibold transition-colors',
            value === o.value ? 'bg-surface text-fg ring-1 ring-line' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="tabular text-subtle">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-6 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn('-mb-px flex h-11 items-center gap-2 whitespace-nowrap border-b-2 text-sm font-semibold transition-colors', value === t.id ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg')}
        >
          {t.label}
          {t.count !== undefined && <span className="tabular text-xs text-subtle">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Carga de imagen local (se guarda como data URL en memoria; en backend iría a varchar(max) o a un storage). */
export function ImageDrop({ value, onChange, label = 'Subir imagen', hint, className, aspect = 'aspect-[4/3]' }: { value: string | null; onChange: (v: string | null) => void; label?: string; hint?: string; className?: string; aspect?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const take = async (f?: File | null) => {
    if (f && f.type.startsWith('image/')) onChange(await readImage(f))
  }

  return (
    <div className={className}>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => take(e.target.files?.[0])} />
      {value ? (
        <div className={cn('group relative overflow-hidden rounded-xl border border-line bg-surface-3', aspect)}>
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={() => ref.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white/95 px-2.5 text-xs font-semibold text-neutral-900">
              <RefreshCw className="size-3.5" />Cambiar
            </button>
            <button type="button" onClick={() => onChange(null)} className="inline-flex size-8 items-center justify-center rounded-md bg-white/95 text-neutral-900" aria-label="Quitar imagen">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => (e.preventDefault(), setOver(true))}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => (e.preventDefault(), setOver(false), take(e.dataTransfer.files[0]))}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center transition-colors',
            aspect,
            over ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface-2 hover:border-accent hover:bg-accent-soft/50',
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-surface text-accent ring-1 ring-line">
            <ImagePlus className="size-[18px]" />
          </span>
          <span className="text-[13px] font-semibold">{label}</span>
          <span className="text-xs text-subtle">{hint ?? 'Arrastra un archivo o haz clic · JPG, PNG'}</span>
        </button>
      )}
    </div>
  )
}

/* ---------- Superposiciones ---------- */

function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' }) {
  useOverlay(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface sm:rounded-2xl', size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          <IconButton label="Cerrar" onClick={onClose} className="-mr-2 -mt-1.5"><X /></IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useOverlay(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={onClose}>
      <aside onMouseDown={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col border-l border-line bg-surface">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0 text-base font-bold">{title}</div>
          <IconButton label="Cerrar" onClick={onClose} className="-mr-2"><X /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </aside>
    </div>
  )
}

/* ---------- Tablas ---------- */

export function Table({ children, min = 680 }: { children: ReactNode; min?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth: min }}>{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('h-10 border-b border-line px-6 text-xs font-semibold text-subtle first:pl-6', className)}>{children}</th>
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('h-14 border-b border-line px-6 align-middle', className)}>{children}</td>
}

export function Kv({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-subtle">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{children}</dd>
    </div>
  )
}
