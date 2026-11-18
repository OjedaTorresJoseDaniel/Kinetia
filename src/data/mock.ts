import { addDays, todayISO } from '../lib/format'
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
} from '../types'

const d = (offset: number) => addDays(todayISO(), offset)
export const img = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

export const IMG_LOGIN = img('1649751361457-01d3a696c7e6', 1400)
const RX_1 = img('1564725075388-cc8338732289')
const RX_2 = img('1516069677018-378515003435')
const MUSC_1 = img('1729339983367-770c2527ce75')
const MUSC_2 = img('1515101659865-0902ffaaa6c8')

/* ---------- Persona ---------- */

export const empleados: Empleado[] = [
  { id_Emp: 1, Num_Emp: 1001, Nombre_Emp: 'Lucía', ApellidoP_Emp: 'Ferrer', ApellidoM_Emp: 'Ruiz', Tipo_Emp: true, Clave: 'fisio123', Telefono_Emp: '5512348890', CedulaProfesional: '10293847', Especialidad: 'Traumatología y deporte', Estatus_Emp: true },
  { id_Emp: 2, Num_Emp: 1002, Nombre_Emp: 'Martín', ApellidoP_Emp: 'Ortega', ApellidoM_Emp: 'Salas', Tipo_Emp: true, Clave: 'fisio456', Telefono_Emp: '5522104471', CedulaProfesional: '11827364', Especialidad: 'Neurorrehabilitación', Estatus_Emp: true },
  { id_Emp: 3, Num_Emp: 1003, Nombre_Emp: 'Sofía', ApellidoP_Emp: 'Guerrero', ApellidoM_Emp: 'Paz', Tipo_Emp: true, Clave: 'fisio789', Telefono_Emp: '5590871123', CedulaProfesional: '12736455', Especialidad: 'Rehabilitación deportiva', Estatus_Emp: true },
  { id_Emp: 4, Num_Emp: 1004, Nombre_Emp: 'Diego', ApellidoP_Emp: 'Navarro', ApellidoM_Emp: 'León', Tipo_Emp: true, Clave: 'fisio000', Telefono_Emp: '5533456612', CedulaProfesional: '10928374', Especialidad: 'Columna y postura', Estatus_Emp: false },
  { id_Emp: 5, Num_Emp: 2001, Nombre_Emp: 'Mateo', ApellidoP_Emp: 'Valdez', ApellidoM_Emp: 'Ríos', Tipo_Emp: 'prestador', Clave: 'pract123', Telefono_Emp: '5588990011', CedulaProfesional: null, Especialidad: 'Fisioterapia General (Prácticas)', Estatus_Emp: true },
  { id_Emp: 6, Num_Emp: 2002, Nombre_Emp: 'Camila', ApellidoP_Emp: 'Torres', ApellidoM_Emp: 'Vargas', Tipo_Emp: 'prestador', Clave: 'pract456', Telefono_Emp: '5544332211', CedulaProfesional: null, Especialidad: 'Rehabilitación física (Servicio social)', Estatus_Emp: true },
]

