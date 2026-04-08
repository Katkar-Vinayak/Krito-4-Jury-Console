# Jury Scoring App

A small web app for hackathon jury scoring with access keys, team search, criteria-based scoring per team, and leaderboard totals. Scores can only be edited with the secret admin key.

## Stack
- Frontend: React (Vite)
- Backend: Node.js (Express)
- Database: Supabase (Postgres)

## Setup

### 1) Create Supabase project
Create a new project in Supabase and open the SQL editor.

Run the schema in [server/supabase.sql](server/supabase.sql).

### 2) Configure server env
Copy the example env file and fill values:

```
cd server
copy .env.example .env
```

Required values:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SECRET` (set to `965233`)
- `ADMIN_JURY_KEY` (optional, treat a jury key as admin)

### 3) Seed 20 jury keys

```
cd server
npm install
npm run seed
```

### 4) Start the server

```
cd server
npm run dev
```

Server runs at `http://localhost:4000`.

### 5) Configure client env

```
cd client
copy .env.example .env
```

Set `VITE_API_BASE` to `http://localhost:4000/api` if you keep defaults.

### 6) Start the client

```
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Usage
- Jury logs in with an access key.
- Teams are searchable and scorable.
- Leaderboard ranks by highest total score across criteria.
- Only admin (secret key) can edit existing scores or create new jury keys.

## Notes
- Teams can be inserted directly in Supabase under the `teams` table.
- Criteria scores are stored per team.
