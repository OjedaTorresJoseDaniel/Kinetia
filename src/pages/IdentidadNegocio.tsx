import { useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Save } from 'lucide-react'
import { useBusiness } from '../context/BusinessContext'
import BusinessBrand from '../components/BusinessBrand'
import { Button, Card } from '../components/ui'
import '../components/HistoriaClinica.css'

export default function IdentidadNegocio() {
  const { business, save } = useBusiness()
  const [draft, setDraft] = useState(business)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState({logo: false, reportImage: false})
  const request = useRef({logo: 0, reportImage: 0})
  const inputs = useRef<Partial<Record<'logo' | 'reportImage', HTMLInputElement | null>>>({})
  const fieldClass = 'mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm focus:outline-accent'
  const upload = async (target: 'logo' | 'reportImage', file?: File) => {
    if (!file) return
    const id = ++request.current[target]
    setError(''); setMessage(''); setLoading(previous => ({...previous, [target]: true}))
    try {
      if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Elige una imagen PNG, JPG o WebP.')
      if (file.size > 2 * 1024 * 1024) throw new Error('La imagen debe pesar como máximo 2 MB.')
      const logo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
        reader.readAsDataURL(file)
      })
      const image = new Image(); image.src = logo
      await image.decode()
      if (id === request.current[target]) setDraft(previous => ({ ...previous, [target]: logo, ...(target === 'logo' ? {logoScale: 1} : {}) }))
    } catch (e) { if (id === request.current[target]) setError(e instanceof Error ? e.message : 'No se pudo abrir la imagen.') }
    finally { if (id === request.current[target]) setLoading(previous => ({...previous, [target]: false})) }
  }
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('')
    try { save(draft); setMessage('Identidad guardada. El sistema y los reportes ya utilizan estos datos.') }
    catch(e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.') }
  }
  return <div className="mx-auto max-w-5xl">
    <h1 className="text-2xl font-bold">Identidad del negocio</h1>
    <p className="mt-2 text-sm text-muted">Personaliza el nombre, logo y lema que aparecen en el sistema y en tus reportes.</p>
    <div className="mt-7 grid items-start gap-6 lg:grid-cols-2">
      <Card className="p-6"><form onSubmit={submit} className="space-y-5">
        <label className="block text-sm font-semibold">Nombre del negocio<input required maxLength={80} value={draft.nombre} onChange={e => { setDraft({...draft, nombre:e.target.value}); setMessage('') }} className={fieldClass} /></label>
        <label className="block text-sm font-semibold">Lema <span className="font-normal text-muted">(opcional)</span><textarea rows={2} maxLength={160} value={draft.lema} onChange={e => { setDraft({...draft, lema:e.target.value}); setMessage('') }} className={fieldClass} placeholder="Escribe el lema de tu negocio" /></label>
        {(['logo', 'reportImage'] as const).map(target => <div key={target} className="border-t border-line pt-5">
          <p className="text-sm font-semibold">{target === 'logo' ? 'Logo del sistema' : 'Imagen para impresiones'}</p>
          <p className="mt-1 text-xs text-muted">{target === 'logo' ? 'Se muestra en el menú y al iniciar sesión.' : 'Se muestra únicamente en los reportes y mapas exportados, con mayor tamaño y sin recorte circular.'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => inputs.current[target]?.click()} disabled={loading[target]} aria-label={`${draft[target] ? 'Cambiar' : 'Agregar'} ${target === 'logo' ? 'logo del sistema' : 'imagen para impresiones'}`} className={`group relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 border-line bg-white transition hover:border-accent hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait ${target === 'logo' ? 'size-28 rounded-full' : 'h-28 w-44 rounded-lg'}`}>
              {draft[target] ? <img src={draft[target]} alt="" className="size-full object-contain" style={{ transform: target === 'logo' ? `scale(${draft.logoScale})` : undefined }} /> : <ImagePlus className="size-8 text-stone-400" />}
              <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"><ImagePlus className="size-6" />{loading[target] ? 'Cargando…' : draft[target] ? 'Cambiar imagen' : 'Agregar imagen'}</span>
            </button>
            <div className="min-w-0 flex-1">
              <input ref={node => { inputs.current[target] = node }} aria-label={target === 'logo' ? 'Archivo del logo del sistema' : 'Archivo de imagen para impresiones'} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { void upload(target, e.target.files?.[0]); e.target.value = '' }} />
              <p className="mt-2 text-xs text-muted">Haz clic en la imagen para cambiarla.</p><p className="mt-1 text-xs text-muted">PNG, JPG o WebP · Máximo 2 MB</p>
            </div>
          </div>
          {target === 'logo' && draft.logo && <div className="mt-4"><label className="flex justify-between text-xs font-semibold" htmlFor="logo-size">Tamaño del logo<span>{Math.round(draft.logoScale * 100)} %</span></label><input id="logo-size" aria-label="Tamaño del logo" type="range" min={1} max={3} step={0.05} value={draft.logoScale} onChange={e => { setDraft({...draft,logoScale:Number(e.target.value)}); setMessage('') }} className="mt-2 w-full cursor-pointer accent-[var(--accent)]" /><p className="mt-1 text-xs text-muted">Amplía el logo si tu archivo tiene márgenes blancos. Revisa que no se corten sus letras.</p></div>}
        </div>)}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {message && <p role="status" className="text-sm text-success">{message}</p>}
        <Button type="submit" disabled={loading.logo || loading.reportImage || !draft.nombre.trim()}><Save />{loading.logo || loading.reportImage ? 'Cargando imagen…' : 'Guardar cambios'}</Button>
      </form></Card>
      <div><p className="mb-3 text-sm font-semibold">Vista previa de impresión</p><div className="rounded-xl border border-line bg-white p-7 text-slate-900"><BusinessBrand identity={draft} /><div className="mt-5 border-t border-gray-300 pt-4 text-center text-sm font-bold tracking-wide">HISTORIAL CLÍNICO</div><div className="mt-6 space-y-3" aria-hidden="true"><div className="h-4 rounded bg-gray-100"/><div className="h-4 w-4/5 rounded bg-gray-100"/><div className="h-4 rounded bg-gray-100"/></div></div><p className="mt-3 text-xs leading-relaxed text-muted">Al guardar se actualizan el historial clínico, el plan de ejercicios y las imágenes exportadas del mapa de electrodos. Los PDF o archivos descargados anteriormente conservan su imagen original.</p><p className="mt-3 text-xs leading-relaxed text-muted">Versión de demostración: los cambios se conservan en este navegador. La configuración compartida y el permiso exclusivo del dueño se conectarán con el backend.</p></div>
    </div>
  </div>
}