export const pacientes: Paciente[] = [
  { id_Pac: 1, Nombre_Pac: 'Carlos', ApellidoP_Pac: 'Méndez', ApellidoM_Pac: 'Ibarra', Telefono_Pac: '5511372311', Fecha_Nacimiento: '1986-04-12', Genero: 'M' },
  { id_Pac: 2, Nombre_Pac: 'Valeria', ApellidoP_Pac: 'Ríos', ApellidoM_Pac: 'Campos', Telefono_Pac: '5512742622', Fecha_Nacimiento: '1994-09-03', Genero: 'F' },
  { id_Pac: 3, Nombre_Pac: 'Roberto', ApellidoP_Pac: 'Salinas', ApellidoM_Pac: 'Gil', Telefono_Pac: '5514112933', Fecha_Nacimiento: '1958-01-27', Genero: 'M' },
  { id_Pac: 4, Nombre_Pac: 'Fernanda', ApellidoP_Pac: 'Aguilar', ApellidoM_Pac: 'Vega', Telefono_Pac: '5515483244', Fecha_Nacimiento: '1990-11-18', Genero: 'F' },
  { id_Pac: 5, Nombre_Pac: 'Jorge', ApellidoP_Pac: 'Castillo', ApellidoM_Pac: 'Rey', Telefono_Pac: '5516853555', Fecha_Nacimiento: '1979-06-08', Genero: 'M' },
  { id_Pac: 6, Nombre_Pac: 'Ximena', ApellidoP_Pac: 'Paredes', ApellidoM_Pac: 'Luna', Telefono_Pac: '5518223866', Fecha_Nacimiento: '1988-02-14', Genero: 'F' },
  { id_Pac: 7, Nombre_Pac: 'Emilio', ApellidoP_Pac: 'Herrera', ApellidoM_Pac: 'Soto', Telefono_Pac: '5519594177', Fecha_Nacimiento: '2002-07-30', Genero: 'M' },
  { id_Pac: 8, Nombre_Pac: 'Patricia', ApellidoP_Pac: 'Domínguez', ApellidoM_Pac: 'Mora', Telefono_Pac: '5520964488', Fecha_Nacimiento: '1967-12-05', Genero: 'F' },
  { id_Pac: 9, Nombre_Pac: 'Andrés', ApellidoP_Pac: 'Fuentes', ApellidoM_Pac: 'Lara', Telefono_Pac: '5522334799', Fecha_Nacimiento: '1983-03-22', Genero: 'M' },
  { id_Pac: 10, Nombre_Pac: 'Camila', ApellidoP_Pac: null, ApellidoM_Pac: 'Ochoa', Telefono_Pac: '5523705010', Fecha_Nacimiento: '1999-05-16', Genero: 'F' },
  { id_Pac: 11, Nombre_Pac: 'Héctor', ApellidoP_Pac: 'Ramírez', ApellidoM_Pac: 'Duarte', Telefono_Pac: '5525075321', Fecha_Nacimiento: '1972-10-09', Genero: 'M' },
  { id_Pac: 12, Nombre_Pac: 'Daniela', ApellidoP_Pac: 'Ponce', ApellidoM_Pac: 'Arias', Telefono_Pac: '5526445632', Fecha_Nacimiento: '1996-08-01', Genero: 'F' },
]

/* ---------- Ubicación ---------- */

export const consultorios: Consultorio[] = [
  { id_Consul: 1, Nombre_Consul: 'Consultorio 1 — Terapia manual', Telefono_Consul: '5552081100', Direccion: 'Av. Insurgentes Sur 1458, Col. Actipan' },
  { id_Consul: 2, Nombre_Consul: 'Consultorio 2 — Rehabilitación', Telefono_Consul: '5552081101', Direccion: 'Av. Insurgentes Sur 1458, Col. Actipan' },
  { id_Consul: 3, Nombre_Consul: 'Gimnasio terapéutico', Telefono_Consul: '5552081102', Direccion: 'Av. Insurgentes Sur 1458, planta baja' },
]

/* ---------- Catálogos ---------- */

export const escalaDolor: EscalaDolor[] = Array.from({ length: 10 }, (_, i) => ({ id_EscalaDolor: i + 1, Valor_Escala: String(i) }))

export const tratamientos: Tratamiento[] = [
  { id_Trata: 1, Nombre_Trata: 'Terapia manual', Descrip_Trata: 'Movilizaciones y manipulaciones articulares para recuperar el rango de movimiento.' },
  { id_Trata: 2, Nombre_Trata: 'Punción seca', Descrip_Trata: 'Inserción de aguja en puntos gatillo miofasciales para disminuir dolor y tensión.' },
  { id_Trata: 3, Nombre_Trata: 'Electroterapia (TENS)', Descrip_Trata: 'Estimulación eléctrica transcutánea con fines analgésicos.' },
  { id_Trata: 4, Nombre_Trata: 'Ultrasonido terapéutico', Descrip_Trata: 'Ondas mecánicas para favorecer la reparación de tejidos blandos.' },
  { id_Trata: 5, Nombre_Trata: 'Vendaje neuromuscular', Descrip_Trata: 'Kinesiotape para soporte, propiocepción y drenaje.' },
  { id_Trata: 6, Nombre_Trata: 'Crioterapia', Descrip_Trata: 'Aplicación de frío para control de inflamación aguda.' },
  { id_Trata: 7, Nombre_Trata: 'Masoterapia', Descrip_Trata: 'Masaje terapéutico y liberación miofascial.' },
  { id_Trata: 8, Nombre_Trata: 'Laserterapia', Descrip_Trata: 'Láser de baja potencia con efecto antiinflamatorio y analgésico.' },
]

