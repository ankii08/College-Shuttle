import { Tabs } from 'expo-router'
import { MapPin, Navigation, User } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserRole } from '@/types/database'

export default function TabLayout() {
  const [userRole, setUserRole] = useState<UserRole>('student') // Back to default student
  const [loading, setLoading] = useState(true)
  const [roleConfirmed, setRoleConfirmed] = useState(false) // Track if role is confirmed from DB

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Getting role for user:', user?.id)
        
        if (user) {
          // Add a small delay to ensure role is created
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const { data: roleData, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single()
          
          console.log('Role data:', roleData, 'Error:', error)
          
          if (roleData) {
            setUserRole((roleData as any).role)
            setRoleConfirmed(true)
            console.log('Set user role to:', (roleData as any).role)
          } else if (!error || error.code === 'PGRST116') {
            // No role found, create default student role
            console.log('Creating default student role')
            const { error: insertError } = await supabase.from('user_roles').insert([{
              user_id: user.id,
              role: 'student'
            }] as any)
            
            if (insertError) {
              console.error('Error creating role:', insertError)
            } else {
              setUserRole('student')
              setRoleConfirmed(true)
              console.log('Successfully created and set student role')
            }
          } else {
            // Error fetching role, default to student
            console.error('Error fetching role:', error)
            setUserRole('student')
            setRoleConfirmed(true)
          }
        } else {
          console.log('No user found')
        }
      } catch (error) {
        console.error('Error getting user role:', error)
        setUserRole('student') // Default to student on error
        setRoleConfirmed(true)
      } finally {
        setLoading(false)
      }
    }

    getUserRole()

    // Listen for auth state changes to refresh role
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session:', !!session)
      if (event === 'SIGNED_IN' && session) {
        setLoading(true)
        setRoleConfirmed(false)
        // Add delay and force refresh
        setTimeout(() => {
          getUserRole()
        }, 1000)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading || !roleConfirmed) {
    return null // Don't render tabs until we have a confirmed role from database
  }

  console.log('🔍 FINAL DEBUG - userRole:', userRole, 'type:', typeof userRole)
  console.log('🚌 Student tab href:', '/student') // Always visible - students, drivers, and admins can see this
  console.log('🚗 Driver tab href:', userRole === 'driver' || userRole === 'admin' ? '/driver' : null)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4B0082', // Sewanee purple
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: 25, // Increased from 5 to avoid home indicator
          paddingTop: 8,     // Slightly increased from 5
          height: 80,        // Increased from 60 to accommodate more padding
          position: 'absolute',
          bottom: 0,
        },
      }}>
      <Tabs.Screen
        name="student/index"
        options={{
          title: 'Shuttle',
          tabBarIcon: ({ size, color }) => (
            <MapPin size={size} color={color} />
          ),
          href: '/student', // Always visible - both students and drivers can see this
        }}
      />
      <Tabs.Screen
        name="driver/index"
        options={{
          title: 'Driver',
          tabBarIcon: ({ size, color }) => (
            <Navigation size={size} color={color} />
          ),
          href: userRole === 'driver' || userRole === 'admin' ? '/driver' : null, // Visible to drivers and admins
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}