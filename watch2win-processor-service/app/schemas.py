from typing import Any

from pydantic import BaseModel


class SearchPayload(BaseModel):
    users: list[dict[str, Any]]
    categories: list[dict[str, Any]]
    athlete: list[dict[str, Any]]


class SearchResponse(BaseModel):
    data: SearchPayload
