import { useState } from 'react'
import { Pencil, Plus, UserPlus } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Avatar, Badge, Button, Card, Field, IconButton, Input, Modal, PageHeader, Select, Table, Tabs, Td, Textarea, Th } from '../components/ui'
import { EmpleadoModal } from '../components/EmpleadoModal'
import { formatTel, iniciales, nombreCompleto } from '../lib/format'
import { rolDe, type Empleado } from '../types'

type Tab = 'lesiones' | 'tipos' | 'tratamientos' | 'categorias' | 'fisioterapeutas'

export default function Catalogos() {
  const data = useData()
  const [tab, setTab] = useState<Tab>('lesiones')
  const [nuevo, setNuevo] = useState(false)
  const [editFisio, setEditFisio] = useState<Empleado | 'nuevo' | null>(null)

  const usoLesion = (id: number) => data.detalleDiag.rows.filter((d) => d.id_Lesion === id).length
  const usoTrata = (id: number) => data.detalleTrata.rows.filter((d) => d.id_Trata === id).length
  const listaFisios = data.empleados.rows.filter((e) => rolDe(e) === 'fisioterapeuta' || rolDe(e) === 'prestador')

  return (
    <>
      <PageHeader
        title="Catálogos clínicos"
        description="Valores de referencia y personal clínico (fisioterapeutas y practicantes) usados al registrar citas y diagnósticos."
        actions={
          tab === 'fisioterapeutas' ? (
            <Button onClick={() => setEditFisio('nuevo')}><UserPlus />Registrar personal</Button>
          ) : (
            <Button onClick={() => setNuevo(true)}><Plus />Agregar</Button>
          )
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'fisioterapeutas', label: 'Fisioterapeutas', count: listaFisios.length },
          { id: 'lesiones', label: 'Lesiones', count: data.lesiones.rows.length },
          { id: 'tipos', label: 'Tipos de lesión', count: data.tiposLesion.rows.length },
          { id: 'tratamientos', label: 'Tratamientos', count: data.tratamientos.rows.length },
          { id: 'categorias', label: 'Categorías de ejercicio', count: data.catEjercicios.rows.length },
        ]}
      />

      <Card className="mt-6">
        {tab === 'fisioterapeutas' && (
          <Table min={800}>
            <thead>
              <tr>
                <Th>Fisioterapeuta</Th>
                <Th>No. Emp</Th>
                <Th>Rol</Th>
                <Th>Teléfono</Th>
                <Th>Cédula</Th>
                <Th>Especialidad</Th>
                <Th>Estatus</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {listaFisios.map((e) => (
                <tr key={e.id_Emp} className="hover:bg-surface-2">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar text={iniciales(e)} size="sm" tone={rolDe(e) === 'fisioterapeuta' ? 'accent' : 'carbon'} />
                      <span className="font-semibold">{nombreCompleto(e)}</span>
                    </div>
                  </Td>
                  <Td className="tabular font-semibold">{e.Num_Emp}</Td>
                  <Td>{rolDe(e) === 'fisioterapeuta' ? <Badge tone="accent">Fisioterapeuta</Badge> : <Badge tone="warning">Practicante</Badge>}</Td>
                  <Td className="tabular whitespace-nowrap text-muted">{formatTel(e.Telefono_Emp)}</Td>
                  <Td className="tabular text-muted">{e.CedulaProfesional ?? '—'}</Td>
                  <Td className="text-muted">{e.Especialidad ?? '—'}</Td>
                  <Td>
                    <button onClick={() => data.empleados.update(e.id_Emp, { Estatus_Emp: !e.Estatus_Emp })} title="Cambiar estatus">
                      {e.Estatus_Emp ? <Badge tone="success" dot>Activo</Badge> : <Badge tone="neutral" dot>Baja</Badge>}
                    </button>
                  </Td>
                  <Td className="text-right">
                    <IconButton label="Editar" className="size-8" onClick={() => setEditFisio(e)}>
                      <Pencil className="!size-4" />
                    </IconButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {tab === 'lesiones' && (
          <Table min={760}>
            <thead><tr><Th>Lesión</Th><Th>Tipo</Th><Th>Grado</Th><Th>Descripción</Th><Th className="text-right">Diagnósticos</Th></tr></thead>
            <tbody>
              {data.lesiones.rows.map((l) => (
                <tr key={l.id_Lesion}>
                  <Td className="font-semibold">{l.Nom_Les}</Td>
                  <Td><Badge>{data.getTipoLesion(l.id_TipoLes)?.Nom_TipoLes}</Badge></Td>
                  <Td className="text-muted">{l.Grado ?? '—'}</Td>
                  <Td className="max-w-[380px] text-[13px] text-muted">{l.Descrip_Les ?? '—'}</Td>
                  <Td className="tabular text-right font-semibold">{usoLesion(l.id_Lesion)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {tab === 'tipos' && (
          <Table min={420}>
            <thead><tr><Th>Tipo de lesión</Th><Th className="text-right">Lesiones asociadas</Th></tr></thead>
            <tbody>
              {data.tiposLesion.rows.map((t) => (
                <tr key={t.id_TipoLes}>
                  <Td className="font-semibold">{t.Nom_TipoLes}</Td>
                  <Td className="tabular text-right font-semibold">{data.lesiones.rows.filter((l) => l.id_TipoLes === t.id_TipoLes).length}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {tab === 'tratamientos' && (
          <Table min={640}>
            <thead><tr><Th>Tratamiento</Th><Th>Descripción</Th><Th className="text-right">Aplicaciones</Th></tr></thead>
            <tbody>
              {data.tratamientos.rows.map((t) => (
                <tr key={t.id_Trata}>
                  <Td className="whitespace-nowrap font-semibold">{t.Nombre_Trata}</Td>
                  <Td className="text-[13px] text-muted">{t.Descrip_Trata}</Td>
                  <Td className="tabular text-right font-semibold">{usoTrata(t.id_Trata)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {tab === 'categorias' && (
          <Table min={420}>
            <thead><tr><Th>Categoría</Th><Th className="text-right">Ejercicios disponibles</Th></tr></thead>
            <tbody>
              {data.catEjercicios.rows.map((c) => (
                <tr key={c.id_CatEjer}>
                  <Td className="font-semibold">{c.Nombre_CatEjer ?? '—'}</Td>
                  <Td className="tabular text-right font-semibold">{data.ejercicios.rows.filter((e) => e.id_CatEjer === c.id_CatEjer).length}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {nuevo && <NuevoCatalogo tab={tab} onClose={() => setNuevo(false)} />}
      {editFisio && (
        <EmpleadoModal
          empleado={editFisio === 'nuevo' ? undefined : editFisio}
          onClose={() => setEditFisio(null)}
        />
      )}
    </>
  )
}

function NuevoCatalogo({ tab, onClose }: { tab: Tab; onClose: () => void }) {
  const data = useData()
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [tipo, setTipo] = useState(data.tiposLesion.rows[0]?.id_TipoLes ?? 0)
  const [grado, setGrado] = useState('')

  const titulos: Record<Tab, string> = {
    fisioterapeutas: 'Registrar fisioterapeuta',
    lesiones: 'Nueva lesión',
    tipos: 'Nuevo tipo de lesión',
    tratamientos: 'Nuevo tratamiento',
    categorias: 'Nueva categoría de ejercicio',
  }
  const valido = a.trim() && (tab !== 'tratamientos' || b.trim())

  const guardar = () => {
    if (tab === 'lesiones') data.lesiones.add({ id_TipoLes: tipo, Nom_Les: a.trim(), Grado: grado.trim() || null, Descrip_Les: b.trim() || null })
    if (tab === 'tipos') data.tiposLesion.add({ Nom_TipoLes: a.trim() })
    if (tab === 'tratamientos') data.tratamientos.add({ Nombre_Trata: a.trim(), Descrip_Trata: b.trim() })
    if (tab === 'categorias') data.catEjercicios.add({ Nombre_CatEjer: a.trim() })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={titulos[tab]}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={!valido}>Guardar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {tab === 'lesiones' && (
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Tipo de lesión" required>
              <Select value={tipo} onChange={(e) => setTipo(Number(e.target.value))}>
                {data.tiposLesion.rows.map((t) => <option key={t.id_TipoLes} value={t.id_TipoLes}>{t.Nom_TipoLes}</option>)}
              </Select>
            </Field>
            <Field label="Grado"><Input maxLength={5} value={grado} onChange={(e) => setGrado(e.target.value)} placeholder="I, II…" /></Field>
          </div>
        )}
        <Field label="Nombre" required>
          <Input maxLength={tab === 'categorias' ? 50 : 60} value={a} onChange={(e) => setA(e.target.value)} />
        </Field>
        {(tab === 'lesiones' || tab === 'tratamientos') && (
          <Field label="Descripción" required={tab === 'tratamientos'}>
            <Textarea value={b} onChange={(e) => setB(e.target.value)} />
          </Field>
        )}
      </div>
    </Modal>
  )
}
