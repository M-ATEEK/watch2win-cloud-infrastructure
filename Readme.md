# Watch2Win Infrastructure

This repository contains the root infrastructure for the Watch2Win system:

- `watch2win-auth-service`
- `watch2win-processor-service`
- local development orchestration in `docker-compose.yml`
- production Docker Swarm stack files in `stacks/`
- deployment workflow in `.github/workflows/deploy_swarm_stacks.yaml`

The following app repositories are expected to live alongside this repo as separate nested repositories:

- `watch2win-backend`
- `watch2win-user-panel`
- `watch2win-admin-panel`

## CI/CD Overview

The setup follows the course instructions:

1. Each application repository builds and pushes its Docker image to `ghcr.io`.
2. The root infrastructure repository deploys the Swarm stacks.
3. Docker Swarm runs the services.
4. Portainer is deployed on the Swarm cluster for stack management and inspection.

## GitHub Actions Workflows

### Nested app repositories

Add these workflows in the corresponding repositories:

- `watch2win-backend/.github/workflows/build_backend_docker.yaml`
- `watch2win-user-panel/.github/workflows/build_user_panel_docker.yaml`
- `watch2win-admin-panel/.github/workflows/build_admin_panel_docker.yaml`

These workflows:

- log in to `ghcr.io`
- build the production image
- tag it with the sanitized branch name
- also push `latest` when building the default branch

### Root infrastructure repository

The root repository contains:

- `.github/workflows/build_auth_docker.yaml`
- `.github/workflows/build_processor_docker.yaml`
- `.github/workflows/deploy_swarm_stacks.yaml`

The deploy workflow copies `stacks/`, `monitoring/`, and `deploy/` to the Swarm manager over SSH, then runs `docker stack deploy`.

## Required GitHub Secrets

### In every repository that pushes to GHCR

- `GHCR_PAT`

### In `watch2win-user-panel`

- `REACT_APP_API_URL`
- `REACT_APP_AUTH_URL`
- `REACT_APP_PROCESSOR_URL`
- `REACT_APP_IMG_URL`
- `REACT_APP_FACEBOOK_APP_ID`
- `REACT_APP_GOOGLE_CLIENT_ID`

### In `watch2win-admin-panel`

- `REACT_APP_API_URL`
- `REACT_APP_AUTH_URL`
- `REACT_APP_IMG_URL`
- `REACT_APP_FACEBOOK_APP_ID`
- `REACT_APP_GOOGLE_CLIENT_ID`

### In the root infrastructure repository

- `SWARM_HOST`
- `SWARM_USER`
- `SWARM_SSH_KEY`
- `SWARM_PORT`
- `BASE_DOMAIN`
- `ACME_EMAIL`
- `JWT_SECRET`
- `MONGO_DATABASE`
- `DO_TOKEN`
- `TRAEFIK_USERS`
- `PROMETHEUS_USERS`
- `GRAFANA_ADMIN_PASSWORD`
- `GHCR_PAT`

`TRAEFIK_USERS` and `PROMETHEUS_USERS` should be htpasswd-style values, for example:

```text
admin:$apr1$example$hashedValueHere
```

For Traefik v3 with the DigitalOcean DNS challenge, the stack passes the token through `DO_AUTH_TOKEN_FILE=/run/secrets/do_token`.

The production images are pulled from `ghcr.io/m-ateek/...`. If you deploy manually through the Portainer UI, configure a `ghcr.io` registry in Portainer first with your GitHub username and a PAT that can read packages, otherwise the stack cannot pull the private images.

## Build Triggers

The workflows follow the instructions-folder pattern and can be triggered by commit message tags:

- `[build-backend]`
- `[build-user-panel]`
- `[build-admin-panel]`
- `[build-auth]`
- `[build-processor]`
- `[build-all]`

The deployment workflow can run:

- automatically on push to `main` when `stacks/`, `monitoring/`, or `deploy/` change
- manually with `workflow_dispatch` when you want to select image tags

## Production Dockerfiles

Production images are built from:

