import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { DetalleElectrodo, NivelFrecuencia, Vista } from '../types'
import { cn } from '../lib/format'
import { readBusiness } from '../context/BusinessContext'
import lamina from '../assets/cuerpo/lamina-anatomica-v2.png'

/** Colocación de un electrodo tal como se dibuja (sin llaves de la tabla). */
export type Marca = Pick<DetalleElectrodo, 'Vista' | 'Zona' | 'Pos_X' | 'Pos_Y' | 'Frecuencia' | 'Hz' | 'Voltaje'>

/** Modelo anatómico: H hombre, M mujer. Las coordenadas son comunes a ambos. */
export type Modelo = 'H' | 'M'
export const modeloDeGenero = (g: 'F' | 'M' | undefined): Modelo => (g === 'F' ? 'M' : 'H')

// Recortes de la lámina original, sin alterar ni regenerar su anatomía.
const RECORTES: Record<string, [number, number, number, number]> = {
  'H-F': [10, 530, 230, 470], 'H-P': [755, 530, 230, 470],
  'H-I': [205, 530, 230, 470], 'H-D': [555, 530, 230, 470],
  'M-F': [10, 30, 230, 470], 'M-P': [380, 30, 230, 470],
  'M-I': [205, 30, 230, 470], 'M-D': [560, 30, 230, 470],
}
// Límites exclusivos de cada figura en la lámina de 1008 × 1043.
// Se recorta solo la capa de imagen, manteniendo el marco y sus coordenadas.
const LIMITES: Record<string, [number, number]> = {
  'H-F': [25, 230], 'H-P': [780, 980],
  'H-I': [270, 385], 'H-D': [625, 730],
  'M-F': [25, 235], 'M-P': [395, 615],
  'M-I': [275, 365], 'M-D': [640, 735],
}
function margenes(src: string) {
  const [x,,w] = RECORTES[src]
  const [izq, der] = LIMITES[src]
  return [Math.max(0, (izq * 990 / 1008 - x) / w), Math.max(0, (x + w - der * 990 / 1008) / w)]
}
export function estiloLamina(src: string) {
  const [left, right] = margenes(src)
  return {
    backgroundImage: `url(${lamina})`,
    backgroundSize: `${990 / 230 * 100}% ${1024 / 470 * 100}%`,
    backgroundPosition: `${RECORTES[src][0] / 760 * 100}% ${RECORTES[src][1] / 554 * 100}%`,
    backgroundRepeat: 'no-repeat',
    clipPath: `inset(0 ${right * 100}% 0 ${left * 100}%)`,
  }
}
function limpiarBordes(ctx: CanvasRenderingContext2D, src: string, w: number, h: number) {
  const [left, right] = margenes(src)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, Math.ceil(left * w), h)
  ctx.fillRect(Math.floor((1 - right) * w), 0, Math.ceil(right * w) + 1, h)
}
const IMAGENES: Record<Modelo, Record<Vista, string>> = {
  H: { F: 'H-F', P: 'H-P', I: 'H-I', D: 'H-D' },
  M: { F: 'M-F', P: 'M-P', I: 'M-I', D: 'M-D' },
}
export const ASPECTO = 230 / 470
export { IMAGENES }

export const VISTAS: { id: Vista; label: string; nota: string }[] = [
  { id: 'F', label: 'Frontal', nota: 'Anterior' },
  { id: 'P', label: 'Posterior', nota: 'Dorsal' },
  { id: 'I', label: 'Lateral izquierdo', nota: 'Perfil izquierdo' },
  { id: 'D', label: 'Lateral derecho', nota: 'Perfil derecho' },
]
export const nombreVista = (v: Vista) => VISTAS.find((x) => x.id === v)?.label ?? v

/* ---------- Niveles de frecuencia ---------- */

/** Colores fijos: los electrodos siempre se dibujan sobre láminas blancas, en ambos temas. */
export const NIVELES: { id: NivelFrecuencia; label: string; rango: string; color: string; tinta: string }[] = [
  { id: 'B', label: 'Baja', rango: '< 1 000 Hz', color: '#3d8b58', tinta: '#ffffff' },
  { id: 'M', label: 'Media', rango: '1 000 – 10 000 Hz', color: '#e3a92b', tinta: '#3b2a06' },
  { id: 'A', label: 'Alta', rango: '> 10 000 Hz', color: '#c9443a', tinta: '#ffffff' },
]
export const nivel = (n: NivelFrecuencia) => NIVELES.find((x) => x.id === n)!
export const nombreNivel = (n: NivelFrecuencia) => `Frecuencia ${nivel(n).label.toLowerCase()}`
/** Clasifica un valor en Hz dentro de los rangos de baja, media o alta frecuencia. */
export const nivelDeHz = (hz: number): NivelFrecuencia => (hz < 1000 ? 'B' : hz <= 10000 ? 'M' : 'A')
export const contarNiveles = (l: { Frecuencia: NivelFrecuencia }[]) => ({ B: l.filter((e) => e.Frecuencia === 'B').length, M: l.filter((e) => e.Frecuencia === 'M').length, A: l.filter((e) => e.Frecuencia === 'A').length })

