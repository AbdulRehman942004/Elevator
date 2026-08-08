/** The one JSON shape the server speaks, and the calls that return it. */

export type Bearing = "UP" | "DOWN";

export type Landing = {
  label: string;
  number: number;
  has_up: boolean;
  has_down: boolean;
  restricted: boolean;
};

export type LiftState = {
  tick: number;
  floor: string;
  floor_number: number;
  direction: Bearing | "IDLE";
  doors: "OPEN" | "CLOSED";
  is_idle: boolean;
  car_calls: string[];
  up_calls: string[];
  down_calls: string[];
  code_entered: boolean;
  landings: Landing[];
  dwell: number;
  notice: string | null;
};

// Uvicorn's default port. Override with NEXT_PUBLIC_API_URL if something else
// on this machine already has 8000.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function call(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<LiftState> {
  const response = await fetch(BASE + path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${method} ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const getState = () => call("/state");
export const step = () => call("/step", "POST");
export const reset = () => call("/reset", "POST");

export const pressHall = (floor: string, direction: Bearing) =>
  call("/hall", "POST", { floor, direction });

export const pressCar = (floor: string) => call("/car", "POST", { floor });

export const enterCode = (code: string) => call("/code", "POST", { code });
