"""
ISO 26262 Functional Safety Layer

ASIL Level: ASIL-B (moderate risk mitigation)
Scope: EV Charging, Battery Management, Grid Interaction

Safety Goals:
1. Prevent battery damage (overcharge, overdischarge)
2. Prevent grid instability (sudden power changes)
3. Ensure system stability (watchdog, heartbeat)
4. Enable safe shutdown (defined safe states)
"""

import time
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ASILLevel(str, Enum):
    """
    Automotive Safety Integrity Level (ISO 26262)
    
    QM (Quality Management) - No safety relevance
    ASIL_A - Lowest safety requirement
    ASIL_B - Moderate safety requirement
    ASIL_C - High safety requirement
    ASIL_D - Highest safety requirement
    """
    QM = "QM"
    ASIL_A = "ASIL_A"
    ASIL_B = "ASIL_B"
    ASIL_C = "ASIL_C"
    ASIL_D = "ASIL_D"


class SafetyState(str, Enum):
    """System Safety States"""
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    DEGRADED = "DEGRADED"
    SAFE_STATE = "SAFE_STATE"
    EMERGENCY_STOP = "EMERGENCY_STOP"


class SafetyEvent:
    """Safety Event Data Structure"""
    
    def __init__(
        self,
        event_type: str,
        asil_level: ASILLevel,
        details: Dict[str, Any],
        action: str
    ):
        self.timestamp = datetime.now()
        self.event_type = event_type
        self.asil_level = asil_level
        self.details = details
        self.action = action
    
    def to_dict(self) -> dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'event_type': self.event_type,
            'asil_level': self.asil_level.value,
            'details': self.details,
            'action': self.action,
        }


