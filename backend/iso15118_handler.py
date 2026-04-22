"""
ISO 15118 Communication Handler
Implementiert Vehicle-to-Grid (V2G) Kommunikation zwischen EVCC und SECC

Standards:
- ISO 15118-2: Network and application protocol
- ISO 15118-20: Enhanced features, V2G, wireless charging
- DIN SPEC 70121: Predecessor to ISO 15118-2

Features:
- Smart Charging (dynamische Ladeleistung)
- Plug & Charge (automatische Authentifizierung)
- Bidirectional Power Transfer (V2G)
- Energy Management Integration
"""

from typing import Dict, Optional, List
from pydantic import BaseModel, validator
from datetime import datetime, timedelta
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ISO15118Protocol(str, Enum):
    """Unterstützte Protokolle"""
    DIN_70121 = "DIN_70121"
    ISO_15118_2 = "ISO_15118_2"
    ISO_15118_20 = "ISO_15118_20"


class EnergyTransferMode(str, Enum):
    """Energie-Transfer-Modi"""
    AC_SINGLE_PHASE = "AC_single_phase"
    AC_THREE_PHASE = "AC_three_phase"
    DC_CORE = "DC_core"
    DC_EXTENDED = "DC_extended"
    DC_COMBO = "DC_combo"
    DC_UNIQUE = "DC_unique"


class AuthMode(str, Enum):
    """Authentifizierungs-Modi"""
    EIM = "EIM"  # External Identification Means (RFID, App, etc.)
    PNC = "PnC"  # Plug & Charge (Certificate-based)


