import React, { useState } from 'react';

// ============================================================================
// AI-Powered Recommendations Widget
// ============================================================================
// Intelligente Empfehlungen mit Konfidenz, Kosten/CO2-Impact und Zeitschätzung

interface AIRecommendation {
  id: string;
  type: 'energy_optimization' | 'cost_saving' | 'sustainability' | 'preventive' | 'charging';
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Impact metrics
  estimated_savings_eur?: number;
  co2_reduction_kg?: number;
  energy_saved_kwh?: number;
  
  // Timing
  time_horizon?: 'immediate' | '1h' | '6h' | '24h' | 'week';
  valid_until?: Date;
  
  // Actions
  actions?: {
    label: string;
    type: 'accept' | 'schedule' | 'dismiss';
    endpoint?: string;
    payload?: Record<string, any>;
  }[];
  
  // Context
  reasoning?: string[];
  data_sources?: string[];
}

interface AIRecommendationsWidgetProps {
  recommendations?: AIRecommendation[];
  onActionClick?: (recommendationId: string, actionType: string, payload?: any) => void;
  maxDisplay?: number;
}

const PRIORITY_STYLES = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-600 text-white',
    icon: '🚨'
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    badge: 'bg-orange-600 text-white',
    icon: '⚠️'
  },
  medium: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    badge: 'bg-blue-600 text-white',
    icon: '💡'
  },
  low: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    badge: 'bg-gray-600 text-white',
    icon: 'ℹ️'
  }
};

const TIME_LABELS = {
  immediate: 'Sofort',
  '1h': 'Nächste Stunde',
  '6h': 'Nächste 6 Stunden',
  '24h': 'Nächste 24 Stunden',
  week: 'Diese Woche'
};

const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => {
  const getColor = () => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-blue-500';
    if (confidence >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>KI-Konfidenz</span>
        <span className="font-bold">{confidence}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
};

const ImpactMetrics: React.FC<{
  savings_eur?: number;
  co2_kg?: number;
  energy_kwh?: number;
}> = ({ savings_eur, co2_kg, energy_kwh }) => {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {savings_eur !== undefined && (
        <div className="bg-green-100 rounded-lg p-2 text-center">
          <div className="text-xs text-green-700">Ersparnis</div>
          <div className="text-lg font-bold text-green-900">
            {savings_eur.toFixed(2)} €
          </div>
        </div>
      )}
      
      {co2_kg !== undefined && (
        <div className="bg-blue-100 rounded-lg p-2 text-center">
          <div className="text-xs text-blue-700">CO₂</div>
          <div className="text-lg font-bold text-blue-900">
            -{co2_kg.toFixed(1)} kg
          </div>
        </div>
      )}
      
      {energy_kwh !== undefined && (
        <div className="bg-purple-100 rounded-lg p-2 text-center">
          <div className="text-xs text-purple-700">Energie</div>
          <div className="text-lg font-bold text-purple-900">
            {energy_kwh.toFixed(1)} kWh
          </div>
        </div>
      )}
    </div>
  );
};

