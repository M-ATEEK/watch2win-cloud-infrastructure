FROM python:3.12.13-slim-bookworm

WORKDIR /usr/src/app

ENV UV_LINK_MODE=copy

RUN pip install --no-cache-dir uv==0.6.7

COPY pyproject.toml ./
RUN uv sync --no-install-project

COPY . .
RUN uv sync --compile-bytecode

ENV PATH="/usr/src/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
