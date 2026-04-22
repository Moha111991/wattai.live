# LoopIQ (EnergyFlowHub_EV): AI Agent Coding Instructions

## Big Picture Architecture
- **Modular EMS Platform**: The codebase is structured around a modular Energy Management System (EMS) for EVs, home batteries, PV, and grid integration.
- **Backend** (`backend/`): FastAPI-based, orchestrates device adapters, AI controllers, secure logging, ISO 15118/21434 compliance, and MQTT communication.
- **Device Adapters** (`device_adapters/`): Integrate real-world EVs, wallboxes, and batteries. Each adapter publishes data via MQTT. See `device_adapters/README.md` for supported devices and quickstart.
- **Frontend** (`frontend/`): React + Vite app for real-time monitoring and control.
- **Mobile App** (`mobile-app/`): React Native/Expo for mobile EMS control, onboarding, and live data via WebSocket.
- **Deployment** (`deployment/`): Contains production-ready Nginx and MQTT broker setups with security best practices.

## Critical Developer Workflows
- **Backend Start**: Run FastAPI server from `backend/main.py`. Use `uvicorn backend.main:app --reload` for development.
- **MQTT Broker**: Deploy via Docker Compose (`deployment/mqtt-broker/README.md`). TLS and ACLs enforced.
- **Nginx Reverse Proxy**: See `deployment/nginx/README.md` for HTTPS/TLS setup and security headers.
- **Device Adapter Development**: Add new adapters in `device_adapters/`, following the base class pattern. Test with `paho-mqtt` and real device APIs.
- **AI Controller**: Extend or configure RL agents in `backend/ai_controller.py` and `dqn_agent.py`. Models interact with `rl_environment.py`.
- **Secure Logging & Message Signing**: All audit logs and MQTT messages must use ISO 21434-compliant signing (`backend/secure_logging.py`, `backend/message_signing.py`).

## Project-Specific Conventions
- **Config Management**: Use YAML files in `config/` (default: `config/config.yaml`). Load via `backend/config_service.py`.
- **Realtime State**: Centralized state in `backend/services/state.py`, updated via MQTT and WebSocket.
- **Pydantic Models**: All device and system configs use strict Pydantic models (`backend/models.py`).
- **Metrics & Monitoring**: HTTP requests tracked via custom middleware (`backend/middleware.py`).
- **Edge AI**: In-vehicle inference via TensorFlow Lite/ONNX (`backend/edge_ai.py`).
- **Compliance**: ISO 15118 for V2G, ISO 21434 for security. See respective handler modules.

## Integration Points & Data Flows
- **MQTT**: All device data flows through MQTT topics (`energy/#`). Backend subscribes and updates state.
- **WebSocket**: Frontend/mobile apps receive live updates via WebSocket endpoints in FastAPI.
- **Adapters**: Each device adapter pushes data to MQTT, which is consumed by backend services.
- **AI Agents**: RL agents make decisions based on real-time state, weather, and device data.

## Examples & Patterns
- **Add Device Adapter**: Inherit from `device_adapters/base.py`, implement API calls, publish to MQTT.
- **Audit Logging**: Use `backend/secure_logging.py` for all security-relevant events.
- **Message Signing**: Sign MQTT payloads with `backend/message_signing.py`.
- **Config Access**: Always use `load_config()` from `backend/config_service.py`.

## References
- See `device_adapters/README.md`, `deployment/mqtt-broker/README.md`, and `deployment/nginx/README.md` for integration and deployment details.
- For frontend/mobile, see respective `README.md` files for build and onboarding instructions.

---

*Please review and suggest any missing or unclear sections for further improvement.*
