"""Walks the car through the situations the office lift has to handle."""

from elevator import Direction, DoorState, Elevator


def choose(car, floor):
    """Press a floor inside the car, saying so when the code check turns it down."""
    if not car.select_floor(floor):
        print(f"  [denied] floor {floor} needs a valid code")


def run(lift, title, board=None, limit=80):
    """Tick until every request is served, reporting each stop on the way."""
    print(f"\n{title}")
    print("-" * len(title))

    for _ in range(limit):
        was_closed = lift.doors is DoorState.CLOSED
        lift.step()

        if was_closed and lift.doors is DoorState.OPEN:
            print(f"  stop at {lift.floor}")
            if board is not None:
                board(lift, lift.floor)

        if lift.is_idle:
            break

    print(f"  parked at {lift.floor}")


def one_passenger_going_up():
    lift = Elevator()
    lift.press_hall("G", Direction.UP)

    def board(car, floor):
        if floor == "G":
            choose(car, "3")

    run(lift, "1) One passenger rides G -> 3", board)


def pickups_along_the_way():
    lift = Elevator()
    lift.press_hall("G", Direction.UP)
    lift.press_hall("1", Direction.UP)
    lift.press_hall("2", Direction.UP)

    def board(car, floor):
        wants = {"G": "3", "1": "6", "2": "3"}
        if floor in wants:
            choose(car, wants[floor])

    run(lift, "2) Collecting 1 and 2 on the way up to 3", board)


def restricted_floors():
    lift = Elevator()
    lift.press_hall("G", Direction.UP)

    def board(car, floor):
        if floor != "G":
            return
        choose(car, "4")                             # no code at all
        car.enter_code("0000")
        choose(car, "5")                             # wrong code
        car.enter_code(Elevator.FLOOR_CODES[5])
        choose(car, "5")                             # accepted
        choose(car, "4")                             # code already spent

    run(lift, "3) Floors 4 and 5 need a code punched first", board)


def down_car_passes_an_up_call():
    lift = Elevator(current_floor="4")
    lift.press_hall("2", Direction.UP)
    lift.press_hall("G", Direction.UP)
    lift.press_hall("B", Direction.UP)

    def board(car, floor):
        wants = {"B": "3", "G": "6", "2": "6"}
        if floor in wants:
            choose(car, wants[floor])

    run(lift, "4a) Car at 4 skips 2, drops to B, then sweeps up B -> G -> 2", board)


def down_car_with_nothing_below():
    lift = Elevator(current_floor="4")
    lift.press_hall("2", Direction.UP)

    def board(car, floor):
        if floor == "2":
            choose(car, "6")

    run(lift, "4b) Same car, but only 2 is waiting, so it turns around there", board)


def up_car_passes_a_down_call():
    lift = Elevator(current_floor="1")
    lift.press_hall("3", Direction.DOWN)
    lift.press_hall("5", Direction.DOWN)
    lift.press_hall("6", Direction.DOWN)

    def board(car, floor):
        wants = {"6": "G", "5": "1", "3": "B"}
        if floor in wants:
            choose(car, wants[floor])

    run(lift, "4c) Mirrored: car at 1 skips 3, climbs to 6, then sweeps down", board)


if __name__ == "__main__":
    one_passenger_going_up()
    pickups_along_the_way()
    restricted_floors()
    down_car_passes_an_up_call()
    down_car_with_nothing_below()
    up_car_passes_a_down_call()
