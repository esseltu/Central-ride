import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// BrowserRouter enables URL-based routing (pages/views matching URL paths) throughout the app.
import { BrowserRouter } from 'react-router-dom'
// MockDataProvider manages simulated live updates (rides, alerts) and links them to database actions.
import { MockDataProvider } from './context/MockDataContext.jsx'
import './index.css' // Global styles for our application
import App from './App.jsx' // Our main App component that contains all the page routing/views

// AuthProvider manages our Firebase user authentication state (login, registration, user profile).
import { AuthProvider } from './context/AuthContext.jsx'

// SERVICE WORKER CLEANUP:
// PWAs (Progressive Web Apps) cache code to run offline. During active development, this can prevent
// you from seeing new changes. This script forces the browser to unregister any active service worker
// so that your latest code updates load immediately.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// MOUNTING THE REACT APP:
// 1. `document.getElementById('root')` targets the single <div id="root"> inside our index.html file.
// 2. `createRoot()` sets up React's modern rendering tree inside that div.
// 3. `StrictMode` checks for potential bugs and deprecated methods during development.
// 4. `BrowserRouter` surrounds our app to support React Routing.
// 5. `AuthProvider` sits high up so all screens can check if a user is logged in.
// 6. `MockDataProvider` sits below AuthProvider so it can access the logged-in user's authentication details.
// 7. Finally, we render our main `<App />` component.
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

