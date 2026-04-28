# syntax=docker/dockerfile:1

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=10000

WORKDIR /app

COPY backend/requirements.deploy.txt /tmp/requirements.deploy.txt
RUN pip install --no-cache-dir -r /tmp/requirements.deploy.txt

COPY backend/ /app/backend/
COPY config/ /app/config/
RUN mkdir -p /app/data

COPY frontend/public/ /app/frontend/public/
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 10000

CMD ["python", "-m", "backend.run_server"]
