import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router'
import { CalendarDays, CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, FileText, Info, Lock, Phone, Stethoscope, Trash2, Undo2, UserRound, X, UsersRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData, type EstadoCita } from '../context/DataContext'
import { Button, Drawer, EmptyState, EstadoCitaBadge, IconButton, Segmented, estadoCitaUI } from '../components/ui'
import { CitaModal, EventoModal } from '../components/forms'
import { addDays, cn, formatDate, formatLongDate, formatTel, horaFin, iniciales, minutes, nombreCompleto, nombreCorto, parseISO, toISODate, todayISO } from '../lib/format'
import type { Agenda as AgendaRow, Cita, Empleado } from '../types'

/* ---------- Configuración de la cuadrícula ---------- */

const START = 7 // primera hora visible
const END = 21 // última hora visible
const LABORAL = [8 * 60, 20 * 60] // fuera de este rango se sombrea
const SLOT = 15 // minutos por casilla
const HOUR_PX = 96
const PX = HOUR_PX / 60
const SLOTS = ((END - START) * 60) / SLOT
/** El esquema no guarda duración: se asume 60 min por cita/bloqueo. */
const DUR = 60

const PROF_COLORS = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--plum)', 'var(--fg-muted)']
const colorProf = (id: number) => PROF_COLORS[(id - 1) % PROF_COLORS.length]

const bloque: Record<EstadoCita, string> = {
  programada: 'border-accent bg-accent-soft hover:ring-accent/50',
  atendida: 'border-success bg-success-soft hover:ring-success/50',
  sin_diagnostico: 'border-warning bg-warning-soft hover:ring-warning/50',
  cancelada: 'border-line-strong bg-surface-2 text-subtle hover:ring-line-strong',
}
const punto: Record<EstadoCita, string> = { programada: 'bg-accent', atendida: 'bg-success', sin_diagnostico: 'bg-warning', cancelada: 'bg-danger' }
const ESTADOS: EstadoCita[] = ['programada', 'atendida', 'sin_diagnostico', 'cancelada']

const rayado: CSSProperties = {
  backgroundColor: 'var(--surface-2)',
  backgroundImage: 'repeating-linear-gradient(135deg, var(--border-strong) 0 1px, transparent 1px 8px)',
}

type Vista = 'dia' | 'semana' | 'mes'
type Ev = { a: AgendaRow; c?: Cita; estado?: EstadoCita }

/* ---------- Utilidades de fecha ---------- */

const pad = (n: number) => String(n).padStart(2, '0')
const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function lunes(iso: string) {
  const d = parseISO(iso)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toISODate(d)
}
const semana = (iso: string) => Array.from({ length: 7 }, (_, i) => addDays(lunes(iso), i))
const primeroMes = (iso: string) => iso.slice(0, 8) + '01'
function addMonths(iso: string, n: number) {
  const d = parseISO(primeroMes(iso))
  d.setMonth(d.getMonth() + n)
  return toISODate(d)
}
const cuadriculaMes = (iso: string) => Array.from({ length: 42 }, (_, i) => addDays(lunes(primeroMes(iso)), i))

