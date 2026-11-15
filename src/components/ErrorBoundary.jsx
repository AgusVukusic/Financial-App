import React from 'react';
import { RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import AuthShell from './auth/AuthShell';
import shared from './auth/auth.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <AuthShell>
          <div className={shared.stack} role="alert">
            <h1 className={shared.heading}>Algo salió mal</h1>
            <p className={shared.muted}>Hubo un error inesperado. Recargá la página para seguir.</p>
          </div>
          <Button variant="primary" size="lg" block onClick={() => window.location.reload()}>
            <RefreshCw size={18} aria-hidden="true" /> Recargar
          </Button>
        </AuthShell>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
