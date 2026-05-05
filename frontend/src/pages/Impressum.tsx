export default function Impressum() {
  return (
    <main style={{ maxWidth: 960, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Impressum (Platzhalter)</h1>
      <p style={{ marginTop: "1rem" }}>
        Dieser Inhalt ist ein technischer Platzhalter. Bitte ersetzen Sie diesen Text durch ein
        rechtlich geprüftes Impressum entsprechend der für Sie geltenden gesetzlichen Vorgaben
        (z. B. nach TMG/ECG/UWG o. Ä.).
      </p>
      <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
        Hinweis: Dieser Text stellt keine Rechtsberatung dar.
      </p>
      <ul style={{ marginTop: "1rem" }}>
        <li>Firmenname / Verantwortliche Stelle</li>
        <li>Anschrift</li>
        <li>Vertretungsberechtigte Person(en)</li>
        <li>Kontakt (E-Mail, Telefon)</li>
        <li>Registereintrag (Handelsregister, Registernummer, Registergericht)</li>
        <li>Umsatzsteuer-ID / Wirtschafts-ID (falls vorhanden)</li>
      </ul>
    </main>
  );
}
