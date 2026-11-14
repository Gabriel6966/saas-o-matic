"""Local configuration; relative SQLite paths are anchored to backend/."""

from dataclasses import dataclass
import os
from pathlib import Path
from urllib.parse import urlsplit

BACKEND_DIR = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Settings:
    database_url: str = "sqlite:///data/saas-o-matic.sqlite3"
    cors_origins: tuple[str, ...] = ("http://localhost:4200",)

    def __post_init__(self) -> None:
        for origin in self.cors_origins:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or "*" in origin
                or parsed.path
                or parsed.query
                or parsed.fragment
                or parsed.username
                or parsed.password
            ):
                raise ValueError("CORS_ORIGINS must contain explicit HTTP origins.")

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            database_url=os.getenv("DATABASE_URL", cls.database_url),
            cors_origins=tuple(
                origin.strip()
                for origin in os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",")
                if origin.strip()
            ),
        )
