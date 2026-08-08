"""The car: the buttons people press, and the sweep that serves them."""

from .direction import Direction
from .door import DoorState
from .floors import BASEMENT, TOP, to_label, to_number


class Elevator:
    # The bottom landing can only ask to go up, the top one only to go down.
    NO_DOWN_BUTTON = BASEMENT
    NO_UP_BUTTON = TOP

    # Floor 4 is the hostel, floor 5 is executives. Both are reached only by
    # punching the floor's code on the car's keypad before pressing its button.
    FLOOR_CODES = {4: "4004", 5: "5005"}

    # Ticks the doors stay open at a stop, i.e. how long there is to board.
    DOOR_DWELL = 2

    def __init__(self, current_floor="G"):
        self.current_floor = to_number(current_floor)
        self.direction = Direction.IDLE
        self.doors = DoorState.CLOSED
        self.tick = 0

        # Floors picked from the panel inside the car. Whoever is already
        # aboard gets taken where they asked, whichever way the car is going.
        self.car_calls = set()

        # Landing buttons, split by the direction the person waiting asked for.
        # Keeping them apart is the whole trick: a car running down past a
        # floor whose UP button is lit leaves it lit and collects it on the way
        # back, instead of stopping to pick up someone who wants the other way.
        self.up_calls = set()
        self.down_calls = set()

        self._dwell = 0
        self._code = None

    # --- pressing buttons -------------------------------------------------

    def press_hall(self, floor, direction):
        """Press an up or down button out on a landing."""
        number = to_number(floor)

        if direction is Direction.UP:
            if number == self.NO_UP_BUTTON:
                raise ValueError(f"Floor {floor} has no UP button, it is the top floor.")
            self.up_calls.add(number)
        elif direction is Direction.DOWN:
            if number == self.NO_DOWN_BUTTON:
                raise ValueError(f"Floor {floor} has no DOWN button, it is the basement.")
            self.down_calls.add(number)
        else:
            raise ValueError("A landing call has to be Direction.UP or Direction.DOWN.")

    def enter_code(self, code):
        """Punch a code on the car's keypad, before pressing a restricted floor."""
        self._code = code

    def select_floor(self, floor):
        """Press a floor button inside the car. Returns whether it lit up."""
        number = to_number(floor)
        required = self.FLOOR_CODES.get(number)

        if required is not None:
            if self._code != required:
                return False
            self._code = None  # one code buys one selection

        self.car_calls.add(number)
        return True

    # --- running the clock ------------------------------------------------

    def step(self):
        """Advance the simulation by one tick: hold the doors, or move a floor."""
        self.tick += 1

        if self.doors is DoorState.OPEN:
            self._dwell -= 1
            if self._dwell <= 0:
                self.doors = DoorState.CLOSED
            return

        if not self._pending():
            self.direction = Direction.IDLE
            return

        if self.direction is Direction.IDLE:
            self.direction = self._direction_of_nearest_call()

        if self._should_stop():
            self._open_doors()
            return

        if self._calls_beyond(self.direction):
            self.current_floor += self.direction.value
            return

        # Nothing further this way after all; turn around and serve it next tick.
        self.direction = self._reverse(self.direction)

    @property
    def floor(self):
        """The current floor as a label, e.g. "G"."""
        return to_label(self.current_floor)

    @property
    def is_idle(self):
        return not self._pending() and self.doors is DoorState.CLOSED

    @property
    def code_entered(self):
        """Whether a code is being held on the keypad, waiting for a floor."""
        return self._code is not None

    @property
    def door_ticks_left(self):
        """Ticks the doors will stay open, so a UI can time the animation."""
        return max(self._dwell, 0)

    def display_status(self):
        print(
            f"Floor {self.floor} | {self.direction.name} | doors {self.doors.name.lower()}"
        )
        print(f"  car:  {self._labels(self.car_calls)}")
        print(f"  up:   {self._labels(self.up_calls)}")
        print(f"  down: {self._labels(self.down_calls)}")

    # --- deciding where to go ---------------------------------------------

    def _should_stop(self):
        floor = self.current_floor

        if floor in self.car_calls:
            return True
        if self.direction is Direction.UP and floor in self.up_calls:
            return True
        if self.direction is Direction.DOWN and floor in self.down_calls:
            return True

        # A button pointing the other way is only collected once there is
        # nothing left ahead of us. That is what carries a down-running car
        # past a lit UP button, all the way to the lowest floor waiting to go
        # up, before it reverses and picks that whole group up on the way back.
        if not self._calls_beyond(self.direction):
            return floor in self.up_calls or floor in self.down_calls

        return False

    def _open_doors(self):
        floor = self.current_floor

        self.doors = DoorState.OPEN
        self._dwell = self.DOOR_DWELL
        self._code = None  # a new batch of passengers, so a fresh keypad

        self.car_calls.discard(floor)

        if self._calls_beyond(self.direction):
            # Mid-sweep, so only the people heading our way get on. Anyone who
            # pressed the other button stays put and waits for the return trip.
            self._clear_hall_call(self.direction)
        else:
            # End of the sweep: everyone still waiting here boards, and the car
            # commits to the other direction if anything is pending that way.
            self.up_calls.discard(floor)
            self.down_calls.discard(floor)

            back = self._reverse(self.direction)
            self.direction = back if self._calls_beyond(back) else Direction.IDLE

    def _direction_of_nearest_call(self):
        nearest = min(self._pending(), key=lambda f: (abs(f - self.current_floor), -f))

        if nearest > self.current_floor:
            return Direction.UP
        if nearest < self.current_floor:
            return Direction.DOWN

        # Someone is waiting on this very floor; set off the way they asked.
        if self.current_floor in self.down_calls:
            return Direction.DOWN
        return Direction.UP

    def _calls_beyond(self, direction):
        if direction is Direction.UP:
            return any(floor > self.current_floor for floor in self._pending())
        if direction is Direction.DOWN:
            return any(floor < self.current_floor for floor in self._pending())
        return False

    def _clear_hall_call(self, direction):
        if direction is Direction.UP:
            self.up_calls.discard(self.current_floor)
        elif direction is Direction.DOWN:
            self.down_calls.discard(self.current_floor)

    def _pending(self):
        return self.car_calls | self.up_calls | self.down_calls

    @staticmethod
    def _reverse(direction):
        if direction is Direction.UP:
            return Direction.DOWN
        if direction is Direction.DOWN:
            return Direction.UP
        return Direction.IDLE

    @staticmethod
    def _labels(floors):
        return ", ".join(to_label(floor) for floor in sorted(floors)) or "-"
