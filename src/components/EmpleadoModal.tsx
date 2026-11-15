import { useState } from 'react'
import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { useData } from '../context/DataContext'
import { Button, Field, Input, Modal, Segmented } from './ui'
import { cn } from '../lib/format'
import { rolDe, type Empleado, type Rol } from '../types'

const ESPECIALIDADES_SUGERIDAS = [
  'Traumatología y ortopedia',
  'Fisioterapia deportiva',
  'Neurorrehabilitación',
  'Rehabilitación de columna y postura',
  'Terapia manual ortopédica',
  'Fisioterapia pediátrica',
  'Fisioterapia geriátrica',
  'Rehabilitación cardiopulmonar',
  'Fisioterapia general (prácticas)',
]

export interface EmpleadoModalProps {
  open?: boolean
  empleado?: Empleado
  onClose: () => void
  /** Forzar que el formulario sea solo para registrar fisioterapeutas */
  soloFisio?: boolean
  onSuccess?: (emp: Empleado) => void
}

/**
 * Formulario de registro y edición para Persona.Empleados
 *
 * CREATE TABLE Persona.Empleados (
 *   id_Emp int primary key,
 *   Num_Emp int not null,
 *   Nombre_Emp varchar (100) not null,
 *   ApellidoP_Emp varchar (100),
 *   ApellidoM_Emp varchar (100) not null,
 *   Tipo_Emp bit not null,  -- true: Fisioterapeuta, false: Recepción, 'prestador': Prestador de servicio
 *   Clave varchar (15) not null,
 *   Telefono_Emp char (10) not null,
 *   CedulaProfesional varchar (10),
 *   Especialidad varchar (50),
 *   Estatus_Emp bit not null
 * );
 */
