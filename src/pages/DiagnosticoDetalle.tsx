import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Download, Expand, Printer, ScanLine } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Avatar, Badge, Button, Card, Modal, PainMeter, SectionLabel } from '../components/ui'
import {
  ASPECTO,
  BodyMap,
  contarNiveles,
  descargarMapa,
  ElectrodoPad,
  estiloLamina,
  IMAGENES,
  Leyenda,
  ModeloToggle,
  modeloDeGenero,
  nombreNivel,
  nombreVista,
  parametros,
  VISTAS,
  type Modelo,
} from '../components/BodyMap'
import { edad, formatDate, iniciales, nombreCompleto } from '../lib/format'
import NotFound from './NotFound'
import HistoriaClinica from '../components/HistoriaClinica'
import type { Vista } from '../types'

const COLORES_TRATAMIENTO = ['#b15d42', '#2563a6', '#6d55a3', '#21816f', '#b47a16', '#a14371', '#617b32', '#566477']
const colorTratamiento = (id: number) => COLORES_TRATAMIENTO[(Math.max(1, id) - 1) % COLORES_TRATAMIENTO.length]

export default function DiagnosticoDetalle() {
  const { id } = useParams()
  const data = useData()
  const [historia, setHistoria] = useState(false)
  const [zoom, setZoom] = useState<{ src: string; title: string } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [modeloElegido, setModelo] = useState<Modelo | null>(null)
  const d = data.diagnosticos.rows.find((x) => x.id_Diag === Number(id))
  if (!d) return <NotFound />

  const c = data.getCita(d.id_Cita)!
  const p = data.getPaciente(c.id_Pac)!
  const emp = data.getEmpleado(c.id_Emp)
  const consul = data.getConsultorio(d.id_Consul)
  const detalles = data.detalleDiag.rows.filter((x) => x.id_Diag === d.id_Diag).sort((a, b) => Number(b.Tipo_Diag) - Number(a.Tipo_Diag))
  const musculos = data.detalleCH.rows.filter((x) => x.id_Diag === d.id_Diag)
  const ejercicios = data.detalleEjer.rows.filter((x) => x.id_Diag === d.id_Diag)
  const electrodos = data.electrodosDeDiag(d.id_Diag)
  const zonas = [...new Set(electrodos.map((e) => e.Zona))]
  const modelo = modeloElegido ?? modeloDeGenero(p?.Genero)

  // Vistas activas para la sección de músculos / tratamiento:
  // Solo se cargan y renderizan las vistas que realmente tienen puntos aplicados (o F por defecto si ninguno tiene coordenadas)
  const vistasConPuntos = Array.from(
    new Set(
      musculos
        .map((m) => m.Vista)
        .filter((v): v is Vista => Boolean(v && ['F', 'P', 'I', 'D'].includes(v)))
    )
  )
  const vistasMostrar: Vista[] = vistasConPuntos.length > 0 ? vistasConPuntos : ['F']

  return (
    <>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link to="/diagnosticos" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-fg">
          <ArrowLeft className="size-4" />Diagnósticos
        </Link>
        <Button variant="secondary" onClick={() => setHistoria(true)}>
          <Printer />Historial clínico / Imprimir
        </Button>
      </div>

      {/* Encabezado del reporte */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-7 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-5">
            <Avatar text={iniciales(p)} size="xl" tone="accent" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Diagnóstico #{d.Num_Diag}</p>
              <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em]">
                <Link to={`/pacientes/${p.id_Pac}`} className="hover:text-accent">{nombreCompleto(p)}</Link>
              </h1>
              <p className="mt-1 text-sm text-muted">{edad(p.Fecha_Nacimiento)} años · {p.Genero === 'F' ? 'Femenino' : 'Masculino'}</p>
            </div>
          </div>
          <div className="tabular rounded-xl bg-surface-3 px-4 py-3 text-right">
            <p className="text-xs text-subtle">Cita</p>
            <p className="text-sm font-bold">{c.Folio}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 border-t border-line md:grid-cols-4 [&>div]:border-line [&>div]:px-7 [&>div]:py-4 md:[&>div:not(:first-child)]:border-l">
          <div><dt className="text-xs text-subtle">Fecha</dt><dd className="mt-1 text-sm font-semibold">{formatDate(c.Fecha_Cita, { day: 'numeric', month: 'long', year: 'numeric' })} · {c.Hora_Cita}</dd></div>
          <div><dt className="text-xs text-subtle">Fisioterapeuta</dt><dd className="mt-1 text-sm font-semibold">{nombreCompleto(emp)}</dd></div>
          <div><dt className="text-xs text-subtle">Consultorio</dt><dd className="mt-1 text-sm font-semibold">{consul?.Nombre_Consul}</dd></div>
          <div><dt className="text-xs text-subtle">Motivo de la cita</dt><dd className="mt-1 text-sm font-semibold">{c.Motivo_Cita ?? '—'}</dd></div>
        </dl>
      </Card>

      {/* Lesiones */}
      <SectionLabel className="mb-3 mt-10">Lesiones diagnosticadas · {detalles.length}</SectionLabel>
      <div className="flex flex-col gap-4">
        {detalles.map((x) => {
          const les = data.getLesion(x.id_Lesion)
          const tipo = data.getTipoLesion(les?.id_TipoLes ?? 0)
          return (
            <Card key={x.id_DetalleDiag} className="grid overflow-hidden md:grid-cols-[1fr_280px]">
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={x.Tipo_Diag ? 'accent' : 'neutral'}>{x.Tipo_Diag ? 'Principal' : 'Secundario'}</Badge>
                  <Badge tone="outline">{tipo?.Nom_TipoLes}</Badge>
                  {les?.Grado && <Badge tone="outline">Grado {les.Grado}</Badge>}
                </div>
                <h3 className="mt-3 text-lg font-bold">{les?.Nom_Les}</h3>
                {les?.Descrip_Les && <p className="mt-1 text-[13px] text-subtle">{les.Descrip_Les}</p>}
                <p className="mt-4 text-sm leading-relaxed">{x.Descrip_Diag}</p>
                <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <span className="text-xs font-medium text-subtle">Escala de dolor</span>
                  <PainMeter value={Number(data.getEscala(x.id_EscalaDolor)?.Valor_Escala ?? 0)} />
                </div>
              </div>
              <div className="border-t border-line bg-surface-2 p-4 md:border-l md:border-t-0">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-subtle"><ScanLine className="size-3.5" />Radiografía</p>
                {x.RadioGrafia ? (
                  <button onClick={() => setZoom({ src: x.RadioGrafia!, title: `Radiografía — ${les?.Nom_Les}` })} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
                    <img src={x.RadioGrafia} alt={`Radiografía de ${les?.Nom_Les}`} className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                    <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-md bg-white/90 text-neutral-900"><Expand className="size-3.5" /></span>
                  </button>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-line-strong text-xs text-subtle">Sin radiografía</div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Músculos y Tratamiento Compacto con mapa unificado */}
      <SectionLabel className="mb-3 mt-10">Músculos afectados y tratamiento · {musculos.length}</SectionLabel>
      {musculos.length === 0 ? (
        <Card className="p-6 text-sm text-muted">No se registraron músculos o tratamientos.</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="no-print flex items-center justify-between border-b border-line px-5 py-3">
            <div>
              <p className="text-xs font-semibold text-muted">
                {vistasConPuntos.length === 1
                  ? `Mostrando únicamente vista con aplicación (${nombreVista(vistasMostrar[0])})`
                  : `Vistas con aplicación: ${vistasMostrar.map(nombreVista).join(', ')}`}
              </p>
            </div>
            <ModeloToggle value={modelo} onChange={setModelo} />
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
            {/* Mapa corporal compacto: solo las vistas con aplicación */}
            <div className="flex flex-wrap items-center justify-center gap-4 bg-surface-2 p-4 rounded-xl">
              {vistasMostrar.map((v) => {
                const src = IMAGENES[modelo][v]
                const puntosVista = musculos
                  .map((m, idx) => ({ m, idx: idx + 1 }))
                  .filter(({ m }) => (m.Vista ?? 'F') === v)

                return (
                  <div key={v} className="flex flex-col items-center">
                    <span className="mb-1.5 text-xs font-bold text-muted">{nombreVista(v)}</span>
                    <div
                      className="relative select-none overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-line"
                      style={{ width: 170, height: 170 / ASPECTO }}
                    >
                      <div aria-hidden className="pointer-events-none absolute inset-0" style={estiloLamina(src)} />
                      {puntosVista.map(({ m, idx }) => {
                        const idTrata = data.getDetalleTrata(m.id_DetalleTrata)?.id_Trata ?? 1
                        const color = colorTratamiento(idTrata)
                        const posX = m.Pos_X ?? 50
                        const posY = m.Pos_Y ?? 50
                        return (
                          <div
                            key={m.id_DetalleCH}
                            title={`${idx}. ${m.Nombre_Musculo}`}
                            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
                            style={{
                              left: `${posX}%`,
                              top: `${posY}%`,
                              backgroundColor: color,
                            }}
                          >
                            <span className="flex size-5 items-center justify-center text-[10px] font-bold text-white">
                              {idx}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Lista compacta de puntos con qué se aplicó y en qué zona */}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h4 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-subtle">
                Detalle por punto de aplicación
              </h4>
              <ul className="divide-y divide-line rounded-xl border border-line bg-surface overflow-hidden">
                {musculos.map((m, idx) => {
                  const t = data.getTratamiento(data.getDetalleTrata(m.id_DetalleTrata)?.id_Trata ?? 0)
                  const idTrata = data.getDetalleTrata(m.id_DetalleTrata)?.id_Trata ?? 1
                  const color = colorTratamiento(idTrata)

                  return (
                    <li key={m.id_DetalleCH} className="flex items-start gap-3 p-3.5 hover:bg-surface-2 transition-colors">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-[13.5px] leading-tight text-fg">{m.Nombre_Musculo}</p>
                          <Badge tone="neutral" className="h-5 text-[11px]">
                            {nombreVista(m.Vista ?? 'F')}
                          </Badge>
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-white shadow-xs"
                            style={{ backgroundColor: color }}
                          >
                            {t?.Nombre_Trata}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted leading-relaxed">
                          {m.Descripcion_DiagCH}
                        </p>
                      </div>
                      {m.imag_Musculo && (
                        <button
                          onClick={() => setZoom({ src: m.imag_Musculo, title: `${idx + 1}. ${m.Nombre_Musculo} — ${t?.Nombre_Trata}` })}
                          className="shrink-0 size-11 overflow-hidden rounded-md border border-line bg-surface-3 transition-opacity hover:opacity-80"
                          title="Ver imagen generada"
                        >
                          <img src={m.imag_Musculo} alt={m.Nombre_Musculo} className="size-full object-cover" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Electroterapia */}
      <SectionLabel className="mb-3 mt-10">Electroterapia · {electrodos.length} electrodos</SectionLabel>
      {electrodos.length === 0 ? (
        <Card className="p-6 text-sm text-muted">No se registró electroterapia en esta sesión.</Card>
      ) : (
        <Card>
          <div className="no-print flex justify-end border-b border-line px-5 py-3">
            <ModeloToggle value={modelo} onChange={setModelo} />
          </div>
          <div ref={mapRef} className="p-5">
            <BodyMap marcas={electrodos} modelo={modelo} />
          </div>
          <ul className="grid border-t border-line sm:grid-cols-2">
            {electrodos.map((e, i) => (
              <li key={e.id_DetalleElectrodo} className="flex items-center gap-3 border-b border-line px-5 py-2.5 sm:odd:border-r">
                <ElectrodoPad nivel={e.Frecuencia} numero={i + 1} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{e.Zona}</p>
                  <p className="truncate text-xs text-muted">{nombreVista(e.Vista)} · {nombreNivel(e.Frecuencia)}</p>
                </div>
                <span className="tabular shrink-0 text-[13px] font-semibold">{parametros(e) || <span className="text-subtle">Sin parámetros</span>}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2.5">
              <Leyenda conteo={contarNiveles(electrodos)} />
              <div className="flex flex-wrap gap-1.5">
                {zonas.map((z) => <Badge key={z} tone="outline">{z} · {electrodos.filter((e) => e.Zona === z).length}</Badge>)}
              </div>
            </div>
            <Button
              variant="secondary"
              className="no-print"
              onClick={() => descargarMapa(mapRef.current, { titulo: nombreCompleto(p), subtitulo: `Diagnóstico #${d.Num_Diag} · ${formatDate(c.Fecha_Cita, { day: 'numeric', month: 'long', year: 'numeric' })} · ${nombreCompleto(emp)}`, archivo: `electrodos-${p.id_Pac}-diag-${d.Num_Diag}.png`, marcas: electrodos })}
            >
              <Download />Descargar imagen
            </Button>
          </div>
        </Card>
      )}

      {/* Ejercicios */}
      <SectionLabel className="mb-3 mt-10">Plan de ejercicios · {ejercicios.length}</SectionLabel>
      {ejercicios.length === 0 ? (
        <Card className="p-6 text-sm text-muted">No se prescribieron ejercicios.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ejercicios.map((x, i) => {
            const e = data.getEjercicio(x.id_Ejercicio)
            const rel = data.detalleEjerLes.rows.find((r) => r.id_DetalleEjerLes === x.id_DetalleEjerLes)
            return (
              <Card key={x.id_DetalleEjer} className="overflow-hidden">
                <div className="relative aspect-[16/10] bg-surface-3">
                  {e?.Imagen_Ejercicio ? <img src={e.Imagen_Ejercicio} alt={e.Nombre_Ejercicio} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-xs text-subtle">Sin imagen</div>}
                  <span className="tabular absolute left-3 top-3 flex size-7 items-center justify-center rounded-full bg-surface text-xs font-bold">{i + 1}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold">{e?.Nombre_Ejercicio}</h3>
                  <p className="mt-1 text-[13px] text-muted">{e?.Ejercicio}</p>
                  <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                    <div>
                      <p className="text-xs text-subtle">Dosificación</p>
                      <p className="tabular text-lg font-bold">{x.Series} × {x.Repeticiones}</p>
                    </div>
                    {rel && <Badge tone="accent">{data.getLesion(rel.id_Lesion)?.Nom_Les}</Badge>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {historia && <HistoriaClinica pacienteId={p.id_Pac} diagnosticoId={d.id_Diag} onClose={() => setHistoria(false)} />}
      <Modal open={!!zoom} onClose={() => setZoom(null)} title={zoom?.title ?? ''} size="lg">
        {zoom && <img src={zoom.src} alt={zoom.title} className="w-full rounded-lg" />}
      </Modal>
    </>
  )
}
