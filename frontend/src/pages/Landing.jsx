import { Link } from 'react-router-dom'
import './Landing.css'

export default function Landing() {
  return (
    <div className="landing grain">
      <div className="landing-gradient" />

      <header className="landing-header container">
        <span className="brand-mark">Ser & Fluir</span>
      </header>

      <main className="landing-hero container">
        <div className="hero-badge">Programa</div>
        <h1 className="hero-title">
          Conciencia<br />
          <em>Encarnada</em>
        </h1>
        <p className="hero-subtitle">
          Autoconocimiento consciente como camino de expansión
        </p>

        <div className="hero-desc">
          <p>
            Un taller vivencial para quienes reconocen algo más y quieren hacerse cargo de su vida.
            Ejercicios experienciales, tareas semanales y bitácora para autoconocimiento aplicado,
            actualizar programas y trabajar el dolor como información.
          </p>
          <p>
            Prácticas simples y constantes que devuelven coherencia, calma y creatividad.
            Si buscas integrar tu historia, volver a tu esencia y moverte desde ahí,
            este es tu espacio.
          </p>
        </div>

        <div className="hero-actions">
          <Link to="/entrar" className="btn btn-primary">Entrar a mi bitácora</Link>
        </div>
      </main>

      <footer className="landing-footer container">
        <p>Ser & Fluir · Conciencia Encarnada</p>
      </footer>
    </div>
  )
}
