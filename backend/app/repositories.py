import uuid
from typing import Generic, TypeVar

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class SQLAlchemyRepository(Generic[ModelT]):
    """Generic repository; application routes never construct SQL directly for CRUD."""

    def __init__(self, session: AsyncSession, model: type[ModelT]):
        self.session = session
        self.model = model

    async def get(self, entity_id: uuid.UUID) -> ModelT | None:
        return await self.session.get(self.model, entity_id)

    async def list(
        self, *, search: str | None = None, offset: int = 0, limit: int = 100
    ) -> list[ModelT]:
        query: Select = select(self.model)
        if search:
            searchable = [
                getattr(self.model, name)
                for name in ("name", "value", "cve_id", "external_id", "title")
                if hasattr(self.model, name)
            ]
            if searchable:
                query = query.where(
                    or_(*(func.lower(column).contains(search.lower()) for column in searchable))
                )
        result = await self.session.scalars(query.offset(offset).limit(limit))
        return list(result.unique())

    async def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: ModelT) -> None:
        await self.session.delete(entity)


class UnitOfWork:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def commit(self) -> None:
        await self.session.commit()

    async def rollback(self) -> None:
        await self.session.rollback()