const RecommendationCard: React.FC<{
  recommendation: AIRecommendation;
  onAction?: (actionType: string, payload?: any) => void;
}> = ({ recommendation, onAction }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  const styles = PRIORITY_STYLES[recommendation.priority];
  
  if (dismissed) return null;
  
  return (
    <div className={`
      rounded-xl p-4 border-2 transition-all duration-300
      ${styles.bg} ${styles.border} ${expanded ? 'shadow-xl' : 'shadow-md'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-2xl">{styles.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900">{recommendation.title}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${styles.badge}`}>
                {recommendation.priority === 'critical' ? 'Kritisch' : 
                 recommendation.priority === 'high' ? 'Hoch' :
                 recommendation.priority === 'medium' ? 'Mittel' : 'Niedrig'}
              </span>
            </div>
            <p className="text-sm text-gray-700">{recommendation.description}</p>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>
      
      {/* Time Horizon */}
      {recommendation.time_horizon && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <span>⏱️</span>
          <span>{TIME_LABELS[recommendation.time_horizon]}</span>
          {recommendation.valid_until && (
            <span className="text-xs text-gray-500">
              (Gültig bis {new Date(recommendation.valid_until).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})
            </span>
          )}
        </div>
      )}
      
      {/* Confidence */}
      <ConfidenceBar confidence={recommendation.confidence} />
      
      {/* Impact Metrics */}
      {(recommendation.estimated_savings_eur || recommendation.co2_reduction_kg || recommendation.energy_saved_kwh) && (
        <ImpactMetrics
          savings_eur={recommendation.estimated_savings_eur}
          co2_kg={recommendation.co2_reduction_kg}
          energy_kwh={recommendation.energy_saved_kwh}
        />
      )}
      
      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
          {/* Reasoning */}
          {recommendation.reasoning && recommendation.reasoning.length > 0 && (
            <div>
              <div className="font-semibold text-sm text-gray-700 mb-2">🧠 KI-Begründung:</div>
              <ul className="space-y-1">
                {recommendation.reasoning.map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Data Sources */}
          {recommendation.data_sources && recommendation.data_sources.length > 0 && (
            <div>
              <div className="font-semibold text-sm text-gray-700 mb-2">📊 Datenquellen:</div>
              <div className="flex flex-wrap gap-2">
                {recommendation.data_sources.map((source, idx) => (
                  <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      {recommendation.actions && recommendation.actions.length > 0 && (
        <div className="flex gap-2 mt-4">
          {recommendation.actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (action.type === 'dismiss') {
                  setDismissed(true);
                }
                onAction?.(action.type, action.payload);
              }}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                ${action.type === 'accept' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  action.type === 'schedule' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                  'bg-gray-600 hover:bg-gray-700 text-white'}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AIRecommendationsWidget: React.FC<AIRecommendationsWidgetProps> = ({
  recommendations = [],
  onActionClick,
  maxDisplay = 5
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'confidence' | 'savings'>('priority');
  
  // Sort recommendations
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (sortBy === 'confidence') {
      return b.confidence - a.confidence;
    }
    if (sortBy === 'savings') {
      return (b.estimated_savings_eur || 0) - (a.estimated_savings_eur || 0);
    }
    return 0;
  });
  
  // Filter recommendations
  const filteredRecommendations = sortedRecommendations
    .filter(r => filter === 'all' || r.priority === filter)
    .slice(0, maxDisplay);
  
  // Calculate total impact
  const totalImpact = recommendations.reduce((acc, r) => ({
    savings: acc.savings + (r.estimated_savings_eur || 0),
    co2: acc.co2 + (r.co2_reduction_kg || 0),
    energy: acc.energy + (r.energy_saved_kwh || 0)
  }), { savings: 0, co2: 0, energy: 0 });
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🤖 KI-Empfehlungen</h2>
          <span className="bg-white bg-opacity-20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
            {recommendations.length} aktiv
          </span>
        </div>
        
        {/* Total Impact Summary */}
        {totalImpact.savings > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
              <div className="text-xs opacity-90">Mögliche Ersparnis</div>
              <div className="text-xl font-bold">{totalImpact.savings.toFixed(2)} €</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
              <div className="text-xs opacity-90">CO₂-Reduktion</div>
              <div className="text-xl font-bold">{totalImpact.co2.toFixed(1)} kg</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
              <div className="text-xs opacity-90">Energie</div>
              <div className="text-xl font-bold">{totalImpact.energy.toFixed(1)} kWh</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Filters & Sorting */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white rounded-lg p-4 shadow">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kritisch
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'high' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Hoch
          </button>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="priority">Nach Priorität</option>
          <option value="confidence">Nach Konfidenz</option>
          <option value="savings">Nach Ersparnis</option>
        </select>
      </div>
      
      {/* Recommendations List */}
      <div className="space-y-3">
        {filteredRecommendations.map(rec => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onAction={(actionType, payload) => onActionClick?.(rec.id, actionType, payload)}
          />
        ))}
      </div>
      
      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <span className="text-6xl mb-4 block">✨</span>
          <p className="text-gray-500 text-lg font-medium">Keine Empfehlungen verfügbar</p>
          <p className="text-gray-400 text-sm mt-2">Ihr System läuft optimal!</p>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationsWidget;
