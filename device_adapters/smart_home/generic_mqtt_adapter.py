#!/usr/bin/env python3
"""Generic Smart-Home MQTT adapter template.

Bridges arbitrary IoT MQTT topics into the EMS backend `/api/ingest`
without requiring a dedicated per-vendor adapter.

Typical flow:
  IoT Device / Home Assistant / Zigbee2MQTT
      -> publishes MQTT payload
      -> this adapter subscribes & normalizes
      -> POST /api/ingest (category=smarthome)
      -> EMS exposes live cards via GET /smarthome/devices

Quick start:
  export BACKEND_URL="http://localhost:8000"
  export BACKEND_API_KEY="mein_geheimer_schulkey123"
  export MQTT_HOST="localhost"
  export MQTT_PORT="1883"
  export MQTT_SUBSCRIBE="energy/home/+/+,homeassistant/+/+/state,zigbee2mqtt/+"
  python -m device_adapters.smart_home.generic_mqtt_adapter

Optional mapping for non-standard topics:
  export TOPIC_RULES_JSON='[
    {"pattern": "zigbee2mqtt/waschmaschine", "device_id": "washing_machine", "name": "Waschmaschine", "metric": "power_w"},
    {"pattern": "zigbee2mqtt/lichtgruppe_wohnzimmer", "device_id": "light_groups", "name": "Lichtgruppen", "metric": "status"}
  ]'
"""

from __future__ import annotations

import json
import os
import re
import signal
import sys
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests
import paho.mqtt.client as mqtt


@dataclass
class TopicRule:
    pattern: str
    device_id: Optional[str] = None
    name: Optional[str] = None
    metric: Optional[str] = None
    flexibility: Optional[str] = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_bool(value: Any) -> Optional[bool]:
    v = str(value).strip().lower()
    if v in {"1", "true", "on", "active", "aktiv", "running"}:
        return True
    if v in {"0", "false", "off", "idle", "standby", "inactive"}:
        return False
    return None


def _safe_float(value: Any) -> Optional[float]:
    try:
        return float(value)
    except Exception:
        return None


def _topic_match(pattern: str, topic: str) -> bool:
    escaped = re.escape(pattern)
    escaped = escaped.replace(r"\+", "[^/]+")
    escaped = escaped.replace(r"\#", ".*")
    return re.fullmatch(escaped, topic) is not None


