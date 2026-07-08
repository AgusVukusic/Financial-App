import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 'var(--spacing-xl)', backgroundColor: 'var(--bg-base)' }}>
          <Card style={{ maxWidth: '400px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <AlertCircle size={48} color="var(--danger-color)" />
            <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>¡Ups! Algo salió mal.</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Ha ocurrido un error inesperado en la aplicación.
            </p>
            <Button variant="primary" onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> Recargar página
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
