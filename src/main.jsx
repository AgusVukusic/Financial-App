import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { DialogProvider } from './contexts/DialogContext.jsx'
import { ToastProvider } from './components/ui/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DialogProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </DialogProvider>
  </StrictMode>,
)
