'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Driver {
  user_id: string
  name: string
  assigned_vehicle: string | null
  active: boolean
  created_at: string
}

interface Vehicle {
  id: string
  label: string
  route_id: string | null
  active: boolean
}

export default function DriverManager() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [newDriver, setNewDriver] = useState({
    name: '',
    email: '',
    assigned_vehicle: ''
  })

  useEffect(() => {
    fetchDrivers()
    fetchVehicles()
  }, [])

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        vehicles(label)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching drivers:', error)
      return
    }

    setDrivers(data || [])
  }

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('active', true)
      .order('label')

    if (error) {
      console.error('Error fetching vehicles:', error)
      return
    }

    setVehicles(data || [])
  }

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    alert('Driver creation requires Supabase Auth integration. This would create a new user account and driver record.')
    setShowAddDriver(false)
  }

  const handleUpdateDriverVehicle = async (driverId: string, vehicleId: string | null) => {
    const { error } = await supabase
      .from('drivers')
      .update({ assigned_vehicle: vehicleId })
      .eq('user_id', driverId)

    if (error) {
      alert('Error updating driver vehicle: ' + error.message)
      return
    }

    fetchDrivers()
  }

  const handleToggleDriverActive = async (driverId: string, active: boolean) => {
    const { error } = await supabase
      .from('drivers')
      .update({ active: !active })
      .eq('user_id', driverId)

    if (error) {
      alert('Error updating driver status: ' + error.message)
      return
    }

    fetchDrivers()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Driver Management</h2>
          <button
            onClick={() => setShowAddDriver(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Driver
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <tr key={driver.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {driver.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={driver.assigned_vehicle || ''}
                      onChange={(e) => handleUpdateDriverVehicle(driver.user_id, e.target.value || null)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">No Assignment</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      driver.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleDriverActive(driver.user_id, driver.active)}
                      className={`mr-3 ${
                        driver.active 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {driver.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Driver Modal */}
        {showAddDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Add New Driver</h3>
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Adding drivers requires creating user accounts through Supabase Auth.
                  In a production setup, this would:
                </p>
                <ul className="mt-2 text-sm text-yellow-800 list-disc list-inside">
                  <li>Create a new user account via Supabase Auth</li>
                  <li>Send an invitation email</li>
                  <li>Create a driver profile</li>
                  <li>Set initial role permissions</li>
                </ul>
              </div>
              <form onSubmit={handleAddDriver}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={newDriver.name}
                      onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={newDriver.email}
                      onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., john@sewanee.edu"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Assigned Vehicle</label>
                    <select
                      value={newDriver.assigned_vehicle}
                      onChange={(e) => setNewDriver({...newDriver, assigned_vehicle: e.target.value})}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">No Assignment</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex space-x-2 mt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Create Driver (Demo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddDriver(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
