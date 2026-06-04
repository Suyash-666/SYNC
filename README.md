# SYNC — Academic OS

SYNC is a study-focused productivity web app combining coursework, notes, realtime study rooms, and AI-powered assistance.

## Tech stack
- Frontend: React, Tailwind CSS, React Query, Redux Toolkit, Socket.IO client
- Backend: Node.js, Express, Prisma (Postgres), Socket.IO, JWT auth
- Realtime: Socket.IO
- Storage: Supabase (optional)

## Local development
1. Copy environment files:

```bash
cp .env.example.backend .env
cp .env.example.frontend .env
```

2. Start services (Postgres + Redis + Backend):

```bash
docker-compose up -d
```

3. Install dependencies and run frontend dev server:

```bash
cd frontend/design-system
npm install
npm run dev
```

4. Start backend:

```bash
cd backend
npm install
npm run dev
```

5. Open `http://localhost:5173` for frontend (Vite dev) and `http://localhost:5000` for backend.

## Environment variables
See `.env.example.backend` and `.env.example.frontend` for required variables.

## Folder structure
- `frontend/design-system` — React app and shared component library
- `backend` — Express API, Prisma schema, services, controllers

## Deployment
See `DEPLOYMENT.md` for step-by-step deployment instructions.
# SYNC
# SYNC
