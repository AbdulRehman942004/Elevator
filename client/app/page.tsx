"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CarPanel from "@/components/CarPanel";
import Shaft from "@/components/Shaft";
import StatusBoard from "@/components/StatusBoard";
import {
  enterCode,
  getState,
  pressCar,
  pressHall,
  reset,
  step,
  type Bearing,
  type LiftState,
} from "@/lib/lift";

type Notice = { text: string; key: number };

export default function Home() {
  const [state, setState] = useState<LiftState | null>(null);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(600);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [offline, setOffline] = useState<string | null>(null);
  const ticking = useRef(false);

  // Every endpoint answers with the whole state, so each handler ends the same
  // way: swap in what came back, and show whatever the server had to say.
  const apply = useCallback(
    async (action: () => Promise<LiftState>, announce: boolean) => {
      try {
        const next = await action();
        setState(next);
        setOffline(null);
        if (announce && next.notice) setNotice({ text: next.notice, key: Date.now() });
      } catch (failure) {
        setOffline(failure instanceof Error ? failure.message : String(failure));
      }
    },
    [],
  );

  // The browser owns the clock. Skip a beat rather than piling up requests if
  // the server is slower than the interval.
  const tick = useCallback(async () => {
    if (ticking.current) return;
    ticking.current = true;
    try {
      await apply(step, false);
    } finally {
      ticking.current = false;
    }
  }, [apply]);

  // Fetch the lift once on mount, guarded so a slow first response cannot land
  // after the page has gone away.
  useEffect(() => {
    let live = true;
    getState()
      .then((first) => {
        if (!live) return;
        setState(first);
        setOffline(null);
      })
      .catch((failure: unknown) => {
        if (live) setOffline(failure instanceof Error ? failure.message : String(failure));
      });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(tick, speed);
    return () => clearInterval(timer);
  }, [running, speed, tick]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const onHall = (floor: string, bearing: Bearing) =>
    apply(() => pressHall(floor, bearing), true);

  if (!state) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {offline
            ? `Cannot reach the lift controller. Start it with "uvicorn main:app --reload" in server/. (${offline})`
            : "Connecting to the lift controller…"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Office lift
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Call it from a landing, then pick a floor from the panel inside. The car only
          stops for people heading the same way it is already going — press ▲ on 2, G and
          B while it sits up top and watch it run past 2, down to B, then collect all
          three on the way back up.
        </p>
      </header>

      {offline && (
        <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          Lost the server: {offline}
        </div>
      )}

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <Shaft state={state} onHall={onHall} />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <StatusBoard
            state={state}
            running={running}
            speed={speed}
            onToggleRun={() => setRunning((on) => !on)}
            onStepOnce={() => apply(step, false)}
            onReset={() => apply(reset, true)}
            onSpeed={setSpeed}
          />
          <CarPanel
            state={state}
            onSelect={(floor) => apply(() => pressCar(floor), true)}
            onCode={(code) => apply(() => enterCode(code), true)}
          />
        </div>
      </div>

      {notice && (
        <div
          key={notice.key}
          role="status"
          className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-full bg-zinc-900 px-4 py-2 text-sm text-zinc-50 shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
        >
          {notice.text}
        </div>
      )}
    </main>
  );
}
