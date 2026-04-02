from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from zoneinfo import ZoneInfo


@dataclass
class ClockState:
    utc: datetime
    iso_utc: str
    iso_local: str
    date_text: str
    time_text: str
    julian_date: float


def _to_julian_date(dt: datetime) -> float:
    year = dt.year
    month = dt.month
    day = dt.day + (dt.hour + dt.minute / 60 + dt.second / 3600) / 24

    if month <= 2:
        year -= 1
        month += 12

    A = int(year / 100)
    B = 2 - A + int(A / 4)

    jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + B - 1524.5
    return jd


def now_clock_state() -> ClockState:
    utc = datetime.now(timezone.utc)
    local = utc.astimezone(ZoneInfo("America/New_York"))

    jd = _to_julian_date(utc)

    return ClockState(
        utc=utc,
        iso_utc=utc.isoformat(),
        iso_local=local.isoformat(),
        date_text=local.strftime("%Y-%m-%d"),
        time_text=local.strftime("%H:%M:%S"),
        julian_date=jd,
    )
