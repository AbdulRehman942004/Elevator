"""The one JSON shape the client renders from, plus the button presses it sends."""

from typing import Literal

from pydantic import BaseModel, Field


class Landing(BaseModel):
    """A floor as it appears in the shaft, and which buttons it really has."""

    label: str
    number: int
    has_up: bool
    has_down: bool
    restricted: bool


class LiftState(BaseModel):
    """Everything the client needs to draw the lift. Every endpoint returns this."""

    tick: int
    floor: str
    floor_number: int
    direction: Literal["UP", "DOWN", "IDLE"]
    doors: Literal["OPEN", "CLOSED"]
    is_idle: bool

    car_calls: list[str] = Field(description="Lit buttons on the panel inside the car.")
    up_calls: list[str] = Field(description="Landings waiting to go up.")
    down_calls: list[str] = Field(description="Landings waiting to go down.")

    code_entered: bool = Field(description="Whether a code is currently held on the keypad.")

    landings: list[Landing] = Field(description="The building, top floor first.")
    dwell: int = Field(description="Ticks the doors will stay open, for animation timing.")

    notice: str | None = Field(
        default=None,
        description="Result of the request that produced this state, e.g. a refused floor.",
    )


class HallPress(BaseModel):
    floor: str
    direction: Literal["UP", "DOWN"]


class CarPress(BaseModel):
    floor: str


class CodeEntry(BaseModel):
    code: str