const num = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 1 })
/** "80 Hz · 22 V", o cadena vacía si no hay parámetros registrados. */
export const parametros = (m: Pick<Marca, 'Hz' | 'Voltaje'>) => [m.Hz != null && `${num(m.Hz)} Hz`, m.Voltaje != null && `${num(m.Voltaje)} V`].filter(Boolean).join(' · ')

/* ---------- Zonas anatómicas (centros en % de la lámina) ---------- */

type Z = [string, number, number]
const ZONAS: Record<Vista, Z[]> = {
  F: [
    ['Cabeza', 50, 10], ['Cuello', 50, 17], ['Hombro derecho', 33, 23], ['Hombro izquierdo', 66, 23], ['Pectoral derecho', 42, 28], ['Pectoral izquierdo', 58, 28],
    ['Abdomen', 50, 39], ['Ingle', 50, 49], ['Brazo derecho', 28, 32], ['Brazo izquierdo', 71, 32], ['Codo derecho', 24, 40], ['Codo izquierdo', 75, 41],
    ['Antebrazo derecho', 21, 46], ['Antebrazo izquierdo', 80, 46], ['Mano derecha', 17, 53], ['Mano izquierda', 87, 50], ['Muslo anterior derecho', 42, 60],
    ['Muslo anterior izquierdo', 57, 60], ['Rodilla derecha', 43, 72], ['Rodilla izquierda', 56, 72], ['Espinilla derecha', 43, 81], ['Espinilla izquierda', 57, 81],
    ['Tobillo derecho', 46, 90], ['Tobillo izquierdo', 56, 90], ['Pie derecho', 47, 95], ['Pie izquierdo', 62, 94],
  ],
  P: [
    ['Cabeza', 50, 10], ['Cervical', 50, 17], ['Hombro izquierdo', 32, 23], ['Hombro derecho', 68, 23], ['Trapecio izquierdo', 41, 21], ['Trapecio derecho', 59, 21],
    ['Escápula izquierda', 40, 28], ['Escápula derecha', 60, 28], ['Dorsal', 50, 31], ['Lumbar', 50, 42], ['Glúteo izquierdo', 42, 50], ['Glúteo derecho', 59, 50],
    ['Brazo izquierdo', 28, 33], ['Brazo derecho', 72, 33], ['Codo izquierdo', 22, 42], ['Codo derecho', 76, 42], ['Antebrazo izquierdo', 16, 47], ['Antebrazo derecho', 79, 46],
    ['Mano izquierda', 9, 52], ['Mano derecha', 82, 51], ['Muslo posterior izquierdo', 44, 62], ['Muslo posterior derecho', 58, 62], ['Hueco poplíteo izquierdo', 45, 71],
    ['Hueco poplíteo derecho', 57, 71], ['Pantorrilla izquierda', 45, 79], ['Pantorrilla derecha', 57, 79], ['Tobillo izquierdo', 47, 90], ['Tobillo derecho', 55, 90],
    ['Talón izquierdo', 46, 94], ['Talón derecho', 57, 94],
  ],
  I: [
    ['Cabeza', 50, 10], ['Cuello', 46, 19], ['Hombro izquierdo', 42, 25],
    ['Pecho', 57, 29], ['Brazo izquierdo', 43, 34], ['Codo izquierdo', 46, 43],
    ['Antebrazo izquierdo', 51, 49], ['Mano izquierda', 58, 54],
    ['Abdomen', 58, 41], ['Cadera izquierda', 40, 50],
    ['Muslo lateral izquierdo', 44, 63], ['Rodilla izquierda', 47, 73],
    ['Pierna izquierda', 45, 83], ['Tobillo izquierdo', 47, 93], ['Pie izquierdo', 57, 97],
  ],
  D: [
    ['Cabeza', 48, 10], ['Cuello', 51, 19], ['Hombro derecho', 57, 25],
    ['Pecho', 42, 29], ['Brazo derecho', 57, 34], ['Codo derecho', 54, 43],
    ['Antebrazo derecho', 48, 49], ['Mano derecha', 40, 54],
    ['Abdomen', 43, 41], ['Cadera derecha', 59, 50],
    ['Muslo lateral derecho', 56, 63], ['Rodilla derecha', 50, 73],
    ['Pierna derecha', 55, 83], ['Tobillo derecho', 53, 93], ['Pie derecho', 43, 97],
  ],
}