export const tiposLesion: TipoLesion[] = [
  { id_TipoLes: 1, Nom_TipoLes: 'Muscular' },
  { id_TipoLes: 2, Nom_TipoLes: 'Ligamentosa' },
  { id_TipoLes: 3, Nom_TipoLes: 'Tendinosa' },
  { id_TipoLes: 4, Nom_TipoLes: 'Articular' },
  { id_TipoLes: 5, Nom_TipoLes: 'Ósea' },
  { id_TipoLes: 6, Nom_TipoLes: 'Nerviosa' },
]

export const lesiones: Lesion[] = [
  { id_Lesion: 1, id_TipoLes: 1, Nom_Les: 'Desgarro de isquiotibiales', Grado: '2', Descrip_Les: 'Rotura parcial de fibras musculares del compartimento posterior del muslo.' },
  { id_Lesion: 2, id_TipoLes: 1, Nom_Les: 'Contractura de trapecio', Grado: null, Descrip_Les: 'Contracción involuntaria y sostenida del trapecio superior.' },
  { id_Lesion: 3, id_TipoLes: 2, Nom_Les: 'Esguince de tobillo', Grado: '2', Descrip_Les: 'Distensión con rotura parcial del ligamento peroneoastragalino anterior.' },
  { id_Lesion: 4, id_TipoLes: 2, Nom_Les: 'Rotura de LCA', Grado: '3', Descrip_Les: 'Rotura completa del ligamento cruzado anterior de la rodilla.' },
  { id_Lesion: 5, id_TipoLes: 3, Nom_Les: 'Tendinopatía del supraespinoso', Grado: null, Descrip_Les: 'Degeneración del tendón del supraespinoso con dolor en abducción.' },
  { id_Lesion: 6, id_TipoLes: 3, Nom_Les: 'Fascitis plantar', Grado: null, Descrip_Les: 'Inflamación de la fascia plantar en su inserción calcánea.' },
  { id_Lesion: 7, id_TipoLes: 4, Nom_Les: 'Gonartrosis', Grado: '2', Descrip_Les: 'Desgaste del cartílago articular de la rodilla.' },
  { id_Lesion: 8, id_TipoLes: 4, Nom_Les: 'Cervicalgia mecánica', Grado: null, Descrip_Les: 'Dolor cervical asociado a postura y sobrecarga.' },
  { id_Lesion: 9, id_TipoLes: 5, Nom_Les: 'Fractura de radio distal', Grado: null, Descrip_Les: 'Fractura de Colles en fase de consolidación.' },
  { id_Lesion: 10, id_TipoLes: 6, Nom_Les: 'Lumbociática', Grado: null, Descrip_Les: 'Dolor lumbar irradiado por compresión de raíz nerviosa L5-S1.' },
]

export const catEjercicios: CatEjercicio[] = [
  { id_CatEjer: 1, Nombre_CatEjer: 'Movilidad' },
  { id_CatEjer: 2, Nombre_CatEjer: 'Fortalecimiento' },
  { id_CatEjer: 3, Nombre_CatEjer: 'Estiramiento' },
  { id_CatEjer: 4, Nombre_CatEjer: 'Propiocepción' },
  { id_CatEjer: 5, Nombre_CatEjer: 'Equilibrio' },
]

