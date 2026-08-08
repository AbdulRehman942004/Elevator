"use client";

import { useState } from "react";

import type { LiftState } from "@/lib/lift";

type Props = {
  state: LiftState;
  onSelect: (floor: string) => void;
  onCode: (code: string) => void;
};

/** The panel inside the car: floor buttons, plus the keypad the locked ones need. */
export default function CarPanel({ state, onSelect, onCode }: Props) {
  const [code, setCode] = useState("");

  const submitCode = () => {
    if (!code.trim()) return;
    onCode(code.trim());
    setCode("");
  };

  return (
    <div className="rounded-xl border border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-3 text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
        Inside the car
      </h2>

      <div className="grid grid-cols-4 gap-2">
        {/* Bottom floor first, the way a real panel reads. */}
        {[...state.landings].reverse().map((landing) => {
          const lit = state.car_calls.includes(landing.label);
          return (
            <button
              key={landing.label}
              type="button"
              onClick={() => onSelect(landing.label)}
              aria-pressed={lit}
              className={`relative aspect-square rounded-full border font-mono text-sm font-semibold transition-colors ${
                lit
                  ? "border-emerald-500 bg-emerald-400 text-emerald-950 shadow-[0_0_12px] shadow-emerald-400/60"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {landing.label}
              {landing.restricted && (
                <span
                  className="absolute top-0.5 right-1 text-[9px] text-amber-500"
                  title="Needs a code"
                >
                  🔒
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <label
          htmlFor="keypad"
          className="mb-1.5 block text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-400"
        >
          Keypad
        </label>
        <div className="flex gap-2">
          <input
            id="keypad"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCode()}
            placeholder="code for 4 or 5"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={submitCode}
            className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
          >
            Enter
          </button>
        </div>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          {state.code_entered
            ? "✓ Code held — now press 4 or 5."
            : "Enter a code before pressing a locked floor."}
        </p>
      </div>
    </div>
  );
}
