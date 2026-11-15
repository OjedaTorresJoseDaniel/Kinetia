import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FileHeart, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Avatar, Badge, Card, EmptyState, Input, PageHeader, PainMeter, Segmented, Table, Td, Th } from '../components/ui'
import { formatDate, iniciales, nombreCompleto, nombreCorto } from '../lib/format'
import { useResumenDiag } from '../lib/useResumenDiag'

export default function Diagnosticos() {
  const { user } = useAuth()
  const data = useData()
  const navigate = useNavigate()
  const resumen = useResumenDiag()
  const [alcance, setAlcance] = useState<'mios' | 'todos'>('mios')
  const [q, setQ] = useState('')

  const filas = data.diagnosticos.rows
    .map((d) => {
      const c = data.getCita(d.id_Cita)!
      return { d, c, p: data.getPaciente(c.id_Pac), r: resumen(d.id_Diag) }
    })
    .filter(({ c }) => alcance === 'todos' || c.id_Emp === user!.id_Emp)
    .filter(({ p, r }) => !q || `${nombreCompleto(p)} ${r.lesiones.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.c.Fecha_Cita + b.c.Hora_Cita).localeCompare(a.c.Fecha_Cita + a.c.Hora_Cita))

  return (
    <>
      <PageHeader title="Diagnósticos" description="Cada diagnóstico se origina en una cita e incluye lesiones, escala de dolor, radiografías, músculos afectados con su tratamiento y el plan de ejercicios." />

      <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Paciente o lesión" className="h-9 pl-9 text-[13px]" />
          </div>
          <Segmented value={alcance} onChange={setAlcance} options={[{ value: 'mios', label: 'Mis diagnósticos' }, { value: 'todos', label: 'Toda la clínica' }]} />
        </div>
        {filas.length === 0 ? (
          <EmptyState icon={<FileHeart />} title="Sin diagnósticos" text="Inicia un diagnóstico desde una cita en la sección Citas o en el Inicio." className="border-t border-line" />
        ) : (
          <Table min={900}>
            <thead>
              <tr className="border-t border-line"><Th>Paciente</Th><Th>No.</Th><Th>Fecha</Th><Th>Lesiones</Th><Th>Dolor</Th><Th>Consultorio</Th><Th>Fisioterapeuta</Th></tr>
            </thead>
            <tbody>
              {filas.map(({ d, c, p, r }) => (
                <tr key={d.id_Diag} onClick={() => navigate(`/diagnosticos/${d.id_Diag}`)} className="cursor-pointer hover:bg-surface-2">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar text={iniciales(p)} size="sm" tone="accent" />
                      <span className="font-semibold">{nombreCompleto(p)}</span>
                    </div>
                  </Td>
                  <Td className="tabular font-semibold text-muted">#{d.Num_Diag}</Td>
                  <Td className="whitespace-nowrap">{formatDate(c.Fecha_Cita)}</Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="accent">{r.principal}</Badge>
                      {r.lesiones.length > 1 && <span className="text-xs font-semibold text-subtle">+{r.lesiones.length - 1}</span>}
                    </div>
                  </Td>
                  <Td><PainMeter value={r.dolor} compact /></Td>
                  <Td className="max-w-[200px] truncate text-muted">{data.getConsultorio(d.id_Consul)?.Nombre_Consul}</Td>
                  <Td className="whitespace-nowrap text-muted">{nombreCorto(data.getEmpleado(c.id_Emp))}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