export const ejercicios: Ejercicio[] = [
  { id_Ejercicio: 1, Nombre_Ejercicio: 'Rotación externa con banda', Ejercicio: 'Codo a 90° pegado al tronco, rotar hacia fuera', Repeticiones: '12', Imagen_Ejercicio: img('1645005512942-a17817fb7c11'), id_CatEjer: 2 },
  { id_Ejercicio: 2, Nombre_Ejercicio: 'Remo con banda elástica', Ejercicio: 'Tracción horizontal llevando escápulas atrás', Repeticiones: '15', Imagen_Ejercicio: img('1645005512964-5057008b4425'), id_CatEjer: 2 },
  { id_Ejercicio: 3, Nombre_Ejercicio: 'Estiramiento de isquiotibiales', Ejercicio: 'Pierna elevada y extendida con asistencia', Repeticiones: '30 s', Imagen_Ejercicio: img('1540206276207-3af25c08abc4'), id_CatEjer: 3 },
  { id_Ejercicio: 4, Nombre_Ejercicio: 'Sentadilla asistida', Ejercicio: 'Flexión de rodillas hasta 60° con control', Repeticiones: '10', Imagen_Ejercicio: img('1649887974297-4be052375a67'), id_CatEjer: 2 },
  { id_Ejercicio: 5, Nombre_Ejercicio: 'Apoyo monopodal', Ejercicio: 'Equilibrio en un pie sobre superficie estable', Repeticiones: '30 s', Imagen_Ejercicio: img('1637157216470-d92cd2edb2e8'), id_CatEjer: 5 },
  { id_Ejercicio: 6, Nombre_Ejercicio: 'Estiramiento de tríceps y hombro', Ejercicio: 'Brazo cruzado por detrás de la cabeza', Repeticiones: '30 s', Imagen_Ejercicio: img('1785926262461-8a7cb6a3678a'), id_CatEjer: 3 },
  { id_Ejercicio: 7, Nombre_Ejercicio: 'Peso muerto rumano ligero', Ejercicio: 'Bisagra de cadera con rodilla semiflexionada', Repeticiones: '8', Imagen_Ejercicio: img('1541534741688-6078c6bfb5c5'), id_CatEjer: 2 },
  { id_Ejercicio: 8, Nombre_Ejercicio: 'Retracción cervical', Ejercicio: 'Deslizar el mentón hacia atrás sin flexionar', Repeticiones: '10', Imagen_Ejercicio: null, id_CatEjer: 1 },
  { id_Ejercicio: 9, Nombre_Ejercicio: 'Elevación de talones', Ejercicio: 'De pie, subir talones y bajar en 3 segundos', Repeticiones: '15', Imagen_Ejercicio: null, id_CatEjer: 2 },
  { id_Ejercicio: 10, Nombre_Ejercicio: 'Rodamiento plantar', Ejercicio: 'Rodar pelota bajo el arco del pie', Repeticiones: '1 min', Imagen_Ejercicio: null, id_CatEjer: 1 },
  { id_Ejercicio: 11, Nombre_Ejercicio: 'Puente de glúteo', Ejercicio: 'Decúbito supino, elevar pelvis', Repeticiones: '15', Imagen_Ejercicio: null, id_CatEjer: 2 },
]

export const detalleEjerLes: DetalleEjerLes[] = [
  { id_DetalleEjerLes: 1, id_Lesion: 1, id_Ejercicio: 3 },
  { id_DetalleEjerLes: 2, id_Lesion: 1, id_Ejercicio: 7 },
  { id_DetalleEjerLes: 3, id_Lesion: 1, id_Ejercicio: 11 },
  { id_DetalleEjerLes: 4, id_Lesion: 2, id_Ejercicio: 8 },
  { id_DetalleEjerLes: 5, id_Lesion: 2, id_Ejercicio: 6 },
  { id_DetalleEjerLes: 6, id_Lesion: 3, id_Ejercicio: 5 },
  { id_DetalleEjerLes: 7, id_Lesion: 3, id_Ejercicio: 9 },
  { id_DetalleEjerLes: 8, id_Lesion: 4, id_Ejercicio: 4 },
  { id_DetalleEjerLes: 9, id_Lesion: 4, id_Ejercicio: 5 },
  { id_DetalleEjerLes: 10, id_Lesion: 5, id_Ejercicio: 1 },
  { id_DetalleEjerLes: 11, id_Lesion: 5, id_Ejercicio: 2 },
  { id_DetalleEjerLes: 12, id_Lesion: 6, id_Ejercicio: 10 },
  { id_DetalleEjerLes: 13, id_Lesion: 6, id_Ejercicio: 9 },
  { id_DetalleEjerLes: 14, id_Lesion: 7, id_Ejercicio: 4 },
  { id_DetalleEjerLes: 15, id_Lesion: 8, id_Ejercicio: 8 },
  { id_DetalleEjerLes: 16, id_Lesion: 10, id_Ejercicio: 11 },
]

