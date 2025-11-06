import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase-config'

// Get security settings from environment
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5,
  LOGIN_TIMEOUT_MINUTES: parseInt(import.meta.env.VITE_LOGIN_TIMEOUT_MINUTES) || 15,
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_SECURITY_LOGGING === 'true',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development'
}

console.log('🛡️ Security Configuration:', SECURITY_CONFIG);

// Security logging
export const logSecurityEvent = async (eventType, userId, details = {}) => {
  // Only log in production or if explicitly enabled
  if (!SECURITY_CONFIG.ENABLE_LOGGING && SECURITY_CONFIG.APP_ENV === 'development') {
    console.log(`[SECURITY LOG] ${eventType}:`, { userId, details });
    return;
  }

  try {
    await addDoc(collection(db, 'security_logs'), {
      eventType,
      userId,
      userAgent: navigator.userAgent,
      timestamp: serverTimestamp(),
      ipAddress: await getClientIP(),
      details,
      severity: getEventSeverity(eventType),
      environment: SECURITY_CONFIG.APP_ENV
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

const getEventSeverity = (eventType) => {
  const severeEvents = [
    'login_failure', 
    'suspicious_activity', 
    'brute_force_attempt',
    'rate_limit_exceeded',
    'unauthorized_access'
  ]
  const mediumEvents = [
    'password_change', 
    'profile_update',
    'email_verification_resent'
  ]
  
  if (severeEvents.includes(eventType)) return 'high'
  if (mediumEvents.includes(eventType)) return 'medium'
  return 'low'
}

// Client IP detection
const getClientIP = async () => {
  if (SECURITY_CONFIG.APP_ENV === 'development') {
    return 'localhost'
  }
  
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    return 'unknown'
  }
}

// XSS Protection
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text
  
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// CSRF Token generation
export const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Password strength checker
export const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, strength: 'Sangat Lemah', isStrong: false }
  
  let score = 0
  
  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  
  // Character variety checks
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z\d]/.test(password)) score++

  const strengths = {
    0: 'Sangat Lemah',
    1: 'Lemah',
    2: 'Cukup',
    3: 'Baik',
    4: 'Kuat',
    5: 'Sangat Kuat',
    6: 'Excellent'
  }

  return {
    score: Math.min(score, 6),
    strength: strengths[Math.min(score, 6)] || 'Sangat Lemah',
    isStrong: score >= 4
  }
}

// Session security helpers
export const validateSession = (user) => {
  if (!user) return { isValid: false, reason: 'No user session' }
  
  // Check if email is verified (optional, depending on requirements)
  if (!user.emailVerified) {
    return { 
      isValid: true, 
      warning: 'Email not verified',
      recommendation: 'Please verify your email for enhanced security'
    }
  }
  
  // Check session age (you might want to implement this with a timestamp)
  const sessionAge = Date.now() - user.metadata.lastLoginAt
  const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours
  
  if (sessionAge > maxSessionAge) {
    return { 
      isValid: false, 
      reason: 'Session expired',
      recommendation: 'Please login again'
    }
  }
  
  return { isValid: true }
}

// Security headers helper (for SSR/backend)
export const getSecurityHeaders = () => {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline';"
  }
}

// Input sanitization for different contexts
export const sanitizeForDatabase = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/\$/g, '&#36;')
    .replace(/\./g, '&#46;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
}

export const sanitizeForHTML = (input) => {
  if (typeof input !== 'string') return input
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;'
  }
  
  return input.replace(/[&<>"'/]/g, (char) => map[char])
}

// Export security config
export { SECURITY_CONFIG }

// Security audit helper
export const performSecurityAudit = (user) => {
  const audit = {
    timestamp: new Date().toISOString(),
    userId: user?.uid || 'unknown',
    checks: {}
  }
  
  // Email verification check
  audit.checks.emailVerified = {
    passed: user?.emailVerified || false,
    importance: 'high',
    recommendation: user?.emailVerified ? null : 'Verify your email address'
  }
  
  // Password strength (this would need the actual password, so we skip in frontend)
  audit.checks.hasPassword = {
    passed: user?.providerData?.some(provider => provider.providerId === 'password') || false,
    importance: 'medium',
    recommendation: 'Use a strong, unique password'
  }
  
  // Multi-provider check
  audit.checks.multipleProviders = {
    passed: (user?.providerData?.length || 0) > 1,
    importance: 'low',
    recommendation: 'Consider adding multiple sign-in methods for backup'
  }
  
  // Recent activity check
  if (user?.metadata?.lastSignInTime) {
    const lastLogin = new Date(user.metadata.lastSignInTime)
    const daysSinceLastLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    audit.checks.recentActivity = {
      passed: daysSinceLastLogin < 30,
      importance: 'medium',
      recommendation: daysSinceLastLogin >= 30 ? 'Consider reviewing account activity' : null
    }
  }
  
  return audit
}