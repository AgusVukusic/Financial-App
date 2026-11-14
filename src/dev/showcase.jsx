import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { AlertTriangle, Clock, Coffee, Landmark, Moon, Plus, Sun, Trash2, Wallet } from 'lucide-react';
import '../index.css';
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  Dither,
  DitherBar,
  Field,
  Input,
  Meter,
  Odometer,
  SectionHeader,
  Select,
  Sheet,
  Tag,
  ToastProvider,
  useToast,
} from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import styles from './showcase.module.css';

const TOKENS = [
  ['--bg', 'Fondo'],
  ['--surf', 'Superficie'],
  ['--chip', 'Chip / hueco'],
  ['--ink', 'Tinta'],
  ['--ink2', 'Tinta 2'],
  ['--rule', 'Filete'],
  ['--acc', 'Acento'],
  ['--in', 'Entró'],
  ['--bad', 'Alerta'],
  ['--warn', 'Aviso'],
];

const fmt = (n) => '$' + String.fromCharCode(160) + n.toLocaleString('es-AR');

/** Todo lo que no es portal, para verlo en un tema forzado con data-theme. */
const Specimen = ({ theme }) => {
  const [balance, setBalance] = useState(15373721);
  const [pressed, setPressed] = useState('Comida');
  const [cat, setCat] = useState('');

  return (
    <div data-theme={theme} className={styles.specimen} aria-label={`Tema ${theme === 'light' ? 'claro' : 'oscuro'}`} role="group">
      <p className={styles.themeLabel}>{theme === 'light' ? 'Tema claro · papel' : 'Tema oscuro · panel'}</p>

      <SectionHeader index="00" title="Color" meta="10 tokens" />
      <div className={styles.swatches}>
        {TOKENS.map(([v, name]) => (
          <div key={v} className={styles.swatch}>
            <span className={styles.chipColor} style={{ background: `var(${v})` }} />
            <span>
              <b>{name}</b>
              <code>{v}</code>
            </span>
          </div>
        ))}
      </div>

      <SectionHeader index="01" title="Saldo" meta="Doto 48 px" />
      <Card variant="dotted" className={styles.balanceCard}>
        <span className={styles.lbl}>Saldo total</span>
        <div className={styles.balance}>
          <span className={styles.cur}>$</span>
          <Odometer value={balance.toLocaleString('es-AR')} className={styles.dot} />
        </div>
        <Button variant="key" size="sm" onClick={() => setBalance((b) => b - 3500)}>
          Anotar café −$ 3.500
        </Button>
      </Card>

      <SectionHeader index="02" title="Botones" meta="44 px o más" />
      <div className={styles.row}>
        <Button variant="primary">Anotar gasto</Button>
        <Button variant="key">Tecla</Button>
        <Button variant="outline">Plana</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className={styles.row}>
        <Button variant="danger">
          <Trash2 size={16} aria-hidden="true" /> Anular
        </Button>
        <Button variant="success">Pagar</Button>
        <Button variant="primary" size="sm">
          Chico
        </Button>
        <Button variant="key" disabled>
          Deshabilitado
        </Button>
        <Button variant="key" isIcon aria-label="Agregar">
          <Plus size={20} aria-hidden="true" />
        </Button>
      </div>
      <Button variant="primary" size="lg" block>
        <Plus size={20} aria-hidden="true" /> Anotar gasto
      </Button>

      <SectionHeader index="03" title="Chips y sellos" />
      <div className={styles.row}>
        {['Comida', 'Compras', 'Hogar'].map((c) => (
          <Chip key={c} pressed={pressed === c} onClick={() => setPressed(c)} icon={<Coffee size={16} aria-hidden="true" />}>
            {c}
          </Chip>
        ))}
      </div>
      <div className={styles.row}>
        <Tag>Neutral</Tag>
        <Tag tone="accent">Nuevo</Tag>
        <Tag tone="dashed">Deuda</Tag>
        <Tag tone="ok">Dentro</Tag>
        <Tag tone="warn" icon={<Clock size={12} aria-hidden="true" />}>
          Cerca · 93%
        </Tag>
        <Tag tone="bad" icon={<AlertTriangle size={12} aria-hidden="true" />}>
          Vencido −3 d
        </Tag>
      </div>

      <SectionHeader index="04" title="Formulario" />
      <div className={styles.col}>
        <Field label="Monto" hint="En pesos, sin puntos.">
          {(p) => <Input type="text" inputMode="decimal" fullWidth placeholder="3500" {...p} />}
        </Field>
        <Field label="Categoría" error={cat ? undefined : 'Elegí una categoría para guardar.'}>
          {(p) => (
            <Select fullWidth value={cat} onChange={(e) => setCat(e.target.value)} {...p}>
              <option value="">Sin elegir</option>
              <option value="Comida">Comida</option>
              <option value="Hogar">Hogar</option>
            </Select>
          )}
        </Field>
      </div>

      <SectionHeader index="05" title="Presupuestos" meta="2 superados" />
      <div className={styles.col}>
        {[
          ['Compras', 387499, 300000, 'bad', 'Superado por $ 87.499'],
          ['Hogar', 372300, 400000, 'warn', 'Cerca del límite · 93%'],
          ['Comida', 138581, 180000, 'ok', 'Dentro del tope · 77%'],
          ['Otros', 33000, null, 'neutral', 'Sin tope'],
        ].map(([name, used, limit, tone, text]) => (
          <Card key={name} className={styles.budget}>
            <div className={styles.between}>
              <b>{name}</b>
              <span className={styles.mono}>{fmt(used)}</span>
            </div>
            <Meter used={used} limit={limit} label={`${name}: ${text}`} />
            <Tag tone={tone === 'neutral' ? 'neutral' : tone} icon={tone === 'bad' ? <AlertTriangle size={12} aria-hidden="true" /> : undefined}>
              {text}
            </Tag>
          </Card>
        ))}
      </div>

      <SectionHeader index="06" title="Tramas" meta="sin depender del color" />
      <DitherBar
        label="Gasto por categoría: Comida 14%, Compras 39%, Hogar 37%, Transporte 3%, Servicios 5%, Otros 3%"
        items={[
          { kind: 0, value: 14 },
          { kind: 1, value: 39 },
          { kind: 2, value: 37 },
          { kind: 3, value: 3 },
          { kind: 4, value: 5 },
          { kind: 5, value: 3 },
        ]}
      />
      <div className={styles.legend}>
        {['Puntos finos', 'Puntos gruesos', 'Diagonal', 'Vertical', 'Horizontal', 'Sólido'].map((n, i) => (
          <span key={n} className={styles.legendItem}>
            <span className={styles.sw}>
              <Dither kind={i} />
            </span>
            {n}
          </span>
        ))}
      </div>

      <SectionHeader index="07" title="Superficies" />
      <div className={styles.col}>
        <Card className={styles.between}>
          <span className={styles.iconRow}>
            <Landmark size={18} aria-hidden="true" /> Ahorros USD
          </span>
          <b className={styles.mono}>{fmt(13050000)}</b>
        </Card>
        <Card variant="dashed" className={styles.between}>
          <span className={styles.iconRow}>
            <Wallet size={18} aria-hidden="true" /> Spotify · pagado
          </span>
          <Tag tone="ok">Listo</Tag>
        </Card>
      </div>
    </div>
  );
};

