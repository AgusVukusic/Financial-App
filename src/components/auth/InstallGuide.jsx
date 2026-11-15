import { Check, Menu, MonitorDown, MoreVertical, Share, SquarePlus } from 'lucide-react';
import { INSTALL_CLOSING, INSTALL_GUIDES, OTHER_GUIDES_ORDER } from '../../utils/installGuide';
import styles from './InstallGuide.module.css';

const ICONS = {
  share: Share,
  plus: SquarePlus,
  dots: MoreVertical,
  menu: Menu,
  monitor: MonitorDown,
  check: Check,
};

const Steps = ({ guide, platform }) => (
  <>
    {guide.steps.length > 0 && (
      <ol className={styles.steps}>
        {guide.steps.map((step, i) => {
          const Icon = ICONS[step.icon];
          return (
            <li key={`${platform}-${i}`} className={styles.step}>
              <span className={styles.num} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.key} aria-hidden="true">
                {Icon && <Icon size={26} />}
              </span>
              <span className={styles.text}>{step.text}</span>
            </li>
          );
        })}
      </ol>
    )}
    {guide.steps.length > 0 && platform !== 'in-app' && <p className={styles.note}>{INSTALL_CLOSING}</p>}
    {guide.note && <p className={styles.note}>{guide.note}</p>}
  </>
);

/** Guía paso a paso para instalar la app según el dispositivo detectado (`platform`). */
const InstallGuide = ({ platform }) => {
  const guide = INSTALL_GUIDES[platform] || INSTALL_GUIDES['desktop-chromium'];
  const key = INSTALL_GUIDES[platform] ? platform : 'desktop-chromium';
  const others = OTHER_GUIDES_ORDER.filter((k) => k !== key);

  return (
    <div className={styles.guide}>
      <p className={styles.device}>Para: {guide.device}</p>
      <p className={styles.intro}>{guide.intro}</p>
      <Steps guide={guide} platform={key} />

      <details className={styles.others}>
        <summary className={styles.summary}>Tengo otro celular o navegador</summary>
        <div className={styles.othersBody}>
          {others.map((k) => (
            <section key={k} className={styles.other}>
              <h3 className={styles.otherTitle}>{INSTALL_GUIDES[k].device}</h3>
              <p className={styles.intro}>{INSTALL_GUIDES[k].intro}</p>
              <Steps guide={INSTALL_GUIDES[k]} platform={k} />
            </section>
          ))}
        </div>
      </details>
    </div>
  );
};

export default InstallGuide;
