# Elevator

An elevator simulator: a Python scheduling core plus a Next.js frontend.

## Layout

```
.
├── server/                  Python elevator core
│   ├── main.py              demo entrypoint
│   └── elevator/            the package
│       ├── __init__.py      re-exports Direction, Elevator
│       ├── direction.py     Direction enum (UP / DOWN / IDLE)
│       └── elevator.py      Elevator class: floor maps, request queues
│
└── client/                  Next.js 16 + React 19 + Tailwind v4 (TypeScript)
    ├── app/                 App Router: layout.tsx, page.tsx, globals.css
    └── public/              static assets
```

## Running

Backend (standard library only, no dependencies):

```bash
cd server
python3 main.py
```

Frontend:

```bash
cd client
npm install
npm run dev
```

## Where things go

- New backend behaviour (movement loop, request scheduling) → a module under `server/elevator/`, exported from `__init__.py`.
- An HTTP layer bridging the two → `server/api/`, importing from `server/elevator/`.
- Shared React pieces → `client/components/`; browser-side helpers → `client/lib/`.
