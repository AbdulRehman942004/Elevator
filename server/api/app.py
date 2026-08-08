"""HTTP layer over the elevator core.

Every endpoint answers with the same LiftState object, so the client only ever
has to understand one shape. The browser owns the clock: nothing moves until
something calls POST /api/step, which means the simulation can be paused,
single-stepped or run at whatever speed the UI feels like.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from elevator import Direction, Elevator
from elevator.floors import NUMBER_TO_FLOOR, to_label

from .schemas import CarPress, CodeEntry, HallPress, Landing, LiftState

app = FastAPI(
    title="Elevator",
    description="One lift, eight landings, and the sweep that serves them.",
)

# The Next.js dev server is a different origin, so it needs to be let through.
# 3001 and 3002 are here because Next silently moves up a port when 3000 is
# taken, and a blocked request there looks like the server is down.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):300[0-2]",
    allow_methods=["*"],
    allow_headers=["*"],
)

# One building, one lift. Every browser tab looks at the same car, which is the
# point: open two tabs and you can call it from two landings at once.
lift = Elevator()


def _labels(floors):
    return [to_label(floor) for floor in sorted(floors)]


def _building():
    """The shaft as the client draws it, top floor first."""
    return [
        Landing(
            label=to_label(number),
            number=number,
            has_up=number != Elevator.NO_UP_BUTTON,
            has_down=number != Elevator.NO_DOWN_BUTTON,
            restricted=number in Elevator.FLOOR_CODES,
        )
        for number in sorted(NUMBER_TO_FLOOR, reverse=True)
    ]


def snapshot(notice: str | None = None) -> LiftState:
    return LiftState(
        tick=lift.tick,
        floor=lift.floor,
        floor_number=lift.current_floor,
        direction=lift.direction.name,
        doors=lift.doors.name,
        is_idle=lift.is_idle,
        car_calls=_labels(lift.car_calls),
        up_calls=_labels(lift.up_calls),
        down_calls=_labels(lift.down_calls),
        code_entered=lift.code_entered,
        landings=_building(),
        dwell=lift.door_ticks_left,
        notice=notice,
    )


@app.get("/api/state", response_model=LiftState)
async def read_state():
    """The lift as it stands, without touching it."""
    return snapshot()


@app.post("/api/step", response_model=LiftState)
async def step():
    """Advance one tick: hold the doors, or move one floor."""
    lift.step()
    return snapshot()


@app.post("/api/hall", response_model=LiftState)
async def press_hall(press: HallPress):
    """Press an up or down button out on a landing."""
    try:
        lift.press_hall(press.floor, Direction[press.direction])
    except ValueError as refused:
        return snapshot(notice=str(refused))
    return snapshot(notice=f"Called {press.direction.lower()} from {press.floor}.")


@app.post("/api/car", response_model=LiftState)
async def press_car(press: CarPress):
    """Press a floor button on the panel inside the car."""
    try:
        accepted = lift.select_floor(press.floor)
    except ValueError as refused:
        return snapshot(notice=str(refused))

    if not accepted:
        return snapshot(notice=f"Floor {press.floor} is restricted. Enter its code first.")
    return snapshot(notice=f"Floor {press.floor} selected.")


@app.post("/api/code", response_model=LiftState)
async def enter_code(entry: CodeEntry):
    """Punch a code on the car's keypad, before pressing a restricted floor."""
    lift.enter_code(entry.code)
    return snapshot(notice="Code entered. Now choose the floor.")


@app.post("/api/reset", response_model=LiftState)
async def reset():
    """Put the lift back at the ground floor with nothing pending."""
    global lift
    lift = Elevator()
    return snapshot(notice="Lift reset to G.")
