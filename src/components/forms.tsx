import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { nombreCompleto, nombreCorto, todayISO } from '../lib/format'
import type { Cita, Paciente } from '../types'
import { Button, Field, Input, Modal, Segmented, Select } from './ui'

export { EmpleadoModal } from './EmpleadoModal'

type Base = { open: boolean; onClose: () => void }

/* ---------- Persona.Cita ---------- */

export function CitaModal({ open, onClose, fecha, hora, id_Pac, id_Emp, onCreated }: Base & { fecha?: string; hora?: string; id_Pac?: number; id_Emp?: number; onCreated?: (c: Cita) => void }) {
  const { user, rol } = useAuth()
  const { pacientes, empleados, crearCita } = useData()
  const fisios = empleados.rows.filter((e) => e.Tipo_Emp && e.Estatus_Emp)
  const [f, setF] = useState({
    id_Pac: id_Pac ?? pacientes.rows[0].id_Pac,
    id_Emp: rol === 'fisioterapeuta' ? user!.id_Emp : (id_Emp ?? fisios[0].id_Emp),
    Fecha_Cita: fecha ?? todayISO(),
    Hora_Cita: hora ?? '10:00',
    Motivo_Cita: '',
  })

  const guardar = () => {
    const c = crearCita({ ...f, Motivo_Cita: f.Motivo_Cita.trim() || null })
    onClose()
    onCreated?.(c)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva cita"
      description="El folio se genera automáticamente y la cita se registra en la agenda. Puedes agendar varias personas en la misma fecha y hora."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar}>Agendar cita</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Paciente" required className="sm:col-span-2">
          <Select value={f.id_Pac} disabled={!!id_Pac} onChange={(e) => setF({ ...f, id_Pac: Number(e.target.value) })}>
            {pacientes.rows.map((p) => <option key={p.id_Pac} value={p.id_Pac}>{nombreCompleto(p)}</option>)}
          </Select>
        </Field>
        <Field label="Fisioterapeuta" required className="sm:col-span-2">
          <Select value={f.id_Emp} disabled={rol === 'fisioterapeuta'} onChange={(e) => setF({ ...f, id_Emp: Number(e.target.value) })}>
            {fisios.map((e) => <option key={e.id_Emp} value={e.id_Emp}>{nombreCorto(e)} — {e.Especialidad}</option>)}
          </Select>
        </Field>
        <Field label="Fecha" required>
          <Input type="date" value={f.Fecha_Cita} onChange={(e) => setF({ ...f, Fecha_Cita: e.target.value })} />
        </Field>
        <Field label="Hora" required>
          <Input type="time" step={900} value={f.Hora_Cita} onChange={(e) => setF({ ...f, Hora_Cita: e.target.value })} />
        </Field>
        <Field label="Motivo de la cita" className="sm:col-span-2" hint={`${f.Motivo_Cita.length}/80`}>
          <Input maxLength={80} value={f.Motivo_Cita} placeholder="Ej. Dolor lumbar al estar sentado" onChange={(e) => setF({ ...f, Motivo_Cita: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------- Persona.Pacientes ---------- */

export function PacienteModal({ open, onClose, paciente, onSaved }: Base & { paciente?: Paciente; onSaved?: (p: Paciente) => void }) {
  const { pacientes } = useData()
  const [f, setF] = useState({
    Nombre_Pac: paciente?.Nombre_Pac ?? '',
    ApellidoP_Pac: paciente?.ApellidoP_Pac ?? '',
    ApellidoM_Pac: paciente?.ApellidoM_Pac ?? '',
    Telefono_Pac: paciente?.Telefono_Pac ?? '',
    Fecha_Nacimiento: paciente?.Fecha_Nacimiento ?? '',
    Genero: paciente?.Genero ?? ('F' as Paciente['Genero']),
  })
  const valido = f.Nombre_Pac.trim() && f.ApellidoM_Pac.trim() && f.Telefono_Pac.length === 10 && f.Fecha_Nacimiento

  const guardar = () => {
    const data = { ...f, ApellidoP_Pac: f.ApellidoP_Pac.trim() || null }
    if (paciente) {
      pacientes.update(paciente.id_Pac, data)
      onSaved?.({ ...paciente, ...data })
    } else onSaved?.(pacientes.add(data))
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={paciente ? 'Editar paciente' : 'Registrar paciente'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={!valido}>{paciente ? 'Guardar cambios' : 'Registrar'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre(s)" required className="sm:col-span-2">
          <Input maxLength={100} value={f.Nombre_Pac} onChange={(e) => setF({ ...f, Nombre_Pac: e.target.value })} />
        </Field>
        <Field label="Apellido paterno">
          <Input maxLength={100} value={f.ApellidoP_Pac} onChange={(e) => setF({ ...f, ApellidoP_Pac: e.target.value })} />
        </Field>
        <Field label="Apellido materno" required>
          <Input maxLength={100} value={f.ApellidoM_Pac} onChange={(e) => setF({ ...f, ApellidoM_Pac: e.target.value })} />
        </Field>
        <Field label="Teléfono" required hint="10 dígitos">
          <Input inputMode="tel" maxLength={10} value={f.Telefono_Pac} placeholder="5512345678" onChange={(e) => setF({ ...f, Telefono_Pac: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <Field label="Fecha de nacimiento" required>
          <Input type="date" max={todayISO()} value={f.Fecha_Nacimiento} onChange={(e) => setF({ ...f, Fecha_Nacimiento: e.target.value })} />
        </Field>
        <Field label="Género" required className="sm:col-span-2">
          <Segmented value={f.Genero} onChange={(v) => setF({ ...f, Genero: v })} options={[{ value: 'F', label: 'Femenino' }, { value: 'M', label: 'Masculino' }]} className="w-fit" />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------- Persona.Agenda ---------- */

export function EventoModal({ open, onClose, fecha, hora }: Base & { fecha?: string; hora?: string }) {
  const { agenda, citas, getPaciente } = useData()
  const [f, setF] = useState({ Nom_Evento: '', Fecha_Agenda: fecha ?? todayISO(), Hora_Agenda: hora ?? '09:00', id_Cita: 0 })
  const vigentes = citas.rows.filter((c) => c.Estatus_Cita && c.Fecha_Cita >= todayISO())

  const guardar = () => {
    agenda.add({ ...f, Nom_Evento: f.Nom_Evento.trim(), id_Cita: f.id_Cita || null })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo evento"
      description="Eventos internos o recordatorios vinculados a una cita."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={!f.Nom_Evento.trim()}>Guardar evento</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del evento" required className="sm:col-span-2" hint={`${f.Nom_Evento.length}/65`}>
          <Input maxLength={65} value={f.Nom_Evento} placeholder="Ej. Junta clínica" onChange={(e) => setF({ ...f, Nom_Evento: e.target.value })} />
        </Field>
        <Field label="Fecha" required>
          <Input type="date" value={f.Fecha_Agenda} onChange={(e) => setF({ ...f, Fecha_Agenda: e.target.value })} />
        </Field>
        <Field label="Hora" required>
          <Input type="time" step={900} value={f.Hora_Agenda} onChange={(e) => setF({ ...f, Hora_Agenda: e.target.value })} />
        </Field>
        <Field label="Cita vinculada" className="sm:col-span-2" hint="Opcional">
          <Select value={f.id_Cita} onChange={(e) => setF({ ...f, id_Cita: Number(e.target.value) })}>
            <option value={0}>Sin cita</option>
            {vigentes.map((c) => <option key={c.id_Cita} value={c.id_Cita}>{c.Folio} · {nombreCorto(getPaciente(c.id_Pac))} · {c.Fecha_Cita} {c.Hora_Cita}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  )
}
