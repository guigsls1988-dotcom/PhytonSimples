import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.core import get_settings
from app.database import get_session
from app.models import (
    CVE,
    Campaign,
    EnrichmentResult,
    IOC,
    MitreTechnique,
    Report,
    ThreatActor,
    TimelineEvent,
    User,
)
from app.repositories import SQLAlchemyRepository, UnitOfWork
from app.schemas import (
    ActorRead,
    ActorWrite,
    CVERead,
    CVEWrite,
    CampaignRead,
    CampaignWrite,
    IOCRead,
    IOCWrite,
    LookupRequest,
    ReportRead,
    TechniqueRead,
    TechniqueWrite,
    TimelineRead,
    Token,
    UserCreate,
    UserRead,
)
from app.services import (
    EnrichmentService,
    calculate_risk,
    extract_iocs_with_ai,
    hash_file,
    normalize_ioc,
)

router = APIRouter(prefix="/api/v1")
Session = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


async def record_event(
    session: AsyncSession, event_type: str, title: str, entity_type: str, entity_id: uuid.UUID
) -> None:
    session.add(
        TimelineEvent(
            event_type=event_type,
            title=title,
            entity_type=entity_type,
            entity_id=str(entity_id),
        )
    )


async def commit_or_conflict(session: AsyncSession, message: str) -> None:
    try:
        await UnitOfWork(session).commit()
    except IntegrityError:
        await UnitOfWork(session).rollback()
        raise HTTPException(status_code=409, detail=message)


@router.post("/auth/register", response_model=UserRead, status_code=201)
async def register(payload: UserCreate, session: Session) -> User:
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    await SQLAlchemyRepository(session, User).add(user)
    await commit_or_conflict(session, "E-mail já cadastrado")
    return user


@router.post("/auth/login", response_model=Token)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], session: Session
) -> Token:
    user = await session.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return Token(access_token=create_access_token(user))


@router.get("/auth/me", response_model=UserRead)
async def me(user: CurrentUser) -> User:
    return user


@router.get("/iocs", response_model=list[IOCRead])
async def list_iocs(
    session: Session,
    search: str | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[IOC]:
    return await SQLAlchemyRepository(session, IOC).list(
        search=search, offset=offset, limit=limit
    )


@router.post("/iocs", response_model=IOCRead, status_code=201)
async def create_ioc(payload: IOCWrite, session: Session) -> IOC:
    try:
        value = normalize_ioc(payload.type, payload.value)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    data = payload.model_dump()
    data.update(value=value, type=payload.type.value, severity=payload.severity.value)
    ioc = IOC(**data, risk_score=calculate_risk(payload.severity.value, payload.confidence))
    await SQLAlchemyRepository(session, IOC).add(ioc)
    await record_event(session, "ioc.created", f"IOC adicionado: {value}", "ioc", ioc.id)
    await commit_or_conflict(session, "IOC já cadastrado")
    return ioc


@router.get("/iocs/{entity_id}", response_model=IOCRead)
async def get_ioc(entity_id: uuid.UUID, session: Session) -> IOC:
    entity = await SQLAlchemyRepository(session, IOC).get(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="IOC não encontrado")
    return entity


@router.put("/iocs/{entity_id}", response_model=IOCRead)
async def update_ioc(
    entity_id: uuid.UUID, payload: IOCWrite, session: Session
) -> IOC:
    entity = await SQLAlchemyRepository(session, IOC).get(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="IOC não encontrado")
    for key, value in payload.model_dump().items():
        setattr(entity, key, value.value if hasattr(value, "value") else value)
    entity.value = normalize_ioc(payload.type, payload.value)
    entity.risk_score = calculate_risk(payload.severity.value, payload.confidence)
    await record_event(session, "ioc.updated", f"IOC atualizado: {entity.value}", "ioc", entity.id)
    await commit_or_conflict(session, "Valor de IOC já utilizado")
    return entity


@router.delete("/iocs/{entity_id}", status_code=204)
async def delete_ioc(entity_id: uuid.UUID, session: Session) -> None:
    entity = await SQLAlchemyRepository(session, IOC).get(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="IOC não encontrado")
    await SQLAlchemyRepository(session, IOC).delete(entity)
    await session.commit()


@router.get("/cves", response_model=list[CVERead])
async def list_cves(session: Session, search: str | None = None) -> list[CVE]:
    return await SQLAlchemyRepository(session, CVE).list(search=search)


@router.post("/cves", response_model=CVERead, status_code=201)
async def create_cve(payload: CVEWrite, session: Session) -> CVE:
    entity = CVE(**payload.model_dump())
    await SQLAlchemyRepository(session, CVE).add(entity)
    await record_event(session, "cve.created", f"CVE adicionada: {entity.cve_id}", "cve", entity.id)
    await commit_or_conflict(session, "CVE já cadastrada")
    return entity


@router.get("/threat-actors", response_model=list[ActorRead])
async def list_actors(
    session: Session, search: str | None = None
) -> list[ThreatActor]:
    return await SQLAlchemyRepository(session, ThreatActor).list(search=search)


@router.post("/threat-actors", response_model=ActorRead, status_code=201)
async def create_actor(payload: ActorWrite, session: Session) -> ThreatActor:
    entity = ThreatActor(**payload.model_dump())
    await SQLAlchemyRepository(session, ThreatActor).add(entity)
    await record_event(
        session, "actor.created", f"Threat Actor adicionado: {entity.name}", "actor", entity.id
    )
    await commit_or_conflict(session, "Threat Actor já cadastrado")
    return entity


@router.get("/mitre-techniques", response_model=list[TechniqueRead])
async def list_techniques(
    session: Session, search: str | None = None
) -> list[MitreTechnique]:
    return await SQLAlchemyRepository(session, MitreTechnique).list(search=search)


@router.post("/mitre-techniques", response_model=TechniqueRead, status_code=201)
async def create_technique(
    payload: TechniqueWrite, session: Session
) -> MitreTechnique:
    entity = MitreTechnique(**payload.model_dump())
    await SQLAlchemyRepository(session, MitreTechnique).add(entity)
    await record_event(
        session,
        "technique.created",
        f"Técnica MITRE adicionada: {entity.external_id}",
        "technique",
        entity.id,
    )
    await commit_or_conflict(session, "Técnica já cadastrada")
    return entity


@router.get("/campaigns", response_model=list[CampaignRead])
async def list_campaigns(
    session: Session, search: str | None = None
) -> list[Campaign]:
    return await SQLAlchemyRepository(session, Campaign).list(search=search)


@router.post("/campaigns", response_model=CampaignRead, status_code=201)
async def create_campaign(payload: CampaignWrite, session: Session) -> Campaign:
    data = payload.model_dump(exclude={"ioc_ids", "actor_ids", "technique_ids"})
    entity = Campaign(**data)
    if payload.ioc_ids:
        entity.iocs = list(
            (await session.scalars(select(IOC).where(IOC.id.in_(payload.ioc_ids)))).all()
        )
    if payload.actor_ids:
        entity.actors = list(
            (
                await session.scalars(
                    select(ThreatActor).where(ThreatActor.id.in_(payload.actor_ids))
                )
            ).all()
        )
    if payload.technique_ids:
        entity.techniques = list(
            (
                await session.scalars(
                    select(MitreTechnique).where(MitreTechnique.id.in_(payload.technique_ids))
                )
            ).all()
        )
    await SQLAlchemyRepository(session, Campaign).add(entity)
    await record_event(
        session, "campaign.created", f"Campanha adicionada: {entity.name}", "campaign", entity.id
    )
    await commit_or_conflict(session, "Campanha já cadastrada")
    return entity


@router.post("/reports", response_model=ReportRead, status_code=201)
async def upload_report(
    session: Session,
    title: Annotated[str, Form()],
    file: Annotated[UploadFile, File()],
) -> Report:
    settings = get_settings()
    if file.content_type != "application/pdf" or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Apenas relatórios PDF são aceitos")
    directory = Path(settings.upload_dir)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{uuid.uuid4()}.pdf"
    size = 0
    with path.open("wb") as output:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > settings.max_upload_mb * 1024 * 1024:
                path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Relatório excede o limite")
            output.write(chunk)
    try:
        extracted = await extract_iocs_with_ai(path, settings)
    except Exception as exc:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"PDF inválido: {exc}")
    report = Report(
        title=title,
        filename=Path(file.filename).name,
        path=str(path),
        sha256=hash_file(path),
        extracted_iocs=extracted,
    )
    await SQLAlchemyRepository(session, Report).add(report)
    for item in extracted:
        existing = await session.scalar(select(IOC).where(IOC.value == item["value"]))
        if not existing:
            session.add(
                IOC(
                    type=item["type"],
                    value=item["value"],
                    confidence=item["confidence"],
                    source=f"report:{report.id}",
                    severity="medium",
                    risk_score=calculate_risk("medium", item["confidence"]),
                )
            )
    await record_event(
        session, "report.processed", f"Relatório processado: {title}", "report", report.id
    )
    await commit_or_conflict(session, "Este relatório já foi enviado")
    return report


