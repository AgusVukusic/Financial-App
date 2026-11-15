import { useRef, useState } from 'react';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { AlertTriangle, ArrowLeft, Eye, EyeOff, Mail } from 'lucide-react';
import Button from './ui/Button';
import Field from './ui/Field';
import Input from './ui/Input';
import { useToast } from './ui/ToastContext';
import { authErrorMessage } from '../utils/authErrors';
import AuthShell from './auth/AuthShell';
import shared from './auth/auth.module.css';
import styles from './WelcomeScreen.module.css';

const WelcomeScreen = ({ onBack }) => {
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(''); // Display name en el registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  // null | { kind: 'registered', email } | { kind: 'unverified' }
  const [notice, setNotice] = useState(null);

  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const validate = ({ withUsername }) => {
    const next = {};
    if (withUsername && !username.trim()) next.username = 'Ponete un nombre.';
    if (!email.trim()) next.email = 'Ingresá tu correo.';
    else if (!email.includes('@')) next.email = 'Revisá el correo: le falta la @.';
    if (!password) next.password = 'Ingresá tu contraseña.';
    else if (!isLogin && password.length < 6) next.password = 'Usá al menos 6 caracteres.';
    setErrors(next);
    if (next.username) usernameRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else if (next.password) passwordRef.current?.focus();
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setFormError('');
    setNotice(null);
    if (!validate({ withUsername: !isLogin })) return;

    setLoading(true);
    try {
      const cleanEmail = email.trim();
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (!cred.user.emailVerified) {
          // Se cierra siempre: con la sesión abierta, un segundo ingreso no dispara onAuthStateChanged.
          await signOut(auth);
          setNotice({ kind: 'unverified' });
        }
        // Verificado: la sesión queda abierta y App muestra el resto.
      } else {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await updateProfile(cred.user, { displayName: username.trim() });
        await sendEmailVerification(cred.user);
        await signOut(auth); // Hasta que verifique el correo no entra
        setIsLogin(true);
        setPassword('');
        setShowPassword(false);
        setNotice({ kind: 'registered', email: cleanEmail });
      }
    } catch (err) {
      console.error(err);
      setFormError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (loading) return;
    setFormError('');
    if (!validate({ withUsername: false })) return;

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (cred.user.emailVerified) {
        // Ya verificó: no se manda nada y la sesión queda abierta, la persona entra sola.
        setNotice(null);
        return;
      }
      try {
        await sendEmailVerification(cred.user);
      } finally {
        await signOut(auth);
      }
      showToast('Te reenviamos el correo de verificación.', 'success');
    } catch (err) {
      console.error(err);
      setFormError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin((v) => !v);
    setErrors({});
    setFormError('');
    setNotice(null);
    setShowPassword(false);
  };

  return (
    <AuthShell>
      {onBack && (
        <div>
          <Button type="button" variant="key" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" /> Volver
          </Button>
        </div>
      )}

      <h1 className={shared.title}>{isLogin ? 'Ingresá' : 'Creá tu cuenta'}</h1>

      {notice && (
        <div
          role="status"
          className={`${styles.notice} ${notice.kind === 'unverified' ? styles.warn : ''}`.trim()}
        >
          {notice.kind === 'unverified' ? (
            <AlertTriangle size={18} aria-hidden="true" className={styles.noticeIcon} />
          ) : (
            <Mail size={18} aria-hidden="true" className={styles.noticeIcon} />
          )}
          <div className={styles.noticeBody}>
            <p>
              {notice.kind === 'unverified'
                ? 'Tu correo todavía no está verificado. Abrí el enlace que te mandamos (mirá también el spam) y volvé a ingresar.'
                : `Te enviamos un correo a ${notice.email}. Abrí el enlace para verificar tu cuenta y después ingresá.`}
            </p>
            <Button type="button" variant="outline" onClick={handleResend} disabled={loading}>
              Reenviar correo
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={shared.stack}>
        {!isLogin && (
          <Field
            label="Tu nombre"
            error={errors.username}
          >
            {(p) => (
              <Input
                {...p}
                ref={usernameRef}
                type="text"
                fullWidth
                autoComplete="nickname"
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
          </Field>
        )}

        <Field
          label="Correo"
          error={errors.email}
          hint={isLogin ? undefined : 'La Beta es por invitación: usá el correo con el que te invitaron.'}
        >
          {(p) => (
            <Input
              {...p}
              ref={emailRef}
              type="email"
              fullWidth
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>

        <Field
          label="Contraseña"
          error={errors.password}
          hint={isLogin ? undefined : 'Mínimo 6 caracteres'}
        >
          {(p) => (
            <div className={styles.passwordRow}>
              <Input
                {...p}
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                fullWidth
                className={styles.passwordInput}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                autoCapitalize="none"
                spellCheck={false}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.toggle}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
          )}
        </Field>

        {formError && (
          <p role="alert" className={styles.formError}>
            <AlertTriangle size={18} aria-hidden="true" className={styles.noticeIcon} />
            <span>{formError}</span>
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" block disabled={loading}>
          {isLogin ? (loading ? 'Ingresando…' : 'Ingresar') : loading ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>

      <button type="button" className={styles.switch} onClick={switchMode}>
        {isLogin ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Ingresá'}
      </button>
    </AuthShell>
  );
};

export default WelcomeScreen;
