import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  Dimensions,
  StatusBar
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, MapPin } from 'lucide-react-native'

const { width, height } = Dimensions.get('window')

interface SignInScreenProps {
  onAuthSuccess: () => void
}

export default function SignInScreen({ onAuthSuccess }: SignInScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      onAuthSuccess()
    }
  }

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })

        if (error) throw error

        if (data.user && !data.session) {
          Alert.alert(
            'Check your email',
            'Please check your email and click the confirmation link to complete your registration.'
          )
        } else if (data.user) {
          // Auto-assign student role for new users
          await assignStudentRole(data.user.id)
          onAuthSuccess()
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) throw error
        onAuthSuccess()
      }
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const assignStudentRole = async (userId: string) => {
    try {
      console.log('Assigning student role to user:', userId)
      
      // First check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (existingRole) {
        console.log('Role already exists:', (existingRole as any).role)
        return
      }
      
      const { error } = await supabase.from('user_roles').insert([{
        user_id: userId,
        role: 'student'
      }] as any)
      
      if (error) {
        console.error('Error assigning role:', error)
        throw error
      }
      
      console.log('Successfully assigned student role')
    } catch (error) {
      console.error('Error assigning role:', error)
      throw error
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#4B0082', '#6B46C1', '#8B5CF6']}
        style={styles.container}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MapPin size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Sewanee Shuttle</Text>
            <Text style={styles.subtitle}>Real-time campus transportation</Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isSignUp 
                  ? 'Sign up to track shuttles in real-time' 
                  : 'Sign in to your account'}
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.authButton, loading && styles.authButtonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#6B7280'] : ['#4B0082', '#7C3AED']}
                  style={styles.authButtonGradient}
                >
                  <Text style={styles.authButtonText}>
                    {loading 
                      ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                      : (isSignUp ? 'Create Account' : 'Sign In')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Toggle Sign Up/In */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.toggleLink}>
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>University of the South</Text>
            <Text style={styles.footerSubtext}>Campus Transportation Services</Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  authButton: {
    marginTop: 12,
    marginBottom: 24,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    color: '#6B7280',
    fontSize: 14,
    marginRight: 4,
  },
  toggleLink: {
    color: '#4B0082',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  footerSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
})
