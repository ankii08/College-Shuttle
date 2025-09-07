'use client'

import { useState } from 'react'

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

interface VehicleListProps {
  vehicles: Vehicle[]
}

export default function VehicleList({ vehicles }: VehicleListProps) {
  const [sortBy, setSortBy] = useState<'label' | 'timestamp' | 'speed'>('timestamp')

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getStatusColor = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    
    if (diffMinutes < 5) return 'text-green-600 bg-green-100'
    if (diffMinutes < 15) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getStatusText = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    
    if (diffMinutes < 5) return 'Active'
    if (diffMinutes < 15) return 'Warning'
    return 'Offline'
  }

  const sortedVehicles = [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'label':
        return a.vehicles.label.localeCompare(b.vehicles.label)
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      case 'speed':
        return (b.speed || 0) - (a.speed || 0)
      default:
        return 0
    }
  })

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Vehicle Status</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="timestamp">Last Update</option>
              <option value="label">Vehicle</option>
              <option value="speed">Speed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Speed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Battery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Update
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedVehicles.map((vehicle) => (
              <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: vehicle.vehicles.routes?.color || '#4B0082' }}
                    />
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.vehicles.label}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {vehicle.vehicles.routes?.short_name || 'Unassigned'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.timestamp)}`}>
                    {getStatusText(vehicle.timestamp)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.speed ? `${vehicle.speed.toFixed(1)} mph` : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {vehicle.battery ? `${vehicle.battery.toFixed(0)}%` : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTimestamp(vehicle.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vehicles.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No vehicles found
        </div>
      )}
    </div>
  )
}