function useAhora() {
  const [n, setN] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setN(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  return n.getHours() * 60 + n.getMinutes()
}

/** Reparte citas que se traslapan en carriles lado a lado. */
function carriles(items: Ev[]) {
  const sorted = [...items].sort((x, y) => x.a.Hora_Agenda.localeCompare(y.a.Hora_Agenda))
  const out: { ev: Ev; lane: number; lanes: number }[] = []
  let grupo: typeof out = []
  let finGrupo = -1
  let finCarril: number[] = []
  const cerrar = () => grupo.forEach((g) => (g.lanes = finCarril.length))
  for (const ev of sorted) {
    const ini = minutes(ev.a.Hora_Agenda)
    if (ini >= finGrupo) {
      cerrar()
      grupo = []
      finCarril = []
    }
    let lane = finCarril.findIndex((f) => f <= ini)
    if (lane === -1) lane = finCarril.push(0) - 1
    finCarril[lane] = ini + DUR
    finGrupo = Math.max(finGrupo, ini + DUR)
    const item = { ev, lane, lanes: 1 }
    grupo.push(item)
    out.push(item)
  }
  cerrar()
  return out
}

/* ---------- Página ---------- */

export default function Agenda() {
  const { user, rol } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const hoy = todayISO()
  const esFisio = rol === 'fisioterapeuta'
  const ahora = useAhora()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [vista, setVista] = useState<Vista>(esFisio ? 'semana' : 'dia')
  const [fecha, setFecha] = useState(hoy)
  const [calMes, setCalMes] = useState(primeroMes(hoy))
  const [ocultos, setOcultos] = useState<number[]>([])
  const [verCanceladas, setVerCanceladas] = useState(true)
  const [sel, setSel] = useState<AgendaRow | null>(null)
  const [nueva, setNueva] = useState<{ tipo: 'cita' | 'evento'; fecha: string; hora?: string; id_Emp?: number } | null>(null)

  const fisios = data.empleados.rows.filter((e) => e.Tipo_Emp && e.Estatus_Emp)
  const profs = esFisio ? data.empleados.rows.filter((e) => e.id_Emp === user!.id_Emp) : fisios.filter((f) => !ocultos.includes(f.id_Emp))
  const profIds = profs.map((p) => p.id_Emp)

  const todos: Ev[] = data.agenda.rows.flatMap((a): Ev[] => {
    if (!a.id_Cita) return [{ a }]
    const c = data.getCita(a.id_Cita)
    if (!c) return []
    return [{ a, c, estado: data.estadoCita(c) }]
  })
  const eventos = todos.filter((e) => !e.c || (profIds.includes(e.c.id_Emp) && (verCanceladas || e.estado !== 'cancelada')))
  const delDia = (iso: string) => eventos.filter((e) => e.a.Fecha_Agenda === iso)

  const go = (iso: string) => {
    setFecha(iso)
    setCalMes(primeroMes(iso))
  }
  const mover = (dir: 1 | -1) => go(vista === 'dia' ? addDays(fecha, dir) : vista === 'semana' ? addDays(fecha, 7 * dir) : addMonths(fecha, dir))
  const abrirDia = (iso: string) => {
    go(iso)
    setVista('dia')
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const h = Math.min(Math.max(new Date().getHours() - 1, 8), END - 5)
    el.scrollTop = (h - START) * HOUR_PX
  }, [vista])

  const dias = semana(fecha)
  const titulo =
    vista === 'dia'
      ? `${formatLongDate(fecha)} de ${parseISO(fecha).getFullYear()}`
      : vista === 'semana'
        ? `${formatDate(dias[0], { day: 'numeric', month: 'short' })} – ${formatDate(dias[6], { day: 'numeric', month: 'short', year: 'numeric' })}`
        : cap(formatDate(fecha, { month: 'long', year: 'numeric' }))

  const resumen = ESTADOS.map((s) => ({ s, n: todos.filter((e) => e.c && e.a.Fecha_Agenda === fecha && profIds.includes(e.c.id_Emp) && e.estado === s).length }))
  const marcados = new Set(eventos.filter((e) => e.c && e.estado !== 'cancelada').map((e) => e.a.Fecha_Agenda))

  const selEv = sel ? todos.find((e) => e.a.id_Agenda === sel.id_Agenda) : undefined

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* ---------- Panel lateral ---------- */}
      <aside className="hidden w-[276px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface xl:flex">
        <div className="border-b border-line p-4">
          <MiniCalendario mes={calMes} setMes={setCalMes} fecha={fecha} hoy={hoy} vista={vista} marcados={marcados} onPick={go} />
        </div>

        {!esFisio && (
          <div className="border-b border-line p-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Fisioterapeutas</p>
              <button className="text-xs font-semibold text-accent hover:underline" onClick={() => setOcultos(ocultos.length ? [] : fisios.map((f) => f.id_Emp))}>
                {ocultos.length ? 'Ver todos' : 'Ocultar todos'}
              </button>
            </div>
            <ul className="flex flex-col">
              {fisios.map((f) => {
                const on = !ocultos.includes(f.id_Emp)
                const n = todos.filter((e) => e.c?.id_Emp === f.id_Emp && e.a.Fecha_Agenda === fecha && e.estado !== 'cancelada').length
                return (
                  <li key={f.id_Emp}>
                    <button
                      onClick={() => setOcultos(on ? [...ocultos, f.id_Emp] : ocultos.filter((x) => x !== f.id_Emp))}
                      className="flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left hover:bg-surface-2"
                    >
                      <span className={cn('flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-2')} style={{ borderColor: colorProf(f.id_Emp), background: on ? colorProf(f.id_Emp) : 'transparent' }}>
                        {on && <Check className="size-3" strokeWidth={3.5} style={{ color: 'var(--surface)' }} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold">{nombreCorto(f)}</span>
                        <span className="block truncate text-[11.5px] text-subtle">{f.Especialidad}</span>
                      </span>
                      <span className="tabular text-xs font-bold text-muted">{n}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="p-4">
          <p className="mb-1 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-subtle">Resumen del día</p>
          <p className="mb-3 px-1 text-[13px] font-semibold">{formatLongDate(fecha)}</p>
          <ul className="flex flex-col gap-0.5">
            {resumen.map(({ s, n }) => (
              <li key={s} className="flex items-center gap-2.5 px-1 py-1 text-[13px]">
                <span className={cn('size-2.5 rounded-full', punto[s])} />
                <span className="flex-1 text-muted">{estadoCitaUI[s].label}</span>
                <span className="tabular font-bold">{n}</span>
              </li>
            ))}
            <li className="flex items-center gap-2.5 px-1 py-1 text-[13px]">
              <span className="size-2.5 rounded-full border border-line-strong" style={rayado} />
              <span className="flex-1 text-muted">Bloqueos</span>
              <span className="tabular font-bold">{delDia(fecha).filter((e) => !e.c).length}</span>
            </li>
          </ul>
          <label className="mt-4 flex cursor-pointer items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold">
            Mostrar canceladas
            <input type="checkbox" className="peer sr-only" checked={verCanceladas} onChange={(e) => setVerCanceladas(e.target.checked)} />
            <span className={cn('relative h-5 w-9 rounded-full transition-colors', verCanceladas ? 'bg-accent' : 'bg-surface-3')}>
              <span className={cn('absolute top-0.5 size-4 rounded-full bg-surface transition-all', verCanceladas ? 'left-[18px]' : 'left-0.5')} />
            </span>
          </label>
        </div>
      </aside>

      {/* ---------- Calendario ---------- */}
      <section className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
          <Button variant="secondary" size="sm" onClick={() => go(hoy)}>Hoy</Button>
          <div className="flex items-center">
            <IconButton label="Anterior" className="size-8" onClick={() => mover(-1)}><ChevronLeft /></IconButton>
            <IconButton label="Siguiente" className="size-8" onClick={() => mover(1)}><ChevronRight /></IconButton>
          </div>
          <h1 className="mr-auto min-w-0 truncate text-[17px] font-bold tracking-tight">{titulo}</h1>
          <Segmented value={vista} onChange={setVista} options={[{ value: 'dia', label: 'Día' }, { value: 'semana', label: 'Semana' }, { value: 'mes', label: 'Mes' }]} />
          <Button variant="secondary" onClick={() => setNueva({ tipo: 'evento', fecha })}><Lock />Bloquear horario</Button>
          <Button onClick={() => setNueva({ tipo: 'cita', fecha })}><CalendarPlus />Nueva cita</Button>
        </div>

        {vista === 'mes' ? (
          <VistaMes fecha={fecha} hoy={hoy} delDia={delDia} onDia={abrirDia} onEvento={(a) => setSel(a)} getPac={data.getPaciente} />
        ) : vista === 'dia' && profs.length === 0 ? (
          <EmptyState icon={<UsersRound />} title="Sin fisioterapeutas seleccionados" text="Activa al menos un fisioterapeuta en el panel lateral para ver su agenda." className="flex-1" />
        ) : (
          <Cuadricula
            scrollRef={scrollRef}
            vista={vista}
            cols={vista === 'dia' ? profs.map((p) => ({ key: String(p.id_Emp), fecha, emp: p })) : dias.map((d) => ({ key: d, fecha: d }))}
            hoy={hoy}
            ahora={ahora}
            delDia={delDia}
            mostrarProf={!esFisio}
            getPac={data.getPaciente}
            getEmp={data.getEmpleado}
            onEvento={(a) => setSel(a)}
            onSlot={(f, hora, id_Emp) => setNueva({ tipo: 'cita', fecha: f, hora, id_Emp: id_Emp ?? (profs.length === 1 ? profs[0].id_Emp : undefined) })}
            onDia={abrirDia}
            conteo={(iso) => delDia(iso).filter((e) => e.c && e.estado !== 'cancelada').length}
          />
        )}
      </section>

      {/* ---------- Detalle ---------- */}
      <Drawer
        open={!!selEv}
        onClose={() => setSel(null)}
        title={selEv?.c ? 'Detalle de la cita' : 'Bloqueo de horario'}
        footer={selEv && <DetalleAcciones key={selEv.c?.id_Cita ?? `b${selEv.a.id_Agenda}`} ev={selEv} esFisio={esFisio} onClose={() => setSel(null)} onNueva={() => { if (selEv.c) setNueva({ tipo: 'cita', fecha: selEv.c.Fecha_Cita, hora: selEv.c.Hora_Cita, id_Emp: selEv.c.id_Emp }); setSel(null) }} navigate={navigate} />}
      >
        {selEv && <Detalle ev={selEv} />}
      </Drawer>

      {nueva?.tipo === 'cita' && <CitaModal open onClose={() => setNueva(null)} fecha={nueva.fecha} hora={nueva.hora} id_Emp={nueva.id_Emp} />}
      {nueva?.tipo === 'evento' && <EventoModal open onClose={() => setNueva(null)} fecha={nueva.fecha} hora={nueva.hora} />}
    </div>
  )
}

/* ---------- Minicalendario ---------- */

function MiniCalendario({ mes, setMes, fecha, hoy, vista, marcados, onPick }: { mes: string; setMes: (m: string) => void; fecha: string; hoy: string; vista: Vista; marcados: Set<string>; onPick: (d: string) => void }) {
  const dias = cuadriculaMes(mes)
  const semanaSel = vista === 'semana' ? semana(fecha) : []
  return (
    <div>
      <div className="mb-2 flex items-center justify-between pl-1">
        <p className="text-[14px] font-bold">{cap(formatDate(mes, { month: 'long', year: 'numeric' }))}</p>
        <div className="flex">
          <IconButton label="Mes anterior" className="size-7 [&_svg]:size-4" onClick={() => setMes(addMonths(mes, -1))}><ChevronLeft /></IconButton>
          <IconButton label="Mes siguiente" className="size-7 [&_svg]:size-4" onClick={() => setMes(addMonths(mes, 1))}><ChevronRight /></IconButton>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i} className="pb-1 text-[11px] font-bold text-subtle">{d}</span>
        ))}
        {dias.map((d) => {
          const otro = d.slice(0, 7) !== mes.slice(0, 7)
          const activo = d === fecha
          const enSemana = semanaSel.includes(d)
          return (
            <div key={d} className={cn('flex justify-center py-0.5', enSemana && 'bg-accent-soft', enSemana && d === semanaSel[0] && 'rounded-l-full', enSemana && d === semanaSel[6] && 'rounded-r-full')}>
              <button
                onClick={() => onPick(d)}
                className={cn(
                  'tabular relative flex size-8 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors',
                  activo ? 'bg-accent text-accent-fg' : d === hoy ? 'text-accent ring-1 ring-accent' : otro ? 'text-subtle hover:bg-surface-3' : 'hover:bg-surface-3',
                )}
              >
                {parseISO(d).getDate()}
                {marcados.has(d) && !activo && <span className="absolute bottom-[3px] size-1 rounded-full bg-accent" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Cuadrícula Día / Semana ---------- */

type Col = { key: string; fecha: string; emp?: Empleado }

function Cuadricula({
  scrollRef,
  vista,
  cols,
  hoy,
  ahora,
  delDia,
  mostrarProf,
  getPac,
  getEmp,
  onEvento,
  onSlot,
  onDia,
  conteo,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>
  vista: Vista
  cols: Col[]
  hoy: string
  ahora: number
  delDia: (iso: string) => Ev[]
  mostrarProf: boolean
  getPac: ReturnType<typeof useData>['getPaciente']
  getEmp: ReturnType<typeof useData>['getEmpleado']
  onEvento: (a: AgendaRow) => void
  onSlot: (fecha: string, hora: string, id_Emp?: number) => void
  onDia: (iso: string) => void
  conteo: (iso: string) => number
}) {
  const alto = SLOTS * SLOT * PX
  const horas = Array.from({ length: END - START }, (_, i) => START + i)
  const nowVisible = ahora >= START * 60 && ahora <= END * 60 && cols.some((c) => c.fecha === hoy)
  const nowTop = (ahora - START * 60) * PX
  const top = (hora: string) => (minutes(hora) - START * 60) * PX
  const enRango = (hora: string) => minutes(hora) >= START * 60 && minutes(hora) < END * 60
  // 116 px por día permite ver la semana completa a 1440 px junto al panel lateral
  const minCol = vista === 'dia' ? 220 : 116

  const Bloqueo = ({ e, className }: { e: Ev; className?: string }) => (
    <button
      onClick={() => onEvento(e.a)}
      style={{ ...rayado, top: top(e.a.Hora_Agenda), height: DUR * PX }}
      className={cn('absolute z-[1] flex items-start gap-1.5 border-y border-line-strong px-3 py-1.5 text-left text-[12px] font-semibold text-muted transition-colors hover:text-fg', className)}
    >
      <Lock className="mt-0.5 size-3.5 shrink-0" />
      <span className="min-w-0">
        <span className="tabular block text-[11px] font-bold">{e.a.Hora_Agenda} – {horaFin(e.a.Hora_Agenda, DUR)}</span>
        <span className="block truncate">{e.a.Nom_Evento}</span>
      </span>
    </button>
  )

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-auto">
      <div className="flex" style={{ minWidth: 64 + cols.length * minCol }}>
        {/* Gutter de horas */}
        <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-line bg-surface">
          <div className="sticky top-0 z-10 h-16 border-b border-line bg-surface" />
          <div className="relative" style={{ height: alto }}>
            {horas.map((h) => (
              <div key={h}>
                <span className={cn('tabular absolute right-2 text-[11.5px] font-bold text-muted', h === START ? 'translate-y-1' : '-translate-y-1/2')} style={{ top: (h - START) * HOUR_PX }}>
                  {pad(h)}:00
                </span>
                <span className="tabular absolute right-2 -translate-y-1/2 text-[10.5px] font-medium text-subtle" style={{ top: (h - START) * HOUR_PX + HOUR_PX / 2 }}>
                  {pad(h)}:30
                </span>
              </div>
            ))}
            {nowVisible && (
              <span className="tabular absolute right-1 z-10 -translate-y-1/2 rounded bg-danger px-1 py-px text-[10.5px] font-bold text-white" style={{ top: nowTop }}>
                {hhmm(ahora)}
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Encabezados */}
          <div className="sticky top-0 z-10 flex h-16 border-b border-line bg-surface">
            {cols.map((c) =>
              c.emp ? (
                <div key={c.key} className="relative flex min-w-0 flex-1 items-center gap-3 border-r border-line px-4 last:border-r-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: colorProf(c.emp.id_Emp), color: 'var(--surface)' }}>
                    {iniciales(c.emp)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-bold">{nombreCorto(c.emp)}</span>
                    <span className="block truncate text-[11.5px] text-muted">
                      {delDia(c.fecha).filter((e) => e.c?.id_Emp === c.emp!.id_Emp && e.estado !== 'cancelada').length} citas · {c.emp.Especialidad}
                    </span>
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: colorProf(c.emp.id_Emp) }} />
                </div>
              ) : (
                <button key={c.key} onClick={() => onDia(c.fecha)} className="group flex min-w-0 flex-1 items-center justify-center gap-2 border-r border-line last:border-r-0 hover:bg-surface-2">
                  <span className={cn('text-[11.5px] font-bold uppercase tracking-wider', c.fecha === hoy ? 'text-accent' : 'text-subtle')}>
                    {formatDate(c.fecha, { weekday: 'short' }).replace('.', '')}
                  </span>
                  <span className={cn('tabular flex size-8 items-center justify-center rounded-full text-[15px] font-bold', c.fecha === hoy && 'bg-accent text-accent-fg')}>
                    {parseISO(c.fecha).getDate()}
                  </span>
                  {conteo(c.fecha) > 0 && <span className="tabular rounded-full bg-surface-3 px-1.5 text-[11px] font-bold text-muted">{conteo(c.fecha)}</span>}
                </button>
              ),
            )}
          </div>

          {/* Cuerpo */}
          <div className="relative flex" style={{ height: alto }}>
            {/* En vista Día los bloqueos aplican a todo el equipo */}
            {vista === 'dia' && delDia(cols[0]?.fecha ?? hoy).filter((e) => !e.c && enRango(e.a.Hora_Agenda)).map((e) => <Bloqueo key={e.a.id_Agenda} e={e} className="inset-x-0" />)}

            {cols.map((c, ci) => {
              const items = delDia(c.fecha).filter((e) => e.c && (!c.emp || e.c.id_Emp === c.emp.id_Emp) && enRango(e.a.Hora_Agenda))
              const bloqueos = vista === 'semana' ? delDia(c.fecha).filter((e) => !e.c && enRango(e.a.Hora_Agenda)) : []
              const esHoy = c.fecha === hoy
              return (
                <div key={c.key} className={cn('relative min-w-0 flex-1 border-r border-line last:border-r-0', vista === 'semana' && esHoy && 'bg-accent-soft/30')}>
                  {Array.from({ length: SLOTS }, (_, i) => {
                    const min = START * 60 + i * SLOT
                    const fuera = min < LABORAL[0] || min >= LABORAL[1]
                    return (
                      <button
                        key={i}
                        onClick={() => onSlot(c.fecha, hhmm(min), c.emp?.id_Emp)}
                        aria-label={`Agendar ${formatDate(c.fecha, { day: 'numeric', month: 'short' })} a las ${hhmm(min)}${c.emp ? ` con ${nombreCorto(c.emp)}` : ''}`}
                        style={{ height: SLOT * PX }}
                        className={cn(
                          'group/slot flex w-full items-start px-2 pt-1 text-left transition-colors hover:bg-accent-soft',
                          i % 4 === 3 ? 'border-b border-line' : i % 2 === 1 ? 'border-b border-dashed border-line' : '',
                          fuera && 'bg-surface-2',
                        )}
                      >
                        <span className="tabular text-[11px] font-bold text-accent-soft-fg opacity-0 group-hover/slot:opacity-100">+ {hhmm(min)}</span>
                      </button>
                    )
                  })}

                  {bloqueos.map((e) => <Bloqueo key={e.a.id_Agenda} e={e} className="inset-x-0" />)}

                  {carriles(items).map(({ ev, lane, lanes }) => {
                    const c2 = ev.c!
                    const estado = ev.estado!
                    const emp = getEmp(c2.id_Emp)
                    const pac = getPac(c2.id_Pac)
                    return (
                      <button
                        key={ev.a.id_Agenda}
                        onClick={() => onEvento(ev.a)}
                        style={{ top: top(ev.a.Hora_Agenda) + 1, height: DUR * PX - 3, left: `calc(${(lane / lanes) * 100}% + 3px)`, width: `calc(${100 / lanes}% - 6px)` }}
                        className={cn('absolute z-[2] flex flex-col overflow-hidden rounded-md border-l-[3px] px-2 py-1.5 text-left transition-shadow hover:ring-1', bloque[estado])}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="tabular truncate text-[11px] font-bold text-muted">{ev.a.Hora_Agenda} – {horaFin(ev.a.Hora_Agenda, DUR)}</span>
                        </span>
                        <span className={cn('truncate text-[13px] font-bold leading-snug', estado === 'cancelada' && 'line-through')}>{nombreCorto(pac)}</span>
                        {c2.Motivo_Cita && <span className="truncate text-[11.5px] leading-snug text-muted">{c2.Motivo_Cita}</span>}
                        {vista === 'semana' && mostrarProf && emp && (
                          <span className="mt-auto flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-muted">
                            <span className="size-2 shrink-0 rounded-full" style={{ background: colorProf(emp.id_Emp) }} />
                            <span className="truncate">{nombreCorto(emp)}</span>
                          </span>
                        )}
                      </button>
                    )
                  })}

                  {esHoy && nowVisible && (
                    <div className="pointer-events-none absolute inset-x-0 z-[3] border-t-2 border-danger" style={{ top: nowTop - 1 }}>
                      {(vista === 'semana' || ci === 0) && <span className="absolute -left-[6px] -top-[6px] size-2.5 rounded-full bg-danger" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Vista Mes ---------- */

function VistaMes({ fecha, hoy, delDia, onDia, onEvento, getPac }: { fecha: string; hoy: string; delDia: (iso: string) => Ev[]; onDia: (iso: string) => void; onEvento: (a: AgendaRow) => void; getPac: ReturnType<typeof useData>['getPaciente'] }) {
  const dias = cuadriculaMes(fecha)
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex h-full min-w-[760px] flex-col">
        <div className="grid grid-cols-7 border-b border-line">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d) => (
            <span key={d} className="px-3 py-2.5 text-[11.5px] font-bold uppercase tracking-wider text-subtle">{d}</span>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7 grid-rows-6">
          {dias.map((d) => {
            const items = delDia(d).sort((x, y) => x.a.Hora_Agenda.localeCompare(y.a.Hora_Agenda))
            const otro = d.slice(0, 7) !== fecha.slice(0, 7)
            return (
              <div key={d} className={cn('flex min-h-[112px] min-w-0 flex-col gap-0.5 border-b border-r border-line p-1.5 [&:nth-child(7n)]:border-r-0', otro && 'bg-surface-2')}>
                <button
                  onClick={() => onDia(d)}
                  className={cn(
                    'tabular mb-0.5 flex size-7 items-center justify-center self-start rounded-full text-[12.5px] font-bold transition-colors',
                    d === hoy ? 'bg-accent text-accent-fg' : otro ? 'text-subtle hover:bg-surface-3' : 'hover:bg-surface-3',
                  )}
                >
                  {parseISO(d).getDate()}
                </button>
                {items.slice(0, 3).map((e) => (
                  <button key={e.a.id_Agenda} onClick={() => onEvento(e.a)} className="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-[11.5px] hover:bg-surface-3">
                    {e.c ? <span className={cn('size-2 shrink-0 rounded-full', punto[e.estado!])} /> : <Lock className="size-3 shrink-0 text-subtle" />}
                    <span className="tabular shrink-0 font-bold">{e.a.Hora_Agenda}</span>
                    <span className={cn('truncate text-muted', e.estado === 'cancelada' && 'line-through')}>{e.c ? nombreCorto(getPac(e.c.id_Pac)) : e.a.Nom_Evento}</span>
                  </button>
                ))}
                {items.length > 3 && (
                  <button onClick={() => onDia(d)} className="self-start px-1.5 text-[11.5px] font-bold text-accent hover:underline">
                    +{items.length - 3} más
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- Panel de detalle ---------- */

function Fila({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 px-4 py-3">
      <span className="mt-0.5 text-subtle [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-subtle">{label}</p>
        <div className="mt-0.5 text-sm font-semibold">{children}</div>
      </div>
    </li>
  )
}

function Detalle({ ev }: { ev: Ev }) {
  const data = useData()
  const { a, c } = ev
  if (!c) {
    return (
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full border border-line-strong text-muted" style={rayado}><Lock className="size-5" /></span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">{a.Nom_Evento}</p>
            <p className="text-[13px] text-muted">Horario bloqueado para todo el equipo</p>
          </div>
        </div>
        <ul className="divide-y divide-line rounded-xl border border-line">
          <Fila icon={<CalendarDays />} label="Fecha">{formatLongDate(a.Fecha_Agenda)}</Fila>
          <Fila icon={<Clock />} label="Horario"><span className="tabular">{a.Hora_Agenda} – {horaFin(a.Hora_Agenda, DUR)}</span></Fila>
        </ul>
      </div>
    )
  }
  const pac = data.getPaciente(c.id_Pac)
  const emp = data.getEmpleado(c.id_Emp)
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-soft-fg">{iniciales(pac)}</span>
        <div className="min-w-0 flex-1">
          <Link to={`/pacientes/${c.id_Pac}`} className="block truncate text-lg font-bold leading-tight hover:text-accent">{nombreCompleto(pac)}</Link>
          {pac && (
            <a href={`tel:${pac.Telefono_Pac}`} className="tabular mt-0.5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg">
              <Phone className="size-3.5" />{formatTel(pac.Telefono_Pac)}
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
        <span className="tabular text-[13px] font-bold text-muted">{c.Folio}</span>
        <EstadoCitaBadge estado={ev.estado!} />
      </div>
      <ul className="divide-y divide-line rounded-xl border border-line">
        <Fila icon={<CalendarDays />} label="Fecha">{formatLongDate(c.Fecha_Cita)}</Fila>
        <Fila icon={<Clock />} label="Horario"><span className="tabular">{c.Hora_Cita} – {horaFin(c.Hora_Cita, DUR)}</span> <span className="font-medium text-subtle">· 60 min</span></Fila>
        <Fila icon={<UserRound />} label="Fisioterapeuta">
          <span className="inline-flex items-center gap-2">
            {emp && <span className="size-2.5 rounded-full" style={{ background: colorProf(emp.id_Emp) }} />}
            {nombreCompleto(emp)}
          </span>
        </Fila>
        <Fila icon={<FileText />} label="Motivo">{c.Motivo_Cita ?? '—'}</Fila>
      </ul>
      <div className="flex gap-3 rounded-xl border border-line px-4 py-3 text-[13px] leading-relaxed text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-subtle" />
        <p>
          {ev.estado === 'cancelada' && 'Esta cita está cancelada: el horario queda libre y no cuenta en el resumen del día. Puedes reactivarla si el paciente confirma.'}
          {ev.estado === 'programada' && 'Cita vigente. Si el paciente no puede asistir, usa «Cancelar cita». Después de la consulta, registra el diagnóstico.'}
          {ev.estado === 'sin_diagnostico' && 'La fecha ya pasó y falta registrar el diagnóstico. Al guardarlo, la cita pasa a «Atendida».'}
          {ev.estado === 'atendida' && 'Consulta atendida con diagnóstico registrado. Ya no se puede cancelar.'}
        </p>
      </div>
    </div>
  )
}

function DetalleAcciones({ ev, esFisio, onClose, onNueva, navigate }: { ev: Ev; esFisio: boolean; onClose: () => void; onNueva: () => void; navigate: ReturnType<typeof useNavigate> }) {
  const data = useData()
  const [confirmando, setConfirmando] = useState(false)
  const c = ev.c
  if (!c) {
    return (
      <Button variant="danger" onClick={() => { data.agenda.remove(ev.a.id_Agenda); onClose() }}><Trash2 />Eliminar bloqueo</Button>
    )
  }
  const diag = data.diagDeCita(c.id_Cita)
  if (confirmando) {
    return (
      <div className="flex w-full flex-col gap-3">
        <p className="text-sm font-semibold">¿Cancelar la cita de {nombreCorto(data.getPaciente(c.id_Pac))}?</p>
        <p className="-mt-1 text-[13px] text-muted">El horario se libera. Podrás reactivarla después desde este mismo panel.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmando(false)}>No, conservar</Button>
          <Button variant="danger" className="flex-1" onClick={() => { data.citas.update(c.id_Cita, { Estatus_Cita: false }); setConfirmando(false) }}><X />Sí, cancelar</Button>
        </div>
      </div>
    )
  }
  return (
    <>
      {c.Estatus_Cita && <Button variant="secondary" size="sm" onClick={onNueva} title="Agendar otra cita a esta misma hora"><CalendarPlus />Otra cita</Button>}
      {!c.Estatus_Cita && <Button variant="secondary" onClick={() => data.citas.update(c.id_Cita, { Estatus_Cita: true })}><Undo2 />Reactivar cita</Button>}
      {c.Estatus_Cita && !diag && <Button variant="secondary" onClick={() => setConfirmando(true)}><X />Cancelar cita</Button>}
      {esFisio && c.Estatus_Cita && !diag && (
        <Button className="ml-auto" onClick={() => navigate(`/diagnosticos/nuevo?cita=${c.id_Cita}`)}><Stethoscope />Diagnosticar</Button>
      )}
      {esFisio && diag && <Button className="ml-auto" onClick={() => navigate(`/diagnosticos/${diag.id_Diag}`)}>Ver diagnóstico</Button>}
      {!esFisio && <Button variant="secondary" className="ml-auto" onClick={() => navigate(`/pacientes/${c.id_Pac}`)}>Ficha del paciente</Button>}
    </>
  )
}
