import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/api'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.login(email)
      sessionStorage.setItem('participante_token', data.participante.token)
      sessionStorage.setItem('participante_nombre', data.participante.nombre)
      navigate('/bitacora')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page grain">
      <div className="landing-gradient" />

      <Link to="/" className="login-back">← Volver</Link>

      <div className="login-card page-enter">
        <h2>Tu bitácora</h2>
        <p className="login-desc">
          Ingresa el email con el que te inscribiste al programa.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Buscando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
