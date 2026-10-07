const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '')

export async function getSites({ page = 1, limit = 10, city = '', status = '' } = {}) {
  const params = new URLSearchParams()
  if (page) params.append('page', page)
  if (limit) params.append('limit', limit)
  if (city) params.append('city', city)
  if (status) params.append('status', status)

  const res = await fetch(`${API}/sites?${params.toString()}`)
  if (!res.ok) throw new Error('Impossible de charger les sites')
  return res.json()
}

export async function getAllSites() {
  const res = await fetch(`${API}/sites?all=1`)
  if (!res.ok) throw new Error('Impossible de charger la liste complète des sites')
  return res.json()
}

export async function searchSites(q) {
  const res = await fetch(`${API}/sites/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Erreur lors de la recherche')
  return res.json()
}

export async function getSite(id) {
  const res = await fetch(`${API}/sites/${id}`)
  if (!res.ok) throw new Error('Site introuvable')
  return res.json()
}

export async function createSite(payload) {
  const res = await fetch(`${API}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errorMsg = data.details 
      ? Object.values(data.details).join(' • ') 
      : (data.error || 'Erreur lors de la création')
    throw new Error(errorMsg)
  }
  return data
}

export async function updateSite(id, payload) {
  const res = await fetch(`${API}/sites/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const errorMsg = data.details 
      ? Object.values(data.details).join(' • ') 
      : (data.error || 'Erreur lors de la mise à jour')
    throw new Error(errorMsg)
  }
  return data
}

export async function deleteSite(id) {
  const res = await fetch(`${API}/sites/${id}`, {
    method: 'DELETE'
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la suppression')
  }
  return data
}

export async function getMeta() {
  const res = await fetch(`${API}/sites/meta`)
  if (!res.ok) throw new Error('Impossible de charger les métadonnées')
  return res.json()
}

export async function getHealth() {
  const res = await fetch(`${API}/health`)
  return res.json()
}

export async function syncElasticsearch() {
  const res = await fetch(`${API}/sites/sync-elasticsearch`, {
    method: 'POST'
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la synchronisation')
  }
  return data
}