export function EmpleadoModal({ empleado, onClose, soloFisio, onSuccess }: EmpleadoModalProps) {
  const { empleados } = useData()
  const sugerido = Math.max(0, ...empleados.rows.map((e) => e.Num_Emp)) + 1

  const rolInicial: Rol = soloFisio ? 'fisioterapeuta' : empleado ? rolDe(empleado) : 'fisioterapeuta'

  const [tipoRol, setTipoRol] = useState<Rol>(rolInicial)
  const [f, setF] = useState({
    Num_Emp: String(empleado?.Num_Emp ?? sugerido),
    Nombre_Emp: empleado?.Nombre_Emp ?? '',
    ApellidoP_Emp: empleado?.ApellidoP_Emp ?? '',
    ApellidoM_Emp: empleado?.ApellidoM_Emp ?? '',
    Clave: empleado?.Clave ?? '',
    Telefono_Emp: empleado?.Telefono_Emp ?? '',
    CedulaProfesional: empleado?.CedulaProfesional ?? '',
    Especialidad: empleado?.Especialidad ?? '',
    Estatus_Emp: empleado?.Estatus_Emp ?? true,
  })
  const [ver, setVer] = useState(false)
  const [openCb, setOpenCb] = useState(false)
  const [filtroEsp, setFiltroEsp] = useState('')

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  const duplicado = empleados.rows.some((e) => e.Num_Emp === Number(f.Num_Emp) && e.id_Emp !== empleado?.id_Emp)

  const esFisio = tipoRol === 'fisioterapeuta'
  const esPrestador = tipoRol === 'prestador'
  const cedulaValida = esFisio ? f.CedulaProfesional.trim().length >= 7 : true

  const valido =
    Boolean(f.Num_Emp) &&
    !duplicado &&
    Boolean(f.Nombre_Emp.trim()) &&
    Boolean(f.ApellidoM_Emp.trim()) &&
    Boolean(f.Clave) &&
    f.Telefono_Emp.length === 10 &&
    cedulaValida

  const guardar = () => {
    let tipoEmpVal: boolean | 'prestador' = false
    if (tipoRol === 'fisioterapeuta') tipoEmpVal = true
    else if (tipoRol === 'prestador') tipoEmpVal = 'prestador'
    else tipoEmpVal = false

    const row = {
      ...f,
      Num_Emp: Number(f.Num_Emp),
      Tipo_Emp: tipoEmpVal,
      Nombre_Emp: f.Nombre_Emp.trim(),
      ApellidoP_Emp: f.ApellidoP_Emp.trim() || null,
      ApellidoM_Emp: f.ApellidoM_Emp.trim(),
      CedulaProfesional: esFisio ? f.CedulaProfesional.trim() || null : null,
      Especialidad: esFisio || esPrestador ? f.Especialidad.trim() || null : null,
    }

    let resultado: Empleado
    if (empleado) {
      empleados.update(empleado.id_Emp, row)
      resultado = { ...empleado, ...row }
    } else {
      resultado = empleados.add(row)
    }

    onSuccess?.(resultado)
    onClose()
  }

  const especialidadesFiltradas = ESPECIALIDADES_SUGERIDAS.filter((esp) =>
    esp.toLowerCase().includes((filtroEsp || f.Especialidad).toLowerCase()),
  )

  const tituloModal = soloFisio
    ? empleado
      ? 'Editar Fisioterapeuta'
      : 'Registrar Fisioterapeuta'
    : empleado
      ? 'Editar empleado'
      : 'Nuevo empleado'

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={tituloModal}
      description="Datos de la tabla Persona.Empleados"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar} disabled={!valido}>{empleado ? 'Guardar cambios' : 'Registrar empleado'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-6">
        {!soloFisio ? (
          <Field label="Tipo de personal (Tipo_Emp)" required className="sm:col-span-6">
            <Segmented
              value={tipoRol}
              onChange={(v) => {
                setTipoRol(v)
                if (v === 'prestador') {
                  setF((prev) => ({ ...prev, CedulaProfesional: '' }))
                }
              }}
              options={[
                { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
                { value: 'prestador', label: 'Prestador de servicio (Practicante)' },
              ]}
              className="w-full sm:w-auto"
            />
            {tipoRol === 'prestador' && (
              <p className="mt-1 text-xs text-muted">
                📌 Los practicantes/prestadores registran pacientes, citas, diagnósticos y ejercicios; <strong>no requieren cédula profesional</strong>.
              </p>
            )}
          </Field>
        ) : (
          <div className="sm:col-span-6 rounded-lg bg-surface-2 p-3 text-xs text-muted flex items-center justify-between">
            <span>Tipo: <strong className="text-accent font-semibold">Fisioterapeuta clínico</strong> (Tipo_Emp = 1)</span>
            <span className="text-[11px] uppercase tracking-wider text-subtle">Cédula obligatoria</span>
          </div>
        )}

        <Field label="Nombre(s)" required className="sm:col-span-6" hint="varchar(100)">
          <Input maxLength={100} value={f.Nombre_Emp} onChange={set('Nombre_Emp')} placeholder="Ej. Lucía" />
        </Field>
        <Field label="Apellido paterno" className="sm:col-span-3" hint="varchar(100) — Opcional">
          <Input maxLength={100} value={f.ApellidoP_Emp} onChange={set('ApellidoP_Emp')} placeholder="Ej. Ferrer" />
        </Field>
        <Field label="Apellido materno" required className="sm:col-span-3" hint="varchar(100)">
          <Input maxLength={100} value={f.ApellidoM_Emp} onChange={set('ApellidoM_Emp')} placeholder="Ej. Ruiz" />
        </Field>

        <Field label="Número de empleado (Num_Emp)" required className="sm:col-span-2" hint={duplicado ? <span className="text-danger">Ya está en uso</span> : 'int'}>
          <Input inputMode="numeric" value={f.Num_Emp} onChange={(e) => setF({ ...f, Num_Emp: e.target.value.replace(/\D/g, '') })} placeholder="1001" />
        </Field>
        <Field label="Teléfono (Telefono_Emp)" required className="sm:col-span-2" hint="char(10)">
          <Input inputMode="tel" maxLength={10} value={f.Telefono_Emp} onChange={(e) => setF({ ...f, Telefono_Emp: e.target.value.replace(/\D/g, '') })} placeholder="5512348890" />
        </Field>
        <Field label="Clave de acceso (Clave)" required className="sm:col-span-2" hint="varchar(15)">
          <span className="relative block">
            <Input type={ver ? 'text' : 'password'} maxLength={15} value={f.Clave} onChange={set('Clave')} className="pr-10" placeholder="••••••••" />
            <button type="button" onClick={() => setVer(!ver)} className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center text-subtle hover:text-fg" aria-label="Mostrar clave">
              {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </Field>

        {esFisio && (
          <Field label="Cédula profesional (CedulaProfesional)" required hint="varchar(10) — 7 a 10 dígitos" className="sm:col-span-2">
            <Input maxLength={10} value={f.CedulaProfesional} onChange={(e) => setF({ ...f, CedulaProfesional: e.target.value.replace(/\s+/g, '') })} placeholder="10293847" />
          </Field>
        )}

        {(esFisio || esPrestador) && (
          <div className={cn('relative sm:col-span-4', !esFisio && 'sm:col-span-6')}>
            <Field label="Especialidad (Especialidad)" hint="varchar(50) — Selecciona o escribe una">
              <div className="relative">
                <Input
                  maxLength={50}
                  value={f.Especialidad}
                  onChange={(e) => {
                    setF({ ...f, Especialidad: e.target.value })
                    setFiltroEsp(e.target.value)
                    setOpenCb(true)
                  }}
                  onFocus={() => {
                    setFiltroEsp('')
                    setOpenCb(true)
                  }}
                  placeholder="Ej. Traumatología y deporte…"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setOpenCb(!openCb)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-fg"
                  tabIndex={-1}
                >
                  <ChevronDown className={cn('size-4 transition-transform', openCb && 'rotate-180')} />
                </button>
              </div>
            </Field>

            {openCb && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOpenCb(false)} />
                <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-56 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-xl ring-1 ring-black/5">
                  <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-subtle">
                    Sugerencias
                  </div>
                  {especialidadesFiltradas.length > 0 ? (
                    especialidadesFiltradas.map((esp) => {
                      const sel = f.Especialidad.toLowerCase() === esp.toLowerCase()
                      return (
                        <button
                          key={esp}
                          type="button"
                          onClick={() => {
                            setF({ ...f, Especialidad: esp })
                            setOpenCb(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-accent-soft hover:text-accent-soft-fg',
                            sel && 'bg-surface-3 font-semibold text-accent',
                          )}
                        >
                          <span>{esp}</span>
                          {sel && <Check className="size-3.5 text-accent" />}
                        </button>
                      )
                    })
                  ) : (
                    <div className="px-3 py-2 text-xs text-muted">
                      Presiona fuera para conservar "{f.Especialidad}"
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <Field label="Estatus del empleado (Estatus_Emp)" className="sm:col-span-6" hint="bit">
          <Segmented value={f.Estatus_Emp ? 1 : 0} onChange={(v) => setF({ ...f, Estatus_Emp: v === 1 })} options={[{ value: 1, label: 'Activo' }, { value: 0, label: 'Baja' }]} className="w-fit" />
        </Field>
      </div>
    </Modal>
  )
}
export default EmpleadoModal

