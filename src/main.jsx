import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MockDataProvider } from './context/MockDataContext.jsx'
import './index.css'
import App from './App.jsx'

import { AuthProvider } from './context/AuthContext.jsx'

// Force unregister all service workers to prevent caching issues during rapid development
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MockDataProvider>
          <App />
        </MockDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
