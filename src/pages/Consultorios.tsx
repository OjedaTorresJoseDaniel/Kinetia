import { useState } from 'react'
import { Building2, MapPin, Pencil, Phone, Plus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button, Card, Field, IconButton, Input, Modal, PageHeader } from '../components/ui'
import { formatTel } from '../lib/format'
import type { Consultorio } from '../types'

export default function Consultorios() {
  const data = useData()
  const [editando, setEditando] = useState<Consultorio | 'nuevo' | null>(null)

  return (
    <>
      <PageHeader title="Consultorios" description="Espacios donde se realizan los diagnósticos." actions={<Button onClick={() => setEditando('nuevo')}><Plus />Nuevo consultorio</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.consultorios.rows.map((c) => {
          const usos = data.diagnosticos.rows.filter((d) => d.id_Consul === c.id_Consul).length
          return (
            <Card key={c.id_Consul} className="flex flex-col p-6">
              <div className="flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-soft-fg"><Building2 className="size-5" /></span>
                <IconButton label="Editar" className="size-8" onClick={() => setEditando(c)}><Pencil className="!size-4" /></IconButton>
              </div>
              <h3 className="mt-5 text-base font-bold">{c.Nombre_Consul}</h3>
              <div className="mt-3 flex flex-col gap-2 text-[13px] text-muted">
                <span className="flex items-center gap-2"><Phone className="size-3.5 shrink-0" /><span className="tabular">{formatTel(c.Telefono_Consul)}</span></span>
                <span className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0" />{c.Direccion}</span>
              </div>
              <p className="mt-6 border-t border-line pt-4 text-xs text-subtle"><b className="tabular text-sm text-fg">{usos}</b> diagnósticos realizados</p>
            </Card>
          )
        })}
      </div>
      {editando && <ConsultorioModal consultorio={editando === 'nuevo' ? undefined : editando} onClose={() => setEditando(null)} />}
    </>
  )
}

function ConsultorioModal({ consultorio, onClose }: { consultorio?: Consultorio; onClose: () => void }) {
  const { consultorios } = useData()
  const [f, setF] = useState({ Nombre_Consul: consultorio?.Nombre_Consul ?? '', Telefono_Consul: consultorio?.Telefono_Consul ?? '', Direccion: consultorio?.Direccion ?? '' })
  const valido = f.Nombre_Consul.trim() && f.Telefono_Consul.length === 10 && f.Direccion.trim()

  const guardar = () => {
    if (consultorio) consultorios.update(consultorio.id_Consul, f)
    else consultorios.add(f)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={consultorio ? 'Editar consultorio' : 'Nuevo consultorio'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={!valido}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Nombre" required><Input maxLength={70} value={f.Nombre_Consul} onChange={(e) => setF({ ...f, Nombre_Consul: e.target.value })} /></Field>
        <Field label="Teléfono" required hint="10 dígitos"><Input inputMode="tel" maxLength={10} value={f.Telefono_Consul} onChange={(e) => setF({ ...f, Telefono_Consul: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label="Dirección" required><Input maxLength={70} value={f.Direccion} onChange={(e) => setF({ ...f, Direccion: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}
