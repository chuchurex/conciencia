import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/api'
import './Bitacora.css'

// Contenido estático de introducción
const INTRO_CONTENT = `
<h2>Ser y Fluir, en breve</h2>
<p>Creemos que la vida —con luces y sombras— tiene sentido. Acompañamos de forma humana y cercana para que nadie camine solo. Nuestra misión es democratizar el autoconocimiento: ofrecer herramientas simples y profundas para la construcción del cambio del ser.</p>

<h2>Por qué importa el autoconocimiento</h2>
<p>Porque es brújula y motor: te ayuda a entender lo que sientes, a leer tanto el goce como el dolor como información, a elegir mejor tus pasos y a sostener hábitos que cuidan tu energía. El resultado es agencia: pienso–siento–actúo en la misma dirección.</p>

<h2>Tu bitácora</h2>
<p>Esta bitácora es tu mapa vivo. Cada semana registrarás intenciones, hallazgos, prácticas y micro-acciones; observarás señales del cuerpo y la emoción, y elegirás indicadores amables para ver tu avance. Así, la comprensión se vuelve acción, la acción hábito y el hábito una vida más en sintonía con tu esencia.</p>
`

const SESION_NOMBRES = {
  1: 'Inicio del camino para encarnar la conciencia'
}

export default function Bitacora() {
  const [data, setData] = useState(null)
  const [activeSesion, setActiveSesion] = useState('intro')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const token = sessionStorage.getItem('participante_token')
  const nombre = sessionStorage.getItem('participante_nombre')

  useEffect(() => {
    if (!token) {
      navigate('/entrar')
      return
    }
    loadBitacora()
  }, [])

  async function loadBitacora() {
    try {
      const result = await api.getBitacora(token)
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    sessionStorage.removeItem('participante_token')
    sessionStorage.removeItem('participante_nombre')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="bitacora-page grain">
        <div className="landing-gradient" />
        <div className="bitacora-loading">Cargando tu bitácora…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bitacora-page grain">
        <div className="landing-gradient" />
        <div className="bitacora-loading">
          <p>{error}</p>
          <Link to="/entrar" className="btn btn-ghost" style={{marginTop: '1rem'}}>Volver a intentar</Link>
        </div>
      </div>
    )
  }

  const { participante, sesiones } = data
  const totalSesiones = participante.total_sesiones

  return (
    <div className="bitacora-page grain">
      <div className="landing-gradient" />

      <aside className="bitacora-sidebar">
        <div className="sidebar-header">
          <span className="brand-mark">Ser & Fluir</span>
          <h3>Conciencia Encarnada</h3>
          <p className="sidebar-cohorte">{participante.cohorte}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSesion === 'intro' ? 'active' : ''}`}
            onClick={() => setActiveSesion('intro')}
          >
            <span className="nav-dot">✦</span>
            Introducción
          </button>

          {Array.from({ length: totalSesiones }, (_, i) => {
            const num = i + 1
            const hasContent = sesiones.some(s => s.sesion === num)
            return (
              <button
                key={num}
                className={`nav-item ${activeSesion === num ? 'active' : ''} ${!hasContent ? 'locked' : ''}`}
                onClick={() => hasContent && setActiveSesion(num)}
                disabled={!hasContent}
              >
                <span className="nav-dot">{hasContent ? '●' : '○'}</span>
                Sesión {num}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-name">{participante.nombre}</p>
          <button onClick={logout} className="sidebar-logout">Salir</button>
        </div>
      </aside>

      <main className="bitacora-main">
        <div className="bitacora-content page-enter" key={activeSesion}>
          {activeSesion === 'intro' ? (
            <div>
              <div className="content-header">
                <h1>Bitácora Conciencia Encarnada</h1>
                <p className="content-greeting">Bienvenida, {participante.nombre}</p>
              </div>
              <div className="content-body" dangerouslySetInnerHTML={{ __html: INTRO_CONTENT }} />
            </div>
          ) : (
            (() => {
              const sesion = sesiones.find(s => s.sesion === activeSesion)
              if (!sesion) return <p>Sesión no disponible aún.</p>
              return (
                <div>
                  <div className="content-header">
                    <p className="content-session-label">Sesión {sesion.sesion}</p>
                    <h1>{SESION_NOMBRES[sesion.sesion] || `Sesión ${sesion.sesion}`}</h1>
                    {sesion.fecha && (
                      <p className="content-date">{new Date(sesion.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    )}
                  </div>
                  <div className="content-body bitacora-text">
                    {sesion.contenido.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <h2 key={i}>{line.replace(/\*\*/g, '')}</h2>
                      }
                      if (line.startsWith('Bitácora Conciencia')) {
                        return <p key={i} className="bitacora-header-line">{line}</p>
                      }
                      if (line.trim()) {
                        return <p key={i}>{line}</p>
                      }
                      return null
                    })}
                  </div>
                </div>
              )
            })()
          )}
        </div>
      </main>
    </div>
  )
}
