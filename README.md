# QuizCrafter (Assessify AI)

An AI-powered quiz generation platform that turns PDF study material into interactive quizzes. Upload a document, let the AI detect topics covered in the file, pick a topic, and take a custom-generated quiz. Scores and history are stored so you can track progress over time.

Link: https://assessify-ai.vercel.app/

## Overview

QuizCrafter is a full-stack web application with a React frontend and an Express API backend. PDFs are stored in Supabase, and quiz generation is powered by Hugging Face (Meta Llama 3). The project is containerized with Docker, orchestrated locally with Docker Compose, and deployable to a local Kubernetes cluster.

### How it works

1. **Upload** — User uploads a PDF study document.
2. **Extract topics** — The backend reads the PDF text and uses AI to list topics actually covered in the document.
3. **Generate quiz** — User selects a topic; AI generates multiple-choice questions from the PDF content.
4. **Track history** — Quiz scores and metrics are saved and shown on a dashboard.

### Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, GSAP |
| Backend | Node.js, Express |
| Database / Storage | Supabase |
| AI | Hugging Face Inference (Meta Llama 3 8B Instruct) |
| DevOps | Docker, Docker Compose, Kubernetes, GitHub Actions |

### Project structure

```
QuizCrafter/
├── frontend/          # React + Vite UI
├── backend/           # Express API, PDF parsing, AI integration
├── docker-compose.yml           # Local dev (frontend + backend)
├── docker-compose.test.yml      # CI test runners
├── backend/backend.yaml         # Kubernetes backend Deployment + Service
├── frontend/frontend.yaml       # Kubernetes frontend Deployment + Service
└── .github/workflows/ci.yml     # CI pipeline with security scans
```

---

## Getting started

### Prerequisites

- Node.js 24+
- Docker & Docker Compose
- Supabase project (URL + keys)
- Hugging Face API key

### Run locally (without Docker)

```bash
# Backend
cd backend
npm install --legacy-peer-deps
npm run dev

# Frontend (separate terminal)
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Run with Docker Compose

```bash
docker compose up --build
```

This starts both services with live-reload volumes mounted for development.

---

## Docker & Docker Compose

### What Docker does in this project

Each service has its own **Dockerfile** that packages the app into a lightweight **Node 24 Alpine** image:

- **`frontend/Dockerfile`** — Installs dependencies, exposes port `5173`, runs `npm run dev`.
- **`backend/Dockerfile`** — Installs dependencies, exposes port `5000`, runs `npm run dev`.

Docker gives you a **consistent runtime** on any machine: same Node version, same dependencies, no “works on my machine” issues.

### What Docker Compose does in this project

Docker Compose runs multiple containers together from a single config file.

| File | Purpose |
|------|---------|
| `docker-compose.yml` | **Local development** — builds and runs frontend + backend together, maps ports, and mounts source code for hot reload. |
| `docker-compose.test.yml` | **CI testing** — spins up test containers that run `npm run test` for both services. Used in GitHub Actions. |

In short: **Docker** builds each app image; **Docker Compose** wires frontend and backend together so you can start the full stack with one command.

---

## Security scan tools

The CI pipeline (`.github/workflows/ci.yml`) runs automated security checks on every push and pull request to `main`. These tools catch issues early before they reach production.

| Tool | What it scans | Why we use it |
|------|---------------|---------------|
| **Trivy** | Filesystem & dependencies | Finds known CVEs in packages and misconfigurations in the repo. |
| **Semgrep** | Source code (SAST) | Detects insecure coding patterns, injection risks, and common bugs in JS/React/Node code. |
| **Gitleaks** | Git history | Prevents API keys, tokens, and secrets from being committed. |
| **OSV Scanner** | Open-source dependencies | Maps `package-lock.json` entries to the OSV database for vulnerability alerts. |
| **Zizmor** | GitHub Actions workflows | Audits CI YAML for insecure workflow patterns (e.g. untrusted inputs, excessive permissions). |

Scan results are uploaded as SARIF where supported, so findings appear in GitHub’s Security tab.

---

## Kubernetes (local cluster)

Kubernetes manifests deploy the app as scalable, self-healing workloads on a **local cluster** (e.g. Minikube, Kind, or Docker Desktop Kubernetes).

### Manifests

| File | Resources |
|------|-----------|
| `backend/backend.yaml` | `Deployment` (2 replicas) + `ClusterIP` Service on port `5000` |
| `frontend/frontend.yaml` | `Deployment` (2 replicas) + `ClusterIP` Service on port `5173` |

Both deployments use locally built images (`quizcrafter-backend:latest`, `quizcrafter-frontend:latest`) with `imagePullPolicy: Never`, which is typical for local clusters where images are built on the same machine.

The backend loads environment variables from a Kubernetes **Secret** named `backend-secret` (Supabase keys, Hugging Face API key, etc.).

### Why Kubernetes here

- **Replicas** — Runs 2 pods per service for basic high availability practice.
- **Declarative config** — Deployments and Services are version-controlled YAML.
- **Secrets management** — Sensitive backend config stays out of images.
- **Local learning** — Same manifests can later be adapted for cloud clusters (GKE, EKS, AKS).

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload PDF to Supabase storage |
| `POST` | `/api/get-topics` | Extract topics from uploaded PDF |
| `POST` | `/api/generate-questions` | Generate quiz for a selected topic |
| `POST` | `/api/save-score` | Save quiz result |
| `GET` | `/api/dashboard-stats` | Fetch user quiz history |

---

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | frontend / backend | Start dev server |
| `npm run build` | frontend | Production build |
| `npm run lint` | frontend | ESLint check |
| `npm run test` | frontend / backend | Run tests (used in CI) |

---

## License

ISC
