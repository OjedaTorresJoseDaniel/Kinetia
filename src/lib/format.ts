const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('es-MX', opts).format(parseISO(iso))
}

export function formatLongDate(iso: string) {
  const s = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseISO(iso))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

export function edad(fechaNacimiento: string): number {
  const nac = parseISO(fechaNacimiento)
  const hoy = new Date()
  let e = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--
  return e
}

export function minutes(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function horaFin(hora: string, duracionMin: number): string {
  const t = minutes(hora) + duracionMin
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
}

export function initials(nombre: string, apellidos = ''): string {
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase()
}

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type ConNombre = { Nombre_Pac: string; ApellidoP_Pac: string | null; ApellidoM_Pac: string } | { Nombre_Emp: string; ApellidoP_Emp: string | null; ApellidoM_Emp: string }

/** Nombre completo respetando que el apellido paterno es opcional en el esquema. */
export function nombreCompleto(x: ConNombre | undefined): string {
  if (!x) return '—'
  if ('Nombre_Pac' in x) return [x.Nombre_Pac, x.ApellidoP_Pac, x.ApellidoM_Pac].filter(Boolean).join(' ')
  return [x.Nombre_Emp, x.ApellidoP_Emp, x.ApellidoM_Emp].filter(Boolean).join(' ')
}

export function nombreCorto(x: ConNombre | undefined): string {
  if (!x) return '—'
  if ('Nombre_Pac' in x) return `${x.Nombre_Pac} ${x.ApellidoP_Pac ?? x.ApellidoM_Pac}`
  return `${x.Nombre_Emp} ${x.ApellidoP_Emp ?? x.ApellidoM_Emp}`
}

export function iniciales(x: ConNombre | undefined): string {
  if (!x) return '?'
  if ('Nombre_Pac' in x) return initials(x.Nombre_Pac, x.ApellidoP_Pac ?? x.ApellidoM_Pac)
  return initials(x.Nombre_Emp, x.ApellidoP_Emp ?? x.ApellidoM_Emp)
}

/** 5512348890 → 55 1234 8890 */
export function formatTel(t: string) {
  const s = t.replace(/\D/g, '')
  return s.length === 10 ? `${s.slice(0, 2)} ${s.slice(2, 6)} ${s.slice(6)}` : t
}

export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
