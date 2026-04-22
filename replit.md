# Overview

This project develops an AI-based Energy Management System (EMS) for optimizing electric vehicle (EV) charging infrastructure integrated with photovoltaic (PV) solar panels, battery storage, and heat pumps. Its core purpose is to intelligently manage energy distribution using reinforcement learning and rule-based control strategies to reduce energy costs, minimize carbon footprint, and enhance energy self-sufficiency.

The system features an interactive Streamlit dashboard for visualizing energy flows, costs, CO2 emissions, and system performance. It supports location-based automatic configuration for 12 German cities, dynamically sizing components based on family size. Smart energy prioritization logic manages charging, discharging, and grid interaction. The system supports AC-coupled and DC-coupled architectures, heating/cooling modes, and "no grid feed-in" island mode, incorporating weather-dependent thermal load calculation. Real-time battery monitoring via MQTT and a FastAPI backend, along with a React Native/Expo mobile application, provide comprehensive remote management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend utilizes **Streamlit** for an interactive web application and **Plotly** for dynamic data visualizations.

## Backend Architecture
### Core Components
The system simulates energy components like PV, battery, EV (with V2G), heat pumps, and household loads via `energy_system.py`. `smart_energy_manager.py` handles intelligent energy distribution. Reinforcement Learning is managed by `rl_environment.py` and `dqn_agent.py`, while `energy_system.py` also provides a rule-based controller. `data_generator.py` creates time-series data. `weather_api.py` integrates optional live weather data. Real-time monitoring uses MQTT and a FastAPI backend.

**Real-Time MQTT Topics (7 topics total):**
- `ems/ev/soc` - EV State of Charge
- `ems/home_battery/soc` - Home Battery State of Charge
- `ems/pv/power` - PV Power Output (W)
- `ems/pv/yield` - PV Daily Yield (kWh)
- `ems/grid/import` - Grid Import Power (W)
- `ems/grid/export` - Grid Export Power (W)
- `ems/inverter/status` - Inverter Status (online/standby, temperature, efficiency)

Data flows through the architecture: **PV Inverter → Edge Gateway (Modbus/SunSpec) → MQTT Broker → FastAPI Backend → Edge-AI Decision Engine**

### Control Flow
Users configure parameters via Streamlit, and the selected agent runs simulations, with results displayed in Streamlit.

### Data Architecture
A **PostgreSQL** database, managed with SQLAlchemy ORM, persists all simulation data, including `simulation_runs`, `energy_timeseries`, `training_metrics`, and `system_configurations`.

**Real-Time In-Memory Storage:** For live monitoring, PV/Grid/Inverter data is stored in thread-safe in-memory dictionaries (`current_pv_data`, `current_grid_data`, `inverter_status_data`) for sub-second latency. Database persistence is optional and does not block real-time operations. This ensures Edge-AI decisions always operate on the latest data even if database is unavailable.

## UI/UX Decisions
The interface prioritizes intuitive interaction with clear visualizations. Features include optimal SOC range highlighting and location/family-size based pre-configurations.

## System Design Choices
The architecture emphasizes modularity and scenario-based simulation.
-   **AC-Coupled vs DC-Coupled Architecture**: Supports both, with DC-coupled recommended for higher efficiency.
-   **Heat Pump / Air Conditioning Modes**: Supports Heating, Cooling, and Auto modes with temperature-dependent performance.
-   **Mobile Application**: A React Native/Expo app provides remote monitoring (live SOC via WebSockets), control (auto/manual modes), history, analytics, push notifications, and production-ready device integration for EVs, wallboxes, and batteries.
-   **ISO 15118 V2G Communication**: Implements standardized V2G communication for smart charging, Plug & Charge (PnC), and V2G protocol support (ISO 15118-2, ISO 15118-20, DIN SPEC 70121). It includes FastAPI endpoints for lifecycle control and EMS integration.
-   **ISO 21434 Automotive Cybersecurity Compliance**: Implements automotive cybersecurity requirements including TARA, secure communication (TLS 1.3, HMAC-SHA256, X.509 PKI), secure device provisioning, tamper-proof audit logging, and compliance with UN R155.
-   **ISO 26262 Functional Safety**: Implements an ASIL-B compliant functional safety layer with real-time safety monitoring (SOC, power, command validation), watchdog & heartbeat, safe state management, and safety event logging. FastAPI endpoints provide control.
-   **Production-Ready HTTPS/TLS**: Utilizes **Nginx Reverse Proxy** for secure production deployment with TLS 1.3, Let's Encrypt, security headers (HSTS, CSP), WebSocket over TLS, OCSP stapling, and rate limiting.
-   **Edge-AI: KI-Modelle im Fahrzeug**: Implements Edge-AI features for autonomous energy decisions directly in vehicle gateways using TensorFlow Lite for local inference. It enables intelligent charging/discharging based on PV surplus, prices, and CO2, with FastAPI integration and ISO 21434 security measures.
-   **PV-Driven Automatic Decision Making**: Real-time PV power data triggers autonomous Edge-AI decisions through MQTT → Backend pipeline. When PV surplus is detected (e.g., 5 kW surplus at midday), the system automatically recommends solar charging with AI confidence scores (typically >99%). The device simulator provides realistic time-dependent PV curves (0 kW at night, up to 10 kW peak at noon) for testing.
-   **Federated Learning & Telemetrie**: Implements GDPR-compliant telemetry for continuous AI improvement through federated learning. This involves anonymized, opt-in data collection, data minimization, monthly federated retraining, and FastAPI endpoints for management.

# External Dependencies

## Python Libraries
*   `numpy`: Numerical computations.
*   `pandas`: Time-series data manipulation.
*   `streamlit`: Interactive web dashboard.
*   `plotly`: Interactive data visualizations.
*   `pvlib`: Solar energy modeling.

## System Integration Points
*   **Energy Pricing**: Configurable grid electricity prices and feed-in tariffs.
*   **Carbon Accounting**: Specified CO2 intensity for grid electricity and PV.
*   **OpenWeatherMap API**: Optional live weather data.
*   **PostgreSQL**: Persistent storage of all simulation data.
*   **MQTT Broker**: For real-time device communication (test.mosquitto.org:1883 for development).
*   **FastAPI**: For backend API and WebSocket server.
*   **PV Inverter Integration**: Supports Modbus RTU/TCP and SunSpec protocol for real-world PV inverter connectivity. Device simulator provides realistic fallback for testing without hardware.