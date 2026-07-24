import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import JSON, Boolean, Column, Date, DateTime, Float, ForeignKey, String, Table, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class IOCType(str, enum.Enum):
    ipv4 = "ipv4"
    ipv6 = "ipv6"
    domain = "domain"
    url = "url"
    email = "email"
    md5 = "md5"
    sha1 = "sha1"
    sha256 = "sha256"


class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


campaign_iocs = Table(
    "campaign_iocs",
    Base.metadata,
    Column("campaign_id", Uuid, ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True),
    Column("ioc_id", Uuid, ForeignKey("iocs.id", ondelete="CASCADE"), primary_key=True),
)

campaign_actors = Table(
    "campaign_actors",
    Base.metadata,
    Column("campaign_id", Uuid, ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True),
    Column("actor_id", Uuid, ForeignKey("threat_actors.id", ondelete="CASCADE"), primary_key=True),
)

campaign_techniques = Table(
    "campaign_techniques",
    Base.metadata,
    Column("campaign_id", Uuid, ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True),
    Column("technique_id", Uuid, ForeignKey("mitre_techniques.id", ondelete="CASCADE"), primary_key=True),
)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(30), default="analyst")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class IOC(Base, TimestampMixin):
    __tablename__ = "iocs"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(20), index=True)
    value: Mapped[str] = mapped_column(String(2048), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), default=Severity.medium.value, index=True)
    confidence: Mapped[int] = mapped_column(default=50)
    risk_score: Mapped[float] = mapped_column(Float, default=0)
    source: Mapped[str | None] = mapped_column(String(255))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class CVE(Base, TimestampMixin):
    __tablename__ = "cves"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    cve_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    cvss_score: Mapped[float] = mapped_column(Float, default=0)
    epss_score: Mapped[float | None] = mapped_column(Float)
    is_kev: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ThreatActor(Base, TimestampMixin):
    __tablename__ = "threat_actors"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    aliases: Mapped[list[str]] = mapped_column(JSON, default=list)
    description: Mapped[str | None] = mapped_column(Text)
    motivation: Mapped[str | None] = mapped_column(String(160))
    sophistication: Mapped[str | None] = mapped_column(String(80))
    country: Mapped[str | None] = mapped_column(String(80))


class MitreTechnique(Base, TimestampMixin):
    __tablename__ = "mitre_techniques"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    external_id: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(180))
    tactic: Mapped[str] = mapped_column(String(100), index=True)
    description: Mapped[str | None] = mapped_column(Text)


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="active")
    first_seen: Mapped[date | None] = mapped_column(Date)
    last_seen: Mapped[date | None] = mapped_column(Date)
    iocs: Mapped[list[IOC]] = relationship(secondary=campaign_iocs, lazy="selectin")
    actors: Mapped[list[ThreatActor]] = relationship(secondary=campaign_actors, lazy="selectin")
    techniques: Mapped[list[MitreTechnique]] = relationship(
        secondary=campaign_techniques, lazy="selectin"
    )


class Report(Base, TimestampMixin):
    __tablename__ = "reports"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255))
    filename: Mapped[str] = mapped_column(String(255))
    path: Mapped[str] = mapped_column(String(1024))
    sha256: Mapped[str] = mapped_column(String(64), unique=True)
    status: Mapped[str] = mapped_column(String(30), default="processed")
    extracted_iocs: Mapped[list[dict]] = mapped_column(JSON, default=list)


class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    title: Mapped[str] = mapped_column(String(255))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[str] = mapped_column(String(36))
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, index=True
    )
    details: Mapped[dict] = mapped_column(JSON, default=dict)


class EnrichmentResult(Base):
    __tablename__ = "enrichment_results"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(30), index=True)
    observable: Mapped[str] = mapped_column(String(2048), index=True)
    status: Mapped[str] = mapped_column(String(30))
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