/** Regional anchors for the treatment selector; broad regions, not segmented muscles. */
export function zonasTratamiento(modelo:Modelo,v:Vista){
 return ZONAS[v].map(([name,x,y])=>{
  if(name==='Cabeza')y=modelo==='M'?17:11
  else if(name==='Cuello'||name==='Cervical')y=modelo==='M'?25.5:20
  else if(name.startsWith('Hombro'))y=modelo==='M'?28:24
  else if(name.startsWith('Pectoral')||name==='Pecho')y=modelo==='M'?32:29
  else if(name.startsWith('Brazo'))y=modelo==='M'?35:33
  else if(name.startsWith('Antebrazo'))y=45
  if(modelo==='M'&&v==='F'){
   if(name==='Hombro derecho')x=30
   if(name==='Hombro izquierdo')x=67
   if(name==='Antebrazo derecho')x=23
   if(name==='Antebrazo izquierdo')x=76
  }
  return {name,x,y}
 })
}
export function zonaTratamientoCercana(modelo:Modelo,v:Vista,x:number,y:number){
 const regions=zonasTratamiento(modelo,v)
 const headEnd=modelo==='M'?(v==='F'?23.8:22.8):(v==='F'?17.8:17.2)
 if(y<=headEnd)return regions.find(r=>r.name==='Cabeza')!
 if(y<=(modelo==='M'?27.4:23.2)&&x>=34&&x<=65)return regions.find(r=>r.name==='Cuello'||r.name==='Cervical')!
 return regions.filter(r=>!['Cabeza','Cuello','Cervical'].includes(r.name)).reduce((a,b)=>
  ((a.x-x)*ASPECTO)**2+(a.y-y)**2<((b.x-x)*ASPECTO)**2+(b.y-y)**2?a:b)
}

/** Zona anatómica más cercana al punto (x, y en %). */
// Límites medidos en la lámina actual; cabeza y cuello no compiten por distancia.
export function zonaCercana(v: Vista, x: number, y: number, modelo: Modelo = 'H') {
  const cabezaFin = modelo === 'M' ? (v === 'F' ? 23.8 : 22.8) : (v === 'F' ? 17.8 : 17.2)
  const cuelloFin = modelo === 'M' ? 27.4 : 23.2
  if (y <= cabezaFin) return 'Cabeza'
  if (y <= cuelloFin && x >= 34 && x <= 65) return v === 'P' ? 'Cervical' : 'Cuello'

  let mejor = ZONAS[v][0][0]
  let d = Infinity
  for (const [n, zx, zy] of ZONAS[v]) {
    if (['Cabeza', 'Cuello', 'Cervical'].includes(n)) continue
    const dd = ((x - zx) * ASPECTO) ** 2 + (y - zy) ** 2
    if (dd < d) [d, mejor] = [dd, n]
  }
  return mejor
}

/* ---------- Detección de silueta (para no colocar electrodos sobre el fondo) ---------- */

const pixeles = new Map<string, ImageData | null>()
export function cargarPixeles(src: string) {
  if (pixeles.has(src)) return
  pixeles.set(src, null)
  const img = new Image()
  img.onload = () => {
    const c = document.createElement('canvas')
    const [sx, sy, sw, sh] = RECORTES[src]
    c.width = sw
    c.height = sh
    const ctx = c.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    ctx.drawImage(img, sx * img.naturalWidth / 990, sy * img.naturalHeight / 1024, sw * img.naturalWidth / 990, sh * img.naturalHeight / 1024, 0, 0, sw, sh)
    limpiarBordes(ctx, src, c.width, c.height)
    pixeles.set(src, ctx.getImageData(0, 0, c.width, c.height))
  }
  img.src = lamina
}
/** true si el punto cae sobre el cuerpo (píxel con color), false si es fondo o sombra. */
export function sobreCuerpo(src: string, x: number, y: number) {
  const d = pixeles.get(src)
  if (!d) return false
  const px = Math.min(d.width - 1, Math.max(0, Math.round((x / 100) * d.width)))
  const py = Math.min(d.height - 1, Math.max(0, Math.round((y / 100) * d.height)))
  const i = (py * d.width + px) * 4
  const [r, g, b] = [d.data[i], d.data[i + 1], d.data[i + 2]]
  const max = Math.max(r, g, b)
  const sat = max ? (max - Math.min(r, g, b)) / max : 0
  return !(max > 195 && sat < 0.09)
}

/* ---------- Piezas visuales ---------- */

/** Electrodo: disco del color de su frecuencia con borde blanco; opcionalmente numerado. */
export function ElectrodoPad({ nivel: n, numero, className }: { nivel: NivelFrecuencia; numero?: number; className?: string }) {
  const c = nivel(n)
  return (
    <span
      aria-hidden
      className={cn('tabular inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white', numero === undefined ? 'size-3' : 'size-[22px] text-[10.5px]', className)}
      style={{ background: c.color, color: c.tinta, outline: `3px solid ${c.color}40` }}
    >
      {numero}
    </span>
  )
}

export function Leyenda({ conteo, className, rangos }: { conteo?: Record<NivelFrecuencia, number>; className?: string; rangos?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-muted', className)}>
      {NIVELES.map((n) => (
        <span key={n.id} className="inline-flex items-center gap-2">
          <ElectrodoPad nivel={n.id} />
          {nombreNivel(n.id)}
          {rangos && <span className="text-subtle">{n.rango}</span>}
          {conteo && <span className="tabular font-bold text-fg">{conteo[n.id]}</span>}
        </span>
      ))}
    </div>
  )
}