/* ---------- Citas y agenda ---------- */

const cita = (id: number, off: number, hora: string, pac: number, emp: number, motivo: string, vigente = true): Cita => ({
  id_Cita: id,
  Folio: `CIT-${String(240 + id).padStart(6, '0')}`,
  Motivo_Cita: motivo,
  Fecha_Cita: d(off),
  Hora_Cita: hora,
  id_Pac: pac,
  id_Emp: emp,
  Estatus_Cita: vigente,
})

export const citas: Cita[] = [
  cita(1, -12, '10:00', 7, 1, 'Valoración postquirúrgica de rodilla'),
  cita(2, -9, '12:00', 4, 1, 'Dolor cervical persistente'),
  cita(3, -6, '09:30', 9, 1, 'Dolor de hombro al levantar el brazo'),
  cita(4, -4, '16:00', 1, 1, 'Torcedura de tobillo jugando fútbol'),
  cita(5, -3, '11:00', 3, 2, 'Dolor lumbar irradiado a pierna'),
  cita(6, -2, '13:00', 12, 1, 'Dolor en talón al despertar'),
  cita(7, -1, '10:00', 2, 3, 'Molestia posterior del muslo al correr'),
  cita(8, -1, '17:00', 8, 2, 'Seguimiento rodilla', false),
  // Hoy
  cita(9, 0, '08:30', 7, 1, 'Revisión de avance LCA'),
  cita(10, 0, '10:00', 4, 1, 'Seguimiento cervicalgia'),
  cita(11, 0, '11:30', 5, 1, 'Primera valoración — dolor de espalda'),
  cita(12, 0, '13:00', 11, 1, 'Dolor de rodilla al subir escaleras'),
  cita(13, 0, '16:30', 10, 1, 'Esguince reciente', false),
  cita(14, 0, '17:30', 6, 1, 'Dolor de muñeca tras caída'),
  cita(15, 0, '09:00', 3, 2, 'Seguimiento lumbociática'),
  cita(16, 0, '12:00', 8, 2, 'Dolor de rodilla crónico'),
  cita(17, 0, '10:30', 2, 3, 'Seguimiento isquiotibiales'),
  cita(18, 0, '15:00', 12, 3, 'Revisión fascitis'),
  // Próximos días
  cita(19, 1, '09:00', 9, 1, 'Seguimiento hombro'),
  cita(20, 1, '12:30', 1, 1, 'Seguimiento tobillo'),
  cita(21, 2, '10:00', 7, 1, 'Revisión de avance LCA'),
  cita(22, 2, '11:00', 3, 2, 'Seguimiento lumbociática'),
  cita(23, 3, '16:00', 4, 1, 'Seguimiento cervicalgia'),
  cita(24, 4, '09:30', 2, 3, 'Alta deportiva'),
]

const nombrePac = (id: number) => {
  const p = pacientes.find((x) => x.id_Pac === id)!
  return `${p.Nombre_Pac} ${p.ApellidoP_Pac ?? p.ApellidoM_Pac}`
}

export const agenda: Agenda[] = [
  ...citas.map((c, i) => ({ id_Agenda: i + 1, Nom_Evento: `Cita — ${nombrePac(c.id_Pac)}`, Fecha_Agenda: c.Fecha_Cita, Hora_Agenda: c.Hora_Cita, id_Cita: c.id_Cita })),
  { id_Agenda: 100, Nom_Evento: 'Junta clínica semanal', Fecha_Agenda: d(0), Hora_Agenda: '14:00', id_Cita: null },
  { id_Agenda: 101, Nom_Evento: 'Mantenimiento de equipo de electroterapia', Fecha_Agenda: d(1), Hora_Agenda: '08:00', id_Cita: null },
  { id_Agenda: 102, Nom_Evento: 'Capacitación: punción seca avanzada', Fecha_Agenda: d(3), Hora_Agenda: '18:00', id_Cita: null },
  { id_Agenda: 103, Nom_Evento: 'Inventario de material', Fecha_Agenda: d(-2), Hora_Agenda: '19:00', id_Cita: null },
]

