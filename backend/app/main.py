from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.errors import register_error_handlers
from .api.routers.customers import router
from .config import Settings
from .persistence.database import create_database_engine, create_session_factory


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    engine = create_database_engine(settings.database_url)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        try:
            yield
        finally:
            engine.dispose()

    application = FastAPI(title="SaaS-O-Matic", lifespan=lifespan, debug=False)
    application.state.settings = settings
    application.state.engine = engine
    application.state.session_factory = create_session_factory(engine)
    register_error_handlers(application)
    application.include_router(router)
    return application


def wrap_with_cors(api: FastAPI) -> CORSMiddleware:
    """Cover ServerErrorMiddleware responses as well as handled HTTP errors."""
    return CORSMiddleware(
        api, allow_origins=list(api.state.settings.cors_origins),
        allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
        expose_headers=["Location"], allow_credentials=False,
    )


# Override dependencies on api_app; Uvicorn continues to serve app.main:app.
api_app = create_app()
app = wrap_with_cors(api_app)