/** Selector Hombre / Mujer con el mismo estilo que `Segmented`. */
export function ModeloToggle({ value, onChange, className }: { value: Modelo; onChange: (m: Modelo) => void; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-lg bg-surface-3 p-[3px]', className)} role="radiogroup" aria-label="Modelo anatómico">
      {(['H', 'M'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={cn('inline-flex h-8 items-center rounded-md px-3 text-[13px] font-semibold transition-colors', value === m ? 'bg-surface text-fg ring-1 ring-line' : 'text-muted hover:text-fg')}
        >
          {m === 'H' ? 'Hombre' : 'Mujer'}
        </button>
      ))}
    </div>
  )
}


type AjustesElectrodos = {
  frecuencia: NivelFrecuencia; hz: string; voltaje: string;
  onFrecuencia: (n: NivelFrecuencia) => void;
  onHz: (v: string) => void; onVoltaje: (v: string) => void;
}

/* ---------- Diagrama ---------- */

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Diagrama corporal con modelo anatómico real en cuatro vistas. Con `onAdd` es editable: un clic
 * sobre el cuerpo coloca un electrodo en la zona más cercana; un clic sobre un electrodo lo selecciona.
 */
export function BodyMap({
  marcas,
  modelo,
  onAdd,
  seleccion,
  onSelect,
  onMove,
  onDelete,
  ajustes,
  className,
}: {
  marcas: Marca[]
  modelo: Modelo
  onAdd?: (m: Pick<Marca, 'Vista' | 'Zona' | 'Pos_X' | 'Pos_Y'>) => void
  seleccion?: number | null
  onSelect?: (index: number) => void
  onDelete?: (index: number) => void
  ajustes?: AjustesElectrodos
  onMove?: (index: number, patch: Partial<Marca>) => void
  className?: string
}) {
  const [hover, setHover] = useState<{ v: Vista; zona: string | null } | null>(null)
  const [ampliada, setAmpliada] = useState<Vista | null>(null)
  const editable = !!onAdd

  useEffect(() => {
    if (editable) VISTAS.forEach((v) => cargarPixeles(IMAGENES[modelo][v.id]))
  }, [editable, modelo])

  const punto = (ev: MouseEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect()
    return { x: r1(((ev.clientX - r.left) / r.width) * 100), y: r1(((ev.clientY - r.top) / r.height) * 100) }
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3 md:grid-cols-4', className)} data-modelo={modelo}>
      {VISTAS.map(({ id: v, label, nota }) => {
        const src = IMAGENES[modelo][v]
        const enVista = marcas.map((m, i) => ({ m, i })).filter(({ m }) => m.Vista === v)
        const h = hover?.v === v ? hover : null
        return (
          <figure key={v} className="flex min-w-0 flex-col rounded-xl bg-surface-2 p-2">
            <button type="button" className="mb-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold hover:text-accent" onClick={() => setAmpliada(v)}>⤢ Ampliar {label.toLowerCase()}</button>
            <div
              data-vista={v}
              data-label={label}
              data-src={src}
              role="img"
              aria-label={`Vista ${label.toLowerCase()} · ${enVista.length} electrodos`}
              className={cn('relative w-full select-none overflow-hidden rounded-lg bg-white', editable && (h?.zona ? 'cursor-crosshair' : 'cursor-default'))}
              style={{ aspectRatio: ASPECTO }}
              onMouseMove={editable ? (e) => { const p = punto(e); setHover({ v, zona: sobreCuerpo(src, p.x, p.y) ? zonaCercana(v, p.x, p.y, modelo) : null }) } : undefined}
              onMouseLeave={editable ? () => setHover(null) : undefined}
              onClick={(e) => {
                if (!onAdd) return
                const p = punto(e)
                if (!sobreCuerpo(src, p.x, p.y)) return
                onAdd({ Vista: v, Zona: zonaCercana(v, p.x, p.y, modelo), Pos_X: p.x, Pos_Y: p.y })
              }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0" style={estiloLamina(src)} />
              {enVista.map(({ m, i }) => {
                const sel = seleccion === i
                return (
                  <button
                    key={i}
                    type="button"
                    title={[`${i + 1}. ${m.Zona}`, nombreNivel(m.Frecuencia), parametros(m)].filter(Boolean).join(' · ')}
                    tabIndex={onSelect ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect?.(i)
                    }}
                    className={cn('absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform', onSelect ? 'cursor-pointer hover:scale-110' : 'cursor-default', sel && 'z-10 scale-125')}
                    style={{ left: `${m.Pos_X}%`, top: `${m.Pos_Y}%` }}
                  >
                    <ElectrodoPad nivel={m.Frecuencia} numero={i + 1} className={cn(sel && 'ring-[#1c1c1c]')} />
                  </button>
                )
              })}
            </div>
            <figcaption className="mt-2 flex min-h-9 items-start justify-between gap-2 px-1 text-xs">
              <span className="min-w-0">
                <span className={cn('block truncate font-semibold', h?.zona && 'text-accent')}>{h?.zona ?? label}</span>
                <span className="block truncate text-subtle">{h ? (h.zona ? 'Clic para colocar' : 'Fuera del cuerpo') : nota}</span>
              </span>
              <span className="tabular shrink-0 font-semibold text-subtle">{enVista.length}</span>
            </figcaption>
          </figure>
        )
      })}
      {ampliada && <ZoomCorporal vista={ampliada} modelo={modelo} marcas={marcas} onClose={() => setAmpliada(null)} onAdd={onAdd} onMove={onMove} onDelete={onDelete} ajustes={ajustes} seleccion={seleccion} onSelect={onSelect} />}
    </div>
  )
}

