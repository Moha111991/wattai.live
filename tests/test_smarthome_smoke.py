from copy import deepcopy

from fastapi.testclient import TestClient

from backend.main import API_KEY, app, app_state


def test_smarthome_ingest_and_devices_smoke() -> None:
    """Smoke test: ingest smart-home payloads and verify `/smarthome/devices` reflects updates."""
    original_devices = deepcopy(app_state.get("smarthome_devices", {}))
    try:
        app_state["smarthome_devices"] = {}

        with TestClient(app) as client:
            headers = {
                "X-API-Key": API_KEY,
                "x-forwarded-proto": "https",
            }

            ingest_payload = [
                {
                    "device_id": "washing_machine",
                    "category": "smarthome",
                    "device_type": "smarthome",
                    "name": "Waschmaschine",
                    "status": "running",
                    "power_w": 742,
                    "flexibility": "hoch",
                    "timestamp": "2026-04-20T10:00:00Z",
                    "source": "smoke_test",
                },
                {
                    "device_id": "light_groups",
                    "category": "smarthome",
                    "device_type": "smarthome",
                    "name": "Lichtgruppen",
                    "status": "on",
                    "power_w": 0,
                    "flexibility": "niedrig",
                    "timestamp": "2026-04-20T10:00:01Z",
                    "source": "smoke_test",
                },
            ]

            ingest_response = client.post("/api/ingest", json=ingest_payload, headers=headers)
            assert ingest_response.status_code == 200

            devices_response = client.get("/smarthome/devices", headers=headers)
            assert devices_response.status_code == 200

            body = devices_response.json()
            assert "devices" in body and isinstance(body["devices"], list)
            assert "summary" in body and isinstance(body["summary"], dict)

            by_id = {d.get("id"): d for d in body["devices"]}

            wm = by_id.get("washing_machine")
            lg = by_id.get("light_groups")

            assert wm is not None
            assert lg is not None

            assert wm["source"] == "smoke_test"
            assert wm["status"] == "aktiv"
            assert wm["power_w"] == 742.0

            assert lg["source"] == "smoke_test"
            assert lg["status"] == "aktiv"

            assert body["summary"]["active_count"] >= 2
            assert body["summary"]["total_power_w"] >= 742.0
    finally:
        app_state["smarthome_devices"] = original_devices


def test_smarthome_ingest_invalid_api_key_smoke() -> None:
    with TestClient(app) as client:
        headers = {
            "X-API-Key": "invalid-key",
            "x-forwarded-proto": "https",
        }
        payload = {
            "device_id": "washing_machine",
            "category": "smarthome",
            "status": "running",
            "power_w": 100,
        }

        response = client.post("/api/ingest", json=payload, headers=headers)
        assert response.status_code == 401


def test_smarthome_ingest_missing_api_key_smoke() -> None:
    with TestClient(app) as client:
        headers = {
            "x-forwarded-proto": "https",
        }
        payload = {
            "device_id": "washing_machine",
            "category": "smarthome",
            "status": "running",
            "power_w": 100,
        }

        response = client.post("/api/ingest", json=payload, headers=headers)
        assert response.status_code == 401
        assert response.json().get("detail") == "Missing API key"
