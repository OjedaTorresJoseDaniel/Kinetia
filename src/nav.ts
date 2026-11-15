import { Settings, BookOpen, Building2, CalendarDays, CalendarClock, Dumbbell, FileHeart, IdCard, LayoutGrid, Users, type LucideIcon } from 'lucide-react'
import type { Rol } from './types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  roles: Rol[]
}

const ambos: Rol[] = ['fisioterapeuta', 'prestador']

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'General',
    items: [
      { to: '/', label: 'Inicio', icon: LayoutGrid, roles: ambos },
      { to: '/agenda', label: 'Agenda', icon: CalendarDays, roles: ambos },
      { to: '/citas', label: 'Citas', icon: CalendarClock, roles: ambos },
      { to: '/pacientes', label: 'Pacientes', icon: Users, roles: ambos },
    ],
  },
  {
    label: 'Clínica',
    items: [
      { to: '/diagnosticos', label: 'Diagnósticos', icon: FileHeart, roles: ambos },
      { to: '/ejercicios', label: 'Ejercicios', icon: Dumbbell, roles: ambos },
      { to: '/catalogos', label: 'Catálogos clínicos', icon: BookOpen, roles: ['fisioterapeuta'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/identidad', label: 'Identidad del negocio', icon: Settings, roles: ['fisioterapeuta'] },
      { to: '/empleados', label: 'Empleados', icon: IdCard, roles: ['fisioterapeuta'] },
      { to: '/consultorios', label: 'Consultorios', icon: Building2, roles: ['fisioterapeuta'] },
    ],
  },
]

export const rolLabel: Record<Rol, string> = {
  fisioterapeuta: 'Fisioterapeuta',
  prestador: 'Prestador de servicio',
}
