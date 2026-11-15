"""One engine, a session per request, and explicit schema initialization."""

from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from ..config import BACKEND_DIR
from .models import Base


def create_database_engine(database_url: str) -> Engine:
    url = make_url(database_url)
    if url.drivername not in {"sqlite", "sqlite+pysqlite"} or url.query:
        raise ValueError("Only local SQLite URLs without query options are supported.")
    in_memory = url.database in {None, "", ":memory:"}
    if not in_memory:
        path = Path(url.database)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        url = url.set(database=str(path.resolve()))
    engine = create_engine(
        url,
        connect_args={"check_same_thread": False, "autocommit": False},
        hide_parameters=True,
        **({"poolclass": StaticPool} if in_memory else {}),
    )

    @event.listens_for(engine, "connect")
    def configure_connection(connection, _record):
        previous = connection.autocommit
        connection.autocommit = True
        try:
            cursor = connection.cursor()
            try:
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute("PRAGMA foreign_keys")
                if cursor.fetchone()[0] != 1:
                    raise RuntimeError("SQLite foreign keys could not be enabled.")
            finally:
                cursor.close()
            connection.create_function(
                "unicode_casefold", 1,
                lambda value: value.casefold() if value is not None else None,
                deterministic=True,
            )
        finally:
            connection.autocommit = previous

    return engine


def create_session_factory(engine: Engine):
    return sessionmaker(bind=engine, expire_on_commit=False, autoflush=False)


def initialize_schema(engine: Engine) -> None:
    """Called explicitly by the CLI/tests, never by a request or app startup."""
    if engine.url.database not in {None, "", ":memory:"}:
        Path(engine.url.database).parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)
