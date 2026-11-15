import { createContext, useContext, useState, type ReactNode } from 'react'
import * as mock from '../data/mock'
import { todayISO } from '../lib/format'
import type {
  Agenda,
  CatEjercicio,
  Cita,
  Consultorio,
  DetalleCH,
  DetalleDiag,
  DetalleElectrodo,
  DetalleEjer,
  DetalleEjerLes,
  DetalleTrata,
  Diagnostico,
  Ejercicio,
  Empleado,
  EscalaDolor,
  Lesion,
  Paciente,
  TipoLesion,
  Tratamiento,
  Vista,
} from '../types'

/** Estado derivado de una cita (no es columna: se calcula con Estatus_Cita y Diagnostico). */
export type EstadoCita = 'cancelada' | 'atendida' | 'programada' | 'sin_diagnostico'

export interface NuevoDiagnostico {
  id_Cita: number
  id_Consul: number
  detalles: Omit<DetalleDiag, 'id_DetalleDiag' | 'id_Diag'>[]
  musculos: { Nombre_Musculo: string; imag_Musculo: string; id_Trata: number; Descripcion_DiagCH: string; Vista?: Vista; Pos_X?: number; Pos_Y?: number }[]
  ejercicios: Omit<DetalleEjer, 'id_DetalleEjer' | 'id_Diag'>[]
  electrodos: Omit<DetalleElectrodo, 'id_DetalleElectrodo' | 'id_Diag'>[]
}

function useTable<T, K extends keyof T>(initial: T[], key: K) {
  const [rows, setRows] = useState(initial)
  const next = (list: T[]) => Math.max(0, ...list.map((r) => Number(r[key]))) + 1
  const add = (row: Omit<T, K>): T => {
    const created = { ...row, [key]: next(rows) } as T
    setRows((l) => [...l, created])
    return created
  }
  const update = (id: T[K], patch: Partial<T>) => setRows((l) => l.map((r) => (r[key] === id ? { ...r, ...patch } : r)))
  const remove = (id: T[K]) => setRows((l) => l.filter((r) => r[key] !== id))
  return { rows, setRows, add, update, remove, next: () => next(rows) }
}

