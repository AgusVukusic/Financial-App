import React, { useState } from 'react';

const WelcomeScreen = ({ onSaveName }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      onSaveName(name);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 'var(--spacing-xl)'
    }}>
      <div className="glass-panel animate-slide-up" style={{
        padding: 'var(--spacing-xl)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)'
      }}>
        <div style={{ fontSize: '3rem' }}>👋</div>
        
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>¡Bienvenido a Finanzas!</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            Tu nueva herramienta para llevar el control de tus gastos de forma sencilla y estética.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>¿Cómo te llamas?</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Escribe tu nombre..."
              autoFocus
              required
              maxLength={20}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
          
          <button type="submit" style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}>
            Comenzar
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeScreen;