- `watch2win-backend/production.Dockerfile`
- `watch2win-user-panel/production.Dockerfile`
- `watch2win-admin-panel/production.Dockerfile`
- `watch2win-auth-service/production.Dockerfile`
- `watch2win-processor-service/production.Dockerfile`

The user and admin panels are built as static React apps and served with nginx.

## Session 5 Style Local Production

Following the `session_5` guide, this repository now also has a local production-oriented path:

- `build_production_images.sh`
- `docker-compose-prod.yml`
- `watch2win-user-panel/nginx-prod.conf`
- `watch2win-user-panel/init-prod.sh`
- `watch2win-admin-panel/nginx-prod.conf`
- `watch2win-admin-panel/init-prod.sh`

This path is useful when you want to test production-mode containers locally before pushing images to GHCR or deploying to Swarm.

Build the local production images:

```bash
./build_production_images.sh
```

Run the local production compose stack:

```bash
docker compose -f docker-compose-prod.yml up -d
```

This differs from the dev stack because:

- the frontends are built once and served by nginx
- there are no source-code bind mounts for the app services
- backend, auth, and processor run their production commands
- the processor is served from its own container instead of the temporary host-run workaround

## Swarm Stack Files

Production deployment is split into these files:

- `stacks/portainer-stack.yml`
- `stacks/traefik-stack.yml`
- `stacks/app-stack.yml`
- `stacks/monitor-stack.yml`

The stack files expect hostnames such as `traefik.<domain>` and `portainer.<domain>` to be available in the environment. The GitHub deploy workflow generates these automatically from `BASE_DOMAIN`. If you deploy manually, populate `deploy/stack.env` first and export it before running `docker stack deploy`.

## Deployment Order

Recommended order on a new Swarm cluster:

1. Initialize Docker Swarm on the manager node.
2. Join worker nodes if you have them.
3. Ensure DNS records exist for:
   - `portainer.<your-domain>`
   - `traefik.<your-domain>`
   - `auth.<your-domain>`
   - `backend.<your-domain>`
   - `processor.<your-domain>`
   - `user.<your-domain>`
   - `admin.<your-domain>`
   - `grafana.<your-domain>`
   - `prometheus.<your-domain>`
4. Run the root deploy workflow.
5. Open Portainer and verify the deployed stacks.

For a manual deployment on the manager, use:

```bash
set -a
. ./deploy/stack.env
set +a

docker stack deploy -c stacks/portainer-stack.yml portainer-stack --with-registry-auth
docker stack deploy -c stacks/traefik-stack.yml traefik-stack --with-registry-auth
docker stack deploy -c stacks/app-stack.yml watch2win --with-registry-auth
docker stack deploy -c stacks/monitor-stack.yml monitor-stack --with-registry-auth
```

If a hostname variable is missing, Traefik labels can render as `Host(\`\`)`, so the workflow now validates rendered stack configs before deploying.

For a manual deployment from the Portainer UI:

1. Add a registry for `ghcr.io` in Portainer with credentials that can read the package images.
2. Use `deploy/.env.example` as the template for the stack environment variables.
3. Set `GHCR_OWNER` to `m-ateek`.
4. Set one shared `JWT_SECRET` value and reuse it for auth, backend, and processor.
5. Deploy `stacks/app-stack.yml` with stack name `watch2win`.

`mongo`, `prometheus`, `loki`, and `grafana` are pinned to the manager node because they use local volumes and should not move between nodes in this Swarm setup.

## Portainer And Swarm Notes

- `portainer-stack.yml` deploys Portainer CE and the Portainer Agent.
- `traefik-stack.yml` deploys Traefik with Let's Encrypt DNS challenge support.
- `app-stack.yml` deploys MongoDB, auth, backend, processor, user panel, and admin panel.
- `monitor-stack.yml` deploys Prometheus, Loki, Promtail, and Grafana.

## Local Development

The existing `docker-compose.yml` remains the local development stack.

For local development:

```bash
docker compose up -d
```

For production deployment, use Docker Swarm and the stack files instead of the local compose file.