from __future__ import annotations
import asyncio
from datetime import datetime, timezone
from typing import Optional

from backend.adapters.pv_adapter import PVAdapter, MockPVAdapter, PVRealtime

class PVService:
    def __init__(self, adapter: Optional[PVAdapter] = None, poll_interval_s: int = 5):
        self.adapter = adapter or MockPVAdapter()
        self.poll_interval_s = poll_interval_s
        self._task: Optional[asyncio.Task] = None
        self._latest: Optional[PVRealtime] = None
        self._accum_today_kwh: float = 0.0
        self._last_sample_ts: Optional[datetime] = None
        self._current_day: Optional[str] = None

    def _day_key(self, ts: datetime) -> str:
        return ts.astimezone().strftime("%Y-%m-%d")

    def _integrate_power(self, prev_ts: datetime, cur_ts: datetime, power_w: float):
        dt_s = (cur_ts - prev_ts).total_seconds()
        self._accum_today_kwh += (power_w * dt_s) / 3_600_000.0

    async def _loop(self):
        while True:
            try:
                sample = await self.adapter.get_realtime()
                self._latest = sample

                day = self._day_key(sample.timestamp)
                if self._current_day is None or self._current_day != day:
                    self._current_day = day
                    self._accum_today_kwh = 0.0
                    self._last_sample_ts = sample.timestamp

                if sample.today_kwh is None:
                    if self._last_sample_ts is not None:
                        self._integrate_power(self._last_sample_ts, sample.timestamp, sample.power_w)
                    self._last_sample_ts = sample.timestamp

            except Exception:
                pass
            await asyncio.sleep(self.poll_interval_s)

    def start(self):
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._loop())

    async def stop(self):
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    def snapshot(self) -> dict:
        if not self._latest:
            return {
                "power_w": 0.0,
                "power_kw": 0.0,
                "today_kwh": 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        today_kwh = self._latest.today_kwh if self._latest.today_kwh is not None else self._accum_today_kwh
        return {
            "power_w": self._latest.power_w,
            "power_kw": round(self._latest.power_w / 1000.0, 3),
            "today_kwh": round(today_kwh, 3),
            "timestamp": self._latest.timestamp.isoformat()
        }

pv_service = PVService()