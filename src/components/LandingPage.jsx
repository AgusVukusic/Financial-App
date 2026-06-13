import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Wallet, Share, PlusSquare, X } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import './LandingPage.css';

const LandingPage = ({ onLoginClick }) => {
  const { isInstallable, isIOS, isStandalone, installPWA } = usePWA();
  const [showIosModal, setShowIosModal] = useState(false);

  const handleDownloadClick = () => {
    if (isInstallable) {
      installPWA();
    } else if (isIOS) {
      setShowIosModal(true);
    } else {
      // Fallback for browsers that don't support programmatic install but aren't iOS
      // We can just show the iOS modal with slightly modified text, or assume they know.
      setShowIosModal(true);
    }
  };

  return (
    <div className="landing-container">
      <motion.div 
        className="landing-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="landing-icon-wrapper">
          <Wallet size={40} color="var(--accent-primary)" />
        </div>
        
        <h1 className="landing-title">
          Toma el control de tus <span className="text-gradient">finanzas</span>
        </h1>
        
        <p className="landing-subtitle">
          Registra tus gastos, crea presupuestos y analiza a dónde va tu dinero con nuestra aplicación rápida, segura y siempre disponible.
        </p>

        <div className="landing-actions">
          {!isStandalone && (
            <button className="btn-primary" onClick={handleDownloadClick}>
              <Download size={20} />
              Descargar App
            </button>
          )}
          
          <button className="btn-secondary" onClick={onLoginClick}>
            Entrar / Iniciar Sesión
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showIosModal && (
          <div className="ios-modal-overlay" onClick={() => setShowIosModal(false)}>
            <motion.div 
              className="ios-modal-content"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowIosModal(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Instala la Aplicación</h3>
                <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                  Añade esta app a tu pantalla de inicio para una experiencia completa y a pantalla completa.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="ios-instruction-step">
                  <div className="ios-step-icon">
                    <Share size={20} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold' }}>Paso 1</span>
                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                      {isIOS ? "Toca el ícono Compartir en la barra de navegación de Safari." : "Abre el menú de opciones de tu navegador."}
                    </span>
                  </div>
                </div>

                <div className="ios-instruction-step">
                  <div className="ios-step-icon">
                    <PlusSquare size={20} color="var(--text-primary)" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold' }}>Paso 2</span>
                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                      {isIOS ? "Selecciona 'Agregar a Inicio'." : "Selecciona 'Instalar aplicación' o 'Añadir a pantalla de inicio'."}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
