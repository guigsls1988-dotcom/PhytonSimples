import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import IOCType, Severity


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=10, max_length=128)


class UserRead(ORMModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class IOCWrite(BaseModel):
    type: IOCType
    value: str = Field(min_length=2, max_length=2048)
    description: str | None = None
    severity: Severity = Severity.medium
    confidence: int = Field(default=50, ge=0, le=100)
    source: str | None = None
    tags: list[str] = Field(default_factory=list)
    first_seen: datetime | None = None
    last_seen: datetime | None = None

    @field_validator("value")
    @classmethod
    def normalize_value(cls, value: str) -> str:
        return value.strip()


class IOCRead(IOCWrite, ORMModel):
    id: uuid.UUID
    risk_score: float
    created_at: datetime
    updated_at: datetime


class CVEWrite(BaseModel):
    cve_id: str = Field(pattern=r"^CVE-\d{4}-\d{4,}$")
    description: str
    cvss_score: float = Field(default=0, ge=0, le=10)
    epss_score: float | None = Field(default=None, ge=0, le=1)
    is_kev: bool = False
    published_at: datetime | None = None


class CVERead(CVEWrite, ORMModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ActorWrite(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    aliases: list[str] = Field(default_factory=list)
    description: str | None = None
    motivation: str | None = None
    sophistication: str | None = None
    country: str | None = None


class ActorRead(ActorWrite, ORMModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TechniqueWrite(BaseModel):
    external_id: str = Field(pattern=r"^T\d{4}(?:\.\d{3})?$")
    name: str
    tactic: str
    description: str | None = None


class TechniqueRead(TechniqueWrite, ORMModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CampaignWrite(BaseModel):
    name: str
    description: str | None = None
    status: str = "active"
    first_seen: date | None = None
    last_seen: date | None = None
    ioc_ids: list[uuid.UUID] = Field(default_factory=list)
    actor_ids: list[uuid.UUID] = Field(default_factory=list)
    technique_ids: list[uuid.UUID] = Field(default_factory=list)


class CampaignRead(ORMModel):
    id: uuid.UUID
    name: str
    description: str | None
    status: str
    first_seen: date | None
    last_seen: date | None
    iocs: list[IOCRead]
    actors: list[ActorRead]
    techniques: list[TechniqueRead]
    created_at: datetime
    updated_at: datetime


class ReportRead(ORMModel):
    id: uuid.UUID
    title: str
    filename: str
    sha256: str
    status: str
    extracted_iocs: list[dict]
    created_at: datetime


class LookupRequest(BaseModel):
    observable: str = Field(min_length=2, max_length=2048)
    providers: list[str] = Field(min_length=1)


class TimelineRead(ORMModel):
    id: uuid.UUID
    event_type: str
    title: str
    entity_type: str
    entity_id: str
    occurred_at: datetime
    details: dict


class RegionalIntelRead(ORMModel):
    id: uuid.UUID
    title: str
    summary: str | None
    source_name: str
    source_url: str
    country_code: str
    country_name: str
    severity: str
    sectors: list[str]
    tags: list[str]
    published_at: datetime
    ingested_at: datetime
