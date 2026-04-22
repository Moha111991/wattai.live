import React from 'react';
import '../styles/ev-dashboard.css';
import ElektroautoV2H from './ElektroautoV2H';
import EVChargeControl from './EVChargeControl';

const EVDashboard: React.FC = () => {
  return (
    <div className="ev-dashboard">
      <EVChargeControl />
      {/* V2H Integration */}
      <ElektroautoV2H />
    </div>
  );
};

export default EVDashboard;
