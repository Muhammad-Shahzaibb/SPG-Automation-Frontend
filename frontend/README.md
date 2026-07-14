# Binaof Extractor — Frontend

Next.js 15 frontend for the **Paper Specification Extractor** API (FastAPI).

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

### Environment

| Variable | Default |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` |

Ensure the FastAPI backend is running at `http://localhost:8000` and CORS allows the frontend origin.

## Features (API-backed only)

| Page | APIs used |
|------|-----------|
| Login | `POST /auth/login`, refresh rotation on 401 |
| Dashboard (user) | `GET /dashboard/user` |
| Dashboard (admin) | `GET /dashboard/admin` |
| Extract Documents | `POST /extract/parse`, `POST /extract/excel` |
| User Management | `GET/POST/PATCH/DELETE /users`, activate, deactivate, reset-password |

## Auth

Stores `access_token` + `refresh_token`. On `401`, automatically calls `POST /auth/refresh` and retries the request. Logout sends the refresh token.

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```
