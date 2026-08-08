"use client";

import type { LiftState } from "@/lib/lift";

type Props = {
  state: LiftState;
  running: boolean;
  speed: number;
  onToggleRun: () => void;
  onStepOnce: () => void;
  onReset: () => void;
  onSpeed: (ms: number) => void;
};

const ARROW = { UP: "▲", DOWN: "▼", IDLE: "—" } as const;

export default function StatusBoard({
  state,
  running,
  speed,
  onToggleRun,
  onStepOnce,
  onReset,
  onSpeed,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-3 font-mono">
        <span className="text-4xl leading-none font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
          {state.floor}
        </span>
        <span className="text-2xl text-zinc-400 dark:text-zinc-500">
          {ARROW[state.direction]}
        </span>
        <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
          tick {state.tick}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip
          label={state.doors === "OPEN" ? "doors open" : "doors closed"}
          tone={state.doors === "OPEN" ? "live" : "quiet"}
        />
        <Chip label={state.is_idle ? "idle" : "serving"} tone={state.is_idle ? "quiet" : "live"} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
        <Queue title="In car" floors={state.car_calls} />
        <Queue title="Going up" floors={state.up_calls} />
        <Queue title="Going down" floors={state.down_calls} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <button
          type="button"
          onClick={onToggleRun}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          {running ? "Pause" : "Run"}
        </button>
        <button
          type="button"
          onClick={onStepOnce}
          disabled={running}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Step once
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Reset
        </button>

        <label className="ml-auto flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          speed
          <input
            type="range"
            min={150}
            max={1200}
            step={50}
            // Drag right for faster, so invert the raw value.
            value={1350 - speed}
            onChange={(e) => onSpeed(1350 - Number(e.target.value))}
            className="w-24 accent-emerald-600"
          />
        </label>
      </div>
    </div>
  );
}

function Queue({ title, floors }: { title: string; floors: string[] }) {
  return (
    <div>
      <div className="text-[10px] tracking-widest text-zinc-400 uppercase dark:text-zinc-500">
        {title}
      </div>
      <div className="mt-0.5 font-mono text-sm text-zinc-800 dark:text-zinc-200">
        {floors.length ? floors.join(" ") : "—"}
      </div>
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: "live" | "quiet" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        tone === "live"
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {label}
    </span>
  );
}
