import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  getSites,
  getAllSites,
  searchSites,
  createSite,
  updateSite,
  deleteSite,
  getMeta,
  getHealth,
  syncElasticsearch
} from './api'
import MapView from './components/MapView'
import SiteModal from './components/SiteModal'
import SiteDetailsModal from './components/SiteDetailsModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import Toast from './components/Toast'
import {
  Search,
  Plus,
  RefreshCw,
  Download,
  Filter,
  MapPin,
  Building2,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database,
  Server,
  Zap,
  Map as MapIcon,
  LayoutGrid,
  Columns,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react'

export default function App() {
  // Main Data States
  const [sites, setSites] = useState([])
  const [allSites, setAllSites] = useState([])
  const [meta, setMeta] = useState({ cities: [], types: [], stats: { total: 0, active: 0, inactive: 0, cities_count: 0 } })
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Filters & Pagination
  const [query, setQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchSource, setSearchSource] = useState('')

  // View Layout
  const [viewMode, setViewMode] = useState('split') // 'split' | 'grid' | 'map'
  const [selectedSite, setSelectedSite] = useState(null)

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingSite, setEditingSite] = useState(null)
  const [detailSite, setDetailSite] = useState(null)
  const [deletingSite, setDeletingSite] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Map Picker State (for creating/editing coords)
  const [isPickingLocation, setIsPickingLocation] = useState(false)
  const [pickedLocation, setPickedLocation] = useState(null)

  // Notifications
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Initial Load & Refresh
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)
      const [metaRes, healthRes, allRes] = await Promise.all([
        getMeta().catch(() => ({ cities: [], types: [], stats: {} })),
        getHealth().catch(() => null),
        getAllSites().catch(() => ({ data: [] }))
      ])

      setMeta(metaRes || {})
      setHealth(healthRes)
      setAllSites(allRes.data || [])

      if (query.trim()) {
        const searchRes = await searchSites(query.trim())
        setSites(searchRes.data || [])
        setSearchSource(searchRes.source || 'elasticsearch')
        setTotalCount(searchRes.count || (searchRes.data || []).length)
        setTotalPages(1)
      } else {
        const pagedRes = await getSites({
          page: currentPage,
          limit: pageSize,
          city: selectedCity,
          status: selectedStatus
        })
        setSites(pagedRes.data || [])
        setTotalCount(pagedRes.meta?.total || 0)
        setTotalPages(pagedRes.meta?.pages || 1)
        setSearchSource('')
      }
    } catch (err) {
      addToast(err.message || 'Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, selectedCity, selectedStatus, query, addToast])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Periodic Health Check
  useEffect(() => {
    const interval = setInterval(() => {
      getHealth()
        .then(h => setHealth(h))
        .catch(() => setHealth(null))
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  // Filter sites in memory by Type if selected
  const displayedSites = useMemo(() => {
    if (!selectedType) return sites
    return sites.filter(s => s.type === selectedType)
  }, [sites, selectedType])

  // Handlers
  async function handleSearchChange(val) {
    setQuery(val)
    setCurrentPage(1)
  }

  async function handleSyncElasticsearch() {
    setSyncing(true)
    try {
      const res = await syncElasticsearch()
      addToast(res.message || 'Elasticsearch synchronisé avec succès !', 'success')
      fetchAllData()
    } catch (err) {
      addToast(err.message || 'Échec de la synchronisation', 'error')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSaveSite(payload) {
    if (editingSite) {
      await updateSite(editingSite.id, payload)
      addToast(`Le site « ${payload.name} » a été mis à jour`, 'success')
      setEditingSite(null)
    } else {
      await createSite(payload)
      addToast(`Le site « ${payload.name} » a été créé avec succès`, 'success')
      setIsCreateOpen(false)
    }
    setIsPickingLocation(false)
    setPickedLocation(null)
    fetchAllData()
  }

  async function handleConfirmDelete(id) {
    setIsDeleting(true)
    try {
      await deleteSite(id)
      addToast('Site supprimé avec succès', 'success')
      setDeletingSite(null)
      if (selectedSite && selectedSite.id === id) setSelectedSite(null)
      fetchAllData()
    } catch (err) {
      addToast(err.message || 'Impossible de supprimer le site', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleStartPickingLocation(lat, lng) {
    setIsPickingLocation(true)
    if (lat && lng) {
      setPickedLocation({ latitude: parseFloat(lat), longitude: parseFloat(lng) })
    }
    // Switch to map view or split view if in grid mode
    if (viewMode === 'grid') setViewMode('split')
  }

  function handleExportCSV() {
    if (allSites.length === 0) {
      addToast('Aucune donnée à exporter', 'info')
      return
    }
    const headers = ['ID', 'Nom', 'Ville', 'Type', 'Statut', 'Latitude', 'Longitude', 'Date création']
    const rows = allSites.map(s => [
      s.id,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${(s.city || '').replace(/"/g, '""')}"`,
      `"${(s.type || '').replace(/"/g, '""')}"`,
      s.status,
      s.latitude || '',
      s.longitude || '',
      s.created_at || ''
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `geotrack_sites_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast('Fichier CSV exporté avec succès !', 'success')
  }

  const isDbHealthy = health?.components?.database?.status === 'connected'
  const isEsHealthy = health?.components?.elasticsearch?.status === 'connected'

  return (
    <div className="app-container">
      {/* Toast Notification Layer */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="logo-icon">
            <MapPin size={22} className="logo-svg" />
          </div>
          <div>
            <div className="brand-title">
              GeoTrack <span className="brand-tag">v1.2</span>
            </div>
            <div className="brand-subtitle">Supervision Géospatiale & Recherche Intelligente</div>
          </div>
        </div>

        {/* Live System Health Indicators */}
        <div className="health-badges">
          <div className={`health-pill ${isDbHealthy ? 'healthy' : 'degraded'}`} title="État de la base MySQL">
            <Database size={13} />
            <span>MySQL</span>
            <span className={`status-dot ${isDbHealthy ? 'dot-active' : 'dot-inactive'}`}></span>
          </div>

          <div className={`health-pill ${isEsHealthy ? 'healthy' : 'degraded'}`} title="État du moteur Elasticsearch">
            <Zap size={13} />
            <span>Elasticsearch</span>
            <span className={`status-dot ${isEsHealthy ? 'dot-active' : 'dot-inactive'}`}></span>
          </div>

          <div className="health-pill healthy" title="API REST PHP MVC">
            <Server size={13} />
            <span>PHP 8.3</span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="nav-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={handleSyncElasticsearch}
            disabled={syncing}
            title="Réindexer tous les sites MySQL vers Elasticsearch"
          >
            <RefreshCw size={15} className={syncing ? 'spin-icon' : ''} />
            <span>{syncing ? 'Indexation...' : 'Sync Elastic'}</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={handleExportCSV}
            title="Exporter la base de sites en format CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingSite(null)
              setIsCreateOpen(true)
            }}
          >
            <Plus size={16} />
            <span>Nouveau Site</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="dashboard-content">
        {/* KPI Statistics Row */}
        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-blue">
              <Layers size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{meta?.stats?.total ?? allSites.length}</span>
              <span className="kpi-label">Sites Enregistrés</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-emerald">
              <Activity size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{meta?.stats?.active ?? allSites.filter(s => s.status === 'active').length}</span>
              <span className="kpi-label">Installations Actives</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-slate">
              <Building2 size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{meta?.stats?.cities_count ?? (meta?.cities?.length || 0)}</span>
              <span className="kpi-label">Villes Couvertes</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrapper bg-indigo">
              <MapPin size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-value">{allSites.filter(s => s.latitude && s.longitude).length}</span>
              <span className="kpi-label">Géolocalisés</span>
            </div>
          </div>
        </section>

        {/* Filter and Control Toolbar */}
        <section className="toolbar-card">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, ville ou type (Elasticsearch)..."
              value={query}
              onChange={e => handleSearchChange(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => handleSearchChange('')}
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="filters-row">
            <div className="filter-select-wrapper">
              <select
                value={selectedCity}
                onChange={e => {
                  setSelectedCity(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">Toutes les villes</option>
                {(meta.cities || []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
              >
                <option value="">Tous les types</option>
                {(meta.types || []).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrapper">
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif uniquement</option>
                <option value="inactive">Inactif uniquement</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
                title="Vue combinée : Liste et Carte"
              >
                <Columns size={16} />
                <span>Split</span>
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vue grille complète"
              >
                <LayoutGrid size={16} />
                <span>Grille</span>
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Vue carte plein écran"
              >
                <MapIcon size={16} />
                <span>Carte</span>
              </button>
            </div>
          </div>
        </section>

        {/* Search Info Badge */}
        {query && (
          <div className="search-feedback-banner">
            <span>
              Résultats pour « <strong>{query}</strong> » : {displayedSites.length} site(s) trouvé(s)
            </span>
            <span className="source-tag">
              Moteur : {searchSource === 'elasticsearch' ? '⚡ Elasticsearch' : '🔍 SQL Fallback'}
            </span>
          </div>
        )}

        {/* Dynamic Main Workspace based on View Mode */}
        <section className={`workspace-layout view-${viewMode}`}>
          {/* Sites List Column (Visible in Split & Grid modes) */}
          {(viewMode === 'split' || viewMode === 'grid') && (
            <div className="sites-column">
              <div className="column-header">
                <h3>
                  {query ? 'Résultats de recherche' : 'Répertoire des Sites'}
                  <span className="count-pill">{displayedSites.length}</span>
                </h3>
                {selectedCity && (
                  <span className="active-filter-badge">
                    Ville: {selectedCity}
                    <button type="button" onClick={() => setSelectedCity('')}>✕</button>
                  </span>
                )}
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Chargement des sites en cours...</p>
                </div>
              ) : displayedSites.length === 0 ? (
                <div className="empty-state">
                  <Building2 size={42} className="empty-icon" />
                  <h4>Aucun site trouvé</h4>
                  <p>Aucun site ne correspond aux critères de recherche actuels.</p>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setQuery('')
                      setSelectedCity('')
                      setSelectedType('')
                      setSelectedStatus('')
                    }}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="sites-cards-list">
                  {displayedSites.map(site => {
                    const isSelected = selectedSite && selectedSite.id === site.id
                    return (
                      <article
                        key={site.id}
                        className={`site-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedSite(site)}
                      >
                        <div className="card-top-row">
                          <span className={`status-pill ${site.status}`}>
                            <span className={`dot dot-${site.status}`}></span>
                            {site.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                          <span className="site-id">#{site.id}</span>
                        </div>

                        <h4 className="site-name">{site.name}</h4>

                        <div className="site-tags">
                          <span className="tag-city">
                            <MapPin size={13} /> {site.city}
                          </span>
                          <span className="tag-type">
                            <Building2 size={13} /> {site.type}
                          </span>
                        </div>

                        <div className="card-coords">
                          {site.latitude && site.longitude ? (
                            <span className="coords-text font-mono">
                              📍 {parseFloat(site.latitude).toFixed(4)}, {parseFloat(site.longitude).toFixed(4)}
                            </span>
                          ) : (
                            <span className="coords-text text-muted">Coordonnées non définies</span>
                          )}
                        </div>

                        <div className="card-actions-bar" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => setDetailSite(site)}
                            title="Consulter les détails"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => setEditingSite(site)}
                            title="Modifier ce site"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon text-danger"
                            onClick={() => setDeletingSite(site)}
                            title="Supprimer ce site"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              {/* Pagination Controls (when not searching) */}
              {!query && totalPages > 1 && (
                <div className="pagination-bar">
                  <div className="page-info">
                    Page {currentPage} sur {totalPages} ({totalCount} au total)
                  </div>
                  <div className="page-buttons">
                    <button
                      type="button"
                      className="btn-page"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft size={16} /> Précédent
                    </button>
                    <button
                      type="button"
                      className="btn-page"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Suivant <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Map Column (Visible in Split & Map modes) */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className="map-column">
              <MapView
                sites={allSites}
                selectedSite={selectedSite}
                onSelectSite={site => setSelectedSite(site)}
                pickerLocation={pickedLocation}
                onPickLocation={loc => setPickedLocation(loc)}
                isPicking={isPickingLocation}
              />
            </div>
          )}
        </section>
      </main>

      {/* Modals & Dialogs */}
      <SiteModal
        isOpen={isCreateOpen || editingSite !== null}
        isEditing={editingSite !== null}
        initialData={editingSite}
        onClose={() => {
          setIsCreateOpen(false)
          setEditingSite(null)
          setIsPickingLocation(false)
          setPickedLocation(null)
        }}
        onSubmit={handleSaveSite}
        pickedLocation={pickedLocation}
        onStartPickingLocation={handleStartPickingLocation}
      />

      <SiteDetailsModal
        site={detailSite}
        onClose={() => setDetailSite(null)}
        onEdit={site => setEditingSite(site)}
        onDelete={site => setDeletingSite(site)}
        onFocusMap={site => {
          setSelectedSite(site)
          if (viewMode === 'grid') setViewMode('split')
        }}
      />

      <ConfirmDeleteModal
        isOpen={deletingSite !== null}
        site={deletingSite}
        deleting={isDeleting}
        onClose={() => setDeletingSite(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div>
          <strong>GeoTrack</strong> — Plateforme de Supervision Géospatiale & Traçabilité Industrielle.
        </div>
        <div className="footer-credits">
          PHP 8.3 MVC API • React Vite • MySQL 8 • Elasticsearch 8 • Docker
        </div>
      </footer>
    </div>
  )
}
