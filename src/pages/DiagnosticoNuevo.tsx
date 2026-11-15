import MuscleEditor, { type MuscleRecord } from '../components/MuscleEditor'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Check, Copy, Download, Dumbbell, Eraser, Plus, Trash2, X, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData, type NuevoDiagnostico } from '../context/DataContext'
import { Avatar, Badge, Button, Card, EmptyState, Field, IconButton, ImageDrop, Input, PainMeter, PainPicker, SectionLabel, Segmented, Select, Textarea } from '../components/ui'
import { BodyMap, contarNiveles, descargarMapa, ElectrodoPad, Leyenda, ModeloToggle, modeloDeGenero, nivelDeHz, NIVELES, nombreVista, type Marca, type Modelo } from '../components/BodyMap'
import type { NivelFrecuencia } from '../types'
import { cn, edad, formatDate, iniciales, nombreCompleto, todayISO } from '../lib/format'

type DetalleForm = { key: number; Tipo_Diag: boolean; id_TipoLes: number; id_Lesion: number; id_EscalaDolor: number; Descrip_Diag: string; RadioGrafia: string | null }
type MusculoForm = MuscleRecord
type EjerForm = { key: number; id_Ejercicio: number; id_DetalleEjerLes: number | null; Series: string; Repeticiones: string }

const pasos = [
  { t: 'Cita y consultorio', d: 'Persona.Diagnostico' },
  { t: 'Lesiones', d: 'Detalle.DetalleDiag' },
  { t: 'Músculos y tratamiento', d: 'Detalle.DetalleCH' },
  { t: 'Electroterapia', d: 'Detalle.DetalleElectrodo' },
  { t: 'Ejercicios', d: 'Ejercicio.DetalleEjer' },
  { t: 'Revisión', d: 'Confirmar y guardar' },
]

const HZ_TIPICO: Record<NivelFrecuencia, number> = { B: 80, M: 4000, A: 15000 }


let uid = 1
const k = () => uid++

