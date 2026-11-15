import { useState } from 'react'
import { Dumbbell, ImagePlus, Plus, Search } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Badge, Button, Card, Drawer, EmptyState, Field, ImageDrop, Input, PageHeader, SectionLabel, Select } from '../components/ui'
import { cn, readImage } from '../lib/format'
import type { Ejercicio } from '../types'

type Form = Omit<Ejercicio, 'id_Ejercicio'>
const vacio: Form = { Nombre_Ejercicio: '', Ejercicio: '', Repeticiones: '', Imagen_Ejercicio: null, id_CatEjer: null }

export default function Ejercicios() {
  const data = useData()
  const [cat, setCat] = useState<number>(0)
  const [q, setQ] = useState('')
  const [editando, setEditando] = useState<Ejercicio | 'nuevo' | null>(null)

  const lista = data.ejercicios.rows.filter(
    (e) => (!cat || e.id_CatEjer === cat) && `${e.Nombre_Ejercicio} ${e.Ejercicio}`.toLowerCase().includes(q.toLowerCase()),
  )
  const sinImagen = data.ejercicios.rows.filter((e) => !e.Imagen_Ejercicio).length

  const subirRapido = async (e: Ejercicio, file?: File) => {
    if (file) data.ejercicios.update(e.id_Ejercicio, { Imagen_Ejercicio: await readImage(file) })
  }

  return (
    <>
      <PageHeader
        title="Ejercicios"
        description={`Catálogo de ejercicios terapéuticos${sinImagen ? ` · ${sinImagen} sin imagen` : ''}.`}
        actions={<Button onClick={() => setEditando('nuevo')}><Plus />Nuevo ejercicio</Button>}
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ejercicio" className="h-9 pl-9 text-[13px]" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {[{ id_CatEjer: 0, Nombre_CatEjer: 'Todos' }, ...data.catEjercicios.rows].map((c) => (
            <button
              key={c.id_CatEjer}
              onClick={() => setCat(c.id_CatEjer)}
              className={cn('h-9 shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-colors', cat === c.id_CatEjer ? 'border-transparent bg-carbon text-carbon-fg dark:bg-fg dark:text-bg' : 'border-line bg-surface text-muted hover:text-fg')}
            >
              {c.Nombre_CatEjer}
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <Card><EmptyState icon={<Dumbbell />} title="Sin ejercicios" text="Prueba con otra categoría o crea uno nuevo." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((e) => {
            const lesiones = data.detalleEjerLes.rows.filter((r) => r.id_Ejercicio === e.id_Ejercicio)
            return (
              <Card key={e.id_Ejercicio} className="group overflow-hidden transition-colors hover:border-line-strong">
                {e.Imagen_Ejercicio ? (
                  <button onClick={() => setEditando(e)} className="block aspect-[4/3] w-full overflow-hidden bg-surface-3">
                    <img src={e.Imagen_Ejercicio} alt={e.Nombre_Ejercicio} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </button>
                ) : (
                  <label className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 border-b border-dashed border-line-strong bg-surface-2 text-muted transition-colors hover:bg-accent-soft/60 hover:text-accent">
                    <input type="file" accept="image/*" className="hidden" onChange={(ev) => subirRapido(e, ev.target.files?.[0])} />
                    <ImagePlus className="size-6" />
                    <span className="text-[13px] font-semibold">Subir imagen</span>
                  </label>
                )}
                <button onClick={() => setEditando(e)} className="block w-full p-5 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold leading-snug">{e.Nombre_Ejercicio}</h3>
                    {e.Repeticiones && <span className="tabular shrink-0 rounded-md bg-surface-3 px-2 py-0.5 text-xs font-bold">{e.Repeticiones}</span>}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{e.Ejercicio}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {e.id_CatEjer && <Badge tone="accent">{data.getCatEjercicio(e.id_CatEjer)?.Nombre_CatEjer}</Badge>}
                    <Badge tone="outline">{lesiones.length} {lesiones.length === 1 ? 'lesión' : 'lesiones'}</Badge>
                  </div>
                </button>
              </Card>
            )
          })}
        </div>
      )}

      {editando && <EjercicioDrawer key={editando === 'nuevo' ? 'nuevo' : editando.id_Ejercicio} ejercicio={editando === 'nuevo' ? undefined : editando} onClose={() => setEditando(null)} />}
    </>
  )
}

