import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/authContext'
import { SocketProvider } from './context/SocketContext'
import { WatchLaterProvider } from './context/watchLaterContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WatchLaterProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </WatchLaterProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)