'use client'

import { useEffect, useRef } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre'

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

interface LiveMapProps {
  vehicles: Vehicle[]
}

export default function LiveMap({ vehicles }: LiveMapProps) {
  const mapRef = useRef<any>(null)

  // Debug logging
  console.log('LiveMap vehicles:', vehicles)
  console.log('Vehicle count:', vehicles.length)
  
  useEffect(() => {
    // Fit map to show all vehicles
    if (vehicles.length > 0 && mapRef.current) {
      console.log('Fitting map bounds for vehicles:', vehicles)
      const bounds = vehicles.reduce(
        (acc, vehicle) => ({
          minLat: Math.min(acc.minLat, vehicle.snapped_lat),
          maxLat: Math.max(acc.maxLat, vehicle.snapped_lat),
          minLng: Math.min(acc.minLng, vehicle.snapped_lng),
          maxLng: Math.max(acc.maxLng, vehicle.snapped_lng),
        }),
        {
          minLat: vehicles[0].snapped_lat,
          maxLat: vehicles[0].snapped_lat,
          minLng: vehicles[0].snapped_lng,
          maxLng: vehicles[0].snapped_lng,
        }
      )

      mapRef.current.fitBounds(
        [
          [bounds.minLng - 0.001, bounds.minLat - 0.001],
          [bounds.maxLng + 0.001, bounds.maxLat + 0.001],
        ],
        { padding: 50, duration: 1000 }
      )
    }
  }, [vehicles])

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
      
      <div className="map-container">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: vehicles.length > 0 ? vehicles[0].snapped_lng : -85.9209,
            latitude: vehicles.length > 0 ? vehicles[0].snapped_lat : 35.2045,
            zoom: 16
          }}
          style={{ width: '100%', height: '600px' }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        >
          {vehicles.map((vehicle) => {
            console.log('Rendering marker for vehicle:', vehicle.vehicle_id, 'at position:', vehicle.snapped_lat, vehicle.snapped_lng)
            return (
            <Marker
              key={vehicle.vehicle_id}
              longitude={vehicle.snapped_lng}
              latitude={vehicle.snapped_lat}
              anchor="center"
              style={{ zIndex: 1000 }}
            >
              <div className="relative" style={{ zIndex: 1000 }}>
                {/* Add a bright background circle */}
                <div className="absolute -inset-4 w-24 h-24 rounded-full bg-red-500 opacity-80 animate-ping" style={{ zIndex: 999 }}></div>
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl border-4 border-yellow-400 animate-bounce"
                  style={{ backgroundColor: vehicle.vehicles.routes?.color || '#4B0082', zIndex: 1001 }}
                >
                  🚐
                </div>
                {/* Popup on hover */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-lg border border-gray-200 opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-10 w-48">
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900">
                      {vehicle.vehicles.label}
                    </div>
                    <div className="text-gray-600">
                      Route: {vehicle.vehicles.routes?.short_name || 'Unassigned'}
                    </div>
                    <div className="text-gray-600">
                      Speed: {vehicle.speed ? `${vehicle.speed.toFixed(1)} mph` : 'Unknown'}
                    </div>
                    <div className="text-gray-600">
                      Battery: {vehicle.battery ? `${vehicle.battery.toFixed(0)}%` : 'Unknown'}
                    </div>
                    <div className="text-gray-600">
                      Last update: {formatTimestamp(vehicle.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </Marker>
            )
          })}
        </Map>
      </div>

      {vehicles.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No active vehicles to display
        </div>
      )}
    </div>
  )
}