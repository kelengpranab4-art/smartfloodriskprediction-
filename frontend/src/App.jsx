import React, { useState } from 'react'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <div className="App">
      {isAdmin ? (
        <AdminPanel onLogout={() => setIsAdmin(false)} />
      ) : (
        <div style={{ position: 'relative' }}>
          <Dashboard />
          <button 
            onClick={() => setIsAdmin(true)}
            style={{
              position: 'fixed', bottom: 20, right: 20,
              background: 'var(--teal-700)', color: '#fff', 
              padding: '8px 16px', borderRadius: '8px',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontSize: 12, fontWeight: 600,
              zIndex: 1000
            }}
          >
            Admin Access
          </button>
        </div>
      )}
    </div>
  )
}

export default App
