import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

// Mock component que lanza un error para probar el límite
const BuggyComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Evitar que React imprima el error en la consola durante los tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('debe renderizar a los children normalmente cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <div>Contenido Seguro</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Contenido Seguro')).toBeInTheDocument();
  });

  it('debe capturar errores y mostrar la interfaz de respaldo', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Algo salió mal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recargar página/i })).toBeInTheDocument();
  });
});
