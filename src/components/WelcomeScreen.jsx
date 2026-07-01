import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const WelcomeScreen = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(''); // Usado como Display Name en registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      if (isLogin) {
        // Sign in directly with email
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Verify if email is verified
        if (!userCredential.user.emailVerified) {
          setNeedsVerification(true);
          setError('Tu correo electrónico no está verificado.');
          setLoading(false);
          // No cerramos sesión aquí para poder reenviar el correo
          return;
        }
        
      } else {
        // Register flow
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        // Send verification email
        await sendEmailVerification(userCredential.user);
        await signOut(auth); // Sign them out until they verify

        setSuccess('¡Registro exitoso! Revisa tu bandeja de entrada (o SPAM) para verificar tu cuenta antes de iniciar sesión.');
        setIsLogin(true); // Switch to login view
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo electrónico ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      try {
        setLoading(true);
        await sendEmailVerification(auth.currentUser);
        setSuccess('Se ha enviado un nuevo enlace de verificación a tu correo.');
        setError('');
        setNeedsVerification(false);
        await signOut(auth);
      } catch (err) {
        if (err.code === 'auth/too-many-requests') {
          setError('Has pedido demasiados correos. Espera un momento.');
        } else {
          setError('Error al enviar el correo: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-base)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 'var(--spacing-xl)'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel" 
        style={{
          padding: 'var(--spacing-xl)', maxWidth: '400px', width: '100%',
          textAlign: 'center', display: 'flex', flexDirection: 'column',
          gap: 'var(--spacing-lg)', position: 'relative'
        }}
      >
        {onBack && (
          <button 
            onClick={onBack}
            style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', padding: 0 }}
          >
            <ArrowLeft size={18} /> Volver
          </button>
        )}

        <div style={{ fontSize: '3rem', marginTop: onBack ? '20px' : '0' }}>👋</div>
        
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
            Controla tus gastos de forma sencilla y en la nube.
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {error}
            {needsVerification && (
              <button 
                type="button"
                onClick={handleResendVerification}
                style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Reenviar correo de verificación
              </button>
            )}
          </div>
        )}
        
        {success && (
          <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', overflow: 'hidden' }}
              >
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Usuario (Tu alias)</label>
                <input 
                  type="text" value={username} onChange={(e) => setUsername(e.target.value)} 
                  placeholder="juan123" required={!isLogin} maxLength={20}
                  style={{
                    padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', marginTop: !isLogin ? '8px' : '0' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
              placeholder="juan@ejemplo.com" required
              style={{
                padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contraseña</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" required minLength={6}
              style={{
                padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
              }}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover))',
            color: 'white', border: 'none', padding: '12px', borderRadius: '8px',
            fontSize: '1rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'transform 0.2s ease', marginTop: '8px'
          }}>
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
          </button>
        </form>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); setNeedsVerification(false); }} 
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
