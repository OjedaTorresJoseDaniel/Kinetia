import { Link } from 'react-router'
import { Compass, Lock } from 'lucide-react'
import { Button, Card, EmptyState } from '../components/ui'

export default function NotFound({ forbidden }: { forbidden?: boolean }) {
  return (
    <Card>
      <EmptyState
        icon={forbidden ? <Lock /> : <Compass />}
        title={forbidden ? 'Módulo no disponible para tu perfil' : 'Página no encontrada'}
        text={forbidden ? 'Este módulo está restringido a otro rol. Solicita acceso al administrador si lo necesitas.' : 'La dirección que buscas no existe o fue movida.'}
        action={
          <Link to="/">
            <Button variant="secondary">Volver al inicio</Button>
          </Link>
        }
      />
    </Card>
  )
}
