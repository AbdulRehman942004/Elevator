"""The building's floors, and the integer scale the scheduler runs on."""

FLOOR_TO_NUMBER = {
    "B": -1, "G": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6}

NUMBER_TO_FLOOR = {number: label for label, number in FLOOR_TO_NUMBER.items()}

BASEMENT = FLOOR_TO_NUMBER["B"]
GROUND = FLOOR_TO_NUMBER["G"]
TOP = FLOOR_TO_NUMBER["6"]


def to_number(floor):
    try:
        return FLOOR_TO_NUMBER[floor]
    except KeyError:
        known = ", ".join(FLOOR_TO_NUMBER)
        raise ValueError(f"No such floor: {floor!r}. The building has {known}.") from None


def to_label(number):
    return NUMBER_TO_FLOOR[number]
