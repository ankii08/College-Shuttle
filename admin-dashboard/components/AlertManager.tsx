'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

interface Alert {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'urgent'
  active: boolean
  expires_at: string | null
  created_at: string
}

export default function AlertManager() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'urgent',
    expires_at: '',
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching alerts:', error)
      return
    }

    setAlerts(data || [])
  }

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('alerts')
      .insert({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        expires_at: formData.expires_at || null,
      })

    if (error) {
      console.error('Error creating alert:', error)
      alert('Failed to create alert')
    } else {
      setFormData({
        title: '',
        message: '',
        type: 'info',
        expires_at: '',
      })
      setShowForm(false)
      fetchAlerts()
    }

    setLoading(false)
  }

  const toggleAlert = async (alertId: string, active: boolean) => {
    const { error } = await supabase
      .from('alerts')
      .update({ active: !active })
      .eq('id', alertId)

    if (error) {
      console.error('Error updating alert:', error)
      alert('Failed to update alert')
    } else {
      fetchAlerts()
    }
  }

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)

    if (error) {
      console.error('Error deleting alert:', error)
      alert('Failed to delete alert')
    } else {
      fetchAlerts()
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'text-red-700 bg-red-100 border-red-300'
      case 'warning': return 'text-yellow-700 bg-yellow-100 border-yellow-300'
      default: return 'text-blue-700 bg-blue-100 border-blue-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Service Alerts</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-sewanee-purple text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              {showForm ? 'Cancel' : 'New Alert'}
            </button>
          </div>
        </div>

        {/* Alert Form */}
        {showForm && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <form onSubmit={createAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Alert title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                  placeholder="Alert message"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-sewanee-purple text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Alert'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Alerts List */}
        <div className="divide-y divide-gray-200">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getTypeColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                    {alert.active ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-green-700 bg-green-100 border border-green-300">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full text-gray-700 bg-gray-100 border border-gray-300">
                        INACTIVE
                      </span>
                    )}
                  </div>

                  <h3 className="font-medium text-gray-900 mb-1">{alert.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{alert.message}</p>

                  <div className="text-xs text-gray-500">
                    Created: {formatDate(alert.created_at)}
                    {alert.expires_at && (
                      <span className="ml-4">
                        Expires: {formatDate(alert.expires_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => toggleAlert(alert.id, alert.active)}
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      alert.active
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {alert.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No alerts created yet
          </div>
        )}
      </div>
    </div>
  )
}