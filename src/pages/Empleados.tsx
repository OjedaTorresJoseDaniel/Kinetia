import { useState } from 'react'
import { Pencil, UserPlus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Avatar, Badge, Button, Card, IconButton, PageHeader, Segmented, Table, Td, Th } from '../components/ui'
import { EmpleadoModal } from '../components/EmpleadoModal'
import { cn, formatTel, iniciales, nombreCompleto } from '../lib/format'
import { rolDe, type Empleado, type Rol } from '../types'

export default function Empleados() {
  const data = useData()
  const [filtro, setFiltro] = useState<'todos' | Rol>('todos')
  const [editando, setEditando] = useState<Empleado | 'nuevo' | null>(null)

  const lista = data.empleados.rows
    .filter((e) => filtro === 'todos' || rolDe(e) === filtro)
    .sort((a, b) => a.Num_Emp - b.Num_Emp)

  const badgeRol = (e: Empleado) => {
    const rol = rolDe(e)
    if (rol === 'fisioterapeuta') return <Badge tone="accent">Fisioterapeuta</Badge>
    return <Badge tone="warning">Prestador de servicio</Badge>
  }

  return (
    <>
      <PageHeader
        title="Personal clínico"
        description="Gestión del personal (Persona.Empleados): fisioterapeutas y prestadores de servicio / practicantes."
        actions={<Button onClick={() => setEditando('nuevo')}><UserPlus />Nuevo registro</Button>}
      />

      <Card>
        <div className="p-4">
          <Segmented
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: 'todos', label: 'Todos', count: data.empleados.rows.length },
              { value: 'fisioterapeuta', label: 'Fisioterapeutas', count: data.empleados.rows.filter((e) => rolDe(e) === 'fisioterapeuta').length },
              { value: 'prestador', label: 'Prestadores / Practicantes', count: data.empleados.rows.filter((e) => rolDe(e) === 'prestador').length },
            ]}
          />
        </div>
        <Table min={920}>
          <thead>
            <tr className="border-t border-line"><Th>Personal</Th><Th>No.</Th><Th>Rol</Th><Th>Teléfono</Th><Th>Cédula</Th><Th>Especialidad</Th><Th>Estatus</Th><Th /></tr>
          </thead>
          <tbody>
            {lista.map((e) => (
              <tr key={e.id_Emp} className={cn('hover:bg-surface-2', !e.Estatus_Emp && 'text-muted')}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar text={iniciales(e)} size="sm" tone={rolDe(e) === 'fisioterapeuta' ? 'accent' : 'carbon'} />
                    <span className="font-semibold">{nombreCompleto(e)}</span>
                  </div>
                </Td>
                <Td className="tabular font-semibold">{e.Num_Emp}</Td>
                <Td>{badgeRol(e)}</Td>
                <Td className="tabular whitespace-nowrap text-muted">{formatTel(e.Telefono_Emp)}</Td>
                <Td className="tabular text-muted">{e.CedulaProfesional ?? '—'}</Td>
                <Td className="text-muted">{e.Especialidad ?? '—'}</Td>
                <Td>
                  <button onClick={() => data.empleados.update(e.id_Emp, { Estatus_Emp: !e.Estatus_Emp })} title="Cambiar estatus">
                    {e.Estatus_Emp ? <Badge tone="success" dot>Activo</Badge> : <Badge tone="neutral" dot>Baja</Badge>}
                  </button>
                </Td>
                <Td className="text-right"><IconButton label="Editar" className="size-8" onClick={() => setEditando(e)}><Pencil className="!size-4" /></IconButton></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {editando && <EmpleadoModal empleado={editando === 'nuevo' ? undefined : editando} onClose={() => setEditando(null)} />}
    </>
  )
}
