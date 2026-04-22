import React from "react";
import { Link } from "react-router-dom";

export default function LegalFooter() {
  return (
    <footer
      style={{
        marginTop: "2rem",
        padding: "1rem 0",
        borderTop: "1px solid #ddd",
        fontSize: "0.85rem",
        textAlign: "center",
        color: "#555",
      }}
    >
      <span style={{ marginRight: "1rem" }}>
        <Link to="/impressum" style={{ margin: "0 0.5rem", color: "#1976d2" }}>
          Impressum
        </Link>
        |
        <Link to="/datenschutz" style={{ margin: "0 0.5rem", color: "#1976d2" }}>
          Datenschutz
        </Link>
        |
        <Link to="/terms" style={{ margin: "0 0.5rem", color: "#1976d2" }}>
          Nutzungsbedingungen
        </Link>
      </span>
      <div style={{ marginTop: "0.3rem" }}>
        {/* Hinweis: Dies ist kein Rechtsdokument. Bitte juristisch geprüfte Texte verwenden. */}
        <span>Hinweis: Rechtstexte müssen durch eine*n Rechtsanwält*in geprüft und bereitgestellt werden.</span>
      </div>
    </footer>
  );
}
