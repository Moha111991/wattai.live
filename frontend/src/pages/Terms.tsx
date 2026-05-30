export default function Terms() {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1.5rem", color: '#cbd5e1', fontFamily: 'sans-serif', lineHeight: 1.8 }}>
      <h1 style={{ color: '#f8fafc', fontSize: 26, fontWeight: 800, marginBottom: '1.5rem' }}>Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p style={{ color: '#94a3b8', fontSize: 13 }}>WattAI.live — Stand: Mai 2026</p>

      {[
        ['§ 1 Geltungsbereich', 'Diese AGB gelten für alle Verträge zwischen WattAI.live (Betreiber: Mohammad Hameed) und den Nutzern der Plattform unter https://wattai.live.'],
        ['§ 2 Vertragsschluss', 'Der Nutzungsvertrag kommt durch Registrierung auf der Plattform und Bestätigung per E-Mail zustande. Für kostenpflichtige Pläne gilt der Vertrag ab Zahlungseingang als geschlossen.'],
        ['§ 3 Leistungsumfang', 'WattAI.live stellt eine KI-gestützte Softwareplattform für Energiemanagement bereit. Free: 1 Gerät, Basis-Monitoring. Pro (19 €/Monat): bis 3 Geräte, KI-Optimierung. Business (49 €/Standort/Monat): bis 25 Geräte, Flottenmanagement, API-Zugang.'],
        ['§ 4 Preise und Zahlung', 'Pro- und Business-Pläne werden monatlich im Voraus per Kreditkarte oder SEPA via Stripe abgerechnet. Alle Preise zzgl. 19 % MwSt.'],
        ['§ 5 Kündigung', 'Bezahlte Pläne sind monatlich kündbar ohne Mindestlaufzeit. Kündigung per E-Mail an kontakt@wattai.live oder im Account-Bereich. Nach Kündigung wird auf Free zurückgestuft; Daten bleiben 30 Tage abrufbar.'],
        ['§ 6 Haftungsbeschränkung', 'WattAI.live haftet nicht für Ausfälle externer Gerätehersteller-APIs, Schäden durch fehlerhafte Nutzerkonfiguration oder indirekte Schäden durch KI-Empfehlungen. Haftung für grobe Fahrlässigkeit und Vorsatz bleibt unberührt.'],
        ['§ 7 Datenschutz', 'Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung und der DSGVO (EU 2016/679).'],
        ['§ 8 Änderungen der AGB', 'Änderungen werden mit 4 Wochen Frist per E-Mail angekündigt. Widerspruch gilt als Kündigung.'],
        ['§ 9 Anwendbares Recht', 'Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts (CISG). Für Verbraucher gilt der Gerichtsstand am Wohnsitz des Nutzers.'],
        ['§ 10 Salvatorische Klausel', 'Sollten einzelne Bestimmungen unwirksam sein, bleiben die übrigen Bestimmungen hiervon unberührt.'],
      ].map(([title, text]) => (
        <div key={title} style={{ marginTop: '1.4rem' }}>
          <strong style={{ color: '#f8fafc' }}>{title}</strong>
          <p style={{ margin: '0.3rem 0 0' }}>{text}</p>
        </div>
      ))}

      <p style={{ marginTop: '2rem', fontSize: 13, color: '#64748b' }}>
        Kontakt: <a href="mailto:kontakt@wattai.live" style={{ color: '#67e8f9' }}>kontakt@wattai.live</a>
      </p>
    </main>
  );
}
