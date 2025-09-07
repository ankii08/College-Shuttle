import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, RefreshControl, ScrollView, TouchableOpacity } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, Clock, MapPin, RefreshCw, Navigation, Zap } from 'lucide-react-native'

interface VehiclePosition {
  vehicle_id: string
  lat: number
  lng: number
  snapped_lat: number
  snapped_lng: number
  timestamp: string
  speed: number | null
  battery: number | null
}

interface Stop {
  id: string
  name: string
  lat: number
  lng: number
  sequence: number
}

interface ServiceAlert {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'urgent'
}

interface ETA {
  id?: string
  vehicle_id?: string
  stop_id?: string
  stop_name: string
  estimated_arrival: string
  distance_km: number
}

export default function StudentScreen() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [alerts, setAlerts] = useState<ServiceAlert[]>([])
  const [etas, setEtas] = useState<ETA[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [region, setRegion] = useState({
    latitude: 35.2045,
    longitude: -85.9209, // Sewanee coordinates
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })

  const fetchData = async () => {
    try {
      // Fetch active vehicle positions
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicle_latest')
        .select('*')

      if (vehicleError) throw vehicleError
      setVehicles(vehicleData || [])

      // Fetch stops
      const { data: stopsData, error: stopsError } = await supabase
        .from('stops')
        .select('*')
        .order('sequence')

      if (stopsError) throw stopsError
      setStops(stopsData || [])

      // Fetch active alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('active', true)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (alertsError) throw alertsError
      setAlerts(alertsData || [])

      // Fetch ETAs
      const { data: etaData, error: etaError } = await supabase
        .from('eta_to_stops')
        .select('*')
        .order('estimated_arrival')

      if (etaError) throw etaError
      setEtas(etaData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      Alert.alert('Error', 'Failed to load shuttle data')
    }
  }

  useEffect(() => {
    fetchData()

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('vehicle_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vehicle_latest' },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchData() // Refresh data on updates
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const formatETA = (timestamp: string) => {
    const eta = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.round((eta.getTime() - now.getTime()) / (1000 * 60))
    
    if (diffMinutes <= 0) return 'Arriving now'
    if (diffMinutes === 1) return '1 minute'
    return `${diffMinutes} minutes`
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'urgent': return '#EF4444'
      case 'warning': return '#F59E0B'
      default: return '#3B82F6'
    }
  }

  const centerMapOnUser = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required to center the map on your location')
        return
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      // Update map region to center on user location
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Zoom in closer than default
        longitudeDelta: 0.005,
      })

    } catch (error) {
      console.error('Error getting location:', error)
      Alert.alert('Error', 'Unable to get your current location')
    }
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient - extends to top of screen */}
      <LinearGradient
        colors={['#4B0082', '#6B46C1']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={centerMapOnUser} style={styles.headerIcon}>
              <Navigation size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
              <RefreshCw size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Shuttle Tracker</Text>
          <Text style={styles.headerSubtitle}>Real-time campus transportation</Text>
          
          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: vehicles.length > 0 ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {vehicles.length} shuttle{vehicles.length !== 1 ? 's' : ''} active
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#4B0082"
            colors={['#4B0082']}
          />
        }
      >
        {/* Service Alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertsContainer}>
            {alerts.map((alert) => (
              <View 
                key={alert.id} 
                style={[styles.alert, { borderLeftColor: getAlertColor(alert.type) }]}
              >
                <View style={styles.alertIcon}>
                  <AlertTriangle size={16} color={getAlertColor(alert.type)} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Map */}
        <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {/* Shuttle markers */}
          {vehicles.map((vehicle) => (
            <Marker
              key={vehicle.vehicle_id}
              coordinate={{
                latitude: vehicle.snapped_lat,
                longitude: vehicle.snapped_lng,
              }}
              title="Shuttle"
              description={`Speed: ${vehicle.speed?.toFixed(1) || 'Unknown'} mph`}
            >
              <View style={styles.shuttleMarker}>
                <Text style={styles.shuttleText}>🚐</Text>
              </View>
            </Marker>
          ))}

          {/* Stop markers */}
          {stops.map((stop) => (
            <Marker
              key={stop.id}
              coordinate={{
                latitude: stop.lat,
                longitude: stop.lng,
              }}
              title={stop.name}
            >
              <View style={styles.stopMarker}>
                <MapPin size={16} color="#4B0082" />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* ETA Information */}
      <View style={styles.etaContainer}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color="#4B0082" />
          <Text style={styles.sectionTitle}>Next Arrivals</Text>
        </View>

        {etas.length > 0 ? (
          etas.slice(0, 5).map((eta, index) => (
            <View key={eta.id || `eta-${index}`} style={styles.etaItem}>
              <View style={styles.etaStop}>
                <Text style={styles.etaStopName}>{eta.stop_name}</Text>
                <Text style={styles.etaDistance}>{eta.distance_km.toFixed(1)} km away</Text>
              </View>
              <Text style={styles.etaTime}>{formatETA(eta.estimated_arrival)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <RefreshCw size={24} color="#9CA3AF" />
            <Text style={styles.noDataText}>No shuttle data available</Text>
            <Text style={styles.noDataSubtext}>Pull to refresh</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 50,  // Enough padding to clear status bar and notch
    paddingBottom: 2, // Minimal bottom padding
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 100, // Extra padding to avoid tab bar
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  alertsContainer: {
    padding: 16,
    gap: 8,
  },
  alert: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
    marginLeft: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    color: '#6B7280',
  },
  mapContainer: {
    height: 500,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  shuttleMarker: {
    backgroundColor: '#4B0082',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  shuttleText: {
    fontSize: 16,
  },
  stopMarker: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4B0082',
  },
  etaContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  etaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  etaStop: {
    flex: 1,
  },
  etaStopName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  etaDistance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  etaTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B0082',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
})