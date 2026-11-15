import { useState } from 'react';
import { usePWA } from '../hooks/usePWA';
import { detectInstallPlatform } from '../utils/installGuide';
import Button from './ui/Button';
import Sheet from './ui/Sheet';
import { DitherBar } from './ui/Dither';
import AuthShell from './auth/AuthShell';
import InstallGuide from './auth/InstallGuide';
import shared from './auth/auth.module.css';
import styles from './LandingPage.module.css';

const BAR = [
  { kind: 5, value: 3 },
  { kind: 2, value: 2 },
  { kind: 0, value: 4 },
  { kind: 3, value: 1 },
];

const LandingPage = ({ onLoginClick }) => {
  const { isInstallable, isStandalone, installPWA } = usePWA();
  const [platform, setPlatform] = useState(null);

  const handleInstall = () => {
    if (isInstallable) {
      installPWA();
    } else {
      setPlatform(
        detectInstallPlatform({
          userAgent: navigator.userAgent,
          maxTouchPoints: navigator.maxTouchPoints,
        }),
      );
    }
  };

  const closeGuide = () => setPlatform(null);

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
        {isStandalone ? (
          <Button variant="primary" size="lg" block onClick={onLoginClick}>
            Ingresar
          </Button>
        ) : (
          <>
            <Button variant="primary" size="lg" block onClick={handleInstall}>
              Instalar la app
            </Button>
            <p className={styles.hint}>Queda en tu pantalla de inicio, como cualquier otra app.</p>
            <Button variant="key" block onClick={onLoginClick}>
              Ingresar
            </Button>
          </>
        )}
      </div>

      <Sheet open={platform !== null} onClose={closeGuide} title="Instalar la app">
        <div className={styles.sheetContent}>
          {platform !== null && <InstallGuide platform={platform} />}
          <Button variant="key" block onClick={closeGuide}>
            Entendido
          </Button>
        </div>
      </Sheet>
    </AuthShell>
  );
};

export default LandingPage;