/* ---------- Diagnóstico ---------- */

export const diagnosticos: Diagnostico[] = [
  { id_Diag: 1, Num_Diag: 1, id_Cita: 1, id_Consul: 2 },
  { id_Diag: 2, Num_Diag: 1, id_Cita: 2, id_Consul: 1 },
  { id_Diag: 3, Num_Diag: 1, id_Cita: 3, id_Consul: 1 },
  { id_Diag: 4, Num_Diag: 1, id_Cita: 4, id_Consul: 2 },
  { id_Diag: 5, Num_Diag: 1, id_Cita: 5, id_Consul: 2 },
  { id_Diag: 6, Num_Diag: 1, id_Cita: 7, id_Consul: 3 },
  { id_Diag: 7, Num_Diag: 2, id_Cita: 9, id_Consul: 3 },
]

export const detalleDiag: DetalleDiag[] = [
  { id_DetalleDiag: 1, id_Diag: 1, Tipo_Diag: true, id_Lesion: 4, RadioGrafia: RX_1, Descrip_Diag: 'Postoperatorio de reconstrucción de LCA con injerto de isquiotibiales. Derrame moderado y atrofia de cuádriceps. Flexión 85°.', id_EscalaDolor: 7 },
  { id_DetalleDiag: 2, id_Diag: 2, Tipo_Diag: true, id_Lesion: 8, RadioGrafia: null, Descrip_Diag: 'Dolor cervical con irradiación a trapecio. Rotación izquierda limitada 40%.', id_EscalaDolor: 8 },
  { id_DetalleDiag: 3, id_Diag: 2, Tipo_Diag: false, id_Lesion: 2, RadioGrafia: null, Descrip_Diag: 'Puntos gatillo activos en trapecio superior derecho.', id_EscalaDolor: 6 },
  { id_DetalleDiag: 4, id_Diag: 3, Tipo_Diag: true, id_Lesion: 5, RadioGrafia: RX_2, Descrip_Diag: 'Arco doloroso entre 70° y 120° de abducción. Neer y Hawkins positivos.', id_EscalaDolor: 7 },
  { id_DetalleDiag: 5, id_Diag: 4, Tipo_Diag: true, id_Lesion: 3, RadioGrafia: RX_1, Descrip_Diag: 'Edema perimaleolar lateral, cajón anterior levemente positivo. Se descarta fractura.', id_EscalaDolor: 6 },
  { id_DetalleDiag: 6, id_Diag: 5, Tipo_Diag: true, id_Lesion: 10, RadioGrafia: RX_2, Descrip_Diag: 'Lasègue positivo a 45° pierna izquierda. Parestesias en dorso del pie.', id_EscalaDolor: 8 },
  { id_DetalleDiag: 7, id_Diag: 6, Tipo_Diag: true, id_Lesion: 1, RadioGrafia: null, Descrip_Diag: 'Dolor a la palpación en tercio medio de bíceps femoral. Fuerza 3/5.', id_EscalaDolor: 5 },
  { id_DetalleDiag: 8, id_Diag: 7, Tipo_Diag: true, id_Lesion: 4, RadioGrafia: null, Descrip_Diag: 'Evolución favorable. Flexión 130°, extensión completa, sin derrame.', id_EscalaDolor: 3 },
]

export const detalleTrata: DetalleTrata[] = [
  { id_DetalleTrata: 1, id_Trata: 6 },
  { id_DetalleTrata: 2, id_Trata: 2 },
  { id_DetalleTrata: 3, id_Trata: 1 },
  { id_DetalleTrata: 4, id_Trata: 4 },
  { id_DetalleTrata: 5, id_Trata: 5 },
  { id_DetalleTrata: 6, id_Trata: 3 },
  { id_DetalleTrata: 7, id_Trata: 7 },
  { id_DetalleTrata: 8, id_Trata: 1 },
]

