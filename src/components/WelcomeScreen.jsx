import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const WelcomeScreen = ({ onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const lowerUsername = username.toLowerCase().replace(/\s+/g, '');

      if (isLogin) {
        // 1. Fetch real email associated with this username
        const userDocRef = doc(db, 'users', lowerUsername);
        const userDoc = await getDoc(userDocRef);
        
        let loginEmail = '';
        if (userDoc.exists()) {
          loginEmail = userDoc.data().email;
        } else {
          // Fallback for old users registered with fake email
          loginEmail = `${lowerUsername}@financialapp.local`;
        }

        // 2. Sign in with the fetched email
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);

        // 3. Verify if email is verified (only for real emails)
        if (!loginEmail.endsWith('@financialapp.local') && !userCredential.user.emailVerified) {
          await signOut(auth);
          setError('Por favor, verifica tu correo electrónico antes de ingresar.');
          setLoading(false);
          return;
        }
        
      } else {
        // Register flow
        // 1. Check if username is taken
        const userDocRef = doc(db, 'users', lowerUsername);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setError('El nombre de usuario ya está en uso.');
          setLoading(false);
          return;
        }

        // 2. Create user in Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });

        // 3. Save mapping in Firestore
        await setDoc(userDocRef, { email: email.toLowerCase() });

        // 4. Send verification email
        await sendEmailVerification(userCredential.user);
        await signOut(auth); // Sign them out until they verify

        setSuccess('¡Registro exitoso! Revisa tu bandeja de entrada para verificar tu cuenta.');
        setIsLogin(true); // Switch to login view
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Usuario o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo electrónico ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
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
          <div style={{ padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
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
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tu nombre</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)} 
                  placeholder="Ej. Juan Pérez" required={!isLogin} maxLength={20}
                  style={{
                    padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
                  }}
                />
                
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Correo Electrónico</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
                  placeholder="juan@ejemplo.com" required={!isLogin}
                  style={{
                    padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Usuario</label>
            <input 
              type="text" value={username} onChange={(e) => setUsername(e.target.value)} 
              placeholder="juan123" required
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
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} 
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