class GenericSmartHomeMQTTAdapter:
    def __init__(self) -> None:
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8000").rstrip("/")
        self.backend_api_key = os.getenv("BACKEND_API_KEY", "")

        self.mqtt_host = os.getenv("MQTT_HOST", "localhost")
        self.mqtt_port = int(os.getenv("MQTT_PORT", "1883"))
        self.mqtt_username = os.getenv("MQTT_USERNAME")
        self.mqtt_password = os.getenv("MQTT_PASSWORD")
        self.keepalive = int(os.getenv("MQTT_KEEPALIVE", "60"))

        subscribe_env = os.getenv("MQTT_SUBSCRIBE", "energy/home/+/+")
        self.subscribe_topics = [t.strip() for t in subscribe_env.split(",") if t.strip()]

        self.default_device_id = os.getenv("DEFAULT_DEVICE_ID", "smarthome_generic")
        self.default_device_name = os.getenv("DEFAULT_DEVICE_NAME", "SmartHome Generic Device")
        self.default_flexibility = os.getenv("DEFAULT_FLEXIBILITY", "mittel")

        self.topic_rules = self._load_topic_rules()

        self.http_timeout = float(os.getenv("BACKEND_TIMEOUT", "6"))
        self.verbose = os.getenv("ADAPTER_VERBOSE", "true").lower() in {"1", "true", "yes"}

        self._stop_event = threading.Event()
        self.client: Optional[mqtt.Client] = None

    def _load_topic_rules(self) -> List[TopicRule]:
        raw = os.getenv("TOPIC_RULES_JSON", "[]")
        try:
            decoded = json.loads(raw)
            if not isinstance(decoded, list):
                return []
            rules: List[TopicRule] = []
            for entry in decoded:
                if not isinstance(entry, dict) or "pattern" not in entry:
                    continue
                rules.append(
                    TopicRule(
                        pattern=str(entry["pattern"]),
                        device_id=entry.get("device_id"),
                        name=entry.get("name"),
                        metric=entry.get("metric"),
                        flexibility=entry.get("flexibility"),
                    )
                )
            return rules
        except Exception:
            print("[smart-home-adapter] WARN: TOPIC_RULES_JSON ungültig, nutze keine Regeln")
            return []

    def _log(self, message: str) -> None:
        if self.verbose:
            print(message)

    def _rule_for_topic(self, topic: str) -> Optional[TopicRule]:
        for rule in self.topic_rules:
            if _topic_match(rule.pattern, topic):
                return rule
        return None

    def _build_ingest_payload(self, topic: str, payload_raw: str) -> Dict[str, Any]:
        parsed: Any
        try:
            parsed = json.loads(payload_raw)
        except Exception:
            parsed = payload_raw

        rule = self._rule_for_topic(topic)

        # Native EMS topic schema: energy/home/<device_id>/<metric>
        parts = topic.split("/")
        metric_from_topic = None
        device_id_from_topic = None
        if len(parts) >= 4 and parts[0] == "energy" and parts[1] == "home":
            device_id_from_topic = parts[2]
            metric_from_topic = parts[3]

        device_id = (
            (rule.device_id if rule else None)
            or (parsed.get("device_id") if isinstance(parsed, dict) else None)
            or device_id_from_topic
            or self.default_device_id
        )
        name = (
            (rule.name if rule else None)
            or (parsed.get("name") if isinstance(parsed, dict) else None)
            or str(device_id).replace("_", " ").title()
        )
        metric = (rule.metric if rule else None) or metric_from_topic

        record: Dict[str, Any] = {
            "device_id": device_id,
            "device_type": "smarthome",
            "category": "smarthome",
            "name": name,
            "topic": topic,
            "timestamp": _now_iso(),
            "source": "generic_mqtt_adapter",
            "raw": parsed if isinstance(parsed, dict) else {"value": parsed},
            "flexibility": (rule.flexibility if rule and rule.flexibility else self.default_flexibility),
        }

        # Merge selected structured fields if payload is JSON
        if isinstance(parsed, dict):
            for k in ("status", "power_w", "flexibility", "type"):
                if k in parsed:
                    record[k] = parsed[k]

        # Metric-driven mapping
        value = parsed.get("value") if isinstance(parsed, dict) and "value" in parsed else parsed

        if metric in {"power", "power_w", "watt"}:
            f = _safe_float(value)
            if f is not None:
                record["power_w"] = f
        elif metric in {"status", "state"}:
            record["status"] = value
        elif metric in {"flex", "flexibility"}:
            record["flexibility"] = value
        else:
            # Best effort for unknown source topics
            as_bool = _parse_bool(value)
            as_float = _safe_float(value)
            if as_bool is not None:
                record["status"] = "aktiv" if as_bool else "standby"
            elif as_float is not None:
                record["power_w"] = as_float

        if "status" not in record and "power_w" in record:
            record["status"] = "aktiv" if float(record["power_w"]) > 0 else "standby"

        if "power_w" not in record:
            record["power_w"] = 0.0

        return record

    def _post_ingest(self, record: Dict[str, Any]) -> None:
        url = f"{self.backend_url}/api/ingest"
        headers = {"Content-Type": "application/json"}
        if self.backend_api_key:
            headers["X-API-Key"] = self.backend_api_key

        resp = requests.post(url, json=record, headers=headers, timeout=self.http_timeout)
        if resp.status_code >= 300:
            raise RuntimeError(f"POST /api/ingest failed: {resp.status_code} {resp.text}")

        self._log(
            f"[smart-home-adapter] OK topic={record.get('topic')} device={record.get('device_id')} "
            f"status={record.get('status')} power_w={record.get('power_w')}"
        )

    def on_connect(self, client: mqtt.Client, userdata: Any, flags: Dict[str, Any], rc: int, properties: Any = None) -> None:
        if rc != 0:
            print(f"[smart-home-adapter] MQTT connect failed rc={rc}")
            return
        print(f"[smart-home-adapter] MQTT connected {self.mqtt_host}:{self.mqtt_port}")
        for topic in self.subscribe_topics:
            client.subscribe(topic)
            print(f"[smart-home-adapter] subscribed: {topic}")

    def on_message(self, client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
        try:
            topic = str(msg.topic)
            payload_raw = msg.payload.decode("utf-8", errors="ignore")
            record = self._build_ingest_payload(topic, payload_raw)
            self._post_ingest(record)
        except Exception as exc:
            print(f"[smart-home-adapter] ERROR processing message: {exc}")

    def start(self) -> None:
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

        if self.mqtt_username and self.mqtt_password:
            self.client.username_pw_set(self.mqtt_username, self.mqtt_password)

        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        self.client.connect(self.mqtt_host, self.mqtt_port, self.keepalive)
        self.client.loop_start()

        print("[smart-home-adapter] running – press Ctrl+C to stop")
        self._stop_event.wait()

    def stop(self) -> None:
        self._stop_event.set()
        if self.client:
            try:
                self.client.loop_stop()
                self.client.disconnect()
            except Exception:
                pass
        print("[smart-home-adapter] stopped")


def main() -> int:
    adapter = GenericSmartHomeMQTTAdapter()

    def _handle_signal(signum: int, frame: Any) -> None:
        adapter.stop()

    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    try:
        adapter.start()
        return 0
    except KeyboardInterrupt:
        adapter.stop()
        return 0
    except Exception as exc:
        print(f"[smart-home-adapter] FATAL: {exc}")
        adapter.stop()
        return 1


if __name__ == "__main__":
    sys.exit(main())
