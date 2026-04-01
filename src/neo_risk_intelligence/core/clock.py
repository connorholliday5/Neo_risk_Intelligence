from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo


DEFAULT_TIMEZONE = "America/New_York"


@dataclass(frozen=True)
class ClockState:
    utc: datetime
    local: datetime
    timezone_name: str
    unix_seconds: float
    julian_date: float
    iso_utc: str
    iso_local: str
    date_text: str
    time_text: str


class SimulationClock:
    def __init__(
        self,
        timezone_name: str = DEFAULT_TIMEZONE,
        *,
        time_scale: float = 1.0,
        start_utc: datetime | None = None,
    ) -> None:
        self.timezone_name = timezone_name
        self.time_scale = float(time_scale)
        self._tz = ZoneInfo(timezone_name)

        if start_utc is None:
            self._anchor_utc = datetime.now(timezone.utc)
        else:
            if start_utc.tzinfo is None:
                raise ValueError("start_utc must be timezone-aware")
            self._anchor_utc = start_utc.astimezone(timezone.utc)

        self._anchor_wall = datetime.now(timezone.utc)

    def now(self) -> ClockState:
        current_wall = datetime.now(timezone.utc)
        elapsed_real = (current_wall - self._anchor_wall).total_seconds()
        simulated_utc = self._anchor_utc + timedelta(seconds=elapsed_real * self.time_scale)
        return build_clock_state(simulated_utc, self.timezone_name)

    def reset(
        self,
        *,
        start_utc: datetime | None = None,
        time_scale: float | None = None,
    ) -> None:
        if time_scale is not None:
            self.time_scale = float(time_scale)

        if start_utc is None:
            self._anchor_utc = datetime.now(timezone.utc)
        else:
            if start_utc.tzinfo is None:
                raise ValueError("start_utc must be timezone-aware")
            self._anchor_utc = start_utc.astimezone(timezone.utc)

        self._anchor_wall = datetime.now(timezone.utc)


def build_clock_state(utc_dt: datetime, timezone_name: str = DEFAULT_TIMEZONE) -> ClockState:
    if utc_dt.tzinfo is None:
        raise ValueError("utc_dt must be timezone-aware")

    utc_dt = utc_dt.astimezone(timezone.utc)
    local_dt = utc_dt.astimezone(ZoneInfo(timezone_name))

    return ClockState(
        utc=utc_dt,
        local=local_dt,
        timezone_name=timezone_name,
        unix_seconds=utc_dt.timestamp(),
        julian_date=to_julian_date(utc_dt),
        iso_utc=utc_dt.isoformat(),
        iso_local=local_dt.isoformat(),
        date_text=local_dt.strftime("%Y-%m-%d"),
        time_text=local_dt.strftime("%H:%M:%S %Z"),
    )


def now_clock_state(timezone_name: str = DEFAULT_TIMEZONE) -> ClockState:
    return build_clock_state(datetime.now(timezone.utc), timezone_name)


def to_julian_date(dt_utc: datetime) -> float:
    if dt_utc.tzinfo is None:
        raise ValueError("dt_utc must be timezone-aware")

    dt_utc = dt_utc.astimezone(timezone.utc)
    year = dt_utc.year
    month = dt_utc.month
    day = dt_utc.day
    hour = dt_utc.hour
    minute = dt_utc.minute
    second = dt_utc.second + (dt_utc.microsecond / 1_000_000)

    if month <= 2:
        year -= 1
        month += 12

    a = year // 100
    b = 2 - a + (a // 4)
    day_fraction = (hour + (minute / 60.0) + (second / 3600.0)) / 24.0

    return (
        int(365.25 * (year + 4716))
        + int(30.6001 * (month + 1))
        + day
        + day_fraction
        + b
        - 1524.5
    )
