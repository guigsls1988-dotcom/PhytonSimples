from contextlib import asynccontextmanager
import hmac
import ipaddress
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from app.config import Settings, get_settings
from app.database import Database
from app.tor_sources import NoSourceAvailable, TorSnapshot, TorSourceService


class ExclusionInput(BaseModel):
    ip: str
    reason: str = Field(default="", max_length=300)

    @field_validator("ip")
    @classmethod
    def valid_ip(cls, value: str) -> str:
        try:
            return str(ipaddress.ip_address(value))
        except ValueError as error:
            raise ValueError("Debe ser una dirección IPv4 o IPv6 válida") from error


class ExclusionOutput(BaseModel):
    ip: str
    reason: str
    created: bool


class TorListOutput(BaseModel):
    count: int
    ips: list[str]
    fetched_at: str
    sources_ok: list[str]
    source_errors: dict[str, str]
    stale: bool
    excluded_count: int = 0


def create_app(settings: Settings | None = None) -> FastAPI:
    configured = settings or get_settings()
    database = Database(configured.database_path)
    source_service = TorSourceService(configured)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        database.initialize()
        yield

    app = FastAPI(
        title="Tor IP Aggregator",
        version="1.0.0",
        description="Unifica nodos de salida Tor y aplica una lista de exclusión.",
        lifespan=lifespan,
    )
    app.state.database = database
    app.state.source_service = source_service
    app.state.settings = configured

    @app.middleware("http")
    async def audit_requests(request: Request, call_next):
        api_key = request.headers.get("x-api-key", "")
        client_ip = request.client.host if request.client else ""
        try:
            response = await call_next(request)
        except Exception:
            database.audit(request.method, request.url.path, 500, api_key, client_ip)
            raise
        database.audit(
            request.method, request.url.path, response.status_code, api_key, client_ip
        )
        return response

    def authorize(
        required_role: Literal["reader", "admin"],
        x_api_key: Annotated[str | None, Header()] = None,
    ) -> str:
        if not x_api_key:
            raise HTTPException(status_code=401, detail="Falta el header X-API-Key")
        admin = any(hmac.compare_digest(x_api_key, key) for key in configured.admin_api_keys)
        reader = any(hmac.compare_digest(x_api_key, key) for key in configured.reader_api_keys)
        if required_role == "admin" and not admin:
            raise HTTPException(status_code=403, detail="Se requiere el rol admin")
        if not (admin or reader):
            raise HTTPException(status_code=401, detail="API key inválida")
        return x_api_key

    def reader_key(
        x_api_key: Annotated[str | None, Header()] = None,
    ) -> str:
        return authorize("reader", x_api_key)

    def admin_key(
        x_api_key: Annotated[str | None, Header()] = None,
    ) -> str:
        return authorize("admin", x_api_key)

    def output(snapshot: TorSnapshot, ips: list[str], excluded_count: int = 0) -> TorListOutput:
        return TorListOutput(
            count=len(ips),
            ips=ips,
            fetched_at=snapshot.fetched_at,
            sources_ok=list(snapshot.sources_ok),
            source_errors=snapshot.source_errors,
            stale=snapshot.stale,
            excluded_count=excluded_count,
        )

    @app.exception_handler(NoSourceAvailable)
    async def no_sources(_: Request, error: NoSourceAvailable) -> JSONResponse:
        return JSONResponse(status_code=503, content={"detail": str(error)})

    @app.get("/health", tags=["operación"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/v1/tor-ips", response_model=TorListOutput, tags=["Tor"])
    async def list_all(
        _: Annotated[str, Depends(reader_key)],
        refresh: bool = Query(default=False, description="Ignora la caché"),
    ) -> TorListOutput:
        snapshot = await source_service.get_snapshot(refresh)
        return output(snapshot, list(snapshot.ips))

    @app.post(
        "/v1/exclusions",
        response_model=ExclusionOutput,
        status_code=status.HTTP_201_CREATED,
        tags=["exclusiones"],
    )
    async def add_exclusion(
        body: ExclusionInput,
        response: Response,
        principal: Annotated[str, Depends(admin_key)],
    ) -> ExclusionOutput:
        created = database.add_exclusion(body.ip, body.reason, principal)
        if not created:
            response.status_code = status.HTTP_200_OK
        return ExclusionOutput(ip=body.ip, reason=body.reason, created=created)

    @app.get("/v1/exclusions", tags=["exclusiones"])
    async def list_exclusions(
        _: Annotated[str, Depends(admin_key)],
    ) -> dict[str, object]:
        items = database.list_exclusions()
        return {"count": len(items), "items": items}

    @app.delete("/v1/exclusions/{ip}", status_code=204, tags=["exclusiones"])
    async def delete_exclusion(
        ip: str,
        _: Annotated[str, Depends(admin_key)],
    ) -> Response:
        try:
            canonical = str(ipaddress.ip_address(ip))
        except ValueError as error:
            raise HTTPException(status_code=422, detail="IP inválida") from error
        if not database.remove_exclusion(canonical):
            raise HTTPException(status_code=404, detail="La exclusión no existe")
        return Response(status_code=204)

    @app.get("/v1/tor-ips/filtered", response_model=TorListOutput, tags=["Tor"])
    async def list_filtered(
        _: Annotated[str, Depends(reader_key)],
        refresh: bool = Query(default=False, description="Ignora la caché"),
    ) -> TorListOutput:
        snapshot = await source_service.get_snapshot(refresh)
        excluded = database.excluded_ips()
        filtered = [ip for ip in snapshot.ips if ip not in excluded]
        return output(snapshot, filtered, len(snapshot.ips) - len(filtered))

    return app


app = create_app()
