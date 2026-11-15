import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Search, UserPlus, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar, Button, Card, EmptyState, Input, PageHeader, Segmented, Table, Td, Th } from '../components/ui'
import { PacienteModal } from '../components/forms'
import { edad, formatDate, formatTel, iniciales, nombreCompleto, todayISO } from '../lib/format'

export default function Pacientes() {
  const { rol } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [genero, setGenero] = useState<'todos' | 'F' | 'M'>('todos')
  const [nuevo, setNuevo] = useState(false)
  const q = params.get('q') ?? ''
  const hoy = todayISO()
  const esFisio = rol === 'fisioterapeuta'

  const t = q.toLowerCase().trim()
  const lista = data.pacientes.rows
    .filter((p) => genero === 'todos' || p.Genero === genero)
    .filter((p) => !t || `${nombreCompleto(p)} ${p.Telefono_Pac}`.toLowerCase().includes(t))
    .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))

  const citasDe = (id: number) => data.citas.rows.filter((c) => c.id_Pac === id && c.Estatus_Cita)

  return (
    <>
      <PageHeader title="Pacientes" description={`${data.pacientes.rows.length} pacientes registrados.`} actions={<Button onClick={() => setNuevo(true)}><UserPlus />Registrar paciente</Button>} />

      <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} placeholder="Buscar por nombre o teléfono" className="h-9 pl-9 text-[13px]" />
          </div>
          <Segmented
            value={genero}
            onChange={setGenero}
            options={[
              { value: 'todos', label: 'Todos', count: data.pacientes.rows.length },
              { value: 'F', label: 'Femenino', count: data.pacientes.rows.filter((p) => p.Genero === 'F').length },
              { value: 'M', label: 'Masculino', count: data.pacientes.rows.filter((p) => p.Genero === 'M').length },
            ]}
          />
        </div>

        {lista.length === 0 ? (
          <EmptyState icon={<Users />} title="Sin resultados" text="No hay pacientes que coincidan con la búsqueda." className="border-t border-line" />
        ) : (
          <Table min={820}>
            <thead>
              <tr className="border-t border-line">
                <Th>Paciente</Th>
                <Th>Género</Th>
                <Th>Nacimiento</Th>
                <Th>Teléfono</Th>
                <Th>Última cita</Th>
                <Th>Próxima cita</Th>
                {esFisio && <Th className="text-right">Diagnósticos</Th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => {
                const cs = citasDe(p.id_Pac)
                const ultima = cs.filter((c) => c.Fecha_Cita < hoy).sort((a, b) => b.Fecha_Cita.localeCompare(a.Fecha_Cita))[0]
                const proxima = cs.filter((c) => c.Fecha_Cita >= hoy).sort((a, b) => (a.Fecha_Cita + a.Hora_Cita).localeCompare(b.Fecha_Cita + b.Hora_Cita))[0]
                const nDiag = data.diagnosticos.rows.filter((d) => data.getCita(d.id_Cita)?.id_Pac === p.id_Pac).length
                return (
                  <tr key={p.id_Pac} onClick={() => navigate(`/pacientes/${p.id_Pac}`)} className="cursor-pointer hover:bg-surface-2">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar text={iniciales(p)} size="sm" tone="accent" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{nombreCompleto(p)}</p>
                          <p className="tabular text-xs text-subtle">ID {String(p.id_Pac).padStart(4, '0')}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-muted">{p.Genero === 'F' ? 'Femenino' : 'Masculino'}</Td>
                    <Td className="whitespace-nowrap">
                      <p>{formatDate(p.Fecha_Nacimiento)}</p>
                      <p className="text-xs text-muted">{edad(p.Fecha_Nacimiento)} años</p>
                    </Td>
                    <Td className="tabular whitespace-nowrap text-muted">{formatTel(p.Telefono_Pac)}</Td>
                    <Td className="whitespace-nowrap text-muted">{ultima ? formatDate(ultima.Fecha_Cita, { day: 'numeric', month: 'short' }) : '—'}</Td>
                    <Td className="whitespace-nowrap">
                      {proxima ? (
                        <span className="font-semibold">
                          {proxima.Fecha_Cita === hoy ? 'Hoy' : formatDate(proxima.Fecha_Cita, { day: 'numeric', month: 'short' })} <span className="tabular font-normal text-muted">{proxima.Hora_Cita}</span>
                        </span>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </Td>
                    {esFisio && <Td className="tabular text-right font-semibold">{nDiag || <span className="text-subtle">—</span>}</Td>}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {nuevo && <PacienteModal open onClose={() => setNuevo(false)} onSaved={(p) => navigate(`/pacientes/${p.id_Pac}`)} />}
    </>
  )
}
