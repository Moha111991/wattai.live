import { useTabContext } from '../context/TabContext';

const STYLES = `
  .tb-nav{
    display:flex; flex-direction:column; align-items:center;
    gap:10px; padding:14px clamp(12px,2vw,24px) 10px;
    background:rgba(2,6,23,0.6); border-bottom:1px solid rgba(255,255,255,0.05);
    backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
  }
  .tb-tabs{
    display:flex; flex-wrap:wrap; justify-content:center;
    gap:clamp(6px,1.2vw,10px);
  }
  .tb-btn{
    padding:0.45rem 0.95rem; border-radius:999px; font-size:13px;
    font-weight:600; cursor:pointer; transition:all 160ms ease;
    min-height:36px; letter-spacing:0.02em; white-space:nowrap;
    border:1px solid rgba(148,163,184,0.3);
    background:rgba(15,23,42,0.55); color:#f8fafc;
    box-shadow:0 3px 8px rgba(2,6,23,0.3);
  }
  .tb-btn.active{
    background:linear-gradient(90deg,#0ea5e9,#14b8a6);
    border-color:rgba(103,232,249,0.65);
    font-weight:700;
    box-shadow:0 6px 18px rgba(14,165,233,0.32);
  }
  .tb-meta{
    display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:center;
  }
  .tb-plan{
    font-size:12px; color:#cbd5e1; padding:0.3rem 0.8rem;
    border-radius:999px;
  }
  .tb-login{
    font-size:12px; font-weight:600; cursor:pointer;
    background:rgba(103,232,249,0.08); border:1px solid rgba(103,232,249,0.3);
    color:#67e8f9; border-radius:999px; padding:0.3rem 0.85rem;
    transition:all 160ms ease;
  }
  .tb-login:hover{ background:rgba(103,232,249,0.16); }
`;

export default function TabBar() {
  const { tab, setTab, tabs, isLoggedIn, onAuthClick, planTitle, planColor } = useTabContext();

  return (
    <>
      <style>{STYLES}</style>
      <nav className="tb-nav">
        <div className="tb-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`tb-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="tb-meta">
          <span className="tb-plan" style={{ border: `1px solid ${planColor}55`, background: `${planColor}0d` }}>
            Aktueller Plan: <b style={{ color: planColor }}>{planTitle}</b>
          </span>
          {!isLoggedIn && (
            <button className="tb-login" onClick={onAuthClick}>
              🔐 Anmelden für mehr Funktionen
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
