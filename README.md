# Seovate

Autonomous SEO product — implementation of the Seovate wireframe.

## Structure

```
seovate/
├── frontend/   Next.js (App Router) + TypeScript + Tailwind CSS — all UI screens
├── backend/    FastAPI (Python) — API endpoints, mock data, pipeline/audit logic
└── docs/       Product/strategy docs (market research, architecture, roadmap)
```

## Running locally

### Database (Postgres, via Docker)

The frontend's auth (login/signup) and real OAuth integrations (Search Console, Analytics,
Business Profile, GitHub) are stored in Postgres.

```bash
docker compose up -d              # starts Postgres, mapped to localhost:5435
cd frontend
npx prisma migrate deploy         # first run only, or after pulling a schema change
```

### Backend (FastAPI)

```bash
cd backend
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000, backend API at http://localhost:8000.
Copy `frontend/.env.example` to `frontend/.env.local` and fill in the values you need — it
documents every variable, including which ones are optional in development.
Set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` to point at the backend (defaults to `http://localhost:8000`).

To test real Google/GitHub sign-in, fill in `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and
`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` in `frontend/.env.local` — see the comments above each
for where to create them and which redirect URIs to register.
