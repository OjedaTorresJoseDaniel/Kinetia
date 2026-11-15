import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, ArrowUpRight, CalendarPlus, CalendarX, Clock, Stethoscope, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, EstadoCitaBadge, PageHeader, PainMeter, Stat } from '../components/ui'
import { CitaModal, EventoModal, PacienteModal } from '../components/forms'
import { addDays, cn, edad, formatDate, formatLongDate, iniciales, nombreCompleto, nombreCorto, todayISO } from '../lib/format'
import { useResumenDiag } from '../lib/useResumenDiag'

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

export default function Dashboard() {
  return <FisioDashboard />
}

function FisioDashboard() {
  const { user } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const resumen = useResumenDiag()
  const hoy = todayISO()

  const mias = data.citas.rows.filter((c) => c.id_Emp === user!.id_Emp)
  const deHoy = mias.filter((c) => c.Fecha_Cita === hoy).sort((a, b) => a.Hora_Cita.localeCompare(b.Hora_Cita))
  const porAtender = deHoy.filter((c) => data.estadoCita(c) === 'programada')
  const pendientes = mias.filter((c) => data.estadoCita(c) === 'sin_diagnostico')
  const misDiags = data.diagnosticos.rows
    .map((d) => ({ d, c: data.getCita(d.id_Cita)! }))
    .filter(({ c }) => c.id_Emp === user!.id_Emp)
    .sort((a, b) => (b.c.Fecha_Cita + b.c.Hora_Cita).localeCompare(a.c.Fecha_Cita + a.c.Hora_Cita))
  const siguiente = porAtender[0]
  const sigPac = siguiente && data.getPaciente(siguiente.id_Pac)

  return (
    <>
      <PageHeader
        kicker={formatLongDate(hoy)}
        title={`${saludo()}, ${user!.Nombre_Emp}`}
        description={`Tienes ${porAtender.length} ${porAtender.length === 1 ? 'paciente' : 'pacientes'} por atender hoy${pendientes.length ? ` y ${pendientes.length} ${pendientes.length === 1 ? 'cita pasada' : 'citas pasadas'} sin diagnóstico` : ''}.`}
      />

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Siguiente paciente */}
        <div className="relative overflow-hidden rounded-2xl bg-carbon p-7 text-carbon-fg">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 -top-4 size-40 rounded-full border border-white/10" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-carbon-fg/50">Siguiente paciente</p>
          {siguiente && sigPac ? (
            <>
              <div className="mt-6 flex items-center gap-4">
                <Avatar text={iniciales(sigPac)} size="lg" tone="solid" />
                <div className="min-w-0">
                  <p className="truncate text-2xl font-bold tracking-tight">{nombreCompleto(sigPac)}</p>
                  <p className="mt-0.5 text-sm text-carbon-fg/60">{edad(sigPac.Fecha_Nacimiento)} años · {sigPac.Genero === 'F' ? 'Femenino' : 'Masculino'}</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-5 text-sm">
                <div><p className="text-xs text-carbon-fg/50">Hora</p><p className="tabular mt-1 text-lg font-bold">{siguiente.Hora_Cita}</p></div>
                <div className="col-span-2"><p className="text-xs text-carbon-fg/50">Motivo</p><p className="mt-1 font-semibold leading-snug">{siguiente.Motivo_Cita ?? 'Sin motivo registrado'}</p></div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={() => navigate(`/diagnosticos/nuevo?cita=${siguiente.id_Cita}`)}><Stethoscope />Iniciar diagnóstico</Button>
                <Link to={`/pacientes/${sigPac.id_Pac}`}><Button variant="ghost" className="text-carbon-fg/85 ring-1 ring-white/15 hover:bg-white/10 hover:text-carbon-fg">Ver expediente</Button></Link>
              </div>
            </>
          ) : (
            <p className="mt-6 text-lg font-semibold text-carbon-fg/70">No hay más pacientes por atender hoy.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Stat accent label="Citas hoy" value={deHoy.filter((c) => c.Estatus_Cita).length} foot={`${deHoy.filter((c) => data.estadoCita(c) === 'atendida').length} atendidas`} />
          <Stat label="Por atender" value={porAtender.length} foot={siguiente ? `Próxima a las ${siguiente.Hora_Cita}` : 'Agenda libre'} />
          <Stat label="Sin diagnóstico" value={pendientes.length} foot="Citas pasadas pendientes" />
          <Stat label="Diagnósticos" value={misDiags.length} foot="Registrados por ti" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader title="Agenda de hoy" description={`${deHoy.length} citas`} action={<Link to="/citas" className="text-[13px] font-semibold text-muted hover:text-fg">Ver citas</Link>} />
          {deHoy.length === 0 ? (
            <EmptyState icon={<Clock />} title="Sin citas hoy" />
          ) : (
            <ol className="px-3 pb-3 pt-2">
              {deHoy.map((c) => {
                const p = data.getPaciente(c.id_Pac)!
                const estado = data.estadoCita(c)
                const diag = data.diagDeCita(c.id_Cita)
                return (
                  <li key={c.id_Cita} className={cn('flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-surface-2', estado === 'cancelada' && 'opacity-55')}>
                    <span className="tabular w-12 shrink-0 text-sm font-bold">{c.Hora_Cita}</span>
                    <span className={cn('h-9 w-[3px] shrink-0 rounded-full', estado === 'atendida' ? 'bg-success' : estado === 'cancelada' ? 'bg-line-strong' : 'bg-accent')} />
                    <Link to={`/pacientes/${p.id_Pac}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{nombreCompleto(p)}</p>
                      <p className="truncate text-[13px] text-muted">{c.Motivo_Cita ?? '—'}</p>
                    </Link>
                    <span className="hidden sm:block"><EstadoCitaBadge estado={estado} /></span>
                    {estado === 'programada' && (
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/diagnosticos/nuevo?cita=${c.id_Cita}`)}>Diagnosticar</Button>
                    )}
                    {diag && (
                      <Link to={`/diagnosticos/${diag.id_Diag}`}><Button size="sm" variant="ghost">Ver</Button></Link>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {pendientes.length > 0 && (
            <Card className="border-warning/30">
              <CardHeader title="Pendientes de diagnóstico" description="Citas vigentes ya pasadas sin diagnóstico registrado" />
              <ul className="px-3 pb-3 pt-2">
                {pendientes.map((c) => (
                  <li key={c.id_Cita} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{nombreCorto(data.getPaciente(c.id_Pac))}</p>
                      <p className="text-xs text-muted">{formatDate(c.Fecha_Cita)} · {c.Hora_Cita}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/diagnosticos/nuevo?cita=${c.id_Cita}`)}>Registrar</Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardHeader title="Diagnósticos recientes" action={<Link to="/diagnosticos" className="text-[13px] font-semibold text-muted hover:text-fg">Ver todos</Link>} />
            <ul className="px-3 pb-3 pt-2">
              {misDiags.slice(0, 5).map(({ d, c }) => {
                const r = resumen(d.id_Diag)
                return (
                  <li key={d.id_Diag}>
                    <Link to={`/diagnosticos/${d.id_Diag}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2">
                      <Avatar text={iniciales(data.getPaciente(c.id_Pac))} size="sm" tone="accent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{nombreCorto(data.getPaciente(c.id_Pac))}</p>
                        <p className="truncate text-xs text-muted">{r.principal} · {formatDate(c.Fecha_Cita, { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <PainMeter value={r.dolor} compact />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}

function RecepcionDashboard() {
  const { user } = useAuth()
  const data = useData()
  const [modal, setModal] = useState<'cita' | 'paciente' | 'evento' | null>(null)
  const hoy = todayISO()

  const deHoy = data.citas.rows.filter((c) => c.Fecha_Cita === hoy)
  const vigentesHoy = deHoy.filter((c) => c.Estatus_Cita)
  const semana = data.citas.rows.filter((c) => c.Estatus_Cita && c.Fecha_Cita > hoy && c.Fecha_Cita <= addDays(hoy, 7))
  const fisios = data.empleados.rows.filter((e) => e.Tipo_Emp && e.Estatus_Emp)
  const eventos = data.agenda.rows.filter((a) => a.Fecha_Agenda >= hoy && a.Fecha_Agenda <= addDays(hoy, 3)).sort((a, b) => (a.Fecha_Agenda + a.Hora_Agenda).localeCompare(b.Fecha_Agenda + b.Hora_Agenda)).slice(0, 7)

  const acciones = [
    { k: 'cita' as const, label: 'Agendar cita', icon: CalendarPlus },
    { k: 'paciente' as const, label: 'Registrar paciente', icon: UserPlus },
    { k: 'evento' as const, label: 'Nuevo evento', icon: Clock },
  ]

  return (
    <>
      <PageHeader
        kicker={formatLongDate(hoy)}
        title={`${saludo()}, ${user!.Nombre_Emp}`}
        description="Resumen de la operación del día."
        actions={acciones.map(({ k, label, icon: Icon }, i) => (
          <Button key={k} variant={i === 0 ? 'primary' : 'secondary'} onClick={() => setModal(k)}><Icon />{label}</Button>
        ))}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat accent label="Citas hoy" value={vigentesHoy.length} foot={`${deHoy.filter((c) => data.estadoCita(c) === 'atendida').length} atendidas`} />
        <Stat label="Canceladas hoy" value={deHoy.length - vigentesHoy.length} foot="Estatus de cita inactivo" />
        <Stat label="Próximos 7 días" value={semana.length} foot="Citas vigentes" />
        <Stat label="Pacientes" value={data.pacientes.rows.length} foot="Registrados" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Citas de hoy por fisioterapeuta" action={<Link to="/agenda" className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-fg">Agenda <ArrowUpRight className="size-3.5" /></Link>} />
          <div className="grid gap-px p-3 md:grid-cols-3">
            {fisios.map((f) => {
              const suyas = deHoy.filter((c) => c.id_Emp === f.id_Emp).sort((a, b) => a.Hora_Cita.localeCompare(b.Hora_Cita))
              return (
                <div key={f.id_Emp} className="rounded-xl p-3">
                  <div className="mb-3 flex items-center gap-2.5">
                    <Avatar text={iniciales(f)} size="sm" tone="carbon" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold">{nombreCorto(f)}</p>
                      <p className="truncate text-xs text-muted">{suyas.filter((c) => c.Estatus_Cita).length} citas</p>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {suyas.map((c) => {
                      const e = data.estadoCita(c)
                      return (
                        <li key={c.id_Cita} className={cn('rounded-lg border border-line px-3 py-2', e === 'cancelada' && 'opacity-50')}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="tabular text-xs font-bold">{c.Hora_Cita}</span>
                            {e !== 'programada' && <EstadoCitaBadge estado={e} />}
                          </div>
                          <p className={cn('mt-0.5 truncate text-[13px] font-semibold', e === 'cancelada' && 'line-through')}>{nombreCorto(data.getPaciente(c.id_Pac))}</p>
                        </li>
                      )
                    })}
                    {suyas.length === 0 && <li className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-subtle">Sin citas</li>}
                  </ul>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Próximos eventos" description="Agenda de los siguientes 3 días" />
          <ul className="px-3 pb-3 pt-2">
            {eventos.map((a) => (
              <li key={a.id_Agenda} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                <div className="w-14 shrink-0 text-center">
                  <p className="text-[11px] font-semibold uppercase text-subtle">{a.Fecha_Agenda === hoy ? 'Hoy' : formatDate(a.Fecha_Agenda, { weekday: 'short' })}</p>
                  <p className="tabular text-sm font-bold">{a.Hora_Agenda}</p>
                </div>
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold">{a.Nom_Evento}</p>
                {a.id_Cita ? <Badge tone="accent">Cita</Badge> : <Badge>Interno</Badge>}
              </li>
            ))}
            {eventos.length === 0 && <EmptyState icon={<CalendarX />} title="Sin eventos próximos" />}
          </ul>
          <Link to="/agenda" className="flex items-center justify-center gap-1.5 border-t border-line py-3 text-[13px] font-semibold text-muted hover:text-fg">
            Abrir agenda <ArrowRight className="size-3.5" />
          </Link>
        </Card>
      </div>

      {modal === 'cita' && <CitaModal open onClose={() => setModal(null)} />}
      {modal === 'paciente' && <PacienteModal open onClose={() => setModal(null)} />}
      {modal === 'evento' && <EventoModal open onClose={() => setModal(null)} />}
    </>
  )
}
