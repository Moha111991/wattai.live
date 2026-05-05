import WattAILogo from '../components/WattAILogo';

/**
 * WattAI.live Logo Showcase & Brand Guidelines
 * 
 * Diese Seite zeigt alle Logo-Varianten und Verwendungsrichtlinien
 */
const LogoShowcase = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #020617 0%, #0b1220 35%, #0f172a 100%)',
      padding: '40px 20px',
      color: '#e2e8f0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div className="animate-fade-in" style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #67e8f9, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '16px'
          }}>
            WattAI.live Logo & Branding
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Professionelles Erkennungszeichen für die KI-gestützte Energie- und Lademanagement-Plattform
          </p>
        </div>

        {/* Main Logo Display */}
        <div className="glass-effect animate-stagger-1 animate-page-enter" style={{
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: '24px',
          padding: '60px',
          marginBottom: '40px',
          border: '1px solid rgba(103, 232, 249, 0.2)',
          textAlign: 'center'
        }}>
          <WattAILogo size={180} animated={true} variant="full" />
          <p style={{
            marginTop: '30px',
            color: '#cbd5e1',
            fontSize: '14px'
          }}>
            Haupt-Logo (animiert)
          </p>
        </div>

        {/* Logo Variants */}
        <h2 className="neon-glow" style={{
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '30px',
          color: '#67e8f9'
        }}>
          Logo-Varianten
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {/* Full Logo - Animated */}
          <div className="glass-effect animate-stagger-2 animate-page-enter" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid rgba(103, 232, 249, 0.2)',
            textAlign: 'center'
          }}>
            <WattAILogo size={120} animated={true} variant="full" />
            <h3 style={{ marginTop: '20px', color: '#e2e8f0', fontSize: '16px' }}>
              Vollständig · Animiert
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
              Für Haupt-Header und Landingpages
            </p>
          </div>

          {/* Full Logo - Static */}
          <div className="glass-effect animate-stagger-2 animate-page-enter delay-100" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid rgba(103, 232, 249, 0.2)',
            textAlign: 'center'
          }}>
            <WattAILogo size={120} animated={false} variant="full" />
            <h3 style={{ marginTop: '20px', color: '#e2e8f0', fontSize: '16px' }}>
              Vollständig · Statisch
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
              Für Print und statische Medien
            </p>
          </div>

          {/* Icon Only - Animated */}
          <div className="glass-effect animate-stagger-2 animate-page-enter delay-200" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid rgba(103, 232, 249, 0.2)',
            textAlign: 'center'
          }}>
            <WattAILogo size={100} animated={true} variant="icon" />
            <h3 style={{ marginTop: '20px', color: '#e2e8f0', fontSize: '16px' }}>
              Symbol · Animiert
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
              Für App-Icons und Social Media
            </p>
          </div>

          {/* Icon Only - Static */}
          <div className="glass-effect animate-stagger-2 animate-page-enter delay-300" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid rgba(103, 232, 249, 0.2)',
            textAlign: 'center'
          }}>
            <WattAILogo size={100} animated={false} variant="icon" />
            <h3 style={{ marginTop: '20px', color: '#e2e8f0', fontSize: '16px' }}>
              Symbol · Statisch
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
              Für Favicon und kleine Flächen
            </p>
          </div>

          {/* Text Only - Animated */}
          <div className="glass-effect animate-stagger-2 animate-page-enter delay-400" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid rgba(103, 232, 249, 0.2)',
            textAlign: 'center'
          }}>
            <WattAILogo size={100} animated={true} variant="text" />
            <h3 style={{ marginTop: '20px', color: '#e2e8f0', fontSize: '16px' }}>
              Text · Animiert
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
              Für Footer und Wasserzeichen
            </p>
          </div>

          {/* Text Only - Static */}
          <div className="glass-effect animate-stagger-2 animate-page-enter delay-500" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '40px',
            border: '1px solid rgba(103, 232, 249, 0.2)',
            textAlign: 'center'
          }}>
            <WattAILogo size={100} animated={false} variant="text" />
            <h3 style={{ marginTop: '20px', color: '#e2e8f0', fontSize: '16px' }}>
              Text · Statisch
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px' }}>
              Für Dokumente und E-Mails
            </p>
          </div>
        </div>

        {/* Design System */}
        <h2 className="neon-glow" style={{
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '30px',
          color: '#67e8f9'
        }}>
          Design-System
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '60px'
        }}>
          {/* Farbpalette */}
          <div className="glass-effect animate-stagger-3 animate-page-enter" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid rgba(103, 232, 249, 0.2)'
          }}>
            <h3 style={{ color: '#e2e8f0', fontSize: '18px', marginBottom: '20px' }}>
              🎨 Farbpalette
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#67e8f9',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }} />
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>Cyan</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>#67e8f9</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }} />
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>Blue</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>#3b82f6</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#fbbf24',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }} />
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>Amber (Accent)</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>#fbbf24</div>
                </div>
              </div>
            </div>
          </div>

          {/* Symbolik */}
          <div className="glass-effect animate-stagger-3 animate-page-enter delay-100" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid rgba(103, 232, 249, 0.2)'
          }}>
            <h3 style={{ color: '#e2e8f0', fontSize: '18px', marginBottom: '20px' }}>
              ⚡ Symbolik
            </h3>
            <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.8, paddingLeft: '20px' }}>
              <li><strong>Blitz:</strong> Energie, Schnelligkeit, Innovation</li>
              <li><strong>Neural Ring:</strong> KI, Vernetzung, Intelligenz</li>
              <li><strong>Nodes:</strong> IoT, Smart Home, Konnektivität</li>
              <li><strong>Gradient:</strong> Zukunft, Technologie, Dynamik</li>
            </ul>
          </div>

          {/* Typografie */}
          <div className="glass-effect animate-stagger-3 animate-page-enter delay-200" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '16px',
            padding: '30px',
            border: '1px solid rgba(103, 232, 249, 0.2)'
          }}>
            <h3 style={{ color: '#e2e8f0', fontSize: '18px', marginBottom: '20px' }}>
              🔤 Typografie
            </h3>
            <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.8 }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>Font:</strong> Inter, Segoe UI, system-ui
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>"Watt":</strong> 800 (ExtraBold)
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>"AI":</strong> 900 (Black) + Gradient
              </div>
              <div>
                <strong>".live":</strong> 500 (Medium) + Grau
              </div>
            </div>
          </div>
        </div>

        {/* Verwendungsrichtlinien */}
        <h2 className="neon-glow" style={{
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '30px',
          color: '#67e8f9'
        }}>
          Verwendungsrichtlinien
        </h2>

        <div className="glass-effect animate-stagger-4 animate-page-enter" style={{
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: '16px',
          padding: '40px',
          border: '1px solid rgba(103, 232, 249, 0.2)',
          marginBottom: '40px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            <div>
              <h3 style={{ color: '#22c55e', fontSize: '18px', marginBottom: '16px' }}>
                ✅ Empfohlen
              </h3>
              <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.8, paddingLeft: '20px' }}>
                <li>Animierte Version für digitale Medien</li>
                <li>Statische Version für Print</li>
                <li>Mindestgröße: 80px Breite</li>
                <li>Freiraum: Mindestens 20px ringsum</li>
                <li>Dunkler oder transparenter Hintergrund</li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#ef4444', fontSize: '18px', marginBottom: '16px' }}>
                ❌ Nicht erlaubt
              </h3>
              <ul style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: 1.8, paddingLeft: '20px' }}>
                <li>Farben ändern oder neu einfärben</li>
                <li>Proportionen verzerren</li>
                <li>Schatten oder Effekte hinzufügen</li>
                <li>Logo auf hellem Hintergrund ohne Anpassung</li>
                <li>Unter 60px Breite skalieren</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code-Beispiele */}
        <h2 className="neon-glow" style={{
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '30px',
          color: '#67e8f9'
        }}>
          Code-Beispiele
        </h2>

        <div className="glass-effect animate-stagger-5 animate-page-enter" style={{
          background: 'rgba(15, 23, 42, 0.7)',
          borderRadius: '16px',
          padding: '30px',
          border: '1px solid rgba(103, 232, 249, 0.2)',
          marginBottom: '60px'
        }}>
          <h3 style={{ color: '#e2e8f0', fontSize: '18px', marginBottom: '16px' }}>
            React/TypeScript Verwendung
          </h3>
          <pre style={{
            background: 'rgba(2, 6, 23, 0.8)',
            color: '#67e8f9',
            padding: '20px',
            borderRadius: '12px',
            overflow: 'auto',
            fontSize: '13px',
            fontFamily: 'monospace',
            border: '1px solid rgba(103, 232, 249, 0.2)'
          }}>
{`import WattAILogo from './components/WattAILogo';

// Vollständiges Logo, animiert
<WattAILogo size={120} animated={true} variant="full" />

// Nur Icon, statisch
<WattAILogo size={80} animated={false} variant="icon" />

// Nur Text, animiert
<WattAILogo size={100} animated={true} variant="text" />

// Mit Custom Styling
<WattAILogo 
  size={150} 
  animated={true} 
  variant="full"
  className="my-custom-class"
  style={{ margin: '20px auto' }}
/>`}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          borderTop: '1px solid rgba(103, 232, 249, 0.2)'
        }}>
          <WattAILogo size={100} animated={true} variant="full" />
          <p style={{
            marginTop: '20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            © 2026 WattAI.live · KI-gestützte Energie- und Lademanagement-Plattform
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoShowcase;
