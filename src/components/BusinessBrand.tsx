import { useBusiness, type BusinessIdentity } from '../context/BusinessContext'
export default function BusinessBrand({ identity }: { identity?: BusinessIdentity }) {
  const { business } = useBusiness()
  const current = identity ?? business
  return <div className="business-report-brand">
    {current.reportImage && <img src={current.reportImage} alt={`Imagen de impresión de ${current.nombre}`} />}
    <div><strong>{current.nombre}</strong>{current.lema && <p>{current.lema}</p>}</div>
  </div>
}
