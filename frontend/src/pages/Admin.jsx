import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/api'
import './Admin.css'

export default function Admin() {
  const [authed, setAuthed] = useState(!!sessionStorage.getItem('admin_token'))
  const [secret, setSecret] = useState('')
  const [view, setView] = useState('dashboard') // dashboard, participantes, bitacoras, prompts
  const [cohortes, setCohortes] = useState([])
  const [selectedCohorte, setSelectedCohorte] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [bitacoras, setBitacoras] = useState([])
  const [sesionActual, setSesionActual] = useState(1)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (authed) loadCohortes()
  }, [authed])

  function doLogin(e) {
    e.preventDefault()
    sessionStorage.setItem('admin_token', secret)
    setAuthed(true)
  }

  async function loadCohortes() {
    try {
      const data = await api.getCohortes()
      setCohortes(data.cohortes)
      if (data.cohortes.length > 0) setSelectedCohorte(data.cohortes[0])
    } catch (err) {
      setMsg('Error: ' + err.message)
      sessionStorage.removeItem('admin_token')
      setAuthed(false)
    }
  }

  async function loadParticipantes() {
    if (!selectedCohorte) return
    const data = await api.getParticipantes(selectedCohorte.id)
    setParticipantes(data.participantes)
  }

  async function loadBitacoras() {
    if (!selectedCohorte) return
    const data = await api.getBitacoras(selectedCohorte.id, sesionActual)
    setBitacoras(data.bitacoras)
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file || !selectedCohorte) return
    setLoading(true)
    setMsg('')
    try {
      const result = await api.uploadExcel(file, selectedCohorte.id)
      setMsg(`✓ ${result.participantes_procesados} participantes procesados de ${result.total_detectados} detectados`)
      loadParticipantes()
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerarTodas() {
    if (!selectedCohorte) return
    setLoading(true)
    setMsg('Generando bitácoras con Claude... esto puede tomar unos minutos.')
    try {
      const result = await api.generarTodas(selectedCohorte.id, sesionActual)
      const exitosos = result.resultados.filter(r => r.success).length
      setMsg(`✓ ${exitosos}/${result.resultados.length} bitácoras generadas`)
      loadBitacoras()
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerarUna(participanteId) {
    setLoading(true)
    try {
      await api.generarBitacora(participanteId, sesionActual)
      setMsg('✓ Bitácora generada')
      loadBitacoras()
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePublicar(bitacoraId) {
    await api.updateBitacora(bitacoraId, { estado: 'publicado' })
    setMsg('✓ Publicada')
    loadBitacoras()
  }

  async function handlePublicarTodas() {
    for (const b of bitacoras) {
      if (b.estado !== 'publicado') {
        await api.updateBitacora(b.id, { estado: 'publicado' })
      }
    }
    setMsg('✓ Todas publicadas')
    loadBitacoras()
  }

  // Login screen
  if (!authed) {
    return (
      <div className="admin-page grain">
        <div className="admin-login">
          <h2>Panel Admin</h2>
          <p>Conciencia Encarnada · Ser & Fluir</p>
          <form onSubmit={doLogin}>
            <div className="field">
              <label>Clave de administrador</label>
              <input type="password" value={secret} onChange={e => setSecret(e.target.value)} autoFocus />
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%',marginTop:'1rem'}}>Entrar</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span className="brand-mark">Admin</span>
          <h3>Conciencia Encarnada</h3>
        </div>
        <nav className="sidebar-nav">
          {['dashboard', 'participantes', 'bitacoras', 'prompts'].map(v => (
            <button
              key={v}
              className={`nav-item ${view === v ? 'active' : ''}`}
              onClick={() => { setView(v); if (v === 'participantes') loadParticipantes(); if (v === 'bitacoras') loadBitacoras() }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={() => { sessionStorage.removeItem('admin_token'); setAuthed(false) }} className="sidebar-logout">Cerrar sesión</button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {msg && <div className="admin-msg">{msg}</div>}

        {/* Cohorte selector */}
        <div className="admin-bar">
          <select value={selectedCohorte?.id || ''} onChange={e => setSelectedCohorte(cohortes.find(c => c.id == e.target.value))} style={{maxWidth: 300}}>
            {cohortes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={sesionActual} onChange={e => setSesionActual(+e.target.value)} style={{maxWidth: 150}}>
            {Array.from({length: selectedCohorte?.total_sesiones || 11}, (_, i) => (
              <option key={i+1} value={i+1}>Sesión {i+1}</option>
            ))}
          </select>
        </div>

        {/* Dashboard */}
        {view === 'dashboard' && (
          <div className="admin-section page-enter">
            <h2>Dashboard</h2>
            <div className="admin-cards">
              <div className="admin-card">
                <h4>Subir Excel</h4>
                <p>Carga el formulario de respuestas de los participantes.</p>
                <input type="file" accept=".xlsx,.csv" onChange={handleUpload} disabled={loading} />
              </div>
              <div className="admin-card">
                <h4>Generar Bitácoras</h4>
                <p>Genera con Claude la bitácora de Sesión {sesionActual} para todos los participantes de esta cohorte.</p>
                <button className="btn btn-primary" onClick={handleGenerarTodas} disabled={loading}>
                  {loading ? 'Generando…' : `Generar Sesión ${sesionActual}`}
                </button>
              </div>
              <div className="admin-card">
                <h4>Publicar Todas</h4>
                <p>Publica todas las bitácoras pendientes de Sesión {sesionActual}.</p>
                <button className="btn btn-ghost" onClick={() => { loadBitacoras().then(handlePublicarTodas) }} disabled={loading}>
                  Publicar todas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participantes */}
        {view === 'participantes' && (
          <div className="admin-section page-enter">
            <h2>Participantes</h2>
            <table className="admin-table">
              <thead>
                <tr><th>Nombre</th><th>Email</th><th>Respuestas</th><th>Bitácoras</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {participantes.map(p => (
                  <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.email}</td>
                    <td>{Object.keys(p.respuestas || {}).length} preguntas</td>
                    <td>{(p.bitacoras || []).map(b => `S${b.sesion}(${b.estado})`).join(', ') || '—'}</td>
                    <td>
                      <button className="btn-small" onClick={() => handleGenerarUna(p.id)} disabled={loading}>
                        Generar S{sesionActual}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bitácoras */}
        {view === 'bitacoras' && (
          <div className="admin-section page-enter">
            <h2>Bitácoras — Sesión {sesionActual}</h2>
            {bitacoras.map(b => (
              <div key={b.id} className="bitacora-review">
                <div className="review-header">
                  <h3>{b.nombre}</h3>
                  <span className={`status-badge ${b.estado}`}>{b.estado}</span>
                </div>
                <div className="review-content">
                  <textarea
                    value={b.contenido_editado || b.contenido_generado}
                    onChange={e => {
                      setBitacoras(prev => prev.map(x => x.id === b.id ? {...x, contenido_editado: e.target.value} : x))
                    }}
                    rows={12}
                  />
                </div>
                <div className="review-actions">
                  <button className="btn-small" onClick={() => api.updateBitacora(b.id, { contenido_editado: b.contenido_editado || b.contenido_generado }).then(() => setMsg('✓ Guardado'))}>
                    Guardar edición
                  </button>
                  {b.estado !== 'publicado' && (
                    <button className="btn-small primary" onClick={() => handlePublicar(b.id)}>
                      Publicar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompts */}
        {view === 'prompts' && <PromptsView />}
      </main>
    </div>
  )
}

function PromptsView() {
  const [prompts, setPrompts] = useState([])
  const [editando, setEditando] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.getPrompts().then(d => setPrompts(d.prompts))
  }, [])

  async function guardar(p) {
    await api.savePrompt({ sesion: p.sesion, nombre: p.nombre, contenido: p.contenido })
    setMsg('✓ Prompt guardado')
    setEditando(null)
  }

  return (
    <div className="admin-section page-enter">
      <h2>Prompts por Sesión</h2>
      {msg && <div className="admin-msg">{msg}</div>}
      {prompts.map(p => (
        <div key={p.id} className="prompt-card">
          <h4>Sesión {p.sesion}: {p.nombre}</h4>
          {editando === p.id ? (
            <>
              <textarea
                value={p.contenido}
                onChange={e => setPrompts(prev => prev.map(x => x.id === p.id ? {...x, contenido: e.target.value} : x))}
                rows={15}
              />
              <div style={{display:'flex', gap:'0.5rem', marginTop:'0.5rem'}}>
                <button className="btn-small primary" onClick={() => guardar(p)}>Guardar</button>
                <button className="btn-small" onClick={() => setEditando(null)}>Cancelar</button>
              </div>
            </>
          ) : (
            <>
              <p style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>{p.contenido.substring(0, 200)}…</p>
              <button className="btn-small" onClick={() => setEditando(p.id)}>Editar</button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
