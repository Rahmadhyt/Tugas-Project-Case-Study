import React from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import TestConnection from './components/TestConnection'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner"></div>
        <div style={{ color: 'white', fontSize: '18px' }}>
          Memuat aplikasi...
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      {!user && <TestConnection />}
      {user ? <Dashboard /> : <Login />}
    </div>
  )
}

export default App