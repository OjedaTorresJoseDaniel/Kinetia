import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'
import { useData } from '../context/DataContext'
import { nombreCompleto, formatDate, formatTel } from '../lib/format'
import { nombreVista, nombreNivel, parametros } from './BodyMap'
import { Button } from './ui'
import './HistoriaClinica.css'
import BusinessBrand from './BusinessBrand'
import { useBusiness } from '../context/BusinessContext'

function Bloque({ title, children }: { title: string; children: ReactNode }) {
  return <section className="hc-section"><h3>{title}</h3>{children}</section>
}
function Campo({ label, value }: { label: string; value?: ReactNode }) {
  return <div className="hc-field"><b>{label}</b><span>{value || 'Sin registrar'}</span></div>
}

export default function HistoriaClinica({ pacienteId, diagnosticoId, onClose }: { pacienteId: number; diagnosticoId?: number; onClose: () => void }) {
  const data = useData()
  const { business } = useBusiness()
  const citas = data.citas.rows.filter(c => c.id_Pac === pacienteId)
  const sesiones = data.diagnosticos.rows.filter(d => citas.some(c => c.id_Cita === d.id_Cita)).sort((a,b) => {
    const ca = data.getCita(a.id_Cita)!, cb = data.getCita(b.id_Cita)!
    return (cb.Fecha_Cita + cb.Hora_Cita).localeCompare(ca.Fecha_Cita + ca.Hora_Cita)
  })
  const [selected, setSelected] = useState(diagnosticoId ?? sesiones[0]?.id_Diag ?? 0)
  const [scale, setScale] = useState(1)
  const [vista, setVista] = useState<'historia' | 'ejercicios'>('historia')
  const [imprimiendo, setImprimiendo] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    document.body.classList.add('hc-print-active')
    return () => { document.body.classList.remove('hc-print-active'); previous?.focus() }
  }, [])
  useLayoutEffect(() => {
    const measure = () => {
      if (content.current && area.current) setScale(Math.min(1, area.current.clientHeight / content.current.scrollHeight))
    }
    const observer = new ResizeObserver(measure)
    if (content.current) observer.observe(content.current)
    measure()
    return () => observer.disconnect()
  }, [selected, vista, business])
  const p = data.getPaciente(pacienteId)
  if (!p) return null
  const d = sesiones.find(d => d.id_Diag === selected)
  const c = d ? data.getCita(d.id_Cita) : undefined
  const emp = c ? data.getEmpleado(c.id_Emp) : undefined
  const consultorio = d ? data.getConsultorio(d.id_Consul) : undefined
  const lesiones = data.detalleDiag.rows.filter(x => x.id_Diag === d?.id_Diag).sort((a,b) => Number(b.Tipo_Diag) - Number(a.Tipo_Diag))
  const musculos = data.detalleCH.rows.filter(x => x.id_Diag === d?.id_Diag)
  const ejercicios = data.detalleEjer.rows.filter(x => x.id_Diag === d?.id_Diag)
  const electrodos = d ? data.electrodosDeDiag(d.id_Diag) : []
  const paginasEjercicios = Array.from({ length: Math.ceil(ejercicios.length / 4) }, (_, i) => ejercicios.slice(i * 4, i * 4 + 4))
  const imprimir = async () => {
    setImprimiendo(true)
    try {
      await Promise.allSettled(Array.from(dialog.current?.querySelectorAll('img') ?? []).map(img => img.decode()))
      window.print()
    } finally { setImprimiendo(false) }
  }
  const dolor = lesiones[0] ? data.getEscala(lesiones[0].id_EscalaDolor)?.Valor_Escala : undefined
  return createPortal(<dialog ref={dialog} className="hc-dialog" onCancel={onClose} aria-labelledby="hc-title">
    <div className="hc-toolbar no-print">
      <div><h2 id="hc-title" className="font-bold">{vista === 'historia' ? 'Historial clínico' : 'Plan de ejercicios'}</h2><p className="text-xs text-muted">Tamaño carta · {vista === 'historia' ? 'Una hoja' : 'Impresión independiente'}</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Sesión del historial" className="rounded-lg border border-line bg-surface px-3 py-2 text-sm" value={selected} onChange={e => setSelected(Number(e.target.value))}>
          {!sesiones.length && <option value={0}>Sin valoración registrada</option>}
          {sesiones.map(s => <option key={s.id_Diag} value={s.id_Diag}>Sesión #{s.Num_Diag} · {formatDate(data.getCita(s.id_Cita)!.Fecha_Cita)}</option>)}
        </select>
        <Button disabled={imprimiendo || (vista === 'ejercicios' && !ejercicios.length)} onClick={imprimir}><Printer />{imprimiendo ? 'Preparando…' : 'Imprimir / PDF'}</Button>
        <Button variant="secondary" onClick={onClose} aria-label="Cerrar historial clínico"><X /></Button>
      </div>
    </div>
    <div className="hc-document-tabs no-print" role="group" aria-label="Documento para imprimir">
      <Button variant={vista === 'historia' ? 'primary' : 'secondary'} aria-pressed={vista === 'historia'} onClick={() => setVista('historia')}>Historial clínico</Button>
      <Button variant={vista === 'ejercicios' ? 'primary' : 'secondary'} aria-pressed={vista === 'ejercicios'} onClick={() => setVista('ejercicios')}>Ejercicios</Button>
    </div>
    <div className="hc-scroll">
      <p className="hc-help no-print">La hoja reúne la información registrada en la sesión seleccionada. En impresión elige carta, escala 100 % y desactiva encabezados y pies del navegador.</p>
      {vista === 'historia' && scale < .8 && <p className="hc-help no-print" role="status">Esta sesión contiene mucho texto; la hoja se ha reducido para conservar todo el contenido. Revisa su legibilidad antes de imprimir.</p>}
      {vista === 'historia' ? <article className="hc-paper" aria-label="Hoja de historial clínico">
        <div ref={area} className="hc-area"><div ref={content} className="hc-content" style={{ transform: `scale(${scale})` }}>
          <header className="hc-header"><div><BusinessBrand /><p>{consultorio?.Nombre_Consul || 'Registro de atención'}</p></div><div><h1>HISTORIAL CLÍNICO</h1><p>Expediente {String(p.id_Pac).padStart(4,'0')} · {d ? `Sesión ${d.Num_Diag}` : 'Sin valoración'}</p><p>Fecha: {c ? formatDate(c.Fecha_Cita) : 'Sin registrar'}</p></div></header>
          <Bloque title="01 / Datos de identificación"><div className="hc-grid"><Campo label="Nombre completo" value={nombreCompleto(p)} /><Campo label="Fisioterapeuta" value={emp ? nombreCompleto(emp) : undefined} /><Campo label="Fecha de nacimiento" value={formatDate(p.Fecha_Nacimiento)} /><Campo label="Cédula profesional" value={emp?.CedulaProfesional} /><Campo label="Sexo" value={p.Genero === 'F' ? 'Femenino' : 'Masculino'} /><Campo label="Teléfono" value={formatTel(p.Telefono_Pac)} /></div></Bloque>
          <Bloque title="02 / Motivo de consulta"><p className="hc-text">{c?.Motivo_Cita || 'Sin registrar'}</p></Bloque>
          <Bloque title="03 / Valoración y diagnóstico">
            {lesiones.length ? lesiones.map(x => <div className="hc-diagnosis" key={x.id_DetalleDiag}><b>{data.getLesion(x.id_Lesion)?.Nom_Les} · {x.Tipo_Diag ? 'Principal' : 'Secundario'}</b><p>{x.Descrip_Diag || 'Sin descripción registrada'}</p><small>Dolor registrado: {data.getEscala(x.id_EscalaDolor)?.Valor_Escala ?? '—'}/10</small></div>) : <p className="hc-text">Sin registrar</p>}
            <div className="hc-pain-visual" aria-label={`Escala de dolor: ${dolor == null ? 'sin registrar' : `${dolor} de 10`}`}>
              <div className="hc-pain-heading"><b>¿Cuánto dolor siente?</b><strong>{dolor == null ? 'Sin registrar' : `Dolor registrado: ${dolor} / 10`}</strong></div>
              <p>0 significa sin dolor y 10, el peor dolor imaginable.</p>
              <div className="hc-pain-numbers">{Array.from({length:11}, (_,i) => <div key={i} className={dolor != null && Number(dolor) === i ? 'is-selected' : ''} style={{backgroundColor: ['#d1eade','#cfe8bd','#e0edb2','#edf0ac','#fae9a3','#ffda94','#ffc58b','#ffae88','#f79488','#e97d80','#df6877'][i]}}><span>{i}</span><small>{dolor != null && Number(dolor) === i ? '▲' : '\u00a0'}</small></div>)}</div>
              <div className="hc-pain-labels"><span>Sin<br/>dolor</span><span>Dolor<br/>leve</span><span>Dolor<br/>moderado</span><span>Dolor<br/>fuerte</span><span>Dolor muy<br/>fuerte</span><span>Peor dolor<br/>imaginable</span></div>
              <p className="hc-pain-caption">La flecha señala el valor registrado para el diagnóstico principal.</p>
            </div>
          </Bloque>
          <Bloque title="04 / Músculos afectados y tratamiento"><table><thead><tr><th>Región / músculo</th><th>Observaciones</th><th>Tratamiento</th></tr></thead><tbody>{musculos.length ? musculos.map(m => <tr key={m.id_DetalleCH}><td>{m.Nombre_Musculo}</td><td>{m.Descripcion_DiagCH}</td><td>{data.getTratamiento(data.getDetalleTrata(m.id_DetalleTrata)?.id_Trata ?? 0)?.Nombre_Trata || 'Sin registrar'}</td></tr>) : <tr><td colSpan={3}>Sin registrar</td></tr>}</tbody></table></Bloque>
          <Bloque title="05 / Electroterapia"><table><thead><tr><th>N.º</th><th>Zona / vista</th><th>Frecuencia</th><th>Parámetros registrados</th></tr></thead><tbody>{electrodos.length ? electrodos.map((e,i) => <tr key={e.id_DetalleElectrodo}><td>{i+1}</td><td>{e.Zona} · {nombreVista(e.Vista)}</td><td>{nombreNivel(e.Frecuencia)}</td><td>{parametros(e) || 'Sin registrar'}</td></tr>) : <tr><td colSpan={4}>Sin electroterapia registrada</td></tr>}</tbody></table></Bloque>
          <footer className="hc-footer"><span>Resumen de la sesión seleccionada · Documento confidencial</span><span>{business.nombre} · 1 / 1</span></footer>
        </div></div>
      </article> : ejercicios.length ? paginasEjercicios.map((pagina, numero) => (
        <article className="hc-paper hc-exercise-paper" key={numero} aria-label={`Plan de ejercicios, página ${numero + 1}`}>
          <header className="hc-exercise-heading"><BusinessBrand /><h1>PLAN DE EJERCICIOS</h1><p>{c ? formatDate(c.Fecha_Cita) : ''} · Sesión {d?.Num_Diag}</p></header>
          <table className="hc-exercise-table">
            <colgroup><col style={{width:'19%'}}/><col style={{width:'24%'}}/><col style={{width:'32%'}}/><col style={{width:'10%'}}/><col style={{width:'15%'}}/></colgroup>
            <thead><tr><th>Nombre</th><th>Imagen del ejercicio</th><th>Descripción</th><th>Series</th><th>Repeticiones</th></tr></thead>
            <tbody>{pagina.map(prescripcion => {
              const ejercicio = data.getEjercicio(prescripcion.id_Ejercicio)
              return <tr key={prescripcion.id_DetalleEjer}>
                <td><b>{ejercicio?.Nombre_Ejercicio || 'Ejercicio sin nombre'}</b></td>
                <td><div className="hc-exercise-image">
                  {ejercicio?.Imagen_Ejercicio ? <img src={ejercicio.Imagen_Ejercicio} alt={ejercicio.Nombre_Ejercicio} onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.setAttribute('data-error', 'Imagen no disponible') }} /> : <span>Sin imagen registrada</span>}
                </div></td>
                <td>{ejercicio?.Ejercicio || 'Sin descripción registrada'}</td>
                <td className="hc-dose"><span>{prescripcion.Series}</span></td>
                <td className="hc-dose"><span>{prescripcion.Repeticiones}</span></td>
              </tr>
            })}</tbody>
          </table>
          <footer className="hc-footer"><span>Plan de la sesión seleccionada</span><span>{numero + 1} / {paginasEjercicios.length}</span></footer>
        </article>
      )) : <div className="hc-exercise-empty" role="status">Esta sesión no tiene ejercicios registrados.</div>}
    </div>
  </dialog>, document.body)
}
