import { useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import { auth } from '../firebase-config'
import { logSecurityEvent } from '../utils/security'
import { RateLimiter } from '../utils/validation'

// Rate limiter untuk login attempts
const loginRateLimiter = new RateLimiter()

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user)
      
      if (user) {
        // Log successful login
        await logSecurityEvent('login_success', user.uid, {
          provider: user.providerData[0]?.providerId
        })
        
        // Check if email is verified
        if (!user.emailVerified) {
          console.warn('Email not verified')
        }
      }
      
      setUser(user)
      setLoading(false)
      setError('')
    }, (error) => {
      console.error('Auth state error:', error)
      setError(getAuthErrorMessage(error.code))
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const clearError = () => setError('')

  const loginWithEmail = async (email, password) => {
    // Rate limiting check
    if (!loginRateLimiter.attempt(email)) {
      const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(email) / 60000)
      const errorMsg = `Terlalu banyak percobaan login. Coba lagi dalam ${remainingTime} menit.`
      setError(errorMsg)
      await logSecurityEvent('rate_limit_exceeded', null, { email, remainingTime })
      throw new Error(errorMsg)
    }

    try {
      setError('')
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      
      await logSecurityEvent('login_success', result.user.uid, {
        method: 'email_password'
      })
      
      console.log('Login success:', result.user)
      return result
    } catch (error) {
      const errorMsg = getAuthErrorMessage(error.code)
      setError(errorMsg)
      
      await logSecurityEvent('login_failure', null, {
        email,
        error: error.code,
        reason: errorMsg
      })
      
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const registerWithEmail = async (email, password, displayName) => {
    try {
      setError('')
      setLoading(true)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile dengan display name
      if (displayName) {
        await updateProfile(result.user, {
          displayName: displayName
        })
      }
      
      // Send email verification
      await sendEmailVerification(result.user)
      
      await logSecurityEvent('user_registered', result.user.uid, {
        email,
        hasDisplayName: !!displayName
      })
      
      console.log('Register success:', result.user)
      return result
    } catch (error) {
      const errorMsg = getAuthErrorMessage(error.code)
      setError(errorMsg)
      
      await logSecurityEvent('registration_failed', null, {
        email,
        error: error.code
      })
      
      console.error('Register error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    try {
      setError('')
      setLoading(true)
      const provider = new GoogleAuthProvider()
      provider.addScope('profile')
      provider.addScope('email')
      
      const result = await signInWithPopup(auth, provider)
      
      await logSecurityEvent('login_success', result.user.uid, {
        method: 'google_oauth'
      })
      
      console.log('Google login success:', result.user)
      return result
    } catch (error) {
      const errorMsg = getAuthErrorMessage(error.code)
      setError(errorMsg)
      
      await logSecurityEvent('login_failure', null, {
        method: 'google_oauth',
        error: error.code
      })
      
      console.error('Google login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError('')
      setLoading(true)
      
      if (user) {
        await logSecurityEvent('user_logout', user.uid)
      }
      
      await signOut(auth)
      console.log('Logout success')
    } catch (error) {
      const errorMsg = getAuthErrorMessage(error.code)
      setError(errorMsg)
      console.error('Logout error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    if (!user || !user.email) throw new Error('User not authenticated')

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      
      // Change password
      await updatePassword(user, newPassword)
      
      await logSecurityEvent('password_changed', user.uid)
      
      return true
    } catch (error) {
      const errorMsg = getAuthErrorMessage(error.code)
      await logSecurityEvent('password_change_failed', user.uid, {
        error: error.code
      })
      throw new Error(errorMsg)
    }
  }

  const resendEmailVerification = async () => {
    if (!user) throw new Error('User not authenticated')

    try {
      await sendEmailVerification(user)
      await logSecurityEvent('email_verification_resent', user.uid)
      return true
    } catch (error) {
      const errorMsg = getAuthErrorMessage(error.code)
      throw new Error(errorMsg)
    }
  }

  return {
    user,
    loading,
    error,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    changePassword,
    resendEmailVerification,
    clearError
  }
}

// Helper function untuk error messages
const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/invalid-email': 'Email tidak valid',
    'auth/user-disabled': 'Akun ini dinonaktifkan',
    'auth/user-not-found': 'User tidak ditemukan',
    'auth/wrong-password': 'Password salah',
    'auth/email-already-in-use': 'Email sudah digunakan',
    'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter)',
    'auth/network-request-failed': 'Koneksi jaringan gagal',
    'auth/too-many-requests': 'Terlalu banyak percobaan, coba lagi nanti',
    'auth/operation-not-allowed': 'Operasi tidak diizinkan',
    'auth/popup-closed-by-user': 'Popup login ditutup',
    'auth/popup-blocked': 'Popup diblokir oleh browser',
    'auth/requires-recent-login': 'Perlu login ulang untuk aksi ini',
  }
  
  return errorMessages[errorCode] || 'Terjadi kesalahan, coba lagi'
}