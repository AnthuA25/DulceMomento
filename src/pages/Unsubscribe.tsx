import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '@/components/Seo'
import { unsubscribe } from '@/services/public'

/** Baja de novedades y promociones. Requiere un clic de confirmación (evita bajas por escáneres de correo). */
export default function Unsubscribe() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const confirm = async () => {
    setState('busy')
    try {
      await unsubscribe(token)
      setState('done')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'No pudimos procesar tu solicitud.')
      setState('error')
    }
  }

  return (
    <section className="section text-center">
      <Seo title="Dejar de recibir novedades | Dulce Momento" description="Gestiona tu suscripción." path="/baja" noindex />
      <div className="container-site max-w-xl">
        {state === 'done' ? (
          <>
            <h1 className="text-4xl">Listo, ya no recibirás novedades</h1>
            <p className="mt-4">Seguirás recibiendo únicamente los correos sobre tus consultas y pedidos.</p>
            <Link to="/" className="btn-secondary mt-7">Volver al inicio</Link>
          </>
        ) : (
          <>
            <h1 className="text-4xl">¿Dejar de recibir novedades?</h1>
            <p className="mt-4">Ya no te enviaremos promociones ni recomendaciones de Dulce Momento por correo electrónico.</p>
            {state === 'error' && <p role="alert" className="field-error mt-4">{message}</p>}
            <button type="button" className="btn-primary mt-7" onClick={confirm} disabled={!token || state === 'busy'}>
              {state === 'busy' ? 'Procesando…' : 'Confirmar baja'}
            </button>
            {!token && <p className="field-error mt-4">El enlace no es válido.</p>}
          </>
        )}
      </div>
    </section>
  )
}
