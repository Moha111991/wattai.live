import { useEffect, useId, useRef } from 'react';
import {
  COMMERCIAL_MODEL,
  GTM_DISTRIBUTION,
  SALES_UPGRADE_LINK,
} from '../config/featureFlags';

type UpgradeModalProps = {
  open: boolean;
  currentPlan: string;
  onClose: () => void;
};

export default function UpgradeModal({
  open,
  currentPlan,
  onClose,
}: UpgradeModalProps) {
  const titleId = useId();
  const summaryId = useId();
  const keyboardHintId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const getPrice = (plan: { name: string; offer: string } & Record<string, unknown>) => {
    return typeof plan.price === 'string' ? plan.price : null;
  };

  const getFocusableElements = () => {
    if (!dialogRef.current) return [];

    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(selectors)).filter(
      (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
    );
  };

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !dialogRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (!active || active === last || !dialogRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.58)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
  aria-labelledby={titleId}
  aria-describedby={`${summaryId} ${keyboardHintId}`}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(980px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 14,
          background: '#ffffff',
          boxShadow: '0 18px 50px rgba(15,23,42,0.35)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <h2 id={titleId} style={{ margin: 0, fontSize: 24 }}>
              Upgrade & Monetarisierung
            </h2>
            <p id={summaryId} style={{ margin: '6px 0 0', color: '#475569', fontSize: 14 }}>
              Aktueller Plan: <b>{currentPlan}</b>
            </p>
            <p
              id={keyboardHintId}
              style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12 }}
            >
              Hinweis: Mit Tab innerhalb des Dialogs navigieren, mit Escape schließen.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              background: '#fff',
              color: '#0f172a',
              padding: '0.4rem 0.7rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Schließen
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {COMMERCIAL_MODEL.b2c.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: '1px solid #dbeafe',
                background: '#f8fbff',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>B2C</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{plan.name}</div>
              {getPrice(plan) && (
                <div style={{ color: '#0f766e', fontSize: 13, marginTop: 2 }}>{getPrice(plan)}</div>
              )}
              <div style={{ marginTop: 8, fontSize: 14, color: '#334155' }}>{plan.offer}</div>
            </div>
          ))}

          {COMMERCIAL_MODEL.b2b.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: '1px solid #dcfce7',
                background: '#f7fff9',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, color: '#15803d', fontWeight: 700 }}>B2B</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{plan.name}</div>
              {getPrice(plan) && (
                <div style={{ color: '#0f766e', fontSize: 13, marginTop: 2 }}>{getPrice(plan)}</div>
              )}
              <div style={{ marginTop: 8, fontSize: 14, color: '#334155' }}>{plan.offer}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Distribution / GTM</div>
          <ul style={{ margin: '0 0 8px 0', paddingLeft: 20, color: '#334155' }}>
            {GTM_DISTRIBUTION.b2c.map((item) => (
              <li key={`b2c-${item}`}>B2C: {item}</li>
            ))}
            {GTM_DISTRIBUTION.b2b.map((item) => (
              <li key={`b2b-${item}`}>B2B: {item}</li>
            ))}
            {GTM_DISTRIBUTION.strategy.map((item) => (
              <li key={`strategy-${item}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={SALES_UPGRADE_LINK}
            style={{
              textDecoration: 'none',
              background: '#0f766e',
              color: '#fff',
              borderRadius: 8,
              padding: '0.55rem 1rem',
              fontWeight: 700,
              display: 'inline-block',
            }}
          >
            Upgrade anfragen
          </a>
          <button
            onClick={onClose}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              background: '#fff',
              color: '#0f172a',
              padding: '0.55rem 1rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Später
          </button>
        </div>
      </div>
    </div>
  );
}
