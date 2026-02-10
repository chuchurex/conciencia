// API base URL - cambiar en producción
const API_BASE = import.meta.env.VITE_API_URL || '/api/index.php?route='

async function request(route, options = {}) {
  const url = API_BASE + route
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body)
  }

  // Admin auth
  const adminToken = sessionStorage.getItem('admin_token')
  if (adminToken) {
    config.headers['Authorization'] = `Bearer ${adminToken}`
  }

  const res = await fetch(url, config)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error en la solicitud')
  }

  return data
}

export const api = {
  // Participante
  login: (email) => request('participante/login', { method: 'POST', body: { email } }),
  getBitacora: (token) => request(`participante/bitacora&token=${token}`),

  // Admin
  getCohortes: () => request('admin/cohortes'),
  createCohorte: (data) => request('admin/cohortes', { method: 'POST', body: data }),
  getParticipantes: (cohorteId) => request(`admin/participantes&cohorte_id=${cohorteId}`),

  uploadExcel: (file, cohorteId) => {
    const form = new FormData()
    form.append('archivo', file)
    form.append('cohorte_id', cohorteId)
    return request('admin/upload-excel', {
      method: 'POST',
      body: form,
      headers: { 'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}` }
    })
  },

  generarBitacora: (participanteId, sesion) =>
    request('admin/generar-bitacora', { method: 'POST', body: { participante_id: participanteId, sesion } }),

  generarTodas: (cohorteId, sesion) =>
    request('admin/generar-todas', { method: 'POST', body: { cohorte_id: cohorteId, sesion } }),

  getBitacoras: (cohorteId, sesion) =>
    request(`admin/bitacoras&cohorte_id=${cohorteId}&sesion=${sesion}`),

  updateBitacora: (id, data) =>
    request('admin/bitacoras', { method: 'PUT', body: { id, ...data } }),

  getPrompts: () => request('admin/prompts'),
  savePrompt: (data) => request('admin/prompts', { method: 'POST', body: data }),
}