function EjercicioDrawer({ ejercicio, onClose }: { ejercicio?: Ejercicio; onClose: () => void }) {
  const data = useData()
  const [f, setF] = useState<Form>(ejercicio ? { ...ejercicio } : vacio)
  const [rel, setRel] = useState<number[]>(ejercicio ? data.detalleEjerLes.rows.filter((r) => r.id_Ejercicio === ejercicio.id_Ejercicio).map((r) => r.id_Lesion) : [])
  const valido = f.Nombre_Ejercicio.trim() && f.Ejercicio.trim()

  const guardar = () => {
    const limpio = { ...f, Repeticiones: f.Repeticiones?.trim() || null }
    let id = ejercicio?.id_Ejercicio
    if (ejercicio) data.ejercicios.update(ejercicio.id_Ejercicio, limpio)
    else id = data.ejercicios.add(limpio).id_Ejercicio
    // Sincroniza Detalle.DetalleEjerLes con las lesiones marcadas.
    const actuales = data.detalleEjerLes.rows.filter((r) => r.id_Ejercicio === id)
    const quitar = actuales.filter((r) => !rel.includes(r.id_Lesion))
    const nuevas = rel.filter((l) => !actuales.some((r) => r.id_Lesion === l))
    data.detalleEjerLes.setRows((l) => {
      let next = Math.max(0, ...l.map((r) => r.id_DetalleEjerLes)) + 1
      return [...l.filter((r) => !quitar.includes(r)), ...nuevas.map((id_Lesion) => ({ id_DetalleEjerLes: next++, id_Lesion, id_Ejercicio: id! }))]
    })
    onClose()
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={ejercicio ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button className="ml-auto" onClick={guardar} disabled={!valido}>{ejercicio ? 'Guardar cambios' : 'Crear ejercicio'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5 p-6">
        <Field label="Imagen del ejercicio">
          <ImageDrop value={f.Imagen_Ejercicio} onChange={(v) => setF({ ...f, Imagen_Ejercicio: v })} label="Subir imagen del ejercicio" />
        </Field>
        <Field label="Nombre" required hint={`${f.Nombre_Ejercicio.length}/40`}>
          <Input maxLength={40} value={f.Nombre_Ejercicio} onChange={(e) => setF({ ...f, Nombre_Ejercicio: e.target.value })} />
        </Field>
        <Field label="Ejercicio" required hint={`Indicación breve · ${f.Ejercicio.length}/50`}>
          <Input maxLength={50} value={f.Ejercicio} onChange={(e) => setF({ ...f, Ejercicio: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Repeticiones">
            <Input maxLength={29} value={f.Repeticiones ?? ''} placeholder="Ej. 12 o 30 s" onChange={(e) => setF({ ...f, Repeticiones: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <Select value={f.id_CatEjer ?? 0} onChange={(e) => setF({ ...f, id_CatEjer: Number(e.target.value) || null })}>
              <option value={0}>Sin categoría</option>
              {data.catEjercicios.rows.map((c) => <option key={c.id_CatEjer} value={c.id_CatEjer}>{c.Nombre_CatEjer}</option>)}
            </Select>
          </Field>
        </div>
        <div>
          <SectionLabel className="mb-1">Lesiones relacionadas</SectionLabel>
          <p className="mb-3 text-xs text-muted">Se sugerirá este ejercicio al diagnosticar estas lesiones.</p>
          <div className="flex flex-wrap gap-1.5">
            {data.lesiones.rows.map((l) => {
              const on = rel.includes(l.id_Lesion)
              return (
                <button
                  key={l.id_Lesion}
                  type="button"
                  onClick={() => setRel(on ? rel.filter((x) => x !== l.id_Lesion) : [...rel, l.id_Lesion])}
                  className={cn('h-8 rounded-full border px-3 text-[12.5px] font-semibold transition-colors', on ? 'border-accent bg-accent text-accent-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg')}
                >
                  {l.Nom_Les}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Drawer>
  )
}