function useDataStore() {
  const empleados = useTable<Empleado, 'id_Emp'>(mock.empleados, 'id_Emp')
  const pacientes = useTable<Paciente, 'id_Pac'>(mock.pacientes, 'id_Pac')
  const consultorios = useTable<Consultorio, 'id_Consul'>(mock.consultorios, 'id_Consul')
  const citas = useTable<Cita, 'id_Cita'>(mock.citas, 'id_Cita')
  const agenda = useTable<Agenda, 'id_Agenda'>(mock.agenda, 'id_Agenda')
  const ejercicios = useTable<Ejercicio, 'id_Ejercicio'>(mock.ejercicios, 'id_Ejercicio')
  const catEjercicios = useTable<CatEjercicio, 'id_CatEjer'>(mock.catEjercicios, 'id_CatEjer')
  const escalaDolor = useTable<EscalaDolor, 'id_EscalaDolor'>(mock.escalaDolor, 'id_EscalaDolor')
  const tratamientos = useTable<Tratamiento, 'id_Trata'>(mock.tratamientos, 'id_Trata')
  const tiposLesion = useTable<TipoLesion, 'id_TipoLes'>(mock.tiposLesion, 'id_TipoLes')
  const lesiones = useTable<Lesion, 'id_Lesion'>(mock.lesiones, 'id_Lesion')
  const detalleEjerLes = useTable<DetalleEjerLes, 'id_DetalleEjerLes'>(mock.detalleEjerLes, 'id_DetalleEjerLes')
  const diagnosticos = useTable<Diagnostico, 'id_Diag'>(mock.diagnosticos, 'id_Diag')
  const detalleDiag = useTable<DetalleDiag, 'id_DetalleDiag'>(mock.detalleDiag, 'id_DetalleDiag')
  const detalleTrata = useTable<DetalleTrata, 'id_DetalleTrata'>(mock.detalleTrata, 'id_DetalleTrata')
  const detalleCH = useTable<DetalleCH, 'id_DetalleCH'>(mock.detalleCH, 'id_DetalleCH')
  const detalleEjer = useTable<DetalleEjer, 'id_DetalleEjer'>(mock.detalleEjer, 'id_DetalleEjer')
  const detalleElectrodo = useTable<DetalleElectrodo, 'id_DetalleElectrodo'>(mock.detalleElectrodo, 'id_DetalleElectrodo')

  const find = <T,>(list: T[], pred: (x: T) => boolean) => list.find(pred)

  const diagDeCita = (id_Cita: number) => find(diagnosticos.rows, (d) => d.id_Cita === id_Cita)

  const estadoCita = (c: Cita): EstadoCita => {
    if (!c.Estatus_Cita) return 'cancelada'
    if (diagDeCita(c.id_Cita)) return 'atendida'
    return c.Fecha_Cita < todayISO() ? 'sin_diagnostico' : 'programada'
  }

  return {
    empleados,
    pacientes,
    consultorios,
    citas,
    agenda,
    ejercicios,
    catEjercicios,
    escalaDolor,
    tratamientos,
    tiposLesion,
    lesiones,
    detalleEjerLes,
    diagnosticos,
    detalleDiag,
    detalleTrata,
    detalleCH,
    detalleEjer,
    detalleElectrodo,

    getPaciente: (id: number) => find(pacientes.rows, (x) => x.id_Pac === id),
    getEmpleado: (id: number) => find(empleados.rows, (x) => x.id_Emp === id),
    getCita: (id: number) => find(citas.rows, (x) => x.id_Cita === id),
    getConsultorio: (id: number) => find(consultorios.rows, (x) => x.id_Consul === id),
    getLesion: (id: number) => find(lesiones.rows, (x) => x.id_Lesion === id),
    getTipoLesion: (id: number) => find(tiposLesion.rows, (x) => x.id_TipoLes === id),
    getEjercicio: (id: number) => find(ejercicios.rows, (x) => x.id_Ejercicio === id),
    getCatEjercicio: (id: number | null) => find(catEjercicios.rows, (x) => x.id_CatEjer === id),
    getEscala: (id: number) => find(escalaDolor.rows, (x) => x.id_EscalaDolor === id),
    getTratamiento: (id: number) => find(tratamientos.rows, (x) => x.id_Trata === id),
    getDetalleTrata: (id: number) => find(detalleTrata.rows, (x) => x.id_DetalleTrata === id),
    electrodosDeDiag: (id_Diag: number) => detalleElectrodo.rows.filter((x) => x.id_Diag === id_Diag),
    diagDeCita,
    estadoCita,

    /** Crea la cita y su registro en Persona.Agenda. */
    crearCita: (c: Omit<Cita, 'id_Cita' | 'Folio' | 'Estatus_Cita'>) => {
      const id = citas.next()
      const nueva: Cita = { ...c, id_Cita: id, Folio: `CIT-${String(240 + id).padStart(6, '0')}`, Estatus_Cita: true }
      citas.setRows((l) => [...l, nueva])
      const p = find(pacientes.rows, (x) => x.id_Pac === c.id_Pac)
      agenda.add({ Nom_Evento: `Cita — ${p?.Nombre_Pac} ${p?.ApellidoP_Pac ?? p?.ApellidoM_Pac}`, Fecha_Agenda: c.Fecha_Cita, Hora_Agenda: c.Hora_Cita, id_Cita: id })
      return nueva
    },

    /** Inserta Diagnostico + DetalleDiag + DetalleTrata/DetalleCH + DetalleEjer + DetalleElectrodo. */
    crearDiagnostico: (n: NuevoDiagnostico) => {
      const cita = find(citas.rows, (c) => c.id_Cita === n.id_Cita)!
      const previos = diagnosticos.rows.filter((d) => find(citas.rows, (c) => c.id_Cita === d.id_Cita)?.id_Pac === cita.id_Pac).length
      const id_Diag = diagnosticos.next()
      diagnosticos.setRows((l) => [...l, { id_Diag, Num_Diag: previos + 1, id_Cita: n.id_Cita, id_Consul: n.id_Consul }])

      let idDD = detalleDiag.next()
      detalleDiag.setRows((l) => [...l, ...n.detalles.map((x) => ({ ...x, id_Diag, id_DetalleDiag: idDD++ }))])

      let idDT = detalleTrata.next()
      let idCH = detalleCH.next()
      const trata: DetalleTrata[] = []
      const ch: DetalleCH[] = []
      for (const m of n.musculos) {
        trata.push({ id_DetalleTrata: idDT, id_Trata: m.id_Trata })
        ch.push({ id_DetalleCH: idCH++, id_Diag, imag_Musculo: m.imag_Musculo, Nombre_Musculo: m.Nombre_Musculo, id_DetalleTrata: idDT++, Descripcion_DiagCH: m.Descripcion_DiagCH, Vista: m.Vista, Pos_X: m.Pos_X, Pos_Y: m.Pos_Y })
      }
      detalleTrata.setRows((l) => [...l, ...trata])
      detalleCH.setRows((l) => [...l, ...ch])

      let idDE = detalleEjer.next()
      detalleEjer.setRows((l) => [...l, ...n.ejercicios.map((x) => ({ ...x, id_Diag, id_DetalleEjer: idDE++ }))])

      let idEl = detalleElectrodo.next()
      detalleElectrodo.setRows((l) => [...l, ...n.electrodos.map((x) => ({ ...x, id_Diag, id_DetalleElectrodo: idEl++ }))])
      return id_Diag
    },
  }
}

type DataCtx = ReturnType<typeof useDataStore>
const Ctx = createContext<DataCtx | null>(null)

/** Almacén en memoria con las tablas del esquema; los cambios se pierden al recargar. */
export function DataProvider({ children }: { children: ReactNode }) {
  const store = useDataStore()
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useData() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider')
  return ctx
}