@router.get("/reports", response_model=list[ReportRead])
async def list_reports(session: Session) -> list[Report]:
    return await SQLAlchemyRepository(session, Report).list()


@router.post("/lookups")
async def lookup(payload: LookupRequest, session: Session) -> dict:
    results = await EnrichmentService(get_settings()).lookup(
        payload.observable, payload.providers
    )
    for result in results:
        session.add(
            EnrichmentResult(
                provider=result["provider"],
                observable=payload.observable,
                status=result["status"],
                data=result.get("data", {"error": result.get("error")}),
            )
        )
    await session.commit()
    return {"observable": payload.observable, "results": results}


@router.get("/timeline", response_model=list[TimelineRead])
async def timeline(
    session: Session, limit: int = Query(default=100, ge=1, le=500)
) -> list[TimelineEvent]:
    result = await session.scalars(
        select(TimelineEvent).order_by(TimelineEvent.occurred_at.desc()).limit(limit)
    )
    return list(result)


@router.get("/dashboard")
async def dashboard(session: Session) -> dict:
    counts = {}
    for name, model in (
        ("iocs", IOC),
        ("cves", CVE),
        ("actors", ThreatActor),
        ("campaigns", Campaign),
        ("reports", Report),
    ):
        counts[name] = await session.scalar(select(func.count()).select_from(model))
    severity_rows = (
        await session.execute(select(IOC.severity, func.count()).group_by(IOC.severity))
    ).all()
    type_rows = (await session.execute(select(IOC.type, func.count()).group_by(IOC.type))).all()
    recent = await session.scalars(
        select(TimelineEvent).order_by(TimelineEvent.occurred_at.desc()).limit(8)
    )
    return {
        "counts": counts,
        "severity": {key: value for key, value in severity_rows},
        "ioc_types": {key: value for key, value in type_rows},
        "recent_events": [
            {
                "id": str(item.id),
                "title": item.title,
                "event_type": item.event_type,
                "occurred_at": item.occurred_at,
            }
            for item in recent
        ],
        "generated_at": datetime.now(timezone.utc),
    }