/* ---------- Exportación a PNG ---------- */

async function cargar(src: string) {
  const img = new Image()
  img.src = lamina
  await img.decode()
  const [x, y, w, h] = RECORTES[src]
  const canvas = document.createElement('canvas')
  const sx = img.naturalWidth / 990
  const sy = img.naturalHeight / 1024
  canvas.width = Math.round(w * sx)
  canvas.height = Math.round(h * sy)
  canvas.getContext('2d')!.drawImage(img, x * sx, y * sy, w * sx, h * sy, 0, 0, canvas.width, canvas.height)
  limpiarBordes(canvas.getContext('2d')!, src, canvas.width, canvas.height)
  return canvas
}

/** Genera un PNG con las cuatro vistas, la lista de electrodos y la leyenda; lo descarga y devuelve el data URL. */
export async function descargarMapa(root: HTMLElement | null, { titulo, subtitulo, archivo, marcas }: { titulo: string; subtitulo: string; archivo: string; marcas: Marca[] }) {
  const vistas = root ? [...root.querySelectorAll<HTMLElement>('[data-vista][data-src]')] : []
  if (!vistas.length) return null
  const modelo = root?.querySelector<HTMLElement>('[data-modelo]')?.dataset.modelo === 'M' ? 'Mujer' : 'Hombre'
  const css = getComputedStyle(document.documentElement)
  const color = (v: string) => css.getPropertyValue(v).trim()
  const W = 320
  const H = Math.round(W / ASPECTO)
  const gap = 24
  const pad = 56
  const top = 320
  const filas = Math.ceil(marcas.length / 2)
  const anchoTotal = pad * 2 + W * vistas.length + gap * (vistas.length - 1)
  const yLista = top + H + 72 + 64
  const canvas = document.createElement('canvas')
  canvas.width = anchoTotal
  canvas.height = yLista + (filas ? 48 + filas * 44 : 0) + pad
  const ctx = canvas.getContext('2d')!
  await document.fonts.ready
  ctx.fillStyle = color('--surface')
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const identity = readBusiness()
  let brandX = pad
  if (identity.reportImage) {
    const logo = new Image()
    logo.src = identity.reportImage
    try {
      await logo.decode()
      const ratio = Math.min(180 / logo.naturalWidth, 90 / logo.naturalHeight)
      const w = logo.naturalWidth * ratio, h = logo.naturalHeight * ratio
      ctx.drawImage(logo, pad + (180 - w) / 2, 20 + (90 - h) / 2, w, h)
      brandX += 200
    } catch { /* Name remains visible if the logo cannot be decoded. */ }
  }
  ctx.fillStyle = color('--fg')
  ctx.font = '700 30px Manrope, sans-serif'
  ctx.fillText(identity.nombre, brandX, 60, anchoTotal - brandX - pad)
  if (identity.lema) {
    ctx.font = '400 20px Manrope, sans-serif'
    ctx.fillText(identity.lema.replace(/\s+/g, ' '), brandX, 94, anchoTotal - brandX - pad)
  }

  ctx.fillStyle = color('--accent')
  ctx.font = '700 22px Manrope, sans-serif'
  ctx.fillText('MAPA DE ELECTRODOS', pad, pad + 130)
  ctx.fillStyle = color('--fg')
  ctx.font = '800 44px Manrope, sans-serif'
  ctx.fillText(titulo, pad, pad + 184)
  ctx.fillStyle = color('--fg-muted')
  ctx.font = '500 24px Manrope, sans-serif'
  ctx.fillText(`${subtitulo} · Modelo ${modelo.toLowerCase()}`, pad, pad + 224)

  const disco = (x: number, y: number, r: number, n: NivelFrecuencia, texto?: string) => {
    const c = nivel(n)
    ctx.fillStyle = `${c.color}40`
    ctx.beginPath()
    ctx.arc(x, y, r + 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, r + 2.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c.color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    if (texto) {
      ctx.fillStyle = c.tinta
      ctx.font = `800 ${Math.round(r * 1.05)}px Manrope, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(texto, x, y + 1)
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
    }
  }

  const imgs = await Promise.all(vistas.map((v) => cargar(v.dataset.src!)))
  imgs.forEach((img, i) => {
    const x = pad + i * (W + gap)
    const v = vistas[i].dataset.vista as Vista
    ctx.fillStyle = color('--surface-2')
    ctx.beginPath()
    ctx.roundRect(x - 8, top - 8, W + 16, H + 72, 20)
    ctx.fill()
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, top, W, H, 14)
    ctx.clip()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, top, W, H)
    ctx.drawImage(img, x, top, W, H)
    ctx.restore()
    marcas.forEach((m, j) => m.Vista === v && disco(x + (m.Pos_X / 100) * W, top + (m.Pos_Y / 100) * H, 15, m.Frecuencia, String(j + 1)))
    ctx.fillStyle = color('--fg')
    ctx.font = '700 22px Manrope, sans-serif'
    ctx.fillText(vistas[i].dataset.label ?? '', x + 8, top + H + 44)
    ctx.fillStyle = color('--fg-subtle')
    const n = String(marcas.filter((m) => m.Vista === v).length)
    ctx.fillText(n, x + W - 8 - ctx.measureText(n).width, top + H + 44)
  })

  // Leyenda
  let lx = pad
  const ly = top + H + 72 + 40
  for (const n of NIVELES) {
    disco(lx + 10, ly - 8, 9, n.id)
    ctx.fillStyle = color('--fg-muted')
    ctx.font = '600 22px Manrope, sans-serif'
    const t = `${nombreNivel(n.id)} (${n.rango}) · ${marcas.filter((m) => m.Frecuencia === n.id).length}`
    ctx.fillText(t, lx + 30, ly)
    lx += 30 + ctx.measureText(t).width + 44
  }

  // Lista de electrodos en dos columnas
  if (filas) {
    ctx.strokeStyle = color('--border')
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(pad, yLista + 8)
    ctx.lineTo(anchoTotal - pad, yLista + 8)
    ctx.stroke()
    const colW = (anchoTotal - pad * 2) / 2
    marcas.forEach((m, j) => {
      const cx = pad + (j < filas ? 0 : colW)
      const cy = yLista + 48 + (j % filas) * 44
      disco(cx + 15, cy - 8, 13, m.Frecuencia, String(j + 1))
      ctx.fillStyle = color('--fg')
      ctx.font = '700 22px Manrope, sans-serif'
      ctx.fillText(m.Zona, cx + 44, cy)
      const z = ctx.measureText(m.Zona).width
      ctx.fillStyle = color('--fg-muted')
      ctx.font = '500 20px Manrope, sans-serif'
      ctx.fillText([nombreVista(m.Vista), nivel(m.Frecuencia).label, parametros(m)].filter(Boolean).join(' · '), cx + 44 + z + 16, cy)
    })
  }

  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = archivo
  a.click()
  return url
}


function ZoomCorporal({ vista, modelo, marcas, onClose, onAdd, onMove, onDelete, ajustes, seleccion, onSelect }: {
  vista: Vista; modelo: Modelo; marcas: Marca[]; onClose: () => void;
  onAdd?: (m: Pick<Marca, 'Vista' | 'Zona' | 'Pos_X' | 'Pos_Y'>) => void;
  onDelete?: (i: number) => void; ajustes?: AjustesElectrodos;
  onMove?: (i: number, patch: Partial<Marca>) => void; seleccion?: number | null; onSelect?: (i: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const gesture = useRef<{x: number; y: number; left: number; top: number; index?: number; moved: boolean} | null>(null)
  const [zoom, setZoom] = useState(1)
  const [base, setBase] = useState(220)
  const [mode, setMode] = useState<'pan' | 'place'>('pan')
  const [active, setActive] = useState<number | null>(seleccion ?? null)
  const [view, setView] = useState(vista)
  const src = IMAGENES[modelo][view]
  const reset = () => { setZoom(1); viewport.current?.scrollTo(0, 0) }
  useEffect(() => {
    dialog.current?.showModal()
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const el = viewport.current!
    const observer = new ResizeObserver(() => setBase(Math.max(120, Math.min(el.clientWidth - 24, (el.clientHeight - 24) * ASPECTO))))
    observer.observe(el)
    return () => { observer.disconnect(); document.body.style.overflow = old }
  }, [])
  useEffect(() => { cargarPixeles(src) }, [src])
  const point = (x: number, y: number) => {
    const r = body.current!.getBoundingClientRect()
    return {x: (x-r.left)/r.width*100, y: (y-r.top)/r.height*100}
  }
  const valid = (p: {x:number;y:number}) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100 && sobreCuerpo(src,p.x,p.y)
  const choose = (i: number) => { setActive(i); onSelect?.(i) }
  const changeZoom = (value: number) => {
    const el = viewport.current!
    const next = Math.max(1,Math.min(2.5,value))
    const ratio = next/zoom
    const left = (el.scrollLeft+el.clientWidth/2)*ratio-el.clientWidth/2
    const top = (el.scrollTop+el.clientHeight/2)*ratio-el.clientHeight/2
    setZoom(next)
    requestAnimationFrame(() => el.scrollTo(Math.max(0,left),Math.max(0,top)))
  }
  useEffect(() => {
    const el = viewport.current!
    const wheel = (e: WheelEvent) => { e.preventDefault(); changeZoom(zoom + (e.deltaY < 0 ? .2 : -.2)) }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [zoom])
  const [zonaHover, setZonaHover] = useState('')
  const current = active == null ? null : marcas[active]
  const button = 'rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold disabled:opacity-40'
  return <dialog ref={dialog} onCancel={(e) => {e.preventDefault();onClose()}} className="fixed inset-0 m-auto h-[94dvh] w-[96vw] max-w-6xl rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/60">
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line p-4"><div><h2 className="font-bold">Mapa corporal ampliado · {modelo === 'H' ? 'Hombre' : 'Mujer'}</h2><p className="text-xs text-muted">Acerca la zona y conserva la ubicación de cada electrodo.</p></div><button type="button" className={button} onClick={onClose} autoFocus>Cerrar</button></header>
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <select aria-label="Vista del cuerpo" className={button} value={view} onChange={e=>{setView(e.target.value as Vista);reset()}}>{VISTAS.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select>
        <button type="button" className={button} disabled={zoom<=1} aria-label="Alejar" onClick={()=>changeZoom(zoom-.25)}>−</button><span className="w-14 text-center text-sm">{Math.round(zoom*100)}%</span><button type="button" className={button} disabled={zoom>=2.5} aria-label="Acercar" onClick={()=>changeZoom(zoom+.25)}>+</button>
        <button type="button" className={button} onClick={reset}>Cuerpo completo</button>
        <button type="button" aria-pressed={mode==='pan'} className={cn(button,mode==='pan' && 'ring-2 ring-accent')} onClick={()=>setMode('pan')}>Mover imagen</button>
        {onAdd && <button type="button" aria-pressed={mode==='place'} className={cn(button,mode==='place' && 'ring-2 ring-accent')} onClick={()=>setMode('place')}>Colocar / ajustar</button>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div ref={viewport} className="min-h-0 flex-1 overflow-auto bg-surface-3" style={{touchAction:'none',cursor:mode==='pan'?'grab':'crosshair'}}
          onPointerDown={e=>{
            if(e.button!==0)return
            const marker=(e.target as HTMLElement).closest<HTMLElement>('[data-marker]')
            const index=marker ? Number(marker.dataset.marker) : undefined
            if(index!==undefined)choose(index)
            const el=viewport.current!
            gesture.current={x:e.clientX,y:e.clientY,left:el.scrollLeft,top:el.scrollTop,index,moved:false}
            e.currentTarget.setPointerCapture(e.pointerId)
          }}
          onPointerMove={e=>{
            const pos=point(e.clientX,e.clientY);setZonaHover(valid(pos)?zonaCercana(view,pos.x,pos.y,modelo):'Fuera del cuerpo')
            const g=gesture.current;if(!g)return
            if(Math.hypot(e.clientX-g.x,e.clientY-g.y)>4)g.moved=true
            if(mode==='pan'){viewport.current!.scrollTo(g.left-(e.clientX-g.x),g.top-(e.clientY-g.y))}
            else if(g.index!==undefined && onMove){const p=point(e.clientX,e.clientY);if(valid(p))onMove(g.index,{Pos_X:r1(p.x),Pos_Y:r1(p.y),Zona:zonaCercana(view,p.x,p.y,modelo)})}
          }}
          onPointerCancel={()=>{gesture.current=null}}
          onPointerUp={e=>{
            const g=gesture.current;gesture.current=null
            if(!g || g.moved || g.index!==undefined || mode!=='place' || !onAdd)return
            const p=point(e.clientX,e.clientY);if(valid(p)){onAdd({Vista:view,Zona:zonaCercana(view,p.x,p.y,modelo),Pos_X:r1(p.x),Pos_Y:r1(p.y)});setActive(marcas.length)}
          }}>
          <div style={{width:Math.max(base*zoom+24,base+24),minWidth:'100%',minHeight:'100%',padding:12,display:'flex',justifyContent:'center',alignItems:'flex-start'}}>
            <div ref={body} className="relative shrink-0 bg-white" style={{width:base*zoom,height:base*zoom/ASPECTO}}>
              <div aria-hidden className="pointer-events-none absolute inset-0" style={estiloLamina(src)} />
              {marcas.map((m,i)=>m.Vista===view && <button key={i} type="button" data-marker={i} aria-label={`Electrodo ${i+1}: ${m.Zona}`} onClick={()=>choose(i)} className={cn('absolute -translate-x-1/2 -translate-y-1/2 rounded-full',active===i && 'z-10 ring-4 ring-black/50')} style={{left:`${m.Pos_X}%`,top:`${m.Pos_Y}%`}}><ElectrodoPad nivel={m.Frecuencia} numero={i+1}/></button>)}
            </div>
          </div>
        </div>
        <aside className="max-h-[35vh] overflow-auto border-t border-line p-4 md:max-h-none md:w-80 md:border-l md:border-t-0">
          <h3 className="font-bold">Electrodos · {nombreVista(view)}</h3>
          <p className="my-2 rounded-lg bg-surface-2 p-2 text-sm" aria-live="polite">{zonaHover || 'Señala una zona del cuerpo'}</p>
          {ajustes && <section className="my-3 space-y-2 border-b border-line pb-3">
            <h4 className="text-sm font-semibold">Nuevo electrodo</h4>
            <div className="grid grid-cols-3 gap-1">{NIVELES.map(n=><button key={n.id} type="button" aria-pressed={ajustes.frecuencia===n.id} onClick={()=>{ajustes.onFrecuencia(n.id);setMode('place')}} className={cn('rounded-lg border border-line px-1 py-2 text-xs',ajustes.frecuencia===n.id && 'ring-2 ring-accent')}><span className="mb-1 block"><ElectrodoPad nivel={n.id}/></span>{n.label}</button>)}</div>
            <label className="block text-xs">Frecuencia (Hz)<input className="mt-1 w-full rounded border border-line bg-surface p-2" type="number" min="0" value={ajustes.hz} onChange={e=>ajustes.onHz(e.target.value)}/></label>
            <label className="block text-xs">Voltaje (V)<input className="mt-1 w-full rounded border border-line bg-surface p-2" type="number" min="0" value={ajustes.voltaje} onChange={e=>ajustes.onVoltaje(e.target.value)}/></label>
          </section>}
          <p className="text-xs text-muted">Zoom máximo 250%. El detalle depende de la resolución original.</p><p className="my-2 text-xs text-muted">{mode==='pan'?'Arrastra para recorrer la imagen. Usa la rueda o + y − para ampliar.':'Pulsa sobre el cuerpo para colocar. Arrastra un electrodo para ajustar su punto.'}</p>
          {current && <div className="my-3 rounded-lg bg-surface-2 p-3 text-sm"><b>Electrodo {active!+1}</b>{onMove ? <label className="block text-xs">Zona del electrodo<input className="my-1 w-full rounded border border-line bg-surface p-2 text-sm" value={current.Zona} onChange={e=>onMove(active!,{Zona:e.target.value})}/></label> : <p>{current.Zona}</p>}<p>{parametros(current) || 'Sin parámetros registrados'}</p><p className="mt-1 text-xs text-muted">Zona orientativa según proximidad.</p></div>}
          {marcas.map((m,i)=>m.Vista===view && <div key={i} className={cn('my-1 flex items-center rounded-lg border border-line',active===i && 'bg-accent-soft')}><button type="button" onClick={()=>choose(i)} className="flex min-w-0 flex-1 items-center gap-2 p-2 text-left text-xs"><ElectrodoPad nivel={m.Frecuencia} numero={i+1}/><span>{m.Zona}</span></button>{onDelete && <button type="button" aria-label={`Eliminar electrodo ${i+1}`} title={`Eliminar electrodo ${i+1}`} className="m-1 rounded p-2 text-xs text-danger hover:bg-danger-soft" onClick={()=>{onDelete(i);setActive(null)}}>Eliminar</button>}</div>)}
          {!marcas.some(m=>m.Vista===view) && <p className="mt-4 text-sm text-muted">Sin electrodos en esta vista.</p>}
        </aside>
      </div>
    </div>
  </dialog>
}

/** Captura de una ubicación de tratamiento sobre la misma lámina 2D. */
export async function imagenTratamiento(modelo: Modelo, vista: Vista, x: number, y: number, color: string, network?: {points: {x:number;y:number}[]; segments: {x1:number;y1:number;x2:number;y2:number}[]}) {
 const src = `${modelo}-${vista}`
 const img = new Image(); img.src = lamina; await img.decode()
 const canvas = document.createElement('canvas'); canvas.width = 460; canvas.height = 940
 const ctx = canvas.getContext('2d')!
 const [sx,sy,sw,sh] = RECORTES[src]
 ctx.fillStyle = 'white'; ctx.fillRect(0,0,460,940)
 ctx.drawImage(img,sx*img.naturalWidth/990,sy*img.naturalHeight/1024,sw*img.naturalWidth/990,sh*img.naturalHeight/1024,0,0,460,940)
 limpiarBordes(ctx,src,460,940)
 for(const line of network?.segments??[]){
  ctx.beginPath();ctx.moveTo(line.x1*4.6,line.y1*9.4);ctx.lineTo(line.x2*4.6,line.y2*9.4);ctx.lineCap='round';ctx.strokeStyle='white';ctx.lineWidth=9;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.stroke()
 }
 for(const point of network?.points??[{x,y}]){ctx.beginPath();ctx.arc(point.x*4.6,point.y*9.4,10,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='white';ctx.stroke()}
 return canvas.toDataURL('image/png')
}
