import { useBusiness } from '../context/BusinessContext'
import { cn } from '../lib/format'

export default function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  const { business } = useBusiness()
  return <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
    {business.logo ? <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white"><img src={business.logo} alt="" className="size-full object-contain" style={{ transform: `scale(${business.logoScale})` }} /></span> : <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg font-bold">{business.nombre.charAt(0).toUpperCase()}</span>}
    <span className="min-w-0"><span title={business.nombre} className={cn('block truncate text-[17px] font-extrabold tracking-tight', inverted ? 'text-carbon-fg' : 'text-fg')}>{business.nombre}</span>{business.lema && <span title={business.lema} className="block truncate text-[10px] font-normal text-muted">{business.lema}</span>}</span>
  </span>
}