export default function DiagnosticoNuevo() {
  const { user } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [paso, setPaso] = useState(0)

  const elegibles = data.citas.rows
    .filter((c) => c.id_Emp === user!.id_Emp && c.Estatus_Cita && !data.diagDeCita(c.id_Cita) && c.Fecha_Cita <= todayISO())
    .sort((a, b) => (b.Fecha_Cita + b.Hora_Cita).localeCompare(a.Fecha_Cita + a.Hora_Cita))

  // Solo se acepta la cita de la URL si es elegible; si no, el selector mostraría otra cita distinta a la del estado
  const citaUrl = Number(params.get('cita'))
  const [id_Cita, setCita] = useState(elegibles.some((c) => c.id_Cita === citaUrl) ? citaUrl : elegibles[0]?.id_Cita || 0)
  const [id_Consul, setConsul] = useState(data.consultorios.rows[0]?.id_Consul ?? 0)
  const [detalles, setDetalles] = useState<DetalleForm[]>([{ key: k(), Tipo_Diag: true, id_TipoLes: 0, id_Lesion: 0, id_EscalaDolor: 0, Descrip_Diag: '', RadioGrafia: null }])
  const [musculos, setMusculos] = useState<MusculoForm[]>([])
  const [treatmentIds, setTreatmentIds] = useState<number[]>([])
  const [muscleBusy, setMuscleBusy] = useState(false)
  const [ejer, setEjer] = useState<EjerForm[]>([])
  const [electrodos, setElectrodos] = useState<Marca[]>([])
  const [nivelSel, setNivelSel] = useState<NivelFrecuencia>('B')
  const [hz, setHz] = useState('80')
  const [volt, setVolt] = useState('20')
  const [sel, setSel] = useState<number | null>(null)
  const [modeloElegido, setModelo] = useState<Modelo | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)

  const cita = data.getCita(id_Cita)
  const pac = cita && data.getPaciente(cita.id_Pac)
  const diagsPac = pac ? data.diagnosticos.rows.filter((d) => data.getCita(d.id_Cita)?.id_Pac === pac.id_Pac) : []
  const numDiag = diagsPac.length + 1
  const diagPrevio = [...diagsPac].sort((a, b) => b.Num_Diag - a.Num_Diag)[0]
  const electrodosPrevios = diagPrevio ? data.electrodosDeDiag(diagPrevio.id_Diag) : []
  const modelo = modeloElegido ?? modeloDeGenero(pac?.Genero)
  const cuenta = (n: NivelFrecuencia) => electrodos.filter((e) => e.Frecuencia === n).length
  const aNum = (v: string) => (v.trim() === '' || Number.isNaN(Number(v)) ? null : Number(v))
  /** Al elegir un rango se propone un valor típico; si se escribe un valor en Hz, el rango se deduce. */
  const elegirNivel = (n: NivelFrecuencia) => {
    setNivelSel(n)
    const v = aNum(hz)
    if (v == null || nivelDeHz(v) !== n) setHz(String(HZ_TIPICO[n]))
  }
  const escribirHz = (v: string) => {
    setHz(v)
    const n = aNum(v)
    if (n != null) setNivelSel(nivelDeHz(n))
  }
  const updElec = (i: number, patch: Partial<Marca>) => setElectrodos((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const quitarElec = (i: number) => {
    setElectrodos((l) => l.filter((_, j) => j !== i))
    setSel(null)
  }
  const zonasElectro = [...new Set(electrodos.map((e) => e.Zona))]
  const escalas = data.escalaDolor.rows.map((e) => ({ id: e.id_EscalaDolor, valor: Number(e.Valor_Escala) }))

  const lesionesSel = [...new Set(detalles.map((d) => d.id_Lesion).filter(Boolean))]
  const recomendados = useMemo(
    () => data.detalleEjerLes.rows.filter((r) => lesionesSel.includes(r.id_Lesion)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.detalleEjerLes.rows, lesionesSel.join(',')],
  )

  const validos = [
    !!cita && !!id_Consul,
    detalles.length > 0 && detalles.every((d) => d.id_Lesion && d.id_EscalaDolor && d.Descrip_Diag.trim()),
    !muscleBusy && treatmentIds.length > 0 && treatmentIds.every(id => musculos.some(m => m.id_Trata === id)) && musculos.length > 0 && musculos.every((m) => m.Nombre_Musculo.trim() && m.imag_Musculo && m.id_Trata),
    true,
    ejer.every((e) => e.Series.trim() && e.Repeticiones.trim()),
    true,
  ]
  const puedeAvanzar = validos.slice(0, paso + 1).every(Boolean)

  const upd = <T extends { key: number }>(set: React.Dispatch<React.SetStateAction<T[]>>) => (key: number, patch: Partial<T>) => set((l) => l.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const updDet = upd(setDetalles)
  const updEjer = upd(setEjer)

  const agregarEjercicio = (id_Ejercicio: number, id_DetalleEjerLes: number | null) => {
    if (ejer.some((e) => e.id_Ejercicio === id_Ejercicio)) return
    const e = data.getEjercicio(id_Ejercicio)
    setEjer((l) => [...l, { key: k(), id_Ejercicio, id_DetalleEjerLes, Series: '3', Repeticiones: e?.Repeticiones ?? '10' }])
  }

  const guardar = () => {
    if (!validos.every(Boolean)) return
    const n: NuevoDiagnostico = {
      id_Cita,
      id_Consul,
      detalles: detalles.map(({ Tipo_Diag, id_Lesion, RadioGrafia, Descrip_Diag, id_EscalaDolor }) => ({ Tipo_Diag, id_Lesion, RadioGrafia, Descrip_Diag: Descrip_Diag.trim(), id_EscalaDolor })),
      musculos: musculos.map((m) => ({
        Nombre_Musculo: m.Nombre_Musculo.trim(),
        imag_Musculo: m.imag_Musculo!,
        id_Trata: m.id_Trata,
        Descripcion_DiagCH: m.Descripcion_DiagCH.trim(),
        Vista: m.point?.view,
        Pos_X: m.point?.x,
        Pos_Y: m.point?.y,
      })),
      ejercicios: ejer.map(({ id_Ejercicio, id_DetalleEjerLes, Series, Repeticiones }) => ({ id_Ejercicio, id_DetalleEjerLes, Series, Repeticiones })),
      electrodos,
    }
    navigate(`/diagnosticos/${data.crearDiagnostico(n)}`, { replace: true })
  }

  return (
    <>
      <Link to="/diagnosticos" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-fg"><ArrowLeft className="size-4" />Diagnósticos</Link>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em]">Nuevo diagnóstico</h1>
          <p className="mt-1.5 text-sm text-muted">{pac ? <>Diagnóstico <b className="text-fg">#{numDiag}</b> de {nombreCompleto(pac)}</> : 'Selecciona la cita a diagnosticar'}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Pasos */}
        <ol aria-label="Pasos del diagnóstico" className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-2 md:grid-cols-3 xl:grid-cols-6">
          {pasos.map((s, i) => {
            const hecho = i < paso
            const actual = i === paso
            const accesible = validos.slice(0, i).every(Boolean)
            return (
              <li key={s.t} className="shrink-0">
                <button
                  disabled={!accesible || muscleBusy}
                  aria-current={actual ? 'step' : undefined}
                  onClick={() => setPaso(i)}
                  className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-40', actual ? 'bg-surface ring-1 ring-line' : 'hover:bg-surface-2')}
                >
                  <span className={cn('tabular flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', hecho ? 'bg-accent text-accent-fg' : actual ? 'bg-carbon text-carbon-fg dark:bg-fg dark:text-bg' : 'bg-surface-3 text-muted')}>
                    {hecho ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[13px] font-semibold', !actual && 'text-muted')}>{s.t}</span>
                    
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="min-w-0">
          {/* Paso 1 */}
          {paso === 0 && (
            <div className="flex flex-col gap-6">
              <Card className="p-6">
                <SectionLabel className="mb-4">Cita</SectionLabel>
                {elegibles.length === 0 && !cita ? (
                  <EmptyState icon={<Check />} title="No hay citas por diagnosticar" text="Todas tus citas vigentes ya tienen diagnóstico." />
                ) : (
                  <>
                    <Select value={id_Cita} onChange={(e) => setCita(Number(e.target.value))}>
                      {cita && !elegibles.includes(cita) && <option value={cita.id_Cita}>{cita.Folio}</option>}
                      {elegibles.map((c) => <option key={c.id_Cita} value={c.id_Cita}>{c.Folio} · {formatDate(c.Fecha_Cita)} {c.Hora_Cita} · {nombreCompleto(data.getPaciente(c.id_Pac))}</option>)}
                    </Select>
                    {pac && cita && (
                      <div className="mt-5 flex items-center gap-4 rounded-xl bg-surface-2 p-4">
                        <Avatar text={iniciales(pac)} size="lg" tone="accent" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{nombreCompleto(pac)}</p>
                          <p className="text-[13px] text-muted">{edad(pac.Fecha_Nacimiento)} años · {pac.Genero === 'F' ? 'Femenino' : 'Masculino'} · {numDiag - 1} diagnósticos previos</p>
                        </div>
                        <div className="hidden text-right sm:block">
                          <p className="text-xs text-subtle">Motivo</p>
                          <p className="max-w-[240px] text-[13px] font-semibold">{cita.Motivo_Cita ?? '—'}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
              <Card className="p-6">
                <SectionLabel className="mb-4">Consultorio</SectionLabel>
                <div className="grid gap-3 sm:grid-cols-3">
                  {data.consultorios.rows.map((c) => (
                    <button
                      key={c.id_Consul}
                      onClick={() => setConsul(c.id_Consul)}
                      className={cn('relative rounded-xl border p-4 text-left transition-colors', id_Consul === c.id_Consul ? 'border-accent bg-accent-soft' : 'border-line hover:border-line-strong')}
                    >
                      <p className="pr-6 text-[13px] font-bold">{c.Nombre_Consul}</p>
                      <p className="mt-1 text-xs text-muted">{c.Direccion}</p>
                      {id_Consul === c.id_Consul && <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-accent text-accent-fg"><Check className="size-3" strokeWidth={3} /></span>}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Paso 2 */}
          {paso === 1 && (
            <div className="flex flex-col gap-4">
              {detalles.map((d, i) => {
                const opciones = data.lesiones.rows.filter((l) => !d.id_TipoLes || l.id_TipoLes === d.id_TipoLes)
                const les = data.getLesion(d.id_Lesion)
                return (
                  <Card key={d.key} className="p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="tabular flex size-7 items-center justify-center rounded-full bg-surface-3 text-xs font-bold">{i + 1}</span>
                        <Segmented value={d.Tipo_Diag ? 1 : 0} onChange={(v) => updDet(d.key, { Tipo_Diag: v === 1 })} options={[{ value: 1, label: 'Principal' }, { value: 0, label: 'Secundario' }]} />
                      </div>
                      {detalles.length > 1 && <Button size="sm" variant="ghost" onClick={() => setDetalles((l) => l.filter((x) => x.key !== d.key))}><Trash2 />Quitar</Button>}
                    </div>
                    <div className="grid gap-6 md:grid-cols-[1fr_240px]">
                      <div className="flex flex-col gap-4">
                        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                          <Field label="Tipo de lesión">
                            <Select value={d.id_TipoLes} onChange={(e) => updDet(d.key, { id_TipoLes: Number(e.target.value), id_Lesion: 0 })}>
                              <option value={0}>Todos</option>
                              {data.tiposLesion.rows.map((t) => <option key={t.id_TipoLes} value={t.id_TipoLes}>{t.Nom_TipoLes}</option>)}
                            </Select>
                          </Field>
                          <Field label="Lesión" required hint={les?.Descrip_Les ?? undefined}>
                            <Select value={d.id_Lesion} onChange={(e) => updDet(d.key, { id_Lesion: Number(e.target.value) })}>
                              <option value={0} disabled>Selecciona una lesión</option>
                              {opciones.map((l) => <option key={l.id_Lesion} value={l.id_Lesion}>{l.Nom_Les}{l.Grado ? ` — Grado ${l.Grado}` : ''}</option>)}
                            </Select>
                          </Field>
                        </div>
                        <Field label="Escala de dolor" required>
                          <PainPicker options={escalas} value={d.id_EscalaDolor} onChange={(id) => updDet(d.key, { id_EscalaDolor: id })} />
                          <span className="flex justify-between text-[11px] text-subtle"><span>Sin dolor</span><span>Dolor máximo</span></span>
                        </Field>
                        <Field label="Descripción del diagnóstico" required>
                          <Textarea value={d.Descrip_Diag} onChange={(e) => updDet(d.key, { Descrip_Diag: e.target.value })} placeholder="Hallazgos de la exploración, pruebas positivas, rango de movimiento…" className="min-h-[110px]" />
                        </Field>
                      </div>
                      <Field label="Radiografía" hint="Opcional">
                        <ImageDrop value={d.RadioGrafia} onChange={(v) => updDet(d.key, { RadioGrafia: v })} label="Subir radiografía" aspect="aspect-[3/4]" />
                      </Field>
                    </div>
                  </Card>
                )
              })}
              <button
                onClick={() => setDetalles((l) => [...l, { key: k(), Tipo_Diag: false, id_TipoLes: 0, id_Lesion: 0, id_EscalaDolor: 0, Descrip_Diag: '', RadioGrafia: null }])}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong text-[13px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <Plus className="size-4" />Agregar otra lesión
              </button>
            </div>
          )}

          {/* Paso 3 */}
          {paso === 2 && <MuscleEditor value={musculos} onChange={setMusculos} modelo={modelo} onModelo={setModelo} newKey={k} treatmentIds={treatmentIds} onTreatments={setTreatmentIds} onBusy={setMuscleBusy} />}

          {/* Paso 4 */}
          {paso === 3 && (
            <div className="flex flex-col gap-4">
              <Card>
                <div className="flex flex-col gap-4 border-b border-line p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[15px] font-bold">Colocación de electrodos</p>
                    <p className="text-[13px] text-muted">Define la frecuencia y el voltaje, y haz clic sobre el cuerpo para colocar el electrodo. Haz clic en un electrodo para editarlo.</p>
                  </div>
                  <ModeloToggle value={modelo} onChange={setModelo} className="shrink-0" />
                </div>

                {/* Parámetros del siguiente electrodo */}
                <div className="grid gap-4 border-b border-line bg-surface-2 p-5 xl:grid-cols-[1fr_auto]">
                  <div>
                    <p className="mb-2 text-[12px] font-bold uppercase tracking-wider text-subtle">Frecuencia</p>
                    <div className="grid grid-cols-3 gap-2">
                      {NIVELES.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => elegirNivel(n.id)}
                          className={cn('flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 text-left transition-colors', nivelSel === n.id ? 'border-fg ring-1 ring-fg' : 'border-line hover:border-line-strong')}
                        >
                          <ElectrodoPad nivel={n.id} numero={cuenta(n.id)} />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-bold">{n.label}</span>
                            <span className="block truncate text-[11.5px] text-muted">{n.rango}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 xl:w-[300px]">
                    <Field label="Frecuencia (Hz)">
                      <Input type="number" min={0} step="any" inputMode="decimal" value={hz} onChange={(e) => escribirHz(e.target.value)} placeholder="Ej. 80" />
                    </Field>
                    <Field label="Voltaje (V)">
                      <Input type="number" min={0} step="any" inputMode="decimal" value={volt} onChange={(e) => setVolt(e.target.value)} placeholder="Ej. 20" />
                    </Field>
                  </div>
                </div>

                <div ref={mapRef} className="p-5">
                  <BodyMap
                    marcas={electrodos}
                    modelo={modelo}
                    seleccion={sel}
                    onSelect={setSel}
                    onMove={updElec}
                    onDelete={quitarElec}
                    ajustes={{ frecuencia: nivelSel, hz, voltaje: volt, onFrecuencia: elegirNivel, onHz: escribirHz, onVoltaje: setVolt }}
                    onAdd={(m) => {
                      setElectrodos((l) => [...l, { ...m, Frecuencia: nivelSel, Hz: aNum(hz), Voltaje: aNum(volt) }])
                      setSel(electrodos.length)
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
                  <Leyenda conteo={contarNiveles(electrodos)} />
                  <div className="flex flex-wrap gap-2">
                    {electrodosPrevios.length > 0 && (
                      <Button size="sm" variant="secondary" onClick={() => { setElectrodos(electrodosPrevios.map(({ Vista, Zona, Pos_X, Pos_Y, Frecuencia, Hz, Voltaje }) => ({ Vista, Zona, Pos_X, Pos_Y, Frecuencia, Hz, Voltaje }))); setSel(null) }}>
                        <Copy />Repetir sesión anterior
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={!electrodos.length} onClick={() => { setElectrodos([]); setSel(null) }}><Eraser />Limpiar</Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!electrodos.length || !pac}
                      onClick={() => pac && cita && descargarMapa(mapRef.current, { titulo: nombreCompleto(pac), subtitulo: `Diagnóstico #${numDiag} · ${formatDate(cita.Fecha_Cita, { day: 'numeric', month: 'long', year: 'numeric' })}`, archivo: `electrodos-${pac.id_Pac}-diag-${numDiag}.png`, marcas: electrodos })}
                    >
                      <Download />Descargar imagen
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="border-b border-line px-5 py-4">
                  <p className="text-[15px] font-bold">Electrodos colocados</p>
                  <p className="text-[13px] text-muted">{electrodos.length ? `${electrodos.length} electrodos en ${zonasElectro.length} zonas · puedes corregir la zona, la frecuencia y el voltaje de cada uno` : 'Este paso es opcional.'}</p>
                </div>
                {electrodos.length === 0 ? (
                  <EmptyState icon={<Zap />} title="Sin electroterapia" text={electrodosPrevios.length ? `La sesión anterior usó ${electrodosPrevios.length} electrodos; puedes repetir esa colocación.` : 'Si la sesión no incluye electroterapia, continúa al siguiente paso.'} />
                ) : (
                  <ul>
                    {electrodos.map((e, i) => (
                      <li
                        key={i}
                        onClick={() => setSel(i)}
                        className={cn('grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 border-b border-line px-5 py-3 last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_auto_96px_84px_auto]', sel === i && 'bg-accent-soft/40')}
                      >
                        <ElectrodoPad nivel={e.Frecuencia} numero={i + 1} />
                        <div className="min-w-0">
                          <Input aria-label={`Zona del electrodo ${i + 1}`} maxLength={40} value={e.Zona} onChange={(ev) => updElec(i, { Zona: ev.target.value })} className="h-9" />
                          <p className="mt-1 truncate text-[11.5px] text-subtle">{nombreVista(e.Vista)}</p>
                        </div>
                        <IconButton label="Quitar electrodo" className="size-8 md:order-last" onClick={(ev) => { ev.stopPropagation(); quitarElec(i) }}><X /></IconButton>
                        <div className="col-span-3 flex gap-1 md:col-span-1" role="radiogroup" aria-label="Frecuencia">
                          {NIVELES.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              role="radio"
                              aria-checked={e.Frecuencia === n.id}
                              onClick={() => updElec(i, { Frecuencia: n.id })}
                              className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition-colors', e.Frecuencia === n.id ? 'border-fg text-fg' : 'border-line text-muted hover:text-fg')}
                            >
                              <ElectrodoPad nivel={n.id} />{n.label}
                            </button>
                          ))}
                        </div>
                        <label className="relative col-span-1 md:col-span-1">
                          <Input type="number" min={0} step="any" aria-label={`Frecuencia del electrodo ${i + 1} en Hz`} value={e.Hz ?? ''} onChange={(ev) => { const v = aNum(ev.target.value); updElec(i, v == null ? { Hz: null } : { Hz: v, Frecuencia: nivelDeHz(v) }) }} placeholder="—" className="h-9 pr-9" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] font-semibold text-subtle">Hz</span>
                        </label>
                        <label className="relative col-span-2 md:col-span-1">
                          <Input type="number" min={0} step="any" aria-label={`Voltaje del electrodo ${i + 1}`} value={e.Voltaje ?? ''} onChange={(ev) => updElec(i, { Voltaje: aNum(ev.target.value) })} placeholder="—" className="h-9 pr-7" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] font-semibold text-subtle">V</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {/* Paso 5 */}
          {paso === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <SectionLabel className="mb-3">Recomendados para las lesiones diagnosticadas</SectionLabel>
                {recomendados.length === 0 ? (
                  <Card className="p-5 text-[13px] text-muted">No hay ejercicios vinculados a estas lesiones. Puedes relacionarlos en el módulo Ejercicios.</Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {recomendados.map((r) => {
                      const e = data.getEjercicio(r.id_Ejercicio)
                      const agregado = ejer.some((x) => x.id_Ejercicio === r.id_Ejercicio)
                      return (
                        <Card key={r.id_DetalleEjerLes} className={cn('flex overflow-hidden transition-colors', agregado && 'border-accent')}>
                          <div className="w-24 shrink-0 bg-surface-3">
                            {e?.Imagen_Ejercicio ? <img src={e.Imagen_Ejercicio} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-subtle"><Dumbbell className="size-5" /></div>}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col p-3.5">
                            <p className="truncate text-[13px] font-bold">{e?.Nombre_Ejercicio}</p>
                            <p className="truncate text-xs text-muted">Para: {data.getLesion(r.id_Lesion)?.Nom_Les}</p>
                            <Button size="sm" variant={agregado ? 'ghost' : 'secondary'} className="mt-2.5 w-fit" disabled={agregado} onClick={() => agregarEjercicio(r.id_Ejercicio, r.id_DetalleEjerLes)}>
                              {agregado ? <><Check />Agregado</> : <><Plus />Agregar</>}
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              <Card>
                <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[15px] font-bold">Plan de ejercicios</p>
                    <p className="text-[13px] text-muted">{ejer.length} ejercicios prescritos</p>
                  </div>
                  <Select value={0} onChange={(e) => agregarEjercicio(Number(e.target.value), null)} className="h-9 text-[13px] sm:w-64">
                    <option value={0} disabled>Agregar desde el catálogo…</option>
                    {data.ejercicios.rows.filter((e) => !ejer.some((x) => x.id_Ejercicio === e.id_Ejercicio)).map((e) => <option key={e.id_Ejercicio} value={e.id_Ejercicio}>{e.Nombre_Ejercicio}</option>)}
                  </Select>
                </div>
                {ejer.length === 0 ? (
                  <EmptyState icon={<Dumbbell />} title="Sin ejercicios" text="Agrega ejercicios recomendados o elige del catálogo. Este paso es opcional." />
                ) : (
                  <ul>
                    {ejer.map((x) => {
                      const e = data.getEjercicio(x.id_Ejercicio)
                      return (
                        <li key={x.key} className="flex flex-wrap items-center gap-4 border-b border-line px-5 py-3.5 last:border-0">
                          <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                            {e?.Imagen_Ejercicio ? <img src={e.Imagen_Ejercicio} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-subtle"><Dumbbell className="size-4" /></div>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{e?.Nombre_Ejercicio}</p>
                            <p className="truncate text-xs text-muted">{x.id_DetalleEjerLes ? 'Recomendado por lesión' : 'Del catálogo'}</p>
                          </div>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted">Series<span className="w-16"><Input maxLength={30} value={x.Series} onChange={(ev) => updEjer(x.key, { Series: ev.target.value })} className="h-9 text-center" /></span></label>
                          <label className="flex items-center gap-2 text-xs font-medium text-muted">Repeticiones<span className="w-20"><Input maxLength={30} value={x.Repeticiones} onChange={(ev) => updEjer(x.key, { Repeticiones: ev.target.value })} className="h-9 text-center" /></span></label>
                          <button onClick={() => setEjer((l) => l.filter((y) => y.key !== x.key))} className="flex size-8 items-center justify-center rounded-md text-subtle hover:bg-danger-soft hover:text-danger" aria-label="Quitar"><Trash2 className="size-4" /></button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {/* Paso 6 */}
          {paso === 5 && pac && cita && (
            <Card className="divide-y divide-line">
              <div className="flex items-center gap-4 p-6">
                <Avatar text={iniciales(pac)} size="lg" tone="accent" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-accent">Diagnóstico #{numDiag}</p>
                  <p className="text-lg font-bold">{nombreCompleto(pac)}</p>
                  <p className="text-[13px] text-muted">{cita.Folio} · {formatDate(cita.Fecha_Cita)} {cita.Hora_Cita} · {data.getConsultorio(id_Consul)?.Nombre_Consul}</p>
                </div>
              </div>
              <div className="p-6">
                <SectionLabel className="mb-3">Lesiones · {detalles.length}</SectionLabel>
                <ul className="flex flex-col gap-3">
                  {detalles.map((d) => (
                    <li key={d.key} className="flex items-start gap-4">
                      {d.RadioGrafia ? <img src={d.RadioGrafia} alt="" className="size-14 shrink-0 rounded-lg object-cover" /> : <div className="size-14 shrink-0 rounded-lg border border-dashed border-line-strong" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{data.getLesion(d.id_Lesion)?.Nom_Les}</p>
                          <Badge tone={d.Tipo_Diag ? 'accent' : 'neutral'}>{d.Tipo_Diag ? 'Principal' : 'Secundario'}</Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{d.Descrip_Diag}</p>
                      </div>
                      <PainMeter value={Number(data.getEscala(d.id_EscalaDolor)?.Valor_Escala ?? 0)} compact />
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6">
                <SectionLabel className="mb-3">Músculos y tratamiento · {musculos.length}</SectionLabel>
                {musculos.length === 0 ? <p className="text-[13px] text-subtle">Ninguno</p> : (
                  <div className="flex flex-wrap gap-3">
                    {musculos.map((m) => (
                      <div key={m.key} className="flex items-center gap-3 rounded-xl border border-line p-2 pr-4">
                        <img src={m.imag_Musculo!} alt="" className="size-10 rounded-lg object-cover" />
                        <div><p className="text-[13px] font-semibold">{m.Nombre_Musculo}</p><p className="text-xs text-accent">{data.getTratamiento(m.id_Trata)?.Nombre_Trata}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6">
                <SectionLabel className="mb-3">Electroterapia · {electrodos.length}</SectionLabel>
                {electrodos.length === 0 ? <p className="text-[13px] text-subtle">Ninguna</p> : (
                  <div className="flex flex-col gap-3">
                    <Leyenda conteo={contarNiveles(electrodos)} />
                    <div className="flex flex-wrap gap-2">
                      {zonasElectro.map((z) => <Badge key={z} tone="outline" className="h-7">{z} · {electrodos.filter((e) => e.Zona === z).length}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <SectionLabel className="mb-3">Ejercicios · {ejer.length}</SectionLabel>
                {ejer.length === 0 ? <p className="text-[13px] text-subtle">Ninguno</p> : (
                  <div className="flex flex-wrap gap-2">
                    {ejer.map((x) => <Badge key={x.key} tone="outline" className="h-7">{data.getEjercicio(x.id_Ejercicio)?.Nombre_Ejercicio} · {x.Series}×{x.Repeticiones}</Badge>)}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Navegación */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="secondary" disabled={paso === 0 || muscleBusy} onClick={() => setPaso(paso - 1)}><ArrowLeft />Anterior</Button>
            <div className="flex items-center gap-3">
              {!validos[paso] && <span className="hidden text-xs text-subtle sm:inline">Completa los campos obligatorios</span>}
              {paso < pasos.length - 1 ? (
                <Button disabled={!puedeAvanzar} onClick={() => setPaso(paso + 1)}>Siguiente<ArrowRight /></Button>
              ) : (
                <Button disabled={!validos.every(Boolean)} onClick={guardar}><Check />Guardar diagnóstico</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
