import '../styles/ev-dashboard.css';
import ElektroautoV2H from './ElektroautoV2H';
import EVChargeControl from './EVChargeControl';

const EVDashboard = () => {
  return (
    <div className="ev-dashboard tab-content-full">
      <div className="animate-fade-in">
        <h2 className="tab-page-title" style={{ margin: '0 0 8px 0' }}>Elektroauto</h2>
        <p className="tab-page-subtitle" style={{ marginBottom: '24px' }}>
          Intelligente Ladesteuerung, V2H/V2G Integration und Echtzeit-Monitoring
        </p>
      </div>
      
      <div className="tab-modern-card ev-section-card glass-effect animate-page-enter animate-stagger-1">
        <EVChargeControl />
      </div>
      
      {/* V2H Integration */}
      <div className="animate-stagger-2 animate-page-enter">
        <ElektroautoV2H />
      </div>
    </div>
  );
};

export default EVDashboard;
