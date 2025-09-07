import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '@/lib/supabase'
import { Play, Square, Wifi, WifiOff, Battery, MapPin, Navigation, Zap } from 'lucide-react-native'

const LOCATION_TASK_NAME = 'background-location-task'
const PING_QUEUE_KEY = 'gps_ping_queue'

interface LocationPing {
  vehicle_label: string
  lat: number
  lng: number
  timestamp: string
  speed: number | null
  heading: number | null
  accuracy: number | null
  battery: number | null
}

interface DriverInfo {
  name: string
  assigned_vehicle: string
  vehicle_label?: string
}

// Background location task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error)
    return
  }

  if (data) {
    const { locations } = data as any
    const location = locations[0]

    if (location) {
      console.log('Background location received:', location.coords.latitude, location.coords.longitude)
      // Queue the location ping
      await queueLocationPing(location)
    }
  }
})

// Alternative simple location tracking for Expo Go
const startSimpleLocationTracking = () => {
  return setInterval(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      console.log('Simple location update:', location.coords.latitude, location.coords.longitude)
      await queueLocationPing(location)
    } catch (error) {
      console.error('Simple location error:', error)
    }
  }, 10000) // Every 10 seconds
}

const queueLocationPing = async (location: any) => {
  try {
    const driverData = await AsyncStorage.getItem('driver_info')
    if (!driverData) return

    const driver: DriverInfo = JSON.parse(driverData)

    const ping: LocationPing = {
      vehicle_label: driver.vehicle_label || driver.assigned_vehicle,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      timestamp: new Date(location.timestamp).toISOString(),
      speed: location.coords.speed ? location.coords.speed * 2.237 : null, // m/s to mph
      heading: location.coords.heading,
      accuracy: location.coords.accuracy,
      battery: null, // Could integrate with expo-battery if needed
    }

    // Get existing queue
    const queueData = await AsyncStorage.getItem(PING_QUEUE_KEY)
    const queue = queueData ? JSON.parse(queueData) : []

    // Add new ping
    queue.push(ping)

    // Keep only last 100 pings in queue
    if (queue.length > 100) {
      queue.splice(0, queue.length - 100)
    }

    await AsyncStorage.setItem(PING_QUEUE_KEY, JSON.stringify(queue))

    // Try to send queued pings
    await sendQueuedPings()
  } catch (error) {
    console.error('Error queuing location ping:', error)
  }
}

const sendQueuedPings = async () => {
  try {
    const queueData = await AsyncStorage.getItem(PING_QUEUE_KEY)
    if (!queueData) return

    const queue: LocationPing[] = JSON.parse(queueData)
    if (queue.length === 0) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Send pings to edge function
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pings: queue }),
    })

    if (response.ok) {
      // Clear successful pings
      await AsyncStorage.removeItem(PING_QUEUE_KEY)
    }
  } catch (error) {
    console.error('Error sending queued pings:', error)
  }
}