/** Lo que vive en un portal (avisos, hoja, diálogo) toma el tema de la página. */
const Portals = () => {
  const { showToast } = useToast();
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);

  return (
    <div className={styles.portals}>
      <SectionHeader index="08" title="Avisos, hoja y diálogo" meta="en el tema de la página" />
      <div className={styles.row}>
        <Button variant="key" onClick={() => showToast('Gasto registrado', 'success', 8000, { action: { label: 'Deshacer', onClick: () => showToast('Deshecho', 'info') } })}>
          Aviso con Deshacer
        </Button>
        <Button variant="key" onClick={() => showToast('No se pudo guardar. Revisá la conexión e intentá de nuevo.', 'error', 6000)}>
          Aviso de error
        </Button>
        <Button variant="key" onClick={() => setSheet(true)}>
          Abrir hoja
        </Button>
        <Button variant="danger" onClick={() => setDialog(true)}>
          Confirmar
        </Button>
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Anotar gasto">
        <div className={styles.col}>
          <Field label="Qué y cuánto">{(p) => <Input fullWidth placeholder="café 3500" {...p} />}</Field>
          <div className={styles.row}>
            <Chip>Comida</Chip>
            <Chip>Transporte</Chip>
            <Chip>Otros</Chip>
          </div>
          <Button variant="primary" size="lg" block onClick={() => setSheet(false)}>
            Anotar
          </Button>
        </div>
      </Sheet>

      <ConfirmDialog
        isOpen={dialog}
        title="Anular movimiento"
        message="Se anula con un movimiento compensatorio y no se puede deshacer."
        confirmText="Anular"
        onConfirm={() => setDialog(false)}
        onCancel={() => setDialog(false)}
      />
    </div>
  );
};

const Page = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div>
          <h1>Sistema de diseño</h1>
          <p className={styles.lead}>Panel de taller. Los dos temas lado a lado; los avisos, la hoja y el diálogo usan el tema de la página.</p>
        </div>
        <Button variant="key" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
          {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          {theme === 'dark' ? 'Claro' : 'Oscuro'}
        </Button>
      </header>
      <div className={styles.cols}>
        <Specimen theme="light" />
        <Specimen theme="dark" />
      </div>
      <Portals />
    </main>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <Page />
      </ToastProvider>
    </MotionConfig>
  </StrictMode>,
);
