import { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import Button from './ui/Button';
import Sheet from './ui/Sheet';
import { DitherBar } from './ui/Dither';
import AuthShell from './auth/AuthShell';
import shared from './auth/auth.module.css';
import styles from './LandingPage.module.css';

const BAR = [
  { kind: 5, value: 3 },
  { kind: 2, value: 2 },
  { kind: 0, value: 4 },
  { kind: 3, value: 1 },
];

const LandingPage = ({ onLoginClick }) => {
  const { isInstallable, isIOS, isStandalone, installPWA } = usePWA();
  const [showSteps, setShowSteps] = useState(false);

  const handleInstall = () => {
    if (isInstallable) {
      installPWA();
    } else {
      setShowSteps(true);
    }
  };

  return (
    <AuthShell>
      <div className={shared.stack}>
        <p className={shared.kicker}>Beta por invitación</p>
        <h1 className={shared.title}>Finanzas Personales</h1>
        <p className={shared.lead}>
          Anotá tus gastos, seguí tus topes y pagá tus gastos fijos. En pesos, desde el celular.
        </p>
      </div>

      <div aria-hidden="true">
        <DitherBar items={BAR} label="Decoración" className={styles.bar} />
      </div>

      <div className={shared.actions}>
        <Button variant="primary" size="lg" block onClick={onLoginClick}>
          Ingresar
        </Button>
        {!isStandalone && (
          <Button variant="key" block onClick={handleInstall}>
            Instalar la app
          </Button>
        )}
      </div>

      <Sheet open={showSteps} onClose={() => setShowSteps(false)} title="Instalar la app">
        <ol className={styles.steps}>
          {isIOS ? (
            <>
              <li>Tocá el botón Compartir en la barra de Safari.</li>
              <li>Elegí &quot;Agregar a inicio&quot;.</li>
            </>
          ) : (
            <>
              <li>Abrí el menú del navegador.</li>
              <li>Elegí &quot;Instalar aplicación&quot; o &quot;Agregar a pantalla de inicio&quot;.</li>
            </>
          )}
        </ol>
      </Sheet>
    </AuthShell>
  );
};

export default LandingPage;
