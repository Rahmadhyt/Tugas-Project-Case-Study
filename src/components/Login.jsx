import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { validateEmail, validatePassword } from '../utils/validation'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [formErrors, setFormErrors] = useState({})
  
  const { 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle, 
    loading, 
    error, 
    clearError 
  } = useAuth()

  // Clear error ketika form mode berubah
  useEffect(() => {
    clearError()
    setFormErrors({})
  }, [isLogin])

  const validateForm = () => {
    const errors = {}
    
    if (!validateEmail(email)) {
      errors.email = 'Format email tidak valid'
    }
    
    const passwordError = validatePassword(password)
    if (passwordError) {
      errors.password = passwordError
    }
    
    if (!isLogin && !displayName.trim()) {
      errors.displayName = 'Nama lengkap harus diisi'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    clearError()
    
    if (!validateForm()) return

    try {
      if (isLogin) {
        await loginWithEmail(email, password)
      } else {
        await registerWithEmail(email, password, displayName)
      }
    } catch (error) {
      // Error sudah dihandle di hook
      console.error('Auth error:', error)
    }
  }

  const handleGoogleAuth = async () => {
    clearError()
    try {
      await loginWithGoogle()
    } catch (error) {
      console.error('Google auth error:', error)
    }
  }

  return (
    <div className="container">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#3498db', marginBottom: '10px' }}>
              {isLogin ? 'Login' : 'Daftar'}
            </h1>
            <p style={{ color: '#666' }}>
              {isLogin ? 'Masuk ke akun Anda' : 'Buat akun baru'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama lengkap"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={!isLogin}
                />
                {formErrors.displayName && (
                  <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                    {formErrors.displayName}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {formErrors.email && (
                <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                  {formErrors.email}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
              {formErrors.password && (
                <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                  {formErrors.password}
                </div>
              )}
              {!isLogin && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Minimal 6 karakter, mengandung huruf dan angka
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '15px' }}
              disabled={loading}
            >
              {loading ? 'Memproses...' : (isLogin ? 'Login' : 'Daftar')}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <span style={{ color: '#666' }}>atau</span>
          </div>

          <button 
            onClick={handleGoogleAuth}
            className="btn btn-google"
            style={{ width: '100%', marginBottom: '20px' }}
            disabled={loading}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isLogin ? 'Login dengan Google' : 'Daftar dengan Google'}
            </div>
          </button>

          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#3498db', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              type="button"
            >
              {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
            </button>
          </div>

          {/* Security Features Info */}
          <div style={{ 
            marginTop: '30px', 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <strong>Fitur Keamanan:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              <li>Password terenkripsi</li>
              <li>Validasi input</li>
              <li>Rate limiting</li>
              <li>SSL/TLS encryption</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login