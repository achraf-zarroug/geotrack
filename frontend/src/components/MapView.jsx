import { useEffect, useRef } from 'react'
import L from 'leaflet'

// Fix default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

function createCustomIcon(status, isSelected) {
  const color = status === 'active' ? '#10b981' : '#64748b'
  const ring = isSelected ? 'box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.45);' : ''
  const size = isSelected ? 38 : 30
  
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 11px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
        ${ring}
      ">
        <span style="display:inline-block; width:8px; height:8px; background:white; border-radius:50%;"></span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  })
}

export default function MapView({
  sites = [],
  selectedSite = null,
  onSelectSite,
  pickerLocation = null,
  onPickLocation = null,
  isPicking = false
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const pickerMarkerRef = useRef(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Center on Tunisia by default
    const map = L.map(mapContainerRef.current, {
      center: [33.8869, 10.0],
      zoom: 7,
      zoomControl: true,
      attributionControl: false
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Handle map click for coordinate picking
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    function handleMapClick(e) {
      if (onPickLocation) {
        onPickLocation({
          latitude: parseFloat(e.latlng.lat.toFixed(6)),
          longitude: parseFloat(e.latlng.lng.toFixed(6))
        })
      }
    }

    if (isPicking) {
      map.getContainer().style.cursor = 'crosshair'
      map.on('click', handleMapClick)
    } else {
      map.getContainer().style.cursor = ''
    }

    return () => {
      map.off('click', handleMapClick)
    }
  }, [isPicking, onPickLocation])

  // Update picker marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove()
      pickerMarkerRef.current = null
    }

    if (pickerLocation && pickerLocation.latitude && pickerLocation.longitude) {
      const pinIcon = L.divIcon({
        className: 'picker-pin',
        html: `
          <div style="
            width: 34px;
            height: 34px;
            background: #6366f1;
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      })

      const marker = L.marker([pickerLocation.latitude, pickerLocation.longitude], {
        icon: pinIcon,
        draggable: true
      }).addTo(map)

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng()
        if (onPickLocation) {
          onPickLocation({
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lng.toFixed(6))
          })
        }
      })

      pickerMarkerRef.current = marker
      map.panTo([pickerLocation.latitude, pickerLocation.longitude], { animate: true })
    }
  }, [pickerLocation, onPickLocation])

  // Update site markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing site markers
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}

    const validSites = sites.filter(s => s.latitude && s.longitude)
    if (validSites.length === 0) return

    const bounds = []

    validSites.forEach(site => {
      const lat = parseFloat(site.latitude)
      const lng = parseFloat(site.longitude)
      if (isNaN(lat) || isNaN(lng)) return

      bounds.push([lat, lng])
      const isSelected = selectedSite && selectedSite.id === site.id
      const icon = createCustomIcon(site.status, isSelected)

      const marker = L.marker([lat, lng], { icon }).addTo(map)

      marker.bindPopup(`
        <div style="font-family: inherit; min-width: 170px; padding: 2px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight:700; text-transform:uppercase; padding: 2px 7px; border-radius: 99px; background: ${site.status === 'active' ? '#dcfce7' : '#f1f5f9'}; color: ${site.status === 'active' ? '#15803d' : '#475569'};">
              ${site.status === 'active' ? 'Actif' : 'Inactif'}
            </span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">#${site.id}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${site.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">${site.city} • <strong style="color:#334155;">${site.type}</strong></p>
          <div style="font-size: 11px; color: #94a3b8; background: #f8fafc; padding: 4px 8px; border-radius: 6px; font-family: monospace;">
            ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `)

      marker.on('click', () => {
        if (onSelectSite) onSelectSite(site)
      })

      markersRef.current[site.id] = marker
    })

    if (bounds.length > 0 && !selectedSite && !pickerLocation) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  }, [sites, selectedSite, onSelectSite])

  // Center on selected site
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedSite) return

    const lat = parseFloat(selectedSite.latitude)
    const lng = parseFloat(selectedSite.longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], 12, { animate: true })
      const marker = markersRef.current[selectedSite.id]
      if (marker) marker.openPopup()
    }
  }, [selectedSite])

  return (
    <div className="map-wrapper">
      {isPicking && (
        <div className="map-picker-banner">
          <span>🎯 Mode sélection : cliquez sur la carte pour définir les coordonnées</span>
        </div>
      )}
      <div ref={mapContainerRef} className="map-container" />
    </div>
  )
}
