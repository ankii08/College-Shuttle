'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import GoogleLiveMap from './GoogleLiveMap'
import VehicleList from './VehicleList'
import AlertManager from './AlertManager'
import RouteManager from './RouteManager'
import DriverManager from './DriverManager'

interface DashboardProps {
  user: any
}

interface VehiclePosition {
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

export default function Dashboard({ user }: DashboardProps) {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([])
  const [activeTab, setActiveTab] = useState('map')
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    checkAdminRole()
    fetchVehicles()
    subscribeToUpdates()
  }, [])

  const checkAdminRole = async () => {
    setCheckingRole(true)
    
    try {
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        console.error('Error checking admin role:', error.message)
        setIsAdmin(false)
        setCheckingRole(false)
        return
      }

      const isAdminUser = roleData?.role === 'admin'
      setIsAdmin(isAdminUser)
    } catch (err) {
      console.error('Unexpected error in admin check:', err)
      setIsAdmin(false)
    } finally {
      setCheckingRole(false)
    }
  }

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from('vehicle_latest')
      .select(`
        *,
        vehicles!inner(
          label,
          routes(short_name, color)
        )
      `)

    if (error) {
      console.error('Error fetching vehicles:', error)
      return
    }

    setVehicles(data as any || [])
  }

  const subscribeToUpdates = () => {
    const subscription = supabase
      .channel('vehicle_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vehicle_latest' },
        () => {
          fetchVehicles()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Show loading while checking role
  if (checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="animate-pulse text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">Checking permissions...</div>
            <div className="text-sm text-gray-500">Please wait while we verify your access.</div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            User: {user.email}<br/>
            User ID: {user.id}
          </p>
          <button
            onClick={signOut}
            className="w-full bg-sewanee-purple text-white py-2 px-4 rounded-md hover:bg-purple-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sewanee Shuttle Admin
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {user.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'map', name: 'Live Map' },
              { id: 'vehicles', name: 'Vehicles' },
              { id: 'routes', name: 'Routes & Stops' },
              { id: 'drivers', name: 'Drivers' },
              { id: 'alerts', name: 'Alerts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'map' && (
          <GoogleLiveMap 
            vehicles={vehicles} 
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
          />
        )}
        {activeTab === 'vehicles' && <VehicleList vehicles={vehicles} />}
        {activeTab === 'routes' && <RouteManager />}
        {activeTab === 'drivers' && <DriverManager />}
        {activeTab === 'alerts' && <AlertManager />}
      </div>
    </div>
  )
}