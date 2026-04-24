FROM python:3.12.13-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.6.7 /uv /uvx /bin/

WORKDIR /usr/src/app

ENV UV_LINK_MODE=copy

COPY pyproject.toml ./
COPY uv.lock* ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-install-project

COPY . .

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --compile-bytecode

RUN apt-get remove -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN useradd -m -d /usr/src/app appuser && chown -R appuser:appuser /usr/src/app

USER appuser

ENV PATH="/usr/src/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
