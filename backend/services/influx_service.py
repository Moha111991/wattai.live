from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime, timezone, timedelta

class InfluxWriter:
    def __init__(self, url: str, token: str, org: str, bucket: str):
        self.client = InfluxDBClient(url=url, token=token, org=org)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        self.query_api = self.client.query_api()
        self.org = org
        self.bucket = bucket
        print(f"[InfluxDB] Verbunden: {url} (Org: {org}, Bucket: {bucket})")

    async def write(self, data: dict):
        """Schreibt Daten in InfluxDB"""
        try:
            ts_raw = data.get("timestamp")
            if ts_raw and isinstance(ts_raw, str):
                dt = datetime.fromisoformat(ts_raw.replace('Z', '+00:00'))
                if dt.tzinfo is None:
                    # Annahme: naive Zeit war lokale Zeit -> in lokale TZ setzen, dann nach UTC
                    local_dt = dt.astimezone()  # interpretiert naive als lokale Zeit
                    dt_utc = local_dt.astimezone(timezone.utc)
                else:
                    dt_utc = dt.astimezone(timezone.utc)
            else:
                dt_utc = datetime.now(timezone.utc)

            # OPTIONAL: wenn Timestamp > Jetzt+2min (Zukunft), auf Jetzt setzen
            now_utc = datetime.now(timezone.utc)
            if dt_utc - now_utc > timedelta(minutes=2):
                print(f"[InfluxDB] Warnung: Zukunfts-Zeit ({dt_utc}) korrigiert auf NOW")
                dt_utc = now_utc

            print(f"[InfluxDB] Schreibe mit UTC-Timestamp: {dt_utc}")
            
            for key, value in data.items():
                if key == "timestamp":
                    continue
                if isinstance(value, (int, float)):
                    point = Point(key).field("value", float(value)).time(dt_utc)
                    self.write_api.write(bucket=self.bucket, org=self.org, record=point)
                    print(f"[InfluxDB] ✓ {key} = {value}")
        except Exception as e:
            print(f"[InfluxDB] Schreibfehler: {e}")
            import traceback; traceback.print_exc()

    def close(self):
        self.client.close()

def create_influx_writer() -> InfluxWriter:
    return InfluxWriter(
        url="http://localhost:8086",
        token="my-super-secret-token",
        org="efh",
        bucket="energy"
    )