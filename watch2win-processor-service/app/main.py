from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pymongo import MongoClient

from app.config import logger, settings
from app.schemas import SearchResponse

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

mongo_client = MongoClient(settings.mongodb_uri)
database = mongo_client[settings.mongo_database]


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Request: %s %s", request.method, request.url.path)
    response = await call_next(request)
    logger.info("Response status: %s", response.status_code)
    return response


def serialize_document(document: Any) -> Any:
    if isinstance(document, list):
        return [serialize_document(item) for item in document]

    if isinstance(document, dict):
        return {key: serialize_document(value) for key, value in document.items()}

    if isinstance(document, ObjectId):
        return str(document)

    if isinstance(document, datetime):
        return document.isoformat()

    return document


def extract_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    if authorization.startswith("Bearer "):
        return authorization[7:]

    if authorization.startswith("JWT "):
        return authorization[4:]

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authorization scheme",
    )


async def verify_token(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    token = extract_token(authorization)

    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as error:
        logger.error("JWT verification failed: %s", error)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )


@app.get("/")
async def root():
    return {"message": "Hello from processor!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/search", response_model=SearchResponse)
async def search_records(
    keyword: str = Query(default="", min_length=0),
    token_data: dict[str, Any] = Depends(verify_token),
):
    logger.info("Search request from user %s for keyword '%s'", token_data.get("_id"), keyword)

    regex_query = {"$regex": keyword, "$options": "i"}
    users_projection = {"firstName": 1, "lastName": 1, "image": 1}
    taxonomy_projection = {"name": 1, "image": 1}

    users = list(database["users"].find({"firstName": regex_query}, users_projection))
    categories = list(
        database["categories"].find({"name": regex_query}, taxonomy_projection)
    )
    athlete = list(database["athletes"].find({"name": regex_query}, taxonomy_projection))

    return {
        "data": {
            "users": serialize_document(users),
            "categories": serialize_document(categories),
            "athlete": serialize_document(athlete),
        }
    }
