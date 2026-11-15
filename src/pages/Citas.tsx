import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { CalendarPlus, CalendarX, Info, RotateCcw, Search, Stethoscope, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar, Button, Card, EmptyState, EstadoCitaBadge, Input, Modal, PageHeader, Segmented, Select, Table, Td, Th } from '../components/ui'
import { CitaModal } from '../components/forms'
import { cn, formatDate, formatLongDate, iniciales, nombreCompleto, nombreCorto, todayISO } from '../lib/format'

type Filtro = 'hoy' | 'proximas' | 'anteriores' | 'canceladas' | 'todas'

export default function Citas() {
  const { user, rol } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('hoy')
  const [q, setQ] = useState('')
  const [fisio, setFisio] = useState(0)
  const [nueva, setNueva] = useState(false)
  const [porCancelar, setPorCancelar] = useState<number | null>(null)
  const hoy = todayISO()
  const esFisio = rol === 'fisioterapeuta'

  const base = data.citas.rows.filter((c) => (user ? c.id_Emp === user.id_Emp : true))
  const reglas: Record<Filtro, (c: (typeof base)[number]) => boolean> = {
    hoy: (c) => c.Fecha_Cita === hoy,
    proximas: (c) => c.Fecha_Cita > hoy && c.Estatus_Cita,
    anteriores: (c) => c.Fecha_Cita < hoy,
    canceladas: (c) => !c.Estatus_Cita,
    todas: () => true,
  }
  const t = q.toLowerCase()
  const lista = base
    .filter(reglas[filtro])
    .filter((c) => !t || `${c.Folio} ${nombreCompleto(data.getPaciente(c.id_Pac))} ${c.Motivo_Cita}`.toLowerCase().includes(t))
    .sort((a, b) => (filtro === 'anteriores' ? -1 : 1) * (a.Fecha_Cita + a.Hora_Cita).localeCompare(b.Fecha_Cita + b.Hora_Cita))

  return (
    <>
      <PageHeader title="Citas" description="Tus citas y atención a pacientes." actions={<Button onClick={() => setNueva(true)}><CalendarPlus />Nueva cita</Button>} />

      <Card>
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <Segmented
            value={filtro}
            onChange={setFiltro}
            className="overflow-x-auto"
            options={(['hoy', 'proximas', 'anteriores', 'canceladas', 'todas'] as Filtro[]).map((f) => ({
              value: f,
              label: { hoy: 'Hoy', proximas: 'Próximas', anteriores: 'Anteriores', canceladas: 'Canceladas', todas: 'Todas' }[f],
              count: base.filter(reglas[f]).length,
            }))}
          />
          <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:justify-end">
            {!esFisio && (
              <Select value={fisio} onChange={(e) => setFisio(Number(e.target.value))} className="h-9 text-[13px] sm:w-52">
                <option value={0}>Todos los fisioterapeutas</option>
                {data.empleados.rows.filter((e) => e.Tipo_Emp).map((f) => <option key={f.id_Emp} value={f.id_Emp}>{nombreCorto(f)}</option>)}
              </Select>
            )}
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Folio, paciente o motivo" className="h-9 pl-9 text-[13px]" />
            </div>
          </div>
        </div>

        <p className="flex items-start gap-2 border-t border-line px-4 py-3 text-[13px] text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-subtle" />
          <span>Cancelar libera el horario y mueve la cita a la pestaña «Canceladas»; no se borra y se puede reactivar. Una cita con diagnóstico ya no se puede cancelar.</span>
        </p>

        {lista.length === 0 ? (
          <EmptyState icon={<CalendarX />} title="No hay citas" text="Prueba con otro filtro o agenda una nueva cita." className="border-t border-line" />
        ) : (
          <Table min={900}>
            <thead>
              <tr className="border-t border-line">
                <Th>Folio</Th>
                <Th>Fecha y hora</Th>
                <Th>Paciente</Th>
                {!esFisio && <Th>Fisioterapeuta</Th>}
                <Th>Motivo</Th>
                <Th>Estado</Th>
                <Th className="text-right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const p = data.getPaciente(c.id_Pac)
                const estado = data.estadoCita(c)
                const diag = data.diagDeCita(c.id_Cita)
                return (
                  <tr key={c.id_Cita} className={cn('hover:bg-surface-2', !c.Estatus_Cita && 'opacity-60')}>
                    <Td className="tabular text-[13px] font-semibold text-muted">{c.Folio}</Td>
                    <Td className="whitespace-nowrap">
                      <p className="font-semibold">{c.Fecha_Cita === hoy ? 'Hoy' : formatDate(c.Fecha_Cita)}</p>
                      <p className="tabular text-xs text-muted">{c.Hora_Cita}</p>
                    </Td>
                    <Td>
                      <Link to={`/pacientes/${c.id_Pac}`} className="flex items-center gap-3 hover:text-accent">
                        <Avatar text={iniciales(p)} size="sm" />
                        <span className="font-semibold">{nombreCompleto(p)}</span>
                      </Link>
                    </Td>
                    {!esFisio && <Td className="whitespace-nowrap text-muted">{nombreCorto(data.getEmpleado(c.id_Emp))}</Td>}
                    <Td className="max-w-[240px] truncate text-muted">{c.Motivo_Cita ?? '—'}</Td>
                    <Td><EstadoCitaBadge estado={estado} /></Td>
                    <Td className="whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {esFisio && diag && <Button size="sm" variant="ghost" onClick={() => navigate(`/diagnosticos/${diag.id_Diag}`)}>Ver diagnóstico</Button>}
                        {esFisio && !diag && c.Estatus_Cita && c.Fecha_Cita <= hoy && (
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/diagnosticos/nuevo?cita=${c.id_Cita}`)}><Stethoscope />Diagnosticar</Button>
                        )}
                        {!diag && c.Estatus_Cita && <Button size="sm" variant="ghost" className="hover:text-danger" onClick={() => setPorCancelar(c.id_Cita)}><X />Cancelar</Button>}
                        {!c.Estatus_Cita && <Button size="sm" variant="secondary" onClick={() => data.citas.update(c.id_Cita, { Estatus_Cita: true })}><RotateCcw />Reactivar</Button>}
                        </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {(() => {
        const c = data.citas.rows.find((c) => c.id_Cita === porCancelar)
        return (
          <Modal
            open={!!c}
            onClose={() => setPorCancelar(null)}
            title="¿Cancelar esta cita?"
            description="El horario quedará libre en la agenda. La cita no se elimina: queda en «Canceladas» y puedes reactivarla."
            footer={
              <>
                <Button variant="secondary" onClick={() => setPorCancelar(null)}>No, conservar</Button>
                <Button variant="danger" onClick={() => { data.citas.update(c!.id_Cita, { Estatus_Cita: false }); setPorCancelar(null) }}>Sí, cancelar cita</Button>
              </>
            }
          >
            {c && (
              <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
                <p className="font-bold">{nombreCompleto(data.getPaciente(c.id_Pac))}</p>
                <p className="mt-0.5 text-muted">{formatLongDate(c.Fecha_Cita)} · {c.Hora_Cita} · {c.Folio}</p>
              </div>
            )}
          </Modal>
        )
      })()}

      {nueva && <CitaModal open onClose={() => setNueva(false)} />}
    </>
  )
}
