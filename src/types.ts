/*
 * Tipos 1:1 con el esquema SQL Server. Los nombres de campo se conservan
 * tal cual para que el mapeo con el backend sea directo.
 * Los bits (BIT) se modelan como boolean.
 */

/** Persona.Empleados — Tipo_Emp: true = Fisioterapeuta, false / 'prestador' = Prestador de servicio. */
export interface Empleado {
  id_Emp: number
  Num_Emp: number
  Nombre_Emp: string
  ApellidoP_Emp: string | null
  ApellidoM_Emp: string
  Tipo_Emp: boolean | 'prestador'
  Clave: string
  Telefono_Emp: string
  CedulaProfesional: string | null
  Especialidad: string | null
  Estatus_Emp: boolean
}

/** Persona.Pacientes */
export interface Paciente {
  id_Pac: number
  Nombre_Pac: string
  ApellidoP_Pac: string | null
  ApellidoM_Pac: string
  Telefono_Pac: string
  Fecha_Nacimiento: string
  Genero: 'F' | 'M'
}

/** Ejercicio.Ejercicios */
export interface Ejercicio {
  id_Ejercicio: number
  Nombre_Ejercicio: string
  Ejercicio: string
  Repeticiones: string | null
  /** PROPUESTO: no existe en el esquema. Se sugiere `Imagen_Ejercicio varchar(max)`. */
  Imagen_Ejercicio: string | null
  /** PROPUESTO: no existe en el esquema. Se sugiere FK `id_CatEjer` hacia Ejercicio.CatEjercicio. */
  id_CatEjer: number | null
}

/** Ejercicio.CatEjercicio */
export interface CatEjercicio {
  id_CatEjer: number
  Nombre_CatEjer: string | null
}

/** Catalogo.EscalaDolor — Valor_Escala es char(1). */
export interface EscalaDolor {
  id_EscalaDolor: number
  Valor_Escala: string
}

/** Catalogo.Tratamiento */
export interface Tratamiento {
  id_Trata: number
  Nombre_Trata: string
  Descrip_Trata: string
}

/** Lesion.TipoLesiones */
export interface TipoLesion {
  id_TipoLes: number
  Nom_TipoLes: string
}

/** Lesion.Lesiones */
export interface Lesion {
  id_Lesion: number
  id_TipoLes: number
  Nom_Les: string
  Grado: string | null
  Descrip_Les: string | null
}

/** Detalle.DetalleEjerLes — ejercicios recomendados por lesión. */
export interface DetalleEjerLes {
  id_DetalleEjerLes: number
  id_Lesion: number
  id_Ejercicio: number
}

/** Ubicacion.Consultorio */
export interface Consultorio {
  id_Consul: number
  Nombre_Consul: string
  Telefono_Consul: string
  Direccion: string
}

/** Persona.Cita — Estatus_Cita: true = vigente, false = cancelada. */
export interface Cita {
  id_Cita: number
  Folio: string | null
  Motivo_Cita: string | null
  Fecha_Cita: string
  Hora_Cita: string
  id_Pac: number
  id_Emp: number
  Estatus_Cita: boolean
}

/** Persona.Agenda */
export interface Agenda {
  id_Agenda: number
  Nom_Evento: string
  Fecha_Agenda: string
  Hora_Agenda: string
  id_Cita: number | null
}

/** Persona.Diagnostico */
export interface Diagnostico {
  id_Diag: number
  Num_Diag: number
  id_Cita: number
  id_Consul: number
}

/** Detalle.DetalleDiag — Tipo_Diag: true = principal, false = secundario. */
export interface DetalleDiag {
  id_DetalleDiag: number
  id_Diag: number
  Tipo_Diag: boolean
  id_Lesion: number
  RadioGrafia: string | null
  Descrip_Diag: string
  id_EscalaDolor: number
}

/** Detalle.DetalleTrata */
export interface DetalleTrata {
  id_DetalleTrata: number
  id_Trata: number
}

/** Ejercicio.DetalleEjer — ejercicios prescritos en un diagnóstico. */
export interface DetalleEjer {
  id_DetalleEjer: number
  id_Diag: number
  id_Ejercicio: number
  id_DetalleEjerLes: number | null
  Series: string
  Repeticiones: string
}

/** Detalle.DetalleCH — músculos afectados, imagen y tratamiento aplicado. */
export interface DetalleCH {
  id_DetalleCH: number
  id_Diag: number
  imag_Musculo: string
  Nombre_Musculo: string
  id_DetalleTrata: number
  Descripcion_DiagCH: string
  Vista?: Vista
  Pos_X?: number
  Pos_Y?: number
}

/** Vista del diagrama corporal: F frontal, P posterior, I lateral izquierdo (¾ anterior), D lateral derecho (¾ posterior). */
export type Vista = 'F' | 'P' | 'I' | 'D'

/** Rango de frecuencia de la corriente: B baja (< 1 000 Hz), M media (1 000–10 000 Hz), A alta (> 10 000 Hz). */
export type NivelFrecuencia = 'B' | 'M' | 'A'

/**
 * PROPUESTO: Detalle.DetalleElectrodo — no existe en el esquema.
 * Colocación de un electrodo sobre el diagrama corporal de un diagnóstico (sesión).
 * Sugerido: id_DetalleElectrodo int PK, id_Diag int FK → Persona.Diagnostico,
 * Vista char(1), Zona varchar(40), Pos_X decimal(5,1), Pos_Y decimal(5,1),
 * Frecuencia char(1) ('B' | 'M' | 'A'), Hz decimal(9,1) NULL, Voltaje decimal(5,1) NULL.
 * Pos_X / Pos_Y son porcentajes (0–100) sobre la imagen de cada vista; sirven igual para el modelo de hombre y de mujer.
 */
export interface DetalleElectrodo {
  id_DetalleElectrodo: number
  id_Diag: number
  Vista: Vista
  Zona: string
  Pos_X: number
  Pos_Y: number
  Frecuencia: NivelFrecuencia
  Hz: number | null
  Voltaje: number | null
}

export type Rol = 'fisioterapeuta' | 'prestador'
export const rolDe = (e: Empleado): Rol => {
  if (e.Tipo_Emp === 'prestador' || e.Tipo_Emp === false) return 'prestador'
  return 'fisioterapeuta'
}
