import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Citas from './pages/Citas'
import Pacientes from './pages/Pacientes'
import PacienteDetalle from './pages/PacienteDetalle'
import Diagnosticos from './pages/Diagnosticos'
import DiagnosticoNuevo from './pages/DiagnosticoNuevo'
import DiagnosticoDetalle from './pages/DiagnosticoDetalle'
import Ejercicios from './pages/Ejercicios'
import Catalogos from './pages/Catalogos'
import Empleados from './pages/Empleados'
import Consultorios from './pages/Consultorios'
import IdentidadNegocio from './pages/IdentidadNegocio'
import NotFound from './pages/NotFound'
import type { Rol } from './types'

/** Restringe una ruta por rol (derivado de Tipo_Emp). */
function only(roles: Rol[], Page: ComponentType) {
  return function Guarded() {
    const { rol } = useAuth()
    return rol && roles.includes(rol) ? <Page /> : <NotFound forbidden />
  }
}

const fisio: Rol[] = ['fisioterapeuta']
const ambos: Rol[] = ['fisioterapeuta', 'prestador']
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    { path: '/login', Component: Login },
    {
      path: '/',
      Component: AppLayout,
      children: [
        { index: true, Component: Dashboard },
        { path: 'agenda', Component: Agenda },
        { path: 'citas', Component: Citas },
        { path: 'pacientes', Component: Pacientes },
        { path: 'pacientes/:id', Component: PacienteDetalle },
        { path: 'diagnosticos', Component: only(ambos, Diagnosticos) },
        { path: 'diagnosticos/nuevo', Component: only(ambos, DiagnosticoNuevo) },
        { path: 'diagnosticos/:id', Component: only(ambos, DiagnosticoDetalle) },
        { path: 'ejercicios', Component: only(ambos, Ejercicios) },
        { path: 'identidad', Component: only(fisio, IdentidadNegocio) },
        { path: 'catalogos', Component: only(fisio, Catalogos) },
        { path: 'empleados', Component: only(fisio, Empleados) },
        { path: 'consultorios', Component: only(fisio, Consultorios) },
        { path: '*', Component: NotFound },
      ],
    },
  ],
  { basename },
)