export default function DriverScreen() {
  const [isTracking, setIsTracking] = useState(false)
  const [isStartingShift, setIsStartingShift] = useState(false) // Loading state for starting
  const [isStoppingShift, setIsStoppingShift] = useState(false) // Loading state for stopping
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline'>('offline')
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null)
  const [queueSize, setQueueSize] = useState(0)
  const [keepScreenAwake, setKeepScreenAwake] = useState(true)
  const [locationInterval, setLocationInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadDriverInfo()
    checkQueue()
    
    // Check connection status periodically
    const interval = setInterval(async () => {
      await checkConnectionStatus()
      await checkQueue()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const loadDriverInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: driverData } = await supabase
        .from('drivers')
        .select(`
          name,
          assigned_vehicle,
          vehicles!inner(label)
        `)
        .eq('user_id', user.id)
        .eq('active', true)
        .single()

      if (driverData) {
        const info: DriverInfo = {
          name: (driverData as any).name,
          assigned_vehicle: (driverData as any).assigned_vehicle,
          vehicle_label: (driverData as any).vehicles?.label,
        }
        setDriverInfo(info)
        await AsyncStorage.setItem('driver_info', JSON.stringify(info))
      }
    } catch (error) {
      console.error('Error loading driver info:', error)
      Alert.alert('Error', 'Failed to load driver information')
    }
  }

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      })
      setConnectionStatus(response.ok ? 'connected' : 'offline')
    } catch {
      setConnectionStatus('offline')
    }
  }

  const checkQueue = async () => {
    try {
      const queueData = await AsyncStorage.getItem(PING_QUEUE_KEY)
      const queue = queueData ? JSON.parse(queueData) : []
      setQueueSize(queue.length)

      if (queue.length > 0) {
        const lastPing = queue[queue.length - 1]
        setLastPingTime(new Date(lastPing.timestamp))
      }
    } catch (error) {
      console.error('Error checking queue:', error)
    }
  }

  const requestPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync()
    if (foregroundStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for tracking')
      return false
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync()
    if (backgroundStatus !== 'granted') {
      Alert.alert('Permission Denied', 'Background location permission is required for continuous tracking')
      return false
    }

    return true
  }

  const startTracking = async () => {
    // Provide immediate haptic feedback first
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    if (!driverInfo) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Error', 'Driver information not loaded')
      return
    }

    setIsStartingShift(true)

    try {
      // Try basic location permissions first
      console.log('Requesting foreground permissions...')
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync()
      
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking')
        setIsStartingShift(false)
        return
      }

      console.log('Foreground permission granted, starting location tracking...')
      
      // Use a simpler approach that works with Expo Go
      // Start with foreground location only
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds (more conservative)
        distanceInterval: 20, // 20 meters
        // Remove foregroundService for Expo Go compatibility
      })

      console.log('Location tracking started successfully')
      setIsTracking(true)
      setIsStartingShift(false)
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Success', 'Location tracking started (foreground mode)')
      
    } catch (error) {
      console.error('Error starting location tracking:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      setIsStartingShift(false)
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      // Check if it's still the Info.plist error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('NSLocation') || errorMessage.includes('Info.plist')) {
        Alert.alert(
          'Expo Go Limitation', 
          'Background location tracking is not supported in Expo Go.\n\nOptions:\n1. Use Simple Mode (foreground only)\n2. Simulate for testing',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Simple Mode', onPress: () => {
              // Use simple location tracking
              const interval = startSimpleLocationTracking()
              setLocationInterval(interval)
              setIsTracking(true)
              setIsStartingShift(false)
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              Alert.alert('Simple Mode Active', 'Location tracking every 10 seconds (keep app open)')
            }},
            { text: 'Simulate', onPress: () => {
              // Simulate tracking mode for testing
              setIsTracking(true)
              setIsStartingShift(false)
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              Alert.alert('Simulation Mode', 'UI is now in tracking mode for testing')
            }}
          ]
        )
      } else {
        Alert.alert('Error', `Failed to start location tracking: ${errorMessage}`)
      }
    }
  }

  const stopTracking = async () => {
    // Provide immediate haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsStoppingShift(true)

    try {
      // Stop background location updates
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      
      // Clear simple location interval if it exists
      if (locationInterval) {
        clearInterval(locationInterval)
        setLocationInterval(null)
      }
      
      setIsTracking(false)
      setIsStoppingShift(false)
      
      // Success haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Success', 'Location tracking stopped')
    } catch (error) {
      console.error('Error stopping location tracking:', error)
      setIsStoppingShift(false)
      
      // Even if there's an error, try to clear the interval and reset state
      if (locationInterval) {
        clearInterval(locationInterval)
        setLocationInterval(null)
      }
      setIsTracking(false)
      
      // Error haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Warning', 'Location tracking stopped (with errors)')
    }
  }

  const forceSyncQueue = async () => {
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    await sendQueuedPings()
    await checkQueue()
    await checkConnectionStatus()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Dashboard</Text>
          {driverInfo && (
            <Text style={styles.subtitle}>
              {driverInfo.name} • Vehicle {driverInfo.vehicle_label}
            </Text>
          )}
        </View>

      {/* Status Cards */}
      <View style={styles.statusGrid}>
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            {connectionStatus === 'connected' ? (
              <Wifi size={24} color="#10B981" />
            ) : (
              <WifiOff size={24} color="#EF4444" />
            )}
          </View>
          <Text style={styles.statusLabel}>Connection</Text>
          <Text style={[styles.statusValue, { 
            color: connectionStatus === 'connected' ? '#10B981' : '#EF4444' 
          }]}>
            {connectionStatus === 'connected' ? 'Online' : 'Offline'}
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <MapPin size={24} color="#4B0082" />
          </View>
          <Text style={styles.statusLabel}>Queue</Text>
          <Text style={styles.statusValue}>{queueSize} pings</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Battery size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statusLabel}>Last Ping</Text>
          <Text style={styles.statusValue}>
            {lastPingTime ? lastPingTime.toLocaleTimeString() : 'Never'}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.trackingButton, 
            isTracking && styles.trackingButtonActive,
            (isStartingShift || isStoppingShift) && styles.trackingButtonDisabled
          ]}
          onPress={isTracking ? stopTracking : startTracking}
          disabled={isStartingShift || isStoppingShift}
        >
          <View style={styles.buttonIcon}>
            {isStartingShift || isStoppingShift ? (
              <ActivityIndicator size={24} color="#FFFFFF" />
            ) : isTracking ? (
              <Square size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.trackingButtonText}>
            {isStartingShift 
              ? 'Starting...' 
              : isStoppingShift 
                ? 'Stopping...' 
                : isTracking 
                  ? 'Stop Shift' 
                  : 'Start Shift'
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={forceSyncQueue}
        >
          <Text style={styles.syncButtonText}>Sync Queue</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.settings}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Keep screen awake</Text>
          <Switch
            value={keepScreenAwake}
            onValueChange={setKeepScreenAwake}
            trackColor={{ false: '#E5E7EB', true: '#4B0082' }}
            thumbColor={keepScreenAwake ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          • Press &quot;Start Shift&quot; to begin location tracking{'\n'}
          • Keep the app running in background{'\n'}
          • GPS data is queued offline and synced automatically{'\n'}
          • Use &quot;Sync Queue&quot; to force data upload
        </Text>
      </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, // Extra padding to avoid tab bar
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  controls: {
    gap: 12,
    marginBottom: 24,
  },
  trackingButton: {
    backgroundColor: '#4B0082',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingButtonActive: {
    backgroundColor: '#EF4444',
  },
  trackingButtonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  trackingButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  syncButtonText: {
    color: '#4B0082',
    fontSize: 16,
    fontWeight: '600',
  },
  settings: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
  },
  instructions: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
})