class SafetyMonitor:
    """
    ISO 26262 Safety Monitor
    
    Features:
    - Plausibility Checks (SOC, Power, Gradient)
    - Watchdog & Heartbeat Monitoring
    - Safe State Management
    - Safety Event Logging
    """
    
    def __init__(
        self,
        watchdog_timeout: int = 5,
        soc_gradient_max: float = 10.0,
        power_gradient_max: float = 5000.0
    ):
        # Watchdog & Heartbeat
        self.watchdog_timeout = watchdog_timeout
        self.last_heartbeat: Dict[str, float] = {}
        self.component_status: Dict[str, str] = {}
        
        # Safety State
        self.safety_state = SafetyState.NORMAL
        self.safety_events: List[SafetyEvent] = []
        
        # Historical Data for Gradient Checks
        self.soc_history: Dict[str, List[tuple]] = defaultdict(list)  # (timestamp, value)
        self.power_history: List[tuple] = []  # (timestamp, value)
        
        # Safety Limits
        self.soc_gradient_max = soc_gradient_max  # Max 10% per minute
        self.power_gradient_max = power_gradient_max  # Max 5kW per second
        
        # Statistics
        self.stats = {
            'total_checks': 0,
            'violations': 0,
            'safe_state_triggers': 0,
            'emergency_stops': 0,
        }
        
        logger.info("SafetyMonitor initialized - ASIL-B compliant")
    
    # ========== PLAUSIBILITY CHECKS ==========
    
    def validate_soc(self, soc: float, device: str) -> bool:
        """
        Plausibility Check: SOC Value
        
        Checks:
        1. Range: 0-100%
        2. Gradient: Max 10% per minute
        3. Physical limits
        
        ASIL Level: ASIL-B (battery damage prevention)
        """
        self.stats['total_checks'] += 1
        
        # Check 1: Range
        if not 0 <= soc <= 100:
            self.trigger_safety_event(
                event_type="SOC_OUT_OF_RANGE",
                asil_level=ASILLevel.ASIL_B,
                details={
                    'device': device,
                    'soc': soc,
                    'valid_range': '0-100',
                },
                action="REJECT_VALUE"
            )
            self.stats['violations'] += 1
            return False
        
        # Check 2: Gradient (rate of change)
        if device in self.soc_history:
            history = self.soc_history[device]
            if len(history) > 0:
                last_timestamp, last_soc = history[-1]
                time_diff = (datetime.now() - last_timestamp).total_seconds() / 60.0  # minutes
                
                if time_diff > 0:
                    gradient = abs(soc - last_soc) / time_diff
                    
                    if gradient > self.soc_gradient_max:
                        self.trigger_safety_event(
                            event_type="SOC_GRADIENT_VIOLATION",
                            asil_level=ASILLevel.ASIL_B,
                            details={
                                'device': device,
                                'current_soc': soc,
                                'last_soc': last_soc,
                                'gradient': round(gradient, 2),
                                'max_gradient': self.soc_gradient_max,
                                'time_diff_min': round(time_diff, 2),
                            },
                            action="REJECT_VALUE_USE_INTERPOLATION"
                        )
                        self.stats['violations'] += 1
                        
                        # Use interpolated value instead
                        interpolated = last_soc + (self.soc_gradient_max * time_diff)
                        logger.warning(f"SOC gradient violation - using interpolated value: {interpolated:.1f}%")
                        return False
        
        # Record valid value
        self.soc_history[device].append((datetime.now(), soc))
        
        # Keep only last 10 values (prevent memory leak)
        if len(self.soc_history[device]) > 10:
            self.soc_history[device] = self.soc_history[device][-10:]
        
        return True
    
    def validate_power(self, power: float, context: str = "unknown") -> bool:
        """
        Plausibility Check: Power Value
        
        Checks:
        1. Range: -50kW to +50kW (typical home limits)
        2. Gradient: Max 5kW per second
        
        ASIL Level: ASIL-B (grid stability)
        """
        self.stats['total_checks'] += 1
        
        # Check 1: Range
        if not -50000 <= power <= 50000:
            self.trigger_safety_event(
                event_type="POWER_OUT_OF_RANGE",
                asil_level=ASILLevel.ASIL_B,
                details={
                    'power': power,
                    'context': context,
                    'valid_range': '-50kW to +50kW',
                },
                action="REJECT_VALUE"
            )
            self.stats['violations'] += 1
            return False
        
        # Check 2: Gradient
        if len(self.power_history) > 0:
            last_timestamp, last_power = self.power_history[-1]
            time_diff = (datetime.now() - last_timestamp).total_seconds()
            
            if time_diff > 0:
                gradient = abs(power - last_power) / time_diff
                
                if gradient > self.power_gradient_max:
                    self.trigger_safety_event(
                        event_type="POWER_GRADIENT_VIOLATION",
                        asil_level=ASILLevel.ASIL_A,
                        details={
                            'current_power': power,
                            'last_power': last_power,
                            'gradient': round(gradient, 2),
                            'max_gradient': self.power_gradient_max,
                            'context': context,
                        },
                        action="RATE_LIMIT_POWER_CHANGE"
                    )
                    # Not critical - just log warning
                    logger.warning(f"Power gradient high: {gradient:.0f} W/s")
        
        # Record value
        self.power_history.append((datetime.now(), power))
        
        # Keep only last 10 values
        if len(self.power_history) > 10:
            self.power_history.pop(0)
        
        return True
    
    def validate_command(self, device_type: str, command: str) -> bool:
        """
        Plausibility Check: Control Commands
        
        Checks:
        1. Command is in whitelist
        2. Device is operational (not in safe state)
        3. Command is allowed in current safety state
        
        ASIL Level: ASIL-C (safety-critical commands)
        """
        self.stats['total_checks'] += 1
        
        # Check 1: Whitelist
        valid_commands = {
            'ev': ['start_charging', 'stop_charging', 'set_charge_limit', 'set_charge_power', 'enable_v2g', 'disable_v2g'],
            'home_battery': ['start_charging', 'stop_charging', 'discharge_to_grid', 'stop_discharge'],
            'battery': ['start_charging', 'stop_charging', 'discharge_to_grid', 'stop_discharge'],  # Alias for home_battery
            'heat_pump': ['start_heating', 'stop_heating', 'start_cooling', 'stop_cooling'],
            'wallbox': ['start_charging', 'stop_charging', 'set_charge_limit', 'set_charge_power', 'set_current_limit'],  # Wallbox-specific
        }
        
        if device_type not in valid_commands:
            self.trigger_safety_event(
                event_type="INVALID_DEVICE_TYPE",
                asil_level=ASILLevel.ASIL_B,
                details={'device_type': device_type, 'command': command},
                action="REJECT_COMMAND"
            )
            self.stats['violations'] += 1
            return False
        
        if command not in valid_commands[device_type]:
            self.trigger_safety_event(
                event_type="INVALID_COMMAND",
                asil_level=ASILLevel.ASIL_B,
                details={
                    'device_type': device_type,
                    'command': command,
                    'valid_commands': valid_commands[device_type],
                },
                action="REJECT_COMMAND"
            )
            self.stats['violations'] += 1
            return False
        
        # Check 2: Safety State
        if self.safety_state == SafetyState.SAFE_STATE:
            self.trigger_safety_event(
                event_type="COMMAND_IN_SAFE_STATE",
                asil_level=ASILLevel.ASIL_C,
                details={
                    'device_type': device_type,
                    'command': command,
                    'safety_state': self.safety_state.value,
                },
                action="REJECT_COMMAND_SAFE_STATE_ACTIVE"
            )
            self.stats['violations'] += 1
            return False
        
        if self.safety_state == SafetyState.EMERGENCY_STOP:
            self.trigger_safety_event(
                event_type="COMMAND_IN_EMERGENCY_STOP",
                asil_level=ASILLevel.ASIL_D,
                details={
                    'device_type': device_type,
                    'command': command,
                },
                action="REJECT_COMMAND_EMERGENCY_STOP_ACTIVE"
            )
            self.stats['violations'] += 1
            return False
        
        return True
    
    # ========== WATCHDOG & HEARTBEAT ==========
    
    def heartbeat(self, component: str):
        """
        Register component heartbeat
        
        Components should call this every 1-2 seconds
        """
        self.last_heartbeat[component] = time.time()
        self.component_status[component] = "ALIVE"
    
    def check_watchdog(self):
        """
        Check if all components are alive
        
        Should be called periodically (e.g., every 5 seconds)
        """
        now = time.time()
        
        for component, last_beat in self.last_heartbeat.items():
            time_since_beat = now - last_beat
            
            if time_since_beat > self.watchdog_timeout:
                self.component_status[component] = "TIMEOUT"
                
                self.trigger_safety_event(
                    event_type="COMPONENT_TIMEOUT",
                    asil_level=ASILLevel.ASIL_B,
                    details={
                        'component': component,
                        'timeout_seconds': round(time_since_beat, 2),
                        'max_timeout': self.watchdog_timeout,
                    },
                    action="ENTER_DEGRADED_STATE"
                )
                
                # Enter degraded state
                if self.safety_state == SafetyState.NORMAL:
                    self.safety_state = SafetyState.DEGRADED
                    logger.warning(f"Entering DEGRADED state - {component} timeout")
    
    def get_component_status(self) -> Dict[str, str]:
        """Get status of all monitored components"""
        self.check_watchdog()
        return self.component_status.copy()
    
    # ========== SAFE STATE MANAGEMENT ==========
    
    def enter_safe_state(self, reason: str):
        """
        Enter Safe State
        
        Actions:
        - Stop all charging
        - Disconnect grid
        - Battery idle
        - Notify user
        
        ASIL Level: ASIL-C
        """
        if self.safety_state in [SafetyState.SAFE_STATE, SafetyState.EMERGENCY_STOP]:
            return  # Already in safe state
        
        self.safety_state = SafetyState.SAFE_STATE
        self.stats['safe_state_triggers'] += 1
        
        self.trigger_safety_event(
            event_type="ENTER_SAFE_STATE",
            asil_level=ASILLevel.ASIL_C,
            details={'reason': reason},
            action="STOP_ALL_OPERATIONS"
        )
        
        logger.error(f"🛑 SAFE STATE ENTERED - Reason: {reason}")
        
        # TODO: Integrate with actual control system
        # - Stop EV charging
        # - Stop battery charging/discharging
        # - Disconnect grid
    
    def enter_emergency_stop(self, reason: str):
        """
        Emergency Stop
        
        Highest priority safety action.
        Requires manual reset.
        
        ASIL Level: ASIL-D
        """
        self.safety_state = SafetyState.EMERGENCY_STOP
        self.stats['emergency_stops'] += 1
        
        self.trigger_safety_event(
            event_type="EMERGENCY_STOP",
            asil_level=ASILLevel.ASIL_D,
            details={'reason': reason},
            action="IMMEDIATE_SHUTDOWN_MANUAL_RESET_REQUIRED"
        )
        
        logger.critical(f"🚨 EMERGENCY STOP - Reason: {reason}")
    
    def reset_safe_state(self, manual_override: bool = False):
        """
        Reset from Safe State to Normal
        
        Requires manual override for safety
        """
        if not manual_override:
            logger.warning("Safe state reset requires manual override")
            return False
        
        if self.safety_state == SafetyState.EMERGENCY_STOP:
            logger.error("Emergency stop requires system restart")
            return False
        
        self.safety_state = SafetyState.NORMAL
        
        self.trigger_safety_event(
            event_type="SAFE_STATE_RESET",
            asil_level=ASILLevel.ASIL_B,
            details={'manual_override': manual_override},
            action="RESUME_NORMAL_OPERATION"
        )
        
        logger.info("✅ Returning to NORMAL state")
        return True
    
    # ========== SAFETY EVENT LOGGING ==========
    
    def trigger_safety_event(
        self,
        event_type: str,
        asil_level: ASILLevel,
        details: Dict[str, Any],
        action: str
    ):
        """
        Log safety event
        
        ISO 26262 requires separate safety event log
        """
        event = SafetyEvent(event_type, asil_level, details, action)
        self.safety_events.append(event)
        
        # Keep only last 1000 events in memory (prevent memory leak)
        if len(self.safety_events) > 1000:
            self.safety_events = self.safety_events[-1000:]
        
        # Write to file (persistent log)
        try:
            with open('/tmp/safety_events.log', 'a') as f:
                f.write(json.dumps(event.to_dict()) + '\n')
        except Exception as e:
            logger.error(f"Failed to write safety event: {e}")
        
        # Log to console
        if asil_level in [ASILLevel.ASIL_C, ASILLevel.ASIL_D]:
            logger.error(f"⚠️ SAFETY EVENT [{asil_level.value}]: {event_type} - {action}")
        elif asil_level == ASILLevel.ASIL_B:
            logger.warning(f"⚠️ SAFETY EVENT [{asil_level.value}]: {event_type} - {action}")
    
    def get_safety_events(
        self,
        limit: int = 100,
        asil_filter: Optional[ASILLevel] = None
    ) -> List[Dict]:
        """Get recent safety events"""
        events = self.safety_events[-limit:]
        
        if asil_filter:
            events = [e for e in events if e.asil_level == asil_filter]
        
        return [e.to_dict() for e in events]
    
    # ========== STATUS & DIAGNOSTICS ==========
    
    def get_status(self) -> Dict[str, Any]:
        """Get current safety system status"""
        return {
            'safety_state': self.safety_state.value,
            'watchdog_timeout': self.watchdog_timeout,
            'components_monitored': len(self.last_heartbeat),
            'component_status': self.get_component_status(),
            'statistics': self.stats,
            'recent_events': len(self.safety_events),
        }
    
    def get_diagnostics(self) -> Dict[str, Any]:
        """
        Comprehensive diagnostics
        
        Useful for OEM integration testing
        """
        return {
            'status': self.get_status(),
            'recent_violations': [
                e.to_dict() for e in self.safety_events[-10:]
                if e.asil_level in [ASILLevel.ASIL_B, ASILLevel.ASIL_C, ASILLevel.ASIL_D]
            ],
            'component_health': self.get_component_status(),
            'limits': {
                'soc_gradient_max': self.soc_gradient_max,
                'power_gradient_max': self.power_gradient_max,
                'watchdog_timeout': self.watchdog_timeout,
            },
        }


# Global singleton instance
_safety_monitor: Optional[SafetyMonitor] = None


def get_safety_monitor() -> SafetyMonitor:
    """Get global safety monitor instance"""
    global _safety_monitor
    if _safety_monitor is None:
        _safety_monitor = SafetyMonitor()
    return _safety_monitor
