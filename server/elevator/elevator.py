import heapq

from .direction import Direction

class Elevator:
    FLOOR_TO_NUMBER = {
        "B": -1, "G": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6}

    NUMBER_TO_FLOOR = {
        -1: "B", 0: "G", 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6"
    }

    def __init__(self):
        self.current_floor = 0  # Ground floor
        self.direction = Direction.IDLE

        #for priority queue of requests
        self.up_queue = []
        self.down_queue = []

        #for deduplication of requests
        self.up_queue_set = set()
        self.down_queue_set = set()

    def display_status(self):
        print(f"Current floor: {self.NUMBER_TO_FLOOR[self.current_floor]}, Direction: {self.direction.name}")

        #display the contents of the up and down queues
        print(f"Up queue: {[self.NUMBER_TO_FLOOR[floor] for floor in self.up_queue]}")
        print(f"Up queue set: {[self.NUMBER_TO_FLOOR[floor] for floor in self.up_queue_set]}")
        print(f"Down queue: {[self.NUMBER_TO_FLOOR[-floor] for floor in self.down_queue]}")
        print(f"Down queue set: {[self.NUMBER_TO_FLOOR[-floor] for floor in self.down_queue_set]}")

    def request_elevator(self, floor):
        requested_floor_number = self.FLOOR_TO_NUMBER[floor]

        if(requested_floor_number>self.current_floor):
            if(requested_floor_number not in self.up_queue_set):
                self.up_queue_set.add(requested_floor_number)
                heapq.heappush(self.up_queue, requested_floor_number)
                self.direction = Direction.UP

        elif(requested_floor_number<self.current_floor):
            if(requested_floor_number not in self.down_queue_set):
                self.down_queue_set.add(requested_floor_number)
                #negitive value is pushed to the down queue to maintain max heap property
                heapq.heappush(self.down_queue, -requested_floor_number)
                self.direction = Direction.DOWN

        else:
            print("Elevator is already on the requested floor.")
            self.direction = Direction.IDLE