export const detalleCH: DetalleCH[] = [
  { id_DetalleCH: 1, id_Diag: 1, imag_Musculo: MUSC_1, Nombre_Musculo: 'Cuádriceps (vasto medial)', id_DetalleTrata: 1, Descripcion_DiagCH: 'Atrofia marcada del vasto medial oblicuo, inhibición artrogénica.', Vista: 'F', Pos_X: 43, Pos_Y: 62 },
  { id_DetalleCH: 2, id_Diag: 2, imag_Musculo: MUSC_2, Nombre_Musculo: 'Trapecio superior', id_DetalleTrata: 2, Descripcion_DiagCH: 'Banda tensa palpable con dolor referido a región temporal.', Vista: 'P', Pos_X: 59, Pos_Y: 21 },
  { id_DetalleCH: 3, id_Diag: 2, imag_Musculo: MUSC_1, Nombre_Musculo: 'Elevador de la escápula', id_DetalleTrata: 3, Descripcion_DiagCH: 'Acortamiento y dolor a la inclinación contralateral.', Vista: 'P', Pos_X: 50, Pos_Y: 20 },
  { id_DetalleCH: 4, id_Diag: 3, imag_Musculo: MUSC_2, Nombre_Musculo: 'Supraespinoso', id_DetalleTrata: 4, Descripcion_DiagCH: 'Dolor a la contracción resistida en abducción.', Vista: 'P', Pos_X: 68, Pos_Y: 23 },
  { id_DetalleCH: 5, id_Diag: 4, imag_Musculo: MUSC_1, Nombre_Musculo: 'Peroneos laterales', id_DetalleTrata: 5, Descripcion_DiagCH: 'Debilidad en eversión, control propioceptivo deficiente.', Vista: 'D', Pos_X: 55, Pos_Y: 82 },
  { id_DetalleCH: 6, id_Diag: 5, imag_Musculo: MUSC_2, Nombre_Musculo: 'Piriforme', id_DetalleTrata: 6, Descripcion_DiagCH: 'Hipertonía con reproducción del dolor ciático.', Vista: 'P', Pos_X: 42, Pos_Y: 50 },
  { id_DetalleCH: 7, id_Diag: 6, imag_Musculo: MUSC_1, Nombre_Musculo: 'Bíceps femoral', id_DetalleTrata: 7, Descripcion_DiagCH: 'Zona de lesión de 3 cm en unión miotendinosa.', Vista: 'P', Pos_X: 58, Pos_Y: 62 },
  { id_DetalleCH: 8, id_Diag: 7, imag_Musculo: MUSC_1, Nombre_Musculo: 'Cuádriceps (vasto medial)', id_DetalleTrata: 8, Descripcion_DiagCH: 'Recuperación de trofismo, déficit de fuerza 20%.', Vista: 'F', Pos_X: 43, Pos_Y: 62 },
]

export const detalleEjer: DetalleEjer[] = [
  { id_DetalleEjer: 1, id_Diag: 1, id_Ejercicio: 4, id_DetalleEjerLes: 8, Series: '3', Repeticiones: '10' },
  { id_DetalleEjer: 2, id_Diag: 1, id_Ejercicio: 5, id_DetalleEjerLes: 9, Series: '3', Repeticiones: '30 s' },
  { id_DetalleEjer: 3, id_Diag: 2, id_Ejercicio: 8, id_DetalleEjerLes: 4, Series: '3', Repeticiones: '10' },
  { id_DetalleEjer: 4, id_Diag: 2, id_Ejercicio: 6, id_DetalleEjerLes: 5, Series: '2', Repeticiones: '30 s' },
  { id_DetalleEjer: 5, id_Diag: 3, id_Ejercicio: 1, id_DetalleEjerLes: 10, Series: '3', Repeticiones: '12' },
  { id_DetalleEjer: 6, id_Diag: 3, id_Ejercicio: 2, id_DetalleEjerLes: 11, Series: '3', Repeticiones: '15' },
  { id_DetalleEjer: 7, id_Diag: 4, id_Ejercicio: 5, id_DetalleEjerLes: 6, Series: '3', Repeticiones: '30 s' },
  { id_DetalleEjer: 8, id_Diag: 4, id_Ejercicio: 9, id_DetalleEjerLes: 7, Series: '3', Repeticiones: '15' },
  { id_DetalleEjer: 9, id_Diag: 5, id_Ejercicio: 11, id_DetalleEjerLes: 16, Series: '3', Repeticiones: '12' },
  { id_DetalleEjer: 10, id_Diag: 6, id_Ejercicio: 3, id_DetalleEjerLes: 1, Series: '3', Repeticiones: '30 s' },
  { id_DetalleEjer: 11, id_Diag: 6, id_Ejercicio: 7, id_DetalleEjerLes: 2, Series: '3', Repeticiones: '8' },
  { id_DetalleEjer: 12, id_Diag: 7, id_Ejercicio: 4, id_DetalleEjerLes: 8, Series: '4', Repeticiones: '12' },
]

