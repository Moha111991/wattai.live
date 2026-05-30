import { useState, type CSSProperties } from 'react';

type FooterSection = 'impressum' | 'datenschutz' | 'agb' | null;

export default function AppFooter() {
  const [openSection, setOpenSection] = useState<FooterSection>(null);

  const footerStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(2,6,23,0.96)',
    borderTop: '1px solid rgba(103,232,249,0.12)',
    marginTop: '3rem',
    boxSizing: 'border-box',
  };

  const innerStyle: CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '2.5rem clamp(1rem, 3vw, 2.5rem) 1.2rem',
    boxSizing: 'border-box',
  };

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem',
  };

  const colTitleStyle: CSSProperties = {
    color: '#67e8f9',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.75rem',
  };

  const linkStyle: CSSProperties = {
    display: 'block',
    color: '#94a3b8',
    fontSize: 13,
    background: 'none',
    border: 'none',
    padding: '0.25rem 0',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'color 150ms',
    textDecoration: 'none',
  };

  const dividerStyle: CSSProperties = {
    borderTop: '1px solid rgba(148,163,184,0.12)',
    marginBottom: '1rem',
  };

  const legalBtnStyle: CSSProperties = {
    ...linkStyle,
    fontWeight: 600,
    color: '#67e8f9',
  };

  const modalOverlayStyle: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 3000,
    background: 'rgba(2,6,23,0.82)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  };

  const modalStyle: CSSProperties = {
    background: 'linear-gradient(160deg, rgba(15,23,42,0.99) 0%, rgba(2,6,23,0.99) 100%)',
    border: '1px solid rgba(103,232,249,0.2)',
    borderRadius: 16,
    padding: 'clamp(1.2rem, 4vw, 2rem)',
    maxWidth: 640,
    width: '100%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 24px 64px rgba(2,6,23,0.7)',
    position: 'relative',
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 1.7,
  };

  const FAQS = [
    { q: 'Was ist WattAI.live?', a: 'WattAI.live ist eine KI-gestützte Energiemanagementsoftware für Privathaushalte und Unternehmen. Sie optimiert den Energieverbrauch von Elektrofahrzeugen, Heimspeichern, PV-Anlagen und Smart-Home-Geräten.' },
    { q: 'Ist die App kostenlos?', a: 'Ja, der Free-Plan ist dauerhaft kostenlos und beinhaltet Echtzeit-Energiedaten und Basisvisualisierung. Für erweiterte KI-Funktionen bieten wir Pro (19 €/Monat) und Business-Pläne an.' },
    { q: 'Welche Geräte werden unterstützt?', a: 'WattAI.live unterstützt alle gängigen Wallboxen, PV-Wechselrichter, Heimspeichersysteme und Smart-Home-Plattformen. Die Liste der kompatiblen Geräte wird laufend erweitert.' },
    { q: 'Sind meine Daten sicher?', a: 'Alle Daten werden verschlüsselt übertragen (TLS 1.3) und auf deutschen Servern gespeichert. Wir verkaufen keine Daten an Dritte. Details finden Sie in unserer Datenschutzerklärung.' },
    { q: 'Kann ich den Plan jederzeit kündigen?', a: 'Ja, bezahlte Pläne sind monatlich kündbar, ohne Mindestlaufzeit.' },
  ];

  const IMPRESSUM_TEXT = `
**Angaben gemäß § 5 TMG**

WattAI.live
– Betreiber: Mohammad Hameed –
Deutschland

**Kontakt:**
E-Mail: kontakt@wattai.live
Web: https://wattai.live

**Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:**
Mohammad Hameed

**Hinweis zur Plattform:**
WattAI.live ist eine KI-gestützte Energiemanagement-Plattform für Elektrofahrzeuge, PV-Anlagen, Heimspeicher und Smart-Home-Integration.

**EU-Streitschlichtung:**
Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
https://ec.europa.eu/consumers/odr/
Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

**Haftung für Inhalte:**
Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.

**Haftung für Links:**
Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.

Stand: Mai 2026
  `;

  const DATENSCHUTZ_TEXT = `
**Datenschutzerklärung gemäß DSGVO (EU 2016/679)**

Stand: Mai 2026

**1. Verantwortlicher**
Mohammad Hameed — WattAI.live
E-Mail: datenschutz@wattai.live
Web: https://wattai.live

**2. Erhobene Daten**
Wir erheben bei der Nutzung der Plattform folgende Daten:
– E-Mail-Adresse und Name (bei Registrierung)
– Gerätedaten: Energieverbrauch, Ladestatus, SoC, PV-Ertrag
– Technische Zugriffsdaten: IP-Adresse, Browser, Zeitstempel (Logs)
– Zahlungsdaten (verarbeitet durch Stripe – wir speichern keine Kartendaten)

**3. Zweck der Verarbeitung**
– Bereitstellung der EMS-Dienste (Art. 6 Abs. 1 lit. b DSGVO)
– KI-Optimierung und Personalisierung (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO)
– Einhaltung gesetzlicher Pflichten (Art. 6 Abs. 1 lit. c DSGVO)
– Zahlungsabwicklung (Art. 6 Abs. 1 lit. b DSGVO)

**4. Weitergabe an Dritte**
Daten werden nur weitergegeben an:
– Stripe Inc. (USA) — Zahlungsabwicklung, Standardvertragsklauseln gem. Art. 46 DSGVO
– Railway.app — Hosting-Infrastruktur (EU-Server)
Kein Verkauf von Daten an Dritte. Keine Weitergabe zu Werbezwecken.

**5. Datenspeicherung & Sicherheit**
Alle Daten werden auf Servern innerhalb der EU gespeichert.
Übertragung ausschließlich verschlüsselt via TLS 1.3.
Passwörter werden mit bcrypt gehasht gespeichert.

**6. Cookies**
Wir verwenden ausschließlich technisch notwendige Cookies (Session, Authentifizierung).
Analyse- oder Marketingcookies werden nur mit ausdrücklicher Einwilligung gesetzt.

**7. Ihre Rechte (Art. 15–22 DSGVO)**
✅ Auskunft über gespeicherte Daten (Art. 15)
✅ Berichtigung unrichtiger Daten (Art. 16)
✅ Löschung Ihrer Daten (Art. 17)
✅ Einschränkung der Verarbeitung (Art. 18)
✅ Datenübertragbarkeit als JSON/CSV (Art. 20)
✅ Widerspruch gegen Verarbeitung (Art. 21)

Anfragen richten Sie an: datenschutz@wattai.live
Antwort innerhalb von 30 Tagen (Art. 12 DSGVO).

**8. Beschwerderecht**
Sie haben das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren.
Zuständig in Deutschland: Der Bundesbeauftragte für den Datenschutz (BfDI).

**9. Änderungen dieser Erklärung**
Wir behalten uns vor, diese Datenschutzerklärung bei Änderungen der Plattform oder gesetzlichen Anforderungen anzupassen. Die aktuelle Version ist stets auf wattai.live abrufbar.
  `;

  const AGB_TEXT = `
**Allgemeine Geschäftsbedingungen (AGB)**
WattAI.live — Stand: Mai 2026

**§ 1 Geltungsbereich**
Diese AGB gelten für alle Verträge zwischen WattAI.live (Betreiber: Mohammad Hameed) und den Nutzern der WattAI.live-Plattform unter https://wattai.live.

**§ 2 Vertragsschluss**
Der Nutzungsvertrag kommt durch Registrierung auf der Plattform und Bestätigung per E-Mail zustande. Für kostenpflichtige Pläne gilt der Vertrag ab Zahlungseingang als geschlossen.

**§ 3 Leistungsumfang**
WattAI.live stellt eine KI-gestützte Softwareplattform für Energiemanagement bereit (EV-Laden, PV-Optimierung, Heimspeicher, Smart Home). Der Funktionsumfang richtet sich nach dem gewählten Tarif:
– Free: Echtzeit-Monitoring, Basisvisualisierung (1 Gerät)
– Pro (19 €/Monat): KI-Optimierung, bis zu 3 Geräte, Verlaufsanalyse
– Business (49 €/Standort/Monat): Flottenmanagement, bis zu 25 Geräte, API-Zugang

**§ 4 Preise und Zahlung**
Pro- und Business-Pläne werden monatlich im Voraus abgerechnet (Kreditkarte oder SEPA via Stripe).
Alle Preise verstehen sich zzgl. der gesetzlichen Mehrwertsteuer (19 % MwSt.).
Es besteht kein Anspruch auf ununterbrochene Verfügbarkeit externer Geräte-APIs.

**§ 5 Kündigung**
Bezahlte Pläne sind monatlich kündbar, ohne Mindestlaufzeit.
Kündigung per E-Mail an kontakt@wattai.live oder über den Account-Bereich.
Nach Kündigung wird der Account automatisch auf den Free-Plan zurückgestuft. Gespeicherte Daten bleiben 30 Tage abrufbar.

**§ 6 Haftungsbeschränkung**
WattAI.live haftet nicht für:
– Ausfälle externer Dienste (Gerätehersteller-APIs, Smart-Meter-Gateways)
– Schäden durch fehlerhafte Gerätekonfiguration durch den Nutzer
– Indirekte oder Folgeschäden durch KI-Optimierungsempfehlungen
Die Haftung für grobe Fahrlässigkeit und Vorsatz bleibt unberührt.

**§ 7 Verfügbarkeit**
Wir streben eine Plattformverfügbarkeit von 99 % p.a. an. Wartungsarbeiten werden nach Möglichkeit angekündigt. Ein Anspruch auf ständige Verfügbarkeit besteht nicht.

**§ 8 Datenschutz**
Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer Datenschutzerklärung und der DSGVO (EU 2016/679).

**§ 9 Nutzerpflichten**
Nutzer sind verpflichtet:
– Zugangsdaten geheim zu halten
– Die Plattform nicht missbräuchlich zu nutzen
– Gerätekonfigurationen sorgfältig durchzuführen

**§ 10 Änderungen der AGB**
Wir behalten uns vor, diese AGB mit einer Ankündigungsfrist von 4 Wochen zu ändern. Nutzer werden per E-Mail informiert. Widerspruch gilt als Kündigung.

**§ 11 Anwendbares Recht / Gerichtsstand**
Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG).
Für Verbraucher gilt der Gerichtsstand am Wohnsitz des Nutzers.

**§ 12 Salvatorische Klausel**
Sollten einzelne Bestimmungen unwirksam sein, bleiben die übrigen Bestimmungen hiervon unberührt.

Kontakt: kontakt@wattai.live
  `;

  const renderModal = () => {
    if (!openSection) return null;
    const titles: Record<NonNullable<FooterSection>, string> = {
      impressum: 'Impressum',
      datenschutz: 'Datenschutzerklärung',
      agb: 'Allgemeine Geschäftsbedingungen',
    };
    const texts: Record<NonNullable<FooterSection>, string> = {
      impressum: IMPRESSUM_TEXT,
      datenschutz: DATENSCHUTZ_TEXT,
      agb: AGB_TEXT,
    };

    return (
      <div style={modalOverlayStyle} onClick={e => { if (e.target === e.currentTarget) setOpenSection(null); }}>
        <div style={modalStyle}>
          <button onClick={() => setOpenSection(null)} aria-label="Schließen" style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' }}>✕</button>
          <h2 style={{ color: '#67e8f9', fontSize: 20, fontWeight: 800, marginTop: 0, marginBottom: '1rem' }}>{titles[openSection]}</h2>
          <div style={{ whiteSpace: 'pre-line', color: '#cbd5e1', fontSize: 13, lineHeight: 1.8 }}>
            {texts[openSection].trim().split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                return <strong key={i} style={{ color: '#e2e8f0', display: 'block', marginTop: '0.9rem', marginBottom: '0.2rem' }}>{line.replace(/\*\*/g, '')}</strong>;
              }
              return <span key={i}>{line}<br/></span>;
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderModal()}
      <footer style={footerStyle} aria-label="Fußzeile">
        <div style={innerStyle}>
          <div style={gridStyle}>
            {/* Produkt */}
            <div>
              <p style={colTitleStyle}>WattAI.live</p>
              <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6, margin: '0 0 0.8rem' }}>
                KI-gestütztes Energiemanagement für EVs, PV, Speicher und Smart Home.
              </p>
              <span style={{ fontSize: 12, color: '#475569' }}>© {new Date().getFullYear()} WattAI.live</span>
            </div>

            {/* Produkte */}
            <div>
              <p style={colTitleStyle}>Produkte</p>
              <span style={linkStyle}>Free Plan</span>
              <span style={linkStyle}>Pro Plan – 19 €/Monat</span>
              <span style={linkStyle}>Business – 49 €/Standort</span>
              <span style={linkStyle}>Mobile App</span>
            </div>

            {/* FAQs */}
            <div>
              <p style={colTitleStyle}>FAQs</p>
              {FAQS.map((faq, i) => (
                <details key={i} style={{ marginBottom: 6 }}>
                  <summary style={{ color: '#94a3b8', fontSize: 12, cursor: 'pointer', fontWeight: 600, listStyle: 'none', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: '#67e8f9', flexShrink: 0 }}>›</span>
                    <span>{faq.q}</span>
                  </summary>
                  <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.6, margin: '0.4rem 0 0 1.2rem' }}>{faq.a}</p>
                </details>
              ))}
            </div>

            {/* Kontakt */}
            <div>
              <p style={colTitleStyle}>Kontakt</p>
              <a href="mailto:kontakt@wattai.live" style={{ ...linkStyle, color: '#67e8f9' }}>📧 kontakt@wattai.live</a>
              <a href="tel:+4912345678" style={linkStyle}>📞 +49 (0)123 456 789</a>
              <span style={{ ...linkStyle, marginTop: 8, color: '#64748b', fontSize: 11 }}>Mo–Fr, 9–18 Uhr</span>
              <span style={{ ...linkStyle, color: '#64748b', fontSize: 11 }}>WattAI.live, Musterstr. 1</span>
              <span style={{ ...linkStyle, color: '#64748b', fontSize: 11 }}>12345 Musterstadt, DE</span>
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Bottom legal bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem 0.8rem', alignItems: 'center' }}>
              <button style={legalBtnStyle} onClick={() => setOpenSection('impressum')}>Impressum</button>
              <span style={{ color: '#334155', fontSize: 12 }}>|</span>
              <button style={legalBtnStyle} onClick={() => setOpenSection('datenschutz')}>Datenschutz</button>
              <span style={{ color: '#334155', fontSize: 12 }}>|</span>
              <button style={legalBtnStyle} onClick={() => setOpenSection('agb')}>AGB</button>
            </div>
            <span style={{ color: '#475569', fontSize: 11 }}>
              Alle Angaben ohne Gewähr · Kein Rechtsrat
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
