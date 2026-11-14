"""Run from the repository root: python backend/init_db.py."""

from app.config import Settings
from app.persistence.database import create_database_engine, initialize_schema


if __name__ == "__main__":
    engine = create_database_engine(Settings.from_env().database_url)
    try:
        initialize_schema(engine)
        print("SQLite: esquema de clientes inicializado.")
    finally:
        engine.dispose()
