import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { db } from '../firebase-config'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { validatePost, sanitizeInput } from '../utils/validation'
import { checkPasswordStrength, escapeHtml } from '../utils/security'

const Dashboard = () => {
  const { user, logout, changePassword, resendEmailVerification } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(false)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [securityInfo, setSecurityInfo] = useState({
    passwordStrength: '',
    lastLogin: 'Tidak tersedia',
    accountCreated: 'Tidak tersedia'
  })

  // 🔥 PERBAIKAN: Semua Hooks dipanggil di top level secara konsisten
  // Load user's posts - SELALU dijalankan
  useEffect(() => {
    if (!user) {
      setDashboardLoading(false)
      return
    }

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData = []
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() })
      })
      setPosts(postsData)
      setDashboardLoading(false)
    })

    return unsubscribe
  }, [user])

  // Security info effect - SELALU dijalankan
  useEffect(() => {
    if (user) {
      const strength = checkPasswordStrength('dummy')
      setSecurityInfo(prev => ({
        ...prev,
        passwordStrength: strength.strength,
        accountCreated: user.metadata?.creationTime || 'Tidak tersedia',
        lastLogin: user.metadata?.lastSignInTime || 'Tidak tersedia'
      }))
    } else {
      // Reset security info jika user null
      setSecurityInfo({
        passwordStrength: '',
        lastLogin: 'Tidak tersedia',
        accountCreated: 'Tidak tersedia'
      })
    }
  }, [user])

  // Helper functions untuk menghindari null errors
  const getUserDisplayName = () => {
    return user?.displayName || user?.email || 'User'
  }

  const getUserEmail = () => {
    return user?.email || 'Email tidak tersedia'
  }

  const getUserId = () => {
    return user?.uid || 'ID tidak tersedia'
  }

  const getEmailVerified = () => {
    return user?.emailVerified || false
  }

  const getProvider = () => {
    return user?.providerData?.[0]?.providerId || 'Email/Password'
  }

  const getAvatarLetter = () => {
    const name = getUserDisplayName()
    return name.charAt(0).toUpperCase()
  }

  const addPost = async (e) => {
    e.preventDefault()
    
    // Input validation
    const validationError = validatePost(newPost)
    if (validationError) {
      alert(validationError)
      return
    }

    if (!newPost.trim()) return

    setLoading(true)
    try {
      const sanitizedText = sanitizeInput(newPost)
      
      await addDoc(collection(db, 'posts'), {
        text: sanitizedText,
        userId: user.uid,
        userEmail: user.email,
        displayName: user.displayName || user.email,
        createdAt: new Date(),
        public: false,
        sanitized: true
      })
      setNewPost('')
    } catch (error) {
      console.error('Error adding post:', error)
      alert('Gagal menambah post: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (postId) => {
    if (!window.confirm('Hapus post ini?')) return

    try {
      await deleteDoc(doc(db, 'posts', postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Gagal menghapus post: ' + error.message)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleResendVerification = async () => {
    try {
      await resendEmailVerification()
      alert('Email verifikasi telah dikirim! Cek inbox Anda.')
    } catch (error) {
      alert('Gagal mengirim email verifikasi: ' + error.message)
    }
  }

  // 🔥 PERBAIKAN: Conditional rendering setelah semua Hooks
  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        color: 'white'
      }}>
        <div className="spinner"></div>
        <div style={{ marginTop: '20px' }}>Loading user data...</div>
      </div>
    )
  }

  // Render utama setelah semua Hooks dan conditional checks
  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="nav-brand">SecureAuth App</div>
          <div className="nav-user">
            <div className="user-info">
              <div className="user-avatar">
                {getAvatarLetter()}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {getUserDisplayName()}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {getUserEmail()}
                </div>
              </div>
            </div>
            <button 
              onClick={logout}
              className="btn btn-logout"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {/* Tab Navigation */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            borderBottom: '2px solid #e1e1e1'
          }}>
            <button
              onClick={() => setActiveTab('posts')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: activeTab === 'posts' ? '#3498db' : 'transparent',
                color: activeTab === 'posts' ? 'white' : '#666',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0'
              }}
            >
              📝 Posts
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: activeTab === 'security' ? '#3498db' : 'transparent',
                color: activeTab === 'security' ? 'white' : '#666',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0'
              }}
            >
              🛡️ Security
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: activeTab === 'profile' ? '#3498db' : 'transparent',
                color: activeTab === 'profile' ? 'white' : '#666',
                cursor: 'pointer',
                borderRadius: '6px 6px 0 0'
              }}
            >
              👤 Profile
            </button>
          </div>
        </div>

        {activeTab === 'posts' && (
          <>
            {/* Welcome Section */}
            <div className="card">
              <h1 style={{ color: '#3498db', marginBottom: '10px' }}>
                Selamat Datang! 🎉
              </h1>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Anda berhasil login dengan aman menggunakan Firebase Authentication.
              </p>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '20px',
                marginTop: '30px'
              }}>
                <div style={{ padding: '20px', background: '#e8f4f8', borderRadius: '8px' }}>
                  <h3 style={{ color: '#3498db', marginBottom: '10px' }}>🔐 Authentication</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Login aman dengan email/password atau Google OAuth
                  </p>
                </div>
                
                <div style={{ padding: '20px', background: '#e8f4f8', borderRadius: '8px' }}>
                  <h3 style={{ color: '#3498db', marginBottom: '10px' }}>🛡️ Security</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Dilindungi SSL/TLS dan Firebase Security Rules
                  </p>
                </div>
                
                <div style={{ padding: '20px', background: '#e8f4f8', borderRadius: '8px' }}>
                  <h3 style={{ color: '#3498db', marginBottom: '10px' }}>📊 Firestore</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    Data tersimpan aman di Cloud Firestore
                  </p>
                </div>
              </div>
            </div>

            {/* Simple Post System */}
            <div className="card">
              <h2 style={{ marginBottom: '20px', color: '#333' }}>Simple Post System</h2>
              
              <form onSubmit={addPost} style={{ marginBottom: '30px' }}>
                <div className="form-group">
                  <label className="form-label">Tulis Post Baru (XSS Protected)</label>
                  <textarea
                    className="form-input"
                    placeholder="Apa yang sedang Anda pikirkan? Konten akan secara otomatis disanitasi untuk mencegah XSS."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows="3"
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Menambah...' : 'Tambah Post'}
                </button>
              </form>

              {dashboardLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <div style={{ marginTop: '10px', color: '#666' }}>Memuat postingan...</div>
                </div>
              ) : (
                <div>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>Postingan Anda ({posts.length})</h3>
                  {posts.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                      Belum ada postingan. Tambah post pertama Anda!
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {posts.map((post) => (
                        <div 
                          key={post.id}
                          style={{ 
                            padding: '15px', 
                            border: '1px solid #e1e1e1', 
                            borderRadius: '8px',
                            background: '#f9f9f9'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                            <div>
                              <strong>{post.displayName || 'Anonymous'}</strong>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {formatDate(post.createdAt)}
                                {post.sanitized && ' 🔒 (Sanitized)'}
                              </div>
                            </div>
                            <button 
                              onClick={() => deletePost(post.id)}
                              style={{ 
                                background: '#e74c3c', 
                                color: 'white', 
                                border: 'none', 
                                padding: '5px 10px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Hapus
                            </button>
                          </div>
                          <div dangerouslySetInnerHTML={{ __html: escapeHtml(post.text) }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'security' && (
          <div className="card">
            <h2 style={{ color: '#3498db', marginBottom: '20px' }}>🛡️ Security Center</h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* Security Status */}
              <div style={{ 
                padding: '20px', 
                background: '#e8f5e8', 
                borderRadius: '8px',
                border: '1px solid #c3e6cb'
              }}>
                <h3 style={{ color: '#27ae60', marginBottom: '10px' }}>Status Keamanan</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <strong>Email Verification:</strong>
                    <div style={{ 
                      color: getEmailVerified() ? '#27ae60' : '#e74c3c',
                      fontWeight: 'bold',
                      marginTop: '5px'
                    }}>
                      {getEmailVerified() ? '✅ Verified' : '❌ Not Verified'}
                    </div>
                    {!getEmailVerified() && (
                      <button 
                        onClick={handleResendVerification}
                        style={{
                          background: '#3498db',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginTop: '5px'
                        }}
                      >
                        Kirim Ulang Verifikasi
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <strong>Last Login:</strong>
                    <div style={{ marginTop: '5px' }}>{securityInfo.lastLogin}</div>
                  </div>
                  
                  <div>
                    <strong>Account Created:</strong>
                    <div style={{ marginTop: '5px' }}>{securityInfo.accountCreated}</div>
                  </div>
                  
                  <div>
                    <strong>Login Provider:</strong>
                    <div style={{ marginTop: '5px' }}>{getProvider()}</div>
                  </div>
                </div>
              </div>

              {/* Security Features */}
              <div>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Fitur Keamanan yang Aktif</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                    <strong>🔒 Firebase Security Rules</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Akses data dibatasi berdasarkan user ID</p>
                  </div>
                  
                  <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                    <strong>🛡️ Input Sanitization</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Proteksi terhadap XSS attacks</p>
                  </div>
                  
                  <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                    <strong>⏱️ Rate Limiting</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Pembatasan percobaan login</p>
                  </div>
                  
                  <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
                    <strong>📊 Activity Logging</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Pencatatan aktivitas keamanan</p>
                  </div>
                </div>
              </div>

              {/* Security Recommendations */}
              <div style={{ 
                padding: '20px', 
                background: '#e3f2fd', 
                borderRadius: '8px',
                border: '1px solid #bbdefb'
              }}>
                <h3 style={{ color: '#1976d2', marginBottom: '10px' }}>Rekomendasi Keamanan</h3>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {!getEmailVerified() && (
                    <li>Verifikasi alamat email Anda untuk keamanan tambahan</li>
                  )}
                  <li>Gunakan password yang kuat dan unik</li>
                  <li>Jangan bagikan credential login Anda</li>
                  <li>Logout dari perangkat yang tidak dikenal</li>
                  <li>Update password secara berkala</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="card">
            <h2 style={{ color: '#3498db', marginBottom: '20px' }}>👤 User Profile</h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              {/* User Information */}
              <div style={{ 
                padding: '20px', 
                background: '#f8f9fa', 
                borderRadius: '8px'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Informasi User</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '15px' 
                }}>
                  <div>
                    <strong>User ID:</strong>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '12px', 
                      background: '#f5f5f5', 
                      padding: '8px',
                      borderRadius: '4px',
                      marginTop: '5px',
                      wordBreak: 'break-all'
                    }}>
                      {getUserId()}
                    </div>
                  </div>
                  <div>
                    <strong>Email:</strong>
                    <div style={{ marginTop: '5px' }}>{getUserEmail()}</div>
                  </div>
                  <div>
                    <strong>Display Name:</strong>
                    <div style={{ marginTop: '5px' }}>{getUserDisplayName()}</div>
                  </div>
                  <div>
                    <strong>Provider:</strong>
                    <div style={{ marginTop: '5px' }}>{getProvider()}</div>
                  </div>
                </div>
              </div>

              {/* Account Metadata */}
              <div>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>Account Metadata</h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  <div style={{ padding: '15px', background: '#e8f4f8', borderRadius: '6px' }}>
                    <strong>Account Created</strong>
                    <div style={{ marginTop: '5px' }}>{securityInfo.accountCreated}</div>
                  </div>
                  
                  <div style={{ padding: '15px', background: '#e8f4f8', borderRadius: '6px' }}>
                    <strong>Last Sign In</strong>
                    <div style={{ marginTop: '5px' }}>{securityInfo.lastLogin}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard