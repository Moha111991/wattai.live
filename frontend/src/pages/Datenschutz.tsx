import React from 'react';

const S: Record<string, React.CSSProperties> = {
  page:    { maxWidth: 860, margin: '2rem auto', padding: '0 1.5rem', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.7 },
  h1:      { fontSize: '2rem', fontWeight: 800, color: '#67e8f9', marginBottom: '0.5rem' },
  h2:      { fontSize: '1.2rem', fontWeight: 700, color: '#93c5fd', marginTop: '2rem', marginBottom: '0.4rem' },
  p:       { marginBottom: '0.8rem' },
  ul:      { paddingLeft: '1.4rem', marginBottom: '0.8rem' },
  badge:   { display: 'inline-block', background: '#1e3a5f', color: '#67e8f9', borderRadius: 6, padding: '2px 10px', fontSize: '0.8rem', marginBottom: '1rem' },
  updated: { color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' },
  box:     { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '1rem 1.4rem', marginBottom: '1rem' },
};

export default function Datenschutz() {
  return (
    <main style={S.page}>
      <h1 style={S.h1}>Datenschutzerklärung</h1>
      <span style={S.badge}>DSGVO-konform · Stand: Mai 2026</span>
      <p style={S.updated}>Letzte Aktualisierung: 20. Mai 2026</p>

      <div style={S.box}>
        <p><strong>Hinweis:</strong> Diese Datenschutzerklärung wurde nach bestem Wissen erstellt und entspricht den Anforderungen der DSGVO (EU 2016/679) sowie dem BDSG. Sie ersetzt keine individuelle Rechtsberatung. Für eine rechtssichere Prüfung empfehlen wir einen spezialisierten Datenschutzanwalt.</p>
      </div>

      <h2 style={S.h2}>1. Verantwortlicher (Art. 13 DSGVO)</h2>
      <p style={S.p}>
        <strong>Mohammad Hameed</strong><br />
        WattAI.live<br />
        E-Mail: <a href="mailto:datenschutz@wattai.live" style={{ color: '#67e8f9' }}>datenschutz@wattai.live</a><br />
        Telefon: +49 151 28163757
      </p>

      <h2 style={S.h2}>2. Welche Daten wir verarbeiten</h2>
      <ul style={S.ul}>
        <li><strong>Zugangsdaten:</strong> E-Mail-Adresse, verschlüsseltes Passwort (bcrypt)</li>
        <li><strong>Energiedaten:</strong> Ladezustand (SoC), Leistungswerte, Zeitreihen Ihrer Geräte</li>
        <li><strong>Zahlungsdaten:</strong> Werden ausschließlich von Stripe (PCI-DSS-konform) verarbeitet. Wir speichern keine Kartendaten.</li>
        <li><strong>Technische Daten:</strong> IP-Adresse (anonymisiert nach 7 Tagen), User-Agent, Zeitstempel</li>
        <li><strong>Audit-Logs:</strong> Anonymisierte Systemzugriffe (ISO 21434, 90 Tage Aufbewahrung)</li>
      </ul>

      <h2 style={S.h2}>3. Rechtsgrundlagen (Art. 6 DSGVO)</h2>
      <ul style={S.ul}>
        <li>Art. 6 Abs. 1 lit. b — Vertragserfüllung (Plattformbetrieb, Energiemanagement)</li>
        <li>Art. 6 Abs. 1 lit. c — Rechtliche Verpflichtung (Buchführung, Sicherheitslogs)</li>
        <li>Art. 6 Abs. 1 lit. f — Berechtigtes Interesse (IT-Sicherheit, Missbrauchsprävention)</li>
        <li>Art. 6 Abs. 1 lit. a — Einwilligung (nur für optionale Analyse-Cookies, sofern aktiviert)</li>
      </ul>

      <h2 style={S.h2}>4. Cookies & lokaler Speicher</h2>
      <p style={S.p}>Wir verwenden ausschließlich <strong>technisch notwendige Cookies</strong> (Session, CSRF-Schutz). Es werden <strong>keine Tracking- oder Werbe-Cookies</strong> ohne Ihre ausdrückliche Einwilligung gesetzt. Drittanbieter-Skripte (z. B. Google Analytics) sind nicht aktiv.</p>

      <h2 style={S.h2}>5. Datenweitergabe an Dritte</h2>
      <ul style={S.ul}>
        <li><strong>Stripe Inc.</strong> (USA) — Zahlungsabwicklung, Standardvertragsklauseln (SCCs) gemäß Art. 46 DSGVO, <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#67e8f9' }}>Stripe-Datenschutz</a></li>
        <li><strong>Railway.app</strong> — Hosting (EU-Rechenzentrum soweit verfügbar), Auftragsverarbeitungsvertrag (AVV) vorhanden</li>
        <li>Keine Weitergabe an Werbetreibende, Datenhändler oder Social-Media-Plattformen</li>
      </ul>

      <h2 style={S.h2}>6. Datenspeicherung & Löschung</h2>
      <ul style={S.ul}>
        <li>Energiezeitreihen: 12 Monate rollierend, danach automatische Löschung</li>
        <li>Audit-Logs: 90 Tage (gesetzliche Mindestanforderung IT-Sicherheit)</li>
        <li>IP-Adressen: Anonymisierung nach 7 Tagen</li>
        <li>Account-Daten: Bis zur Kündigung + 30 Tage Nachhaltefrist</li>
        <li>Zahlungsbelege: 10 Jahre (§ 147 AO)</li>
      </ul>

      <h2 style={S.h2}>7. Ihre Rechte (Art. 15–22 DSGVO)</h2>
      <ul style={S.ul}>
        <li>✅ <strong>Auskunft</strong> (Art. 15) — Was wir über Sie gespeichert haben</li>
        <li>✅ <strong>Berichtigung</strong> (Art. 16) — Korrektur falscher Daten</li>
        <li>✅ <strong>Löschung</strong> (Art. 17) — „Recht auf Vergessenwerden"</li>
        <li>✅ <strong>Einschränkung</strong> (Art. 18) — Verarbeitung einschränken</li>
        <li>✅ <strong>Datenübertragbarkeit</strong> (Art. 20) — Export als JSON/CSV</li>
        <li>✅ <strong>Widerspruch</strong> (Art. 21) — Gegen berechtigte Interessen</li>
        <li>✅ <strong>Beschwerde</strong> — Bei der zuständigen Aufsichtsbehörde: <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" style={{ color: '#67e8f9' }}>LDA Bayern</a> oder Ihrer Landesbehörde</li>
      </ul>
      <p style={S.p}>Anfragen an: <a href="mailto:datenschutz@wattai.live" style={{ color: '#67e8f9' }}>datenschutz@wattai.live</a> — Antwort innerhalb von 30 Tagen (Art. 12 DSGVO).</p>

      <h2 style={S.h2}>8. Datensicherheit (Art. 32 DSGVO)</h2>
      <ul style={S.ul}>
        <li>TLS 1.2/1.3 für alle Verbindungen (HSTS aktiviert)</li>
        <li>Passwörter: bcrypt mit hohem Work-Factor</li>
        <li>API-Keys: PBKDF2-SHA256 mit Salt (200.000 Iterationen)</li>
        <li>MQTT: TLS + ACL-Authentifizierung</li>
        <li>Tamper-proof Audit-Logs (Blockchain-Hash-Chain, ISO 21434)</li>
        <li>Regelmäßige Sicherheitsüberprüfungen</li>
      </ul>

      <h2 style={S.h2}>9. Änderungen dieser Erklärung</h2>
      <p style={S.p}>Bei wesentlichen Änderungen informieren wir registrierte Nutzer per E-Mail mindestens 14 Tage im Voraus.</p>
    </main>
  );
}
