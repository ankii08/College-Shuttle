'use client'

import { useEffect, useRef } from 'react'

interface Vehicle {
  vehicle_id: string
  lat: number
  lng: number
  snapped_lat: number
  snapped_lng: number
  timestamp: string
  speed: number | null
  battery: number | null
  vehicles: {
    label: string
    routes: {
      short_name: string
      color: string
    } | null
  }
}

interface GoogleLiveMapProps {
  vehicles: Vehicle[]
  apiKey: string
}

declare global {
  interface Window {
    google: any
  }
}

export default function GoogleLiveMap({ vehicles, apiKey }: GoogleLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  console.log('GoogleLiveMap vehicles:', vehicles)
  console.log('Vehicle count:', vehicles.length)

  // Center on first vehicle or default to Sewanee campus
  const center = vehicles.length > 0 
    ? { lat: vehicles[0].snapped_lat, lng: vehicles[0].snapped_lng }
    : { lat: 35.2045, lng: -85.9209 }

  useEffect(() => {
    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`
      script.async = true
      script.onload = initializeMap
      document.head.appendChild(script)
    } else {
      initializeMap()
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, [apiKey])

  useEffect(() => {
    // Update markers when vehicles change
    if (mapInstanceRef.current) {
      updateMarkers()
    }
  }, [vehicles])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: 16,
      mapTypeId: 'roadmap',
    })

    mapInstanceRef.current = map
    updateMarkers()
  }

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    vehicles.forEach((vehicle) => {
      console.log('Creating Google Maps marker for vehicle:', vehicle.vehicle_id, 'at position:', vehicle.snapped_lat, vehicle.snapped_lng)
      
      const marker = new window.google.maps.Marker({
        position: { lat: vehicle.snapped_lat, lng: vehicle.snapped_lng },
        map: mapInstanceRef.current,
        title: `${vehicle.vehicles.label} - ${vehicle.vehicles.routes?.short_name || 'Unassigned'}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: vehicle.vehicles.routes?.color || '#4B0082',
          fillOpacity: 1,
          strokeWeight: 3,
          strokeColor: '#FFFFFF',
        },
      })

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${vehicle.vehicles.label}</h3>
            <p style="margin: 4px 0; color: #6b7280;">Route: ${vehicle.vehicles.routes?.short_name || 'Unassigned'}</p>
            <p style="margin: 4px 0; color: #6b7280;">Speed: ${vehicle.speed ? `${vehicle.speed.toFixed(1)} mph` : 'Unknown'}</p>
            <p style="margin: 4px 0; color: #6b7280;">Battery: ${vehicle.battery ? `${vehicle.battery.toFixed(0)}%` : 'Unknown'}</p>
            <p style="margin: 4px 0; color: #6b7280;">Last update: ${formatTimestamp(vehicle.timestamp)}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    // Center map on vehicles if any exist
    if (vehicles.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      vehicles.forEach(vehicle => {
        bounds.extend({ lat: vehicle.snapped_lat, lng: vehicle.snapped_lng })
      })
      mapInstanceRef.current.fitBounds(bounds)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes === 1) return '1 minute ago'
    return `${diffMinutes} minutes ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Live Vehicle Tracking</h2>
        <p className="text-sm text-gray-600">
          {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} active
        </p>
      </div>
      
      <div 
        ref={mapRef}
        className="map-container"
        style={{ height: '600px', width: '100%' }}
      />

      {vehicles.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No active vehicles to display
        </div>
      )}

      {/* Vehicle info panel */}
      {vehicles.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-2">Active Vehicles</h3>
          {vehicles.map((vehicle) => (
            <div key={vehicle.vehicle_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <div className="font-medium text-gray-900">{vehicle.vehicles.label}</div>
                <div className="text-sm text-gray-600">
                  Route: {vehicle.vehicles.routes?.short_name || 'Unassigned'}
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>Speed: {vehicle.speed ? `${vehicle.speed.toFixed(1)} mph` : 'Unknown'}</div>
                <div>Battery: {vehicle.battery ? `${vehicle.battery.toFixed(0)}%` : 'Unknown'}</div>
                <div>Updated: {formatTimestamp(vehicle.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
