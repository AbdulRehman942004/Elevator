"use client";

import type { Bearing, LiftState } from "@/lib/lift";

/** Height of one landing in the shaft, in pixels. */
const ROW = 68;

type Props = {
  state: LiftState;
  onHall: (floor: string, direction: Bearing) => void;
};

export default function Shaft({ state, onHall }: Props) {
  const position = state.landings.findIndex((l) => l.number === state.floor_number);
  const open = state.doors === "OPEN";
  const shaftHeight = ROW * state.landings.length;

  return (
    <div className="flex gap-4">
      {/* One row per landing: the floor, and the buttons that floor really has. */}
      <div className="shrink-0">
        {state.landings.map((landing) => {
          const here = landing.number === state.floor_number;
          return (
            <div
              key={landing.label}
              style={{ height: ROW }}
              className="flex items-center justify-end gap-3"
            >
              <div className="text-right">
                <div
                  className={`font-mono text-lg leading-none font-semibold tabular-nums transition-colors ${
                    here
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {landing.label}
                </div>
                {landing.restricted && (
                  <div className="mt-0.5 text-[10px] tracking-wide text-amber-600 dark:text-amber-500">
                    LOCKED
                  </div>
                )}
              </div>

              <div className="flex w-7 flex-col gap-1">
                <HallButton
                  bearing="UP"
                  exists={landing.has_up}
                  lit={state.up_calls.includes(landing.label)}
                  onClick={() => onHall(landing.label, "UP")}
                />
                <HallButton
                  bearing="DOWN"
                  exists={landing.has_down}
                  lit={state.down_calls.includes(landing.label)}
                  onClick={() => onHall(landing.label, "DOWN")}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* The shaft itself, with the car sliding between floors. */}
      <div
        style={{ height: shaftHeight }}
        className="relative w-44 overflow-hidden rounded-xl border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {state.landings.map((landing, i) => (
          <div
            key={landing.label}
            style={{ top: i * ROW }}
            className="absolute inset-x-0 border-b border-dashed border-zinc-300/70 dark:border-zinc-700/70"
          />
        ))}

        <div
          style={{ top: position * ROW + 5, height: ROW - 10 }}
          className="absolute inset-x-2 rounded-lg bg-zinc-800 shadow-lg transition-[top] duration-500 ease-in-out dark:bg-zinc-700"
        >
          {/* Behind the doors: the floor the car is actually at. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
              {state.floor}
            </span>
          </div>

          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <DoorLeaf side="left" open={open} />
            <DoorLeaf side="right" open={open} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DoorLeaf({ side, open }: { side: "left" | "right"; open: boolean }) {
  const slid = side === "left" ? "-translate-x-full" : "translate-x-full";
  return (
    <div
      className={`absolute inset-y-0 w-1/2 bg-zinc-400 transition-transform duration-300 ease-in-out dark:bg-zinc-500 ${
        side === "left" ? "left-0 border-r" : "right-0 border-l"
      } border-zinc-500/60 dark:border-zinc-800/60 ${open ? slid : "translate-x-0"}`}
    />
  );
}

function HallButton({
  bearing,
  exists,
  lit,
  onClick,
}: {
  bearing: Bearing;
  exists: boolean;
  lit: boolean;
  onClick: () => void;
}) {
  // The basement has no down button and the top floor no up button, so keep the
  // slot but leave it empty rather than letting the rows jump around.
  if (!exists) return <div className="h-6" aria-hidden />;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Call lift ${bearing.toLowerCase()}`}
      aria-pressed={lit}
      className={`flex h-6 w-7 items-center justify-center rounded border text-[9px] transition-colors ${
        lit
          ? "border-amber-500 bg-amber-400 text-amber-950 shadow-[0_0_10px] shadow-amber-400/60"
          : "border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      }`}
    >
      {bearing === "UP" ? "▲" : "▼"}
    </button>
  );
}
