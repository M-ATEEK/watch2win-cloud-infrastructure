import logging
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Watch2Win Search Processor"
    mongodb_uri: str = "mongodb://mongo:27017"
    mongo_database: str = "watch2win"
    jwt_secret: str = "inventally"
    jwt_algorithm: str = "HS256"
    cors_origins: list[str] = [
        "https://user.localhost",
        "https://admin.localhost",
        "https://backend.localhost",
        "https://traefik.localhost",
    ]
    cors_methods: list[str] = ["*"]
    cors_headers: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("watch2win-processor")
