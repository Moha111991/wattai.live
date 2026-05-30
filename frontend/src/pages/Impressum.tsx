export default function Impressum() {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1.5rem", color: '#cbd5e1', fontFamily: 'sans-serif', lineHeight: 1.8 }}>
      <h1 style={{ color: '#f8fafc', fontSize: 26, fontWeight: 800, marginBottom: '1.5rem' }}>Impressum</h1>
      <p><strong style={{ color: '#f8fafc' }}>Angaben gemäß § 5 TMG</strong></p>
      <p>WattAI.live<br/>Betreiber: Mohammad Hameed<br/>Deutschland</p>
      <p><strong style={{ color: '#f8fafc' }}>Kontakt</strong><br/>
        E-Mail: <a href="mailto:kontakt@wattai.live" style={{ color: '#67e8f9' }}>kontakt@wattai.live</a><br/>
        Web: <a href="https://wattai.live" style={{ color: '#67e8f9' }}>https://wattai.live</a>
      </p>
      <p><strong style={{ color: '#f8fafc' }}>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</strong><br/>Mohammad Hameed</p>
      <p><strong style={{ color: '#f8fafc' }}>EU-Streitschlichtung</strong><br/>
        Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: '#67e8f9' }}>
          https://ec.europa.eu/consumers/odr/
        </a><br/>
        Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: '2rem' }}>Stand: Mai 2026</p>
    </main>
  );
}
