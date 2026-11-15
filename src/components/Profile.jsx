import { useRef, useState } from 'react';
import { FileText, FileSpreadsheet, LogOut } from 'lucide-react';
import { exportToPDF, exportToCSV } from '../utils/formatters';
import { useDialog } from '../contexts/DialogContext';
import { useAllTransactions } from '../hooks/useAllTransactions';
import Button from './ui/Button';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Tag from './ui/Tag';
import { useToast } from './ui/ToastContext';
import styles from './Profile.module.css';

const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

/**
 * Perfil: cuenta, exportación de movimientos y cierre de sesión.
 * El encabezado de la app ya dice "Perfil" y saluda: acá no se repite.
 */
const Profile = ({ userName, email, uid, onClearData }) => {
  const { confirm } = useDialog();
  const { showToast } = useToast();
  const allTransactions = useAllTransactions(uid) || [];
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false); // guarda síncrona: dos toques en el mismo tick no exportan dos veces

  const count = allTransactions.length;
  const empty = count === 0;

  const runExport = async (exporter) => {
    if (busyRef.current || empty) return;
    busyRef.current = true;
    setBusy(true);
    try {
      // Deja pintar el botón deshabilitado antes del trabajo síncrono (el PDF es pesado).
      await new Promise((resolve) => setTimeout(resolve, 0));
      const sorted = [...allTransactions].sort(byDateDesc);
      const fileName = exporter(sorted);
      showToast(`Se descargó ${fileName}`, 'success');
    } catch {
      showToast('No se pudo exportar. Probá de nuevo.', 'error');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirm('¿Cerrar sesión? Tus datos quedan guardados en tu cuenta.', 'Cerrar sesión', {
      confirmText: 'Cerrar sesión',
      destructive: false,
    });
    if (ok) onClearData();
  };

  return (
    <div className={styles.screen}>
      <section aria-label="Cuenta">
        <SectionHeader index="00" title="Cuenta" />
        <Card className={styles.account}>
          <p className={styles.name}>{userName}</p>
          {email && <p className={styles.email}>{email}</p>}
          <Tag>Beta por invitación</Tag>
        </Card>
      </section>

      <section aria-label="Exportar movimientos">
        <SectionHeader index="01" title="Exportar movimientos" />
        <p className={styles.lead}>Todos tus movimientos, del más nuevo al más viejo.</p>
        <p className={styles.count}>{empty ? 'Todavía no hay movimientos para exportar.' : count === 1 ? '1 movimiento' : `${count} movimientos`}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.action} disabled={empty || busy} onClick={() => runExport(exportToPDF)}>
            <FileText size={22} aria-hidden="true" className={styles.icon} />
            <span className={styles.text}>
              <span className={styles.title}>Descargar PDF</span>
              <span className={styles.desc}>Para imprimir o compartir</span>
            </span>
          </button>
          <button type="button" className={styles.action} disabled={empty || busy} onClick={() => runExport(exportToCSV)}>
            <FileSpreadsheet size={22} aria-hidden="true" className={styles.icon} />
            <span className={styles.text}>
              <span className={styles.title}>Descargar CSV</span>
              <span className={styles.desc}>Para abrir en Excel o Google Sheets</span>
            </span>
          </button>
        </div>
      </section>

      <section aria-label="Sesión">
        <SectionHeader index="02" title="Sesión" />
        <Button variant="outline" block onClick={handleLogout}>
          <LogOut size={18} aria-hidden="true" />
          Cerrar sesión
        </Button>
      </section>

      <p className={styles.footer}>Finanzas Personales · Beta</p>
    </div>
  );
};

export default Profile;
