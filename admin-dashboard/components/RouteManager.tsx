'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RouteManager() {
  const [routes, setRoutes] = useState<any[]>([])
  const [stops, setStops] = useState<any[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  useEffect(() => {
    fetchRoutes()
  }, [])

  useEffect(() => {
    if (selectedRoute) {
      fetchStops(selectedRoute)
    }
  }, [selectedRoute])

  const fetchRoutes = async () => {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('short_name')

    if (error) {
      console.error('Error fetching routes:', error)
      return
    }

    setRoutes(data || [])
  }

  const fetchStops = async (routeId: string) => {
    const { data, error } = await supabase
      .from('stops')
      .select('*')
      .eq('route_id', routeId)
      .order('sequence')

    if (error) {
      console.error('Error fetching stops:', error)
      return
    }

    setStops(data || [])
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Route Management</h2>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Add Route
          </button>
        </div>

        <div className="grid gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`border rounded-lg p-4 cursor-pointer ${
                selectedRoute === route.id ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
              }`}
              onClick={() => setSelectedRoute(route.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{route.short_name}</h3>
                  <p className="text-sm text-gray-600">{route.long_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: route.color }}
                  ></div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    route.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {route.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {routes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No routes found. Add a route to get started.
          </div>
        )}
      </div>

      {selectedRoute && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Stops for Selected Route</h2>
          <div className="grid gap-2">
            {stops.map((stop) => (
              <div key={stop.id} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{stop.name}</h4>
                    <p className="text-sm text-gray-600">
                      Sequence: {stop.sequence} | Lat: {stop.lat}, Lng: {stop.lng}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stops.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No stops found for this route.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
