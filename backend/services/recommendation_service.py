from datetime import datetime, timezone

def generate_recommendation(state: dict) -> dict:
    pv = state.get("pv_power_w", 0)
    load = state.get("house_load_w", 0)
    batt_soc = state.get("battery_soc", 0)
    batt_power = state.get("battery_power_kw", 0)
    ev_soc = state.get("ev_soc", 0)
    ev_charging = state.get("ev_charging", False)
    grid_import = state.get("grid_import_w", 0)
    grid_export = state.get("grid_export_w", 0)

    surplus = pv - load
    actions = []
    notes = []

    if pv > 400 and surplus > 200:
        notes.append("PV-Überschuss")
    if pv < 300:
        notes.append("Geringe PV")

    if surplus > 800 and batt_soc < 90:
        actions.append("Batterie laden (Überschuss)")
    if batt_soc > 70 and surplus < 0 and grid_import > 300:
        actions.append("Batterie entladen zur Netzreduktion")
    if batt_soc < 20:
        notes.append("Batterie niedrig")

    if surplus > 1500 and ev_soc < 80 and not ev_charging:
        actions.append("EV laden (PV-Überschuss)")
    if ev_soc >= 90 and ev_charging:
        actions.append("EV-Ladung stoppen")

    if grid_export > 1000 and batt_soc < 95:
        actions.append("Überschuss zuerst für Batterie/EV nutzen")

    if not actions:
        actions.append("Keine Aktion erforderlich")

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "pv_w": pv,
            "load_w": load,
            "battery_soc": batt_soc,
            "ev_soc": ev_soc,
            "surplus_w": surplus
        },
        "actions": actions,
        "notes": notes
    }