/* ---------- Electroterapia (tabla propuesta) ---------- */

const el = (id_DetalleElectrodo: number, id_Diag: number, Vista: DetalleElectrodo['Vista'], Zona: string, Pos_X: number, Pos_Y: number, Frecuencia: DetalleElectrodo['Frecuencia'], Hz: number | null, Voltaje: number | null): DetalleElectrodo => ({ id_DetalleElectrodo, id_Diag, Vista, Zona, Pos_X, Pos_Y, Frecuencia, Hz, Voltaje })

export const detalleElectrodo: DetalleElectrodo[] = [
  // Diag 1 — LCA rodilla derecha (Emilio)
  el(1, 1, 'F', 'Muslo anterior derecho', 41, 57, 'B', 80, 22),
  el(2, 1, 'F', 'Muslo anterior derecho', 43, 64, 'B', 80, 22),
  el(3, 1, 'F', 'Rodilla derecha', 39, 72, 'M', 4000, 30),
  el(4, 1, 'F', 'Rodilla derecha', 47, 72, 'M', 4000, 30),
  // Diag 2 — Cervicalgia y trapecio derecho (Fernanda)
  el(5, 2, 'P', 'Cervical', 46, 17, 'B', 100, 18),
  el(6, 2, 'P', 'Cervical', 54, 17, 'B', 100, 18),
  el(7, 2, 'P', 'Trapecio derecho', 60, 21, 'A', 15000, 12),
  el(8, 2, 'P', 'Escápula derecha', 61, 28, 'A', 15000, 12),
  // Diag 3 — Supraespinoso derecho (Andrés)
  el(9, 3, 'F', 'Hombro derecho', 33, 24, 'M', 4000, 25),
  el(10, 3, 'P', 'Hombro derecho', 67, 24, 'M', 4000, 25),
  el(11, 3, 'D', 'Hombro derecho', 66, 25, 'B', 120, 20),
  el(12, 3, 'D', 'Brazo derecho', 72, 33, 'B', 120, 20),
  // Diag 4 — Esguince de tobillo derecho (Carlos)
  el(13, 4, 'D', 'Tobillo derecho', 55, 89, 'A', 12000, 10),
  el(14, 4, 'D', 'Pantorrilla derecha', 53, 79, 'B', 50, 24),
  el(15, 4, 'D', 'Talón derecho', 57, 94, 'B', 50, 24),
  // Diag 5 — Lumbociática izquierda (Roberto)
  el(16, 5, 'P', 'Lumbar', 45, 42, 'B', 80, 28),
  el(17, 5, 'P', 'Lumbar', 55, 42, 'B', 80, 28),
  el(18, 5, 'P', 'Glúteo izquierdo', 42, 50, 'M', 4000, 32),
  el(19, 5, 'P', 'Muslo posterior izquierdo', 44, 62, 'B', 80, 28),
  // Diag 6 — Isquiotibiales derechos (Valeria)
  el(20, 6, 'P', 'Muslo posterior derecho', 58, 59, 'A', 15000, 14),
  el(21, 6, 'P', 'Muslo posterior derecho', 57, 66, 'M', 2500, 26),
  // Diag 7 — Seguimiento LCA (Emilio)
  el(22, 7, 'F', 'Muslo anterior derecho', 42, 58, 'B', 60, 20),
  el(23, 7, 'F', 'Muslo anterior derecho', 43, 65, 'B', 60, 20),
  el(24, 7, 'F', 'Rodilla derecha', 44, 72, 'M', 4000, 26),
  el(25, 7, 'D', 'Muslo lateral derecho', 61, 60, 'B', 60, 20),
]
