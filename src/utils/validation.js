import { SECURITY_CONFIG } from './security'

// Input validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  const minLength = SECURITY_CONFIG.APP_ENV === 'production' ? 8 : 6
  
  if (password.length < minLength) return `Password minimal ${minLength} karakter`
  if (!/[a-zA-Z]/.test(password)) return 'Password harus mengandung huruf'
  if (!/\d/.test(password)) return 'Password harus mengandung angka'
  return null
}

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export const validatePost = (text) => {
  const sanitized = sanitizeInput(text)
  if (sanitized.length === 0) return 'Post tidak boleh kosong'
  if (sanitized.length > 1000) return 'Post maksimal 1000 karakter'
  return null
}

// Rate limiting helper
export class RateLimiter {
  constructor(maxAttempts = null, timeWindow = null) {
    this.maxAttempts = maxAttempts || SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS
    this.timeWindow = timeWindow || (SECURITY_CONFIG.LOGIN_TIMEOUT_MINUTES * 60 * 1000)
    this.attempts = new Map()
  }

  attempt(key) {
    const now = Date.now()
    const userAttempts = this.attempts.get(key) || []

    // Remove old attempts
    const recentAttempts = userAttempts.filter(time => now - time < this.timeWindow)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }

    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)
    return true
  }

  getRemainingTime(key) {
    const userAttempts = this.attempts.get(key) || []
    if (userAttempts.length === 0) return 0

    const oldestAttempt = Math.min(...userAttempts)
    return this.timeWindow - (Date.now() - oldestAttempt)
  }

  getRemainingAttempts(key) {
    const userAttempts = this.attempts.get(key) || []
    const now = Date.now()
    const recentAttempts = userAttempts.filter(time => now - time < this.timeWindow)
    return this.maxAttempts - recentAttempts.length
  }

  // Reset attempts for a specific key
  reset(key) {
    this.attempts.delete(key)
  }

  // Get all active rate limits (for admin purposes)
  getActiveLimits() {
    const active = {}
    const now = Date.now()
    
    this.attempts.forEach((attempts, key) => {
      const recentAttempts = attempts.filter(time => now - time < this.timeWindow)
      if (recentAttempts.length > 0) {
        active[key] = {
          attempts: recentAttempts.length,
          remaining: this.maxAttempts - recentAttempts.length,
          resetIn: this.timeWindow - (now - Math.min(...recentAttempts))
        }
      }
    })
    
    return active
  }
}

// Form validation helper
export const validateForm = (fields) => {
  const errors = {}
  
  if (fields.email && !validateEmail(fields.email)) {
    errors.email = 'Format email tidak valid'
  }
  
  if (fields.password) {
    const passwordError = validatePassword(fields.password)
    if (passwordError) {
      errors.password = passwordError
    }
  }
  
  if (fields.displayName && !fields.displayName.trim()) {
    errors.displayName = 'Nama lengkap harus diisi'
  }
  
  if (fields.post) {
    const postError = validatePost(fields.post)
    if (postError) {
      errors.post = postError
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Export default rate limiter instance
export const defaultRateLimiter = new RateLimiter()