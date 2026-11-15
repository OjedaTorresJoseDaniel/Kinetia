import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CalendarPlus, ChevronRight, Download, FileHeart, Pencil, Stethoscope, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, EstadoCitaBadge, PainMeter, Select, Stat, Table, Tabs, Td, Th } from '../components/ui'
import { BodyMap, contarNiveles, descargarMapa, ElectrodoPad, Leyenda, ModeloToggle, modeloDeGenero, NIVELES, nombreNivel, nombreVista, type Modelo } from '../components/BodyMap'
import type { NivelFrecuencia } from '../types'
import { CitaModal, PacienteModal } from '../components/forms'
import { cn, edad, formatDate, formatTel, iniciales, nombreCompleto, nombreCorto, todayISO } from '../lib/format'
import { useResumenDiag } from '../lib/useResumenDiag'
import type { Cita, Diagnostico } from '../types'
import NotFound from './NotFound'
import HistoriaClinica from '../components/HistoriaClinica'

/** Sesiones del paciente: citas vigentes ya ocurridas, con su diagnóstico si existe (orden cronológico). */
function useSesiones(id_Pac: number) {
  const data = useData()
  const hoy = todayISO()
  const pasadas = data.citas.rows
    .filter((c) => c.id_Pac === id_Pac && c.Estatus_Cita && c.Fecha_Cita <= hoy)
    .sort((a, b) => (a.Fecha_Cita + a.Hora_Cita).localeCompare(b.Fecha_Cita + b.Hora_Cita))
  let n = 0
  const sesiones = pasadas.map((c) => {
    const d = data.diagDeCita(c.id_Cita)
    return { c, d, num: d ? ++n : null }
  })
  const atendidas = sesiones.filter((s): s is { c: Cita; d: Diagnostico; num: number } => !!s.d)
  return { sesiones, atendidas }
}

