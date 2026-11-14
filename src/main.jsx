import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import { DialogProvider } from './contexts/DialogContext.jsx'
import { ToastProvider } from './components/ui/ToastContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {/* Con "reduce movement" del sistema, framer-motion deja solo los cambios de opacidad. */}
      <MotionConfig reducedMotion="user">
        <DialogProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DialogProvider>
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
)
