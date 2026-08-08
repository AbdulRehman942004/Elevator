# Elevator

An elevator simulator: a Python scheduling core plus a Next.js frontend.

## Layout

```
.
├── server/                  Python elevator core
│   ├── main.py              server entrypoint: uvicorn main:app --reload
│   ├── demo.py              walks the car through each scenario, no server
│   ├── api/                 the HTTP layer
│   │   ├── app.py           the FastAPI application
│   │   └── schemas.py       the one LiftState shape, and the presses
│   └── elevator/            the package
│       ├── __init__.py      re-exports the public names
│       ├── direction.py     Direction enum (UP / DOWN / IDLE)
│       ├── door.py          DoorState enum (OPEN / CLOSED)
│       ├── floors.py        floor labels B, G, 1-6 and the integer scale
│       └── elevator.py      the car: buttons, access codes, the LOOK sweep
│
└── client/                  Next.js 16 + React 19 + Tailwind v4 (TypeScript)
    ├── app/                 App Router: layout.tsx, page.tsx, globals.css
    └── public/              static assets
```

## Running

Two processes. API first:

```bash
cd server
source venv/bin/activate
uvicorn main:app --reload
```

Then the UI, which expects the API on port 8000 (override with
`NEXT_PUBLIC_API_URL`):

```bash
cd client
npm install
npm run dev            # http://localhost:3000
```

The scheduling core has no dependencies, so it also runs on its own. This walks
the car through every scenario and prints where it stops:

```bash
cd server
python3 demo.py
```

## The API

Every endpoint answers with the same `LiftState` object — floor, direction,
doors, the three sets of lit buttons, and the building's layout — so the client
only ever parses one shape. Interactive docs at `/docs`.

| Method | Path         | Does                                            |
| ------ | ------------ | ----------------------------------------------- |
| GET    | `/api/state` | the lift as it stands, without touching it      |
| POST   | `/api/step`  | advance one tick                                |
| POST   | `/api/hall`  | press a landing button `{floor, direction}`     |
| POST   | `/api/car`   | press a floor inside the car `{floor}`          |
| POST   | `/api/code`  | punch a keypad code `{code}`                    |
| POST   | `/api/reset` | park the car back at G with nothing pending     |

The browser owns the clock: nothing moves until something calls `/api/step`, so
the UI can run, pause and single-step the simulation. A refused press (a locked
floor, a button that landing does not have) still returns 200 with the whole
state — the reason arrives in `notice`, so the single-shape contract holds.

## How the car decides

The building has B, G and 1-6. The basement has only an UP button and the top
floor only a DOWN one; every landing in between has both.

Requests are held in three sets: `car_calls` (buttons pressed inside the car)
and `up_calls` / `down_calls` (landing buttons, kept apart by the direction the
person waiting asked for). While the car is running one way it stops only for
its own car calls and for landing calls pointing the same way. A lit button
pointing the other way is passed by and left lit until the car has nothing
further ahead, at which point it turns around and collects it.

So a car at 4 with UP pressed at 2, G and B does not stop at 2 on the way down.
It runs to B, reverses, and picks that whole group up going back: B, G, 2. If
only 2 were waiting, it would come down to 2 and turn around there.

Floors 4 and 5 are restricted (`Elevator.FLOOR_CODES`). The code is punched on
the car's keypad before the floor button is pressed; it buys one selection and
is cleared whenever the doors open for a new batch of passengers.

`step()` advances one tick, so the caller owns the clock:

```python
lift = Elevator()
lift.press_hall("G", Direction.UP)
while not lift.is_idle:
    lift.step()
    if lift.doors is DoorState.OPEN and lift.floor == "G":
        lift.select_floor("3")
```

## Where things go

- New backend behaviour (movement loop, request scheduling) → a module under `server/elevator/`, exported from `__init__.py`.
- An HTTP layer bridging the two → `server/api/`, importing from `server/elevator/`.
- Shared React pieces → `client/components/`; browser-side helpers → `client/lib/`.
