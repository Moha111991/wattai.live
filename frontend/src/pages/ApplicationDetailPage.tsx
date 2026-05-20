import { Link, useParams } from 'react-router-dom';
import { APPLICATION_MAP } from '../data/applications';

export default function ApplicationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const application = slug ? APPLICATION_MAP[slug] : undefined;

  if (!application) {
    return (
      <main style={{ minHeight: '100dvh', background: '#020617', color: '#e2e8f0', padding: '48px 20px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(26px,4vw,42px)' }}>Anwendung nicht gefunden</h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
            Diese Anwendung existiert nicht oder wurde verschoben.
          </p>
          <Link to="/" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 700 }}>
            ← Zur Startseite
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #020617 0%, #0b1220 40%, #0f172a 100%)', color: '#e2e8f0', padding: '40px 20px 60px' }}>
      <section style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 20 }}>
        <Link to="/" style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 700 }}>
          ← Zur Startseite
        </Link>

        <article style={{
          borderRadius: 20,
          padding: '32px clamp(20px,4vw,38px)',
          border: '1px solid rgba(103,232,249,0.25)',
          background: application.cardBackground,
          boxShadow: '0 18px 36px rgba(2,6,23,0.5)',
        }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>{application.icon}</div>
          <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(28px,4.2vw,46px)', lineHeight: 1.12 }}>{application.title}</h1>
          <p style={{ margin: 0, maxWidth: 760, lineHeight: 1.75, color: '#dbeafe' }}>{application.desc}</p>
        </article>

        <article style={{
          borderRadius: 18,
          padding: '30px clamp(20px,4vw,34px)',
          border: '1px solid rgba(148,163,184,0.3)',
          background: 'rgba(15,23,42,0.72)',
        }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 'clamp(22px,3vw,32px)', color: '#f8fafc' }}>
            Tiefe technische Beschreibung
          </h2>
          <p style={{ margin: '0 0 18px', lineHeight: 1.82, color: '#cbd5e1' }}>{application.technicalOverview}</p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, color: '#dbeafe' }}>
            {application.technicalHighlights.map((point) => (
              <li key={point} style={{ lineHeight: 1.7 }}>
                {point}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