class ChargingSession(BaseModel):
    """ISO 15118 Ladesession"""
    session_id: str
    ev_id: str  # Electric Vehicle ID
    evse_id: str  # Electric Vehicle Supply Equipment ID
    protocol: ISO15118Protocol
    energy_transfer_mode: EnergyTransferMode
    auth_mode: AuthMode
    started_at: datetime
    ended_at: Optional[datetime] = None
    
    # Charging Parameters
    target_soc: float = 80.0  # Target State of Charge (%)
    current_soc: float = 50.0
    battery_capacity: float = 75.0  # kWh
    max_current: float = 32.0  # A
    max_voltage: float = 400.0  # V
    max_power: float = 11.0  # kW
    
    # Smart Charging
    departure_time: Optional[datetime] = None
    energy_demand: float = 20.0  # kWh needed
    
    # Plug & Charge
    contract_id: Optional[str] = None
    certificate_valid: bool = False
    
    @validator('target_soc', 'current_soc')
    def validate_soc(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('SOC must be between 0 and 100')
        return v


class ChargeSchedule(BaseModel):
    """Smart Charging Schedule (ISO 15118-2)"""
    start_time: datetime
    duration: int  # seconds
    power_limit: float  # kW
    price_per_kwh: float = 0.28  # EUR/kWh
    renewable_energy: bool = False


class ChargingProfile(BaseModel):
    """Charging Profile für Smart Charging"""
    profile_id: str
    schedules: List[ChargeSchedule]
    total_energy: float  # kWh
    total_cost: float  # EUR
    co2_emissions: float  # kg CO2
    pv_usage: float = 0.0  # kWh from PV


class V2GMessage(BaseModel):
    """V2G Message (vereinfacht)"""
    message_type: str
    session_id: str
    timestamp: datetime
    payload: Dict


class ISO15118Handler:
    """
    ISO 15118 Communication Handler
    
    Implementiert SECC (Supply Equipment Communication Controller)
    für Smart Charging und Plug & Charge
    """
    
    def __init__(self):
        self.active_sessions: Dict[str, ChargingSession] = {}
        self.charging_profiles: Dict[str, ChargingProfile] = {}
        logger.info("🔌 ISO 15118 Handler initialized")
    
    async def session_setup(
        self,
        ev_id: str,
        evse_id: str,
        protocol: ISO15118Protocol = ISO15118Protocol.ISO_15118_2,
        energy_mode: EnergyTransferMode = EnergyTransferMode.AC_THREE_PHASE,
        auth_mode: AuthMode = AuthMode.EIM
    ) -> ChargingSession:
        """
        Session Setup (ISO 15118-2 Message)
        
        Etabliert V2G-Session zwischen EVCC und SECC
        """
        session_id = f"session_{ev_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        session = ChargingSession(
            session_id=session_id,
            ev_id=ev_id,
            evse_id=evse_id,
            protocol=protocol,
            energy_transfer_mode=energy_mode,
            auth_mode=auth_mode,
            started_at=datetime.now()
        )
        
        self.active_sessions[session_id] = session
        
        logger.info(f"✅ Session established: {session_id}")
        logger.info(f"   EV: {ev_id} | EVSE: {evse_id}")
        logger.info(f"   Protocol: {protocol.value} | Mode: {energy_mode.value}")
        
        return session
    
    async def service_discovery(self, session_id: str) -> Dict:
        """
        Service Discovery (ISO 15118-2)
        
        Gibt verfügbare Ladedienste zurück
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        services = {
            "energy_transfer": {
                "ac_charging": True,
                "dc_charging": False,
                "bidirectional": True,  # V2G support
            },
            "payment": {
                "external_payment": True,  # EIM
                "contract_based": session.auth_mode == AuthMode.PNC,  # Plug & Charge
            },
            "value_added_services": {
                "smart_charging": True,
                "internet_access": False,
                "certificate_update": True,
            }
        }
        
        logger.info(f"📋 Service Discovery for {session_id}")
        return services
    
    async def authorize_payment(self, session_id: str, contract_id: Optional[str] = None) -> bool:
        """
        Payment Authorization (ISO 15118-2)
        
        Authentifiziert EV für Plug & Charge oder EIM
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if session.auth_mode == AuthMode.PNC:
            # Plug & Charge: Zertifikat-basierte Authentifizierung
            if contract_id:
                session.contract_id = contract_id
                session.certificate_valid = True
                logger.info(f"✅ Plug & Charge authorized: Contract {contract_id}")
                return True
            else:
                logger.warning("❌ Plug & Charge failed: No contract ID")
                return False
        else:
            # EIM: Externe Authentifizierung (RFID, App, etc.)
            logger.info(f"✅ EIM authorized for {session_id}")
            return True
    
    async def charge_parameter_discovery(
        self,
        session_id: str,
        battery_capacity: float,
        current_soc: float,
        target_soc: float,
        departure_time: Optional[datetime] = None
    ) -> Dict:
        """
        Charge Parameter Discovery (ISO 15118-2)
        
        Austausch von Batterie- und Ladeparametern
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        session.battery_capacity = battery_capacity
        session.current_soc = current_soc
        session.target_soc = target_soc
        session.departure_time = departure_time or (datetime.now() + timedelta(hours=8))
        
        # Berechne benötigte Energie
        energy_needed = (target_soc - current_soc) / 100 * battery_capacity
        session.energy_demand = energy_needed
        
        # Verfügbare Ladeleistung (EVSE-seitig)
        evse_params = {
            "max_current": 32.0,  # A
            "max_voltage": 400.0,  # V
            "max_power": 11.0,  # kW (AC three-phase)
            "nominal_voltage": 230.0,  # V per phase
        }
        
        logger.info(f"⚡ Charge Parameters for {session_id}")
        logger.info(f"   Battery: {battery_capacity} kWh | SOC: {current_soc}% → {target_soc}%")
        logger.info(f"   Energy needed: {energy_needed:.2f} kWh")
        logger.info(f"   Departure: {session.departure_time}")
        
        return {
            "ev_params": session.dict(),
            "evse_params": evse_params,
            "energy_needed": energy_needed
        }
    
    async def create_smart_charging_profile(
        self,
        session_id: str,
        pv_forecast: List[float],  # kW per hour
        grid_prices: List[float],  # EUR/kWh per hour
        grid_co2: List[float] = None  # kg CO2/kWh per hour
    ) -> ChargingProfile:
        """
        Smart Charging Profile erstellen
        
        Optimiert Ladeplan basierend auf:
        - PV-Überschuss
        - Strompreisen
        - CO2-Emissionen
        - Departure Time
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Berechne Ladezeit bis departure_time
        now = datetime.now()
        time_available = (session.departure_time - now).total_seconds() / 3600  # hours
        
        if time_available <= 0:
            raise ValueError("Departure time already passed")
        
        schedules = []
        total_energy = 0
        total_cost = 0
        total_co2 = 0
        pv_energy = 0
        
        # Erstelle stündliche Schedules
        hours = min(int(time_available), len(pv_forecast), len(grid_prices))
        
        for i in range(hours):
            start_time = now + timedelta(hours=i)
            pv_power = pv_forecast[i] if i < len(pv_forecast) else 0
            grid_price = grid_prices[i] if i < len(grid_prices) else 0.28
            co2_intensity = grid_co2[i] if grid_co2 and i < len(grid_co2) else 0.4
            
            # Intelligente Ladeleistung:
            # 1. Nutze PV-Überschuss maximal
            # 2. Lade bei niedrigen Preisen
            # 3. Vermeide hohe CO2-Zeiten
            
            if total_energy >= session.energy_demand:
                # Ziel erreicht
                break
            
            # Priorität auf PV-Überschuss
            if pv_power > 0:
                power = min(pv_power, session.max_power)
                renewable = True
                pv_energy += power
            else:
                # Grid-Charging: priorisiere günstige Zeiten
                if grid_price < 0.25:  # Günstige Zeiten
                    power = session.max_power
                else:
                    power = session.max_power * 0.5  # Reduzierte Leistung
                renewable = False
            
            energy = power  # kWh (1 Stunde)
            cost = energy * grid_price if not renewable else 0
            co2 = energy * co2_intensity if not renewable else 0
            
            schedule = ChargeSchedule(
                start_time=start_time,
                duration=3600,  # 1 hour
                power_limit=power,
                price_per_kwh=grid_price,
                renewable_energy=renewable
            )
            
            schedules.append(schedule)
            total_energy += energy
            total_cost += cost
            total_co2 += co2
        
        profile = ChargingProfile(
            profile_id=f"profile_{session_id}",
            schedules=schedules,
            total_energy=total_energy,
            total_cost=total_cost,
            co2_emissions=total_co2,
            pv_usage=pv_energy
        )
        
        self.charging_profiles[session_id] = profile
        
        logger.info(f"📊 Smart Charging Profile created for {session_id}")
        logger.info(f"   Total Energy: {total_energy:.2f} kWh")
        logger.info(f"   Total Cost: {total_cost:.2f} EUR")
        logger.info(f"   CO2 Emissions: {total_co2:.2f} kg")
        logger.info(f"   PV Usage: {pv_energy:.2f} kWh ({pv_energy/total_energy*100:.1f}%)")
        
        return profile
    
    async def power_delivery(
        self,
        session_id: str,
        charge_progress: bool = True
    ) -> Dict:
        """
        Power Delivery (ISO 15118-2)
        
        Startet/Stoppt Energieübertragung
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if charge_progress:
            logger.info(f"⚡ Power Delivery START for {session_id}")
            status = "charging"
        else:
            logger.info(f"🛑 Power Delivery STOP for {session_id}")
            status = "idle"
        
        return {
            "session_id": session_id,
            "status": status,
            "power_delivery": charge_progress,
            "timestamp": datetime.now().isoformat()
        }
    
    async def charging_status(
        self,
        session_id: str,
        current_soc: float,
        charging_current: float,
        charging_voltage: float
    ) -> Dict:
        """
        Charging Status (ISO 15118-2)
        
        Gibt aktuellen Ladestatus zurück
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        session.current_soc = current_soc
        
        # Berechne verbleibende Zeit
        energy_remaining = (session.target_soc - current_soc) / 100 * session.battery_capacity
        current_power = (charging_current * charging_voltage) / 1000  # kW
        
        if current_power > 0:
            time_remaining = energy_remaining / current_power  # hours
        else:
            time_remaining = 0
        
        return {
            "session_id": session_id,
            "current_soc": current_soc,
            "target_soc": session.target_soc,
            "charging_current": charging_current,
            "charging_voltage": charging_voltage,
            "charging_power": current_power,
            "energy_remaining": energy_remaining,
            "time_remaining_hours": time_remaining,
            "timestamp": datetime.now().isoformat()
        }
    
    async def session_stop(self, session_id: str) -> Dict:
        """
        Session Stop (ISO 15118-2)
        
        Beendet V2G-Session
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        session.ended_at = datetime.now()
        duration = (session.ended_at - session.started_at).total_seconds() / 3600
        
        logger.info(f"✅ Session stopped: {session_id}")
        logger.info(f"   Duration: {duration:.2f} hours")
        logger.info(f"   Final SOC: {session.current_soc}%")
        
        # Entferne Session aus aktiven Sessions
        del self.active_sessions[session_id]
        
        return {
            "session_id": session_id,
            "duration_hours": duration,
            "final_soc": session.current_soc,
            "timestamp": datetime.now().isoformat()
        }
    
    def get_active_sessions(self) -> List[ChargingSession]:
        """Gibt alle aktiven Sessions zurück"""
        return list(self.active_sessions.values())
    
    def get_charging_profile(self, session_id: str) -> Optional[ChargingProfile]:
        """Gibt Charging Profile für Session zurück"""
        return self.charging_profiles.get(session_id)


# Global Handler Instance
iso15118_handler = ISO15118Handler()
