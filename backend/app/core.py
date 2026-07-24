from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Sentinel CTI"
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://cti:cti@db:5432/cti"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    upload_dir: str = "/data/reports"
    max_upload_mb: int = 20
    shodan_api_key: str | None = None
    censys_api_id: str | None = None
    censys_api_secret: str | None = None
    virustotal_api_key: str | None = None
    abuseipdb_api_key: str | None = None
    greynoise_api_key: str | None = None
    misp_url: str | None = None
    misp_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