export default function PacienteDetalle() {
  const { id } = useParams()
  const { rol } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const esFisio = rol === 'fisioterapeuta'
  const [tab, setTab] = useState<'historial' | 'electro' | 'citas'>(esFisio ? 'historial' : 'citas')
  const [modal, setModal] = useState<'cita' | 'editar' | null>(null)
  const [historia, setHistoria] = useState(false)
  const p = data.getPaciente(Number(id))
  const { atendidas } = useSesiones(p?.id_Pac ?? 0)
  if (!p) return <NotFound />

  const hoy = todayISO()
  const citas = data.citas.rows.filter((c) => c.id_Pac === p.id_Pac).sort((a, b) => (b.Fecha_Cita + b.Hora_Cita).localeCompare(a.Fecha_Cita + a.Hora_Cita))
  const electrosPac = atendidas.flatMap((s) => data.electrodosDeDiag(s.d.id_Diag))
  const porDiagnosticar = citas.find((c) => esFisio && data.estadoCita(c) !== 'cancelada' && data.estadoCita(c) !== 'atendida' && c.Fecha_Cita <= hoy)

  const datos = [
    ['Edad', `${edad(p.Fecha_Nacimiento)} años`],
    ['Nacimiento', formatDate(p.Fecha_Nacimiento, { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Género', p.Genero === 'F' ? 'Femenino' : 'Masculino'],
    ['Teléfono', formatTel(p.Telefono_Pac)],
  ]

  return (
    <>
      <Link to="/pacientes" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" />Pacientes
      </Link>

      <Card className="mb-8 p-6 sm:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <Avatar text={iniciales(p)} size="xl" tone="accent" />
          <div className="min-w-0 flex-1">
            <p className="tabular text-xs font-semibold text-subtle">Paciente · ID {String(p.id_Pac).padStart(4, '0')}</p>
            <h1 className="mt-1 text-[26px] font-bold tracking-[-0.02em]">{nombreCompleto(p)}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {esFisio && <Button variant="secondary" onClick={() => setHistoria(true)}><FileHeart />Historial clínico</Button>}
            <Button variant="secondary" onClick={() => setModal('editar')}><Pencil />Editar</Button>
            <Button variant="secondary" onClick={() => setModal('cita')}><CalendarPlus />Agendar</Button>
            {porDiagnosticar && <Button onClick={() => navigate(`/diagnosticos/nuevo?cita=${porDiagnosticar.id_Cita}`)}><Stethoscope />Diagnosticar</Button>}
          </div>
        </div>
        <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-4">
          {datos.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium text-subtle">{k}</dt>
              <dd className="tabular mt-1 text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ...(esFisio
            ? [
                { id: 'historial' as const, label: 'Historial de sesiones', count: atendidas.length },
                { id: 'electro' as const, label: 'Electroterapia', count: electrosPac.length },
              ]
            : []),
          { id: 'citas' as const, label: 'Citas', count: citas.length },
        ]}
      />

      <div className="mt-6">
        {tab === 'historial' && <Historial id_Pac={p.id_Pac} />}
        {tab === 'electro' && <Electroterapia id_Pac={p.id_Pac} nombre={nombreCompleto(p)} genero={p.Genero} />}

        {tab === 'citas' && (
          <Card>
            {citas.length === 0 ? (
              <EmptyState icon={<CalendarPlus />} title="Sin citas registradas" />
            ) : (
              <Table>
                <thead><tr><Th>Folio</Th><Th>Fecha</Th><Th>Hora</Th><Th>Fisioterapeuta</Th><Th>Motivo</Th><Th>Estado</Th></tr></thead>
                <tbody>
                  {citas.map((c) => (
                    <tr key={c.id_Cita}>
                      <Td className="tabular text-[13px] font-semibold text-muted">{c.Folio}</Td>
                      <Td className="whitespace-nowrap font-semibold">{formatDate(c.Fecha_Cita)}</Td>
                      <Td className="tabular">{c.Hora_Cita}</Td>
                      <Td className="whitespace-nowrap">{nombreCorto(data.getEmpleado(c.id_Emp))}</Td>
                      <Td className="text-muted">{c.Motivo_Cita ?? '—'}</Td>
                      <Td><EstadoCitaBadge estado={data.estadoCita(c)} /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        )}
      </div>

      {historia && <HistoriaClinica pacienteId={p.id_Pac} onClose={() => setHistoria(false)} />}
      {modal === 'cita' && <CitaModal open onClose={() => setModal(null)} id_Pac={p.id_Pac} />}
      {modal === 'editar' && <PacienteModal open onClose={() => setModal(null)} paciente={p} />}
    </>
  )
}

const fechaLarga = (iso: string) => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' })

/* ---------- Historial de sesiones ---------- */

function Historial({ id_Pac }: { id_Pac: number }) {
  const data = useData()
  const navigate = useNavigate()
  const resumen = useResumenDiag()
  const { sesiones, atendidas } = useSesiones(id_Pac)

  if (sesiones.length === 0) {
    return <Card><EmptyState icon={<FileHeart />} title="Sin sesiones registradas" text="Las sesiones aparecen aquí cuando el paciente asiste a una cita y se registra su diagnóstico." /></Card>
  }

  const primera = atendidas[0]
  const ultima = atendidas[atendidas.length - 1]
  const sinRegistro = sesiones.length - atendidas.length

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Sesiones atendidas" value={atendidas.length} foot={sinRegistro ? `${sinRegistro} sin registro clínico` : 'Todas con registro clínico'} accent />
        <Stat label="Primera sesión" value={<span className="text-xl">{primera ? formatDate(primera.c.Fecha_Cita) : '—'}</span>} foot={primera ? resumen(primera.d.id_Diag).principal : undefined} />
        <Stat label="Última sesión" value={<span className="text-xl">{ultima ? formatDate(ultima.c.Fecha_Cita) : '—'}</span>} foot={ultima ? nombreCorto(data.getEmpleado(ultima.c.id_Emp)) : undefined} />
        <Stat
          label="Dolor"
          value={primera ? <>{resumen(primera.d.id_Diag).dolor}<span className="px-1.5 text-subtle">→</span>{resumen(ultima.d.id_Diag).dolor}</> : '—'}
          foot="Primera sesión → última"
        />
      </div>

      <ol className="relative flex flex-col gap-3 pl-6 before:absolute before:bottom-6 before:left-[7px] before:top-6 before:w-px before:bg-line">
        {[...sesiones].reverse().map(({ c, d, num }) => {
          const emp = data.getEmpleado(c.id_Emp)
          if (!d) {
            return (
              <li key={c.id_Cita} className="relative">
                <span className="absolute -left-6 top-5 size-[15px] rounded-full border-[3px] border-bg bg-line-strong" />
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-subtle">{fechaLarga(c.Fecha_Cita)} · {c.Hora_Cita} · {nombreCorto(emp)}</p>
                    <p className="mt-0.5 text-sm font-semibold text-muted">Sin registro clínico{c.Motivo_Cita ? ` — ${c.Motivo_Cita}` : ''}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/diagnosticos/nuevo?cita=${c.id_Cita}`)}><Stethoscope />Registrar diagnóstico</Button>
                </div>
              </li>
            )
          }
          const r = resumen(d.id_Diag)
          const trat = [...new Set(data.detalleCH.rows.filter((x) => x.id_Diag === d.id_Diag).map((m) => data.getTratamiento(data.getDetalleTrata(m.id_DetalleTrata)?.id_Trata ?? 0)?.Nombre_Trata))].filter((t): t is string => !!t)
          const elec = data.electrodosDeDiag(d.id_Diag)
          const ejs = data.detalleEjer.rows.filter((x) => x.id_Diag === d.id_Diag)
          const vacio = <span className="text-[13px] text-subtle">—</span>
          return (
            <li key={c.id_Cita} className="relative">
              <span className="absolute -left-6 top-6 size-[15px] rounded-full border-[3px] border-bg bg-accent" />
              <Link to={`/diagnosticos/${d.id_Diag}`} className="group block rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong">
                <div className="flex flex-wrap items-start justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-subtle">Sesión {num} · {fechaLarga(c.Fecha_Cita)} · {c.Hora_Cita}</p>
                    <p className="mt-1 text-base font-bold">{r.principal}</p>
                    <p className="mt-0.5 text-[13px] text-muted">{nombreCorto(emp)} · {data.getConsultorio(d.id_Consul)?.Nombre_Consul}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <PainMeter value={r.dolor} />
                    <ChevronRight className="size-4 text-subtle group-hover:text-fg" />
                  </div>
                </div>
                <dl className="grid border-t border-line sm:grid-cols-3 [&>div]:min-w-0 [&>div]:border-line [&>div]:px-5 [&>div]:py-3.5 [&>div:not(:first-child)]:border-t sm:[&>div:not(:first-child)]:border-l sm:[&>div:not(:first-child)]:border-t-0">
                  <div>
                    <dt className="text-xs font-medium text-subtle">Tratamiento</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1">{trat.length ? trat.map((t) => <Badge key={t} tone="accent">{t}</Badge>) : vacio}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-subtle">Electroterapia</dt>
                    <dd className="mt-1.5">
                      {elec.length ? (
                        <>
                          <span className="tabular flex items-center gap-3 text-[13px] font-bold">
                            {NIVELES.map((n) => {
                              const k = elec.filter((e) => e.Frecuencia === n.id).length
                              return k ? <span key={n.id} className="inline-flex items-center gap-1.5" title={nombreNivel(n.id)}><ElectrodoPad nivel={n.id} />{k}</span> : null
                            })}
                          </span>
                          <p className="mt-1 truncate text-xs text-muted">{[...new Set(elec.map((e) => e.Zona))].join(', ')}</p>
                        </>
                      ) : vacio}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-subtle">Ejercicios</dt>
                    <dd className="mt-1.5">
                      {ejs.length ? (
                        <>
                          <p className="text-[13px] font-bold">{ejs.length} prescritos</p>
                          <p className="mt-1 truncate text-xs text-muted">{ejs.map((x) => data.getEjercicio(x.id_Ejercicio)?.Nombre_Ejercicio).join(', ')}</p>
                        </>
                      ) : vacio}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------- Electroterapia ---------- */

const total = (n: Record<NivelFrecuencia, number>) => n.B + n.M + n.A

function Electroterapia({ id_Pac, nombre, genero }: { id_Pac: number; nombre: string; genero: 'F' | 'M' }) {
  const data = useData()
  const { atendidas } = useSesiones(id_Pac)
  const [sel, setSel] = useState(0)
  const mapRef = useRef<HTMLDivElement>(null)
  const [modelo, setModelo] = useState<Modelo>(modeloDeGenero(genero))

  const filas = atendidas.flatMap((s) => data.electrodosDeDiag(s.d.id_Diag).map((e) => ({ e, s })))
  if (!filas.length) {
    return <Card><EmptyState icon={<Zap />} title="Sin electroterapia registrada" text="Las colocaciones de electrodos se capturan en el paso Electroterapia de cada diagnóstico." /></Card>
  }

  const conElectro = atendidas.filter((s) => filas.some((f) => f.s.d.id_Diag === s.d.id_Diag))
  const sesionSel = conElectro.find((s) => s.d.id_Diag === sel)
  const marcas = (sesionSel ? filas.filter((f) => f.s.d.id_Diag === sel) : filas).map((f) => f.e)
  const todas = contarNiveles(filas.map((f) => f.e))

  const porZona = new Map<string, { zona: string; vistas: Set<string>; n: Record<NivelFrecuencia, number>; hz: number[]; v: number[]; sesiones: Set<number>; ultima: string }>()
  for (const { e, s } of filas) {
    const z = porZona.get(e.Zona) ?? { zona: e.Zona, vistas: new Set(), n: { B: 0, M: 0, A: 0 }, hz: [], v: [], sesiones: new Set(), ultima: '' }
    z.vistas.add(nombreVista(e.Vista))
    z.n[e.Frecuencia]++
    if (e.Hz != null) z.hz.push(e.Hz)
    if (e.Voltaje != null) z.v.push(e.Voltaje)
    z.sesiones.add(s.d.id_Diag)
    if (s.c.Fecha_Cita > z.ultima) z.ultima = s.c.Fecha_Cita
    porZona.set(e.Zona, z)
  }
  const uso = [...porZona.values()].sort((a, b) => b.sesiones.size - a.sesiones.size || total(b.n) - total(a.n))
  const rango = (l: number[], u: string) => (l.length ? (Math.min(...l) === Math.max(...l) ? `${Math.min(...l).toLocaleString('es-MX')} ${u}` : `${Math.min(...l).toLocaleString('es-MX')}–${Math.max(...l).toLocaleString('es-MX')} ${u}`) : null)

  const descargar = () =>
    descargarMapa(mapRef.current, {
      titulo: nombre,
      subtitulo: sesionSel ? `Sesión ${sesionSel.num} · ${fechaLarga(sesionSel.c.Fecha_Cita)}` : `Acumulado de ${conElectro.length} sesiones con electroterapia`,
      archivo: sesionSel ? `electrodos-${id_Pac}-sesion-${sesionSel.num}.png` : `electrodos-${id_Pac}-acumulado.png`,
      marcas,
    })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Asistencias" value={atendidas.length} foot="Sesiones con registro clínico" />
        <Stat label="Con electroterapia" value={conElectro.length} foot={`${Math.round((conElectro.length / atendidas.length) * 100)}% de las sesiones`} accent />
        {NIVELES.map((n) => (
          <Stat key={n.id} label={`Frecuencia ${nombreNivel(n.id).toLowerCase()}`} value={todas[n.id]} foot={`${n.rango} · electrodos en total`} />
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-4 px-5 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold tracking-tight">Mapa de electrodos</h2>
            <p className="mt-0.5 text-[13px] text-muted">{sesionSel ? `Sesión ${sesionSel.num} · ${fechaLarga(sesionSel.c.Fecha_Cita)}` : `Todas las colocaciones superpuestas · ${conElectro.length} sesiones`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ModeloToggle value={modelo} onChange={setModelo} />
            <Select value={sel} onChange={(e) => setSel(Number(e.target.value))} className="h-9 text-[13px] sm:w-64">
              <option value={0}>Todas las sesiones</option>
              {[...conElectro].reverse().map((s) => <option key={s.d.id_Diag} value={s.d.id_Diag}>Sesión {s.num} · {formatDate(s.c.Fecha_Cita)}</option>)}
            </Select>
            <Button variant="secondary" onClick={descargar}><Download />Descargar imagen</Button>
          </div>
        </div>
        <div ref={mapRef} className="p-5">
          <BodyMap marcas={marcas} modelo={modelo} />
        </div>
        <div className="border-t border-line px-5 py-4">
          <Leyenda conteo={contarNiveles(marcas)} rangos />
        </div>
      </Card>

      <Card>
        <CardHeader title="Frecuencia de uso por zona" description="En cuántas sesiones se ha estimulado cada zona, con qué rango de frecuencia y con qué parámetros." />
        <div className="mt-3">
          <Table min={860}>
            <thead><tr><Th>Zona</Th><Th>Vistas</Th><Th>Baja</Th><Th>Media</Th><Th>Alta</Th><Th>Parámetros</Th><Th>Sesiones</Th><Th>Última vez</Th></tr></thead>
            <tbody>
              {uso.map((z) => {
                const pct = Math.round((z.sesiones.size / atendidas.length) * 100)
                return (
                  <tr key={z.zona}>
                    <Td className="font-semibold">{z.zona}</Td>
                    <Td className="text-[13px] text-muted">{[...z.vistas].join(', ')}</Td>
                    {NIVELES.map((n) => (
                      <Td key={n.id}><span className={cn('tabular inline-flex items-center gap-2 font-semibold', !z.n[n.id] && 'text-subtle')}><ElectrodoPad nivel={n.id} className={cn(!z.n[n.id] && 'opacity-30')} />{z.n[n.id]}</span></Td>
                    ))}
                    <Td className="tabular whitespace-nowrap text-[13px] text-muted">{[rango(z.hz, 'Hz'), rango(z.v, 'V')].filter(Boolean).join(' · ') || '—'}</Td>
                    <Td>
                      <span className="flex items-center gap-3">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3"><span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></span>
                        <span className="tabular text-[13px] font-semibold">{z.sesiones.size} de {atendidas.length}</span>
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-[13px] text-muted">{formatDate(z.ultima)}</Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
