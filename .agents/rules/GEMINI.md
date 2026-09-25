---
trigger: always_on
---

# Project Rules & Team Conventions

## Tech Stack
- **Frontend**: React (Vite) + TypeScript
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **API Base URL**: `http://localhost:8000`

## Architecture & Conventions
- Frontend lives in [`frontend/`](file:///c:/Users/Lenovo/Desktop/HACKGENIX/frontend)
- Backend lives in [`backend/`](file:///c:/Users/Lenovo/Desktop/HACKGENIX/backend)
- Always use TypeScript for frontend components and strict typing (Pydantic models) for backend endpoints.
- REST API standard response shape:
  ```json
  {
    "data": null,
    "error": null
  }
  ```

## Team Domain Ownership
- **Person 1 (Frontend Lead)**: Routing, Layout, Design System (`frontend/src/`)
- **Person 2 (Frontend Dev)**: Pages & Features (`frontend/src/pages/`, `frontend/src/components/`)
- **Person 3 (Backend Lead)**: Architecture, Auth, Database Models (`backend/models/`, `backend/core/`)
- **Person 4 (Backend Dev)**: API Routes & CRUD Endpoints (`backend/routes/`)
- **Person 5 (AI / Logic)**: Business logic, external services & integrations (`backend/services/`)
- **Person 6 (DevOps & Integration)**: Environment setup, CORS, Docker, CI/CD (`root`, `backend/main.py`)

## Git & Workflow Guidelines
- Create short-lived feature branches (`feat/<feature-name>`).
- Pull with rebase before pushing: `git pull origin main --rebase`.
- Commit working checkpoints before triggering long-running agent tasks.
