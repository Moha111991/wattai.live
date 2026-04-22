"""
Database models and utilities for energy management system
"""
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime

Base = declarative_base()

class SimulationRun(Base):
    """Stores metadata about each simulation run"""
    __tablename__ = 'simulation_runs'
    
    id = Column(Integer, primary_key=True)
    run_name = Column(String(200))
    scenario = Column(String(50))
    control_strategy = Column(String(50))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration_days = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # System configuration
    pv_power = Column(Float)
    battery_capacity = Column(Float)
    ev_capacity = Column(Float)
    ev_charge_power = Column(Float)
    hp_annual_consumption = Column(Float)
    household_annual_consumption = Column(Float)
    
    # Performance metrics
    total_cost = Column(Float)
    total_co2 = Column(Float)
    autarky_degree = Column(Float)
    self_consumption_rate = Column(Float)
    grid_import_total = Column(Float)
    grid_export_total = Column(Float)
    pv_generation_total = Column(Float)
    
    # Additional metadata
    config_json = Column(JSON)
    notes = Column(Text)


class EnergyTimeSeries(Base):
    """Stores time-series energy data for each simulation"""
    __tablename__ = 'energy_timeseries'
    
    id = Column(Integer, primary_key=True)
    simulation_run_id = Column(Integer)
    timestamp = Column(DateTime)
    
    # Generation
    pv_generation = Column(Float)
    
    # Consumption
    household_load = Column(Float)
    ev_charging = Column(Float)
    hp_consumption = Column(Float)
    total_consumption = Column(Float)
    
    # Storage states
    battery_soc = Column(Float)
    battery_charge = Column(Float)
    battery_discharge = Column(Float)
    ev_soc = Column(Float)
    ev_present = Column(Boolean)
    
    # Grid interaction
    grid_import = Column(Float)
    grid_export = Column(Float)
    grid_price = Column(Float)
    
    # V2G and advanced features
    v2g_discharge = Column(Float)
    v2g_active = Column(Boolean)
    
    # Costs and emissions
    cost = Column(Float)
    co2_emissions = Column(Float)
    
    # Weather
    cloud_cover = Column(Float)
    temperature = Column(Float)


class TrainingMetrics(Base):
    """Stores RL agent training metrics"""
    __tablename__ = 'training_metrics'
    
    id = Column(Integer, primary_key=True)
    agent_type = Column(String(50))
    episode = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Training metrics
    episode_reward = Column(Float)
    episode_cost = Column(Float)
    episode_co2 = Column(Float)
    epsilon = Column(Float)
    learning_rate = Column(Float)
    
    # Performance indicators
    avg_reward_100 = Column(Float)
    best_reward = Column(Float)
    
    # Configuration
    config_json = Column(JSON)


class SystemConfiguration(Base):
    """Stores different system configurations for what-if analysis"""
    __tablename__ = 'system_configurations'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Component sizes
    pv_power = Column(Float)
    battery_capacity = Column(Float)
    ev_capacity = Column(Float)
    ev_charge_power = Column(Float)
    hp_power = Column(Float)
    
    # Economic parameters
    grid_price = Column(Float)
    feed_in_tariff = Column(Float)
    
    # Full configuration
    config_json = Column(JSON)
    
    # What-if results
    estimated_cost = Column(Float)
    estimated_autarky = Column(Float)
    estimated_co2 = Column(Float)


class AlertThreshold(Base):
    """Stores alert thresholds for webhook notifications"""
    __tablename__ = 'alert_thresholds'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    metric = Column(String(100))
    threshold_value = Column(Float)
    comparison = Column(String(10))
    webhook_url = Column(String(500))
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_triggered = Column(DateTime)


class RealtimePVData(Base):
    """Stores real-time PV data from inverter/meter via MQTT"""
    __tablename__ = 'realtime_pv_data'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # PV Generation
    power_w = Column(Float)
    yield_today_kwh = Column(Float)
    
    # Metadata
    data_source = Column(String(50))


class RealtimeGridData(Base):
    """Stores real-time grid import/export data via MQTT"""
    __tablename__ = 'realtime_grid_data'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Grid Power Flow
    import_w = Column(Float)
    export_w = Column(Float)
    net_flow_w = Column(Float)
    
    # Metadata
    data_source = Column(String(50))


class InverterStatusLog(Base):
    """Stores inverter status logs for monitoring and diagnostics"""
    __tablename__ = 'inverter_status_log'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Status
    status = Column(String(20))
    temperature = Column(Float)
    efficiency = Column(Float)
    
    # Error codes (if any)
    error_code = Column(String(50))
    error_message = Column(Text)


def get_engine():
    """Create database engine from environment variable"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    engine = create_engine(database_url)
    return engine


def get_session():
    """Create a new database session"""
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()


def init_database():
    """Initialize database schema"""
    engine = get_engine()
    Base.metadata.create_all(engine)
    print("Database initialized successfully")


def save_simulation_run(run_data: dict, timeseries_data: list):
    """
    Save a complete simulation run with time-series data
    
    Args:
        run_data: Dictionary with simulation metadata
        timeseries_data: List of dictionaries with time-series entries
    """
    session = get_session()
    
    try:
        # Create simulation run
        sim_run = SimulationRun(**run_data)
        session.add(sim_run)
        session.flush()
        
        # Add time-series data
        for ts_entry in timeseries_data:
            ts_entry['simulation_run_id'] = sim_run.id
            ts_record = EnergyTimeSeries(**ts_entry)
            session.add(ts_record)
        
        session.commit()
        return sim_run.id
        
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


def get_simulation_runs(limit=50, scenario=None, control_strategy=None):
    """Retrieve simulation runs with optional filtering"""
    session = get_session()
    
    try:
        query = session.query(SimulationRun).order_by(SimulationRun.created_at.desc())
        
        if scenario:
            query = query.filter(SimulationRun.scenario == scenario)
        if control_strategy:
            query = query.filter(SimulationRun.control_strategy == control_strategy)
        
        runs = query.limit(limit).all()
        return runs
        
    finally:
        session.close()


def get_timeseries_data(simulation_run_id):
    """Get all time-series data for a specific simulation run"""
    session = get_session()
    
    try:
        data = session.query(EnergyTimeSeries).filter(
            EnergyTimeSeries.simulation_run_id == simulation_run_id
        ).order_by(EnergyTimeSeries.timestamp).all()
        return data
        
    finally:
        session.close()


def save_training_metrics(metrics_list: list):
    """Save RL training metrics"""
    session = get_session()
    
    try:
        for metrics in metrics_list:
            record = TrainingMetrics(**metrics)
            session.add(record)
        
        session.commit()
        
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


def get_training_history(agent_type=None, limit=1000):
    """Retrieve training history for analysis"""
    session = get_session()
    
    try:
        query = session.query(TrainingMetrics).order_by(TrainingMetrics.episode)
        
        if agent_type:
            query = query.filter(TrainingMetrics.agent_type == agent_type)
        
        history = query.limit(limit).all()
        return history
        
    finally:
        session.close()
