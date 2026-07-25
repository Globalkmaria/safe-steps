"use client";

import { useEffect, useState } from "react";
import { CrosswalkScene } from "@/views/game/ui/CrosswalkScene";
import { useCrosswalkGame } from "@/views/game/model/use-crosswalk-game";
import { setMuted } from "@/shared/lib/audio";
import { haptic } from "@/shared/lib/haptics";

const DINO_COLORS = [
  { value: "#62b73a", label: "Green" },
  { value: "#4aa9c9", label: "Blue" },
  { value: "#c96ad0", label: "Purple" },
  { value: "#e2913a", label: "Orange" },
] as const;

const WAIT_SECONDS = 1.8;
const CROSS_SECONDS = 3.4;

const BUBBLE_TEXT = {
  idle: "Let's cross safely! First, find the button.",
  waiting: "Nice press! Now wait for the green light…",
  green: "Green light! It's safe now — tap Walk to cross.",
  crossing: "Here we go — walking safely!",
  success: "Great job! You made a safe choice.",
  oops: "Wait! It's not safe to cross yet.",
} as const;

export function GamePage() {
  const [dinoColor, setDinoColor] = useState<string>(DINO_COLORS[0].value);
  const [soundOn, setSoundOn] = useState(true);

  const game = useCrosswalkGame({
    waitSeconds: WAIT_SECONDS,
    crossSeconds: CROSS_SECONDS,
  });

  useEffect(() => {
    setMuted(!soundOn);
  }, [soundOn]);

  const { phase, isGreen } = game;
  const stepOneDone = phase !== "idle";
  const stepTwoDone = isGreen;

  return (
    <div
      className="min-h-dvh w-full"
      style={{ background: "linear-gradient(#8fd0f5 0%, #b9e4f7 52%, #d8f0e2 100%)" }}
    >
      <div className="mx-auto flex h-dvh w-full max-w-[1024px] items-stretch">
        {/* 좌: 이동 버튼 */}
        <aside className="flex w-1/4 max-w-[300px] shrink-0 flex-col justify-center gap-4 p-3">
          <h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
            Move
          </h2>

          {phase !== "success" && phase !== "crossing" && phase !== "oops" && (
            <button
              type="button"
              onClick={game.walk}
              className="flex min-h-14 items-center justify-center gap-3 rounded-3xl border-4 border-white/90 px-4 py-4 text-2xl font-extrabold text-white transition active:translate-y-1"
              style={{
                background: isGreen
                  ? "linear-gradient(#6fca4a,#4da12c)"
                  : "linear-gradient(#a8bcc9,#8ba0ae)",
                boxShadow: isGreen
                  ? "0 8px 0 #3b7d21, 0 0 28px rgba(110,205,80,.55)"
                  : "0 8px 0 #6c8290",
              }}
            >
              <span aria-hidden className="h-5 w-5 rounded bg-white/90" />
              WALK
            </button>
          )}

          {phase === "oops" && (
            <button
              type="button"
              onClick={game.tryAgain}
              className="min-h-14 rounded-3xl bg-white px-4 py-4 text-xl font-extrabold text-sky-700 shadow-[0_8px_0_rgba(30,60,80,.2)] transition active:translate-y-1"
            >
              Try Again
            </button>
          )}

          {phase === "success" && (
            <button
              type="button"
              onClick={game.reset}
              className="min-h-14 rounded-3xl bg-white px-4 py-4 text-xl font-extrabold text-sky-700 shadow-[0_8px_0_rgba(30,60,80,.2)] transition active:translate-y-1"
            >
              Play Again
            </button>
          )}
        </aside>

        {/* 중앙: 장면 */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <CrosswalkScene
              phase={phase}
              isGreen={isGreen}
              dinoY={game.dinoY}
              instant={game.instant}
              dinoColor={dinoColor}
              crossSeconds={CROSS_SECONDS}
              onPressButton={game.pressButton}
              onWalk={game.walk}
            />
          </div>

          <p
            role="status"
            className="pointer-events-none absolute inset-x-2 bottom-4 rounded-3xl border-4 border-white bg-[#fffdf7]/95 px-5 py-3 text-center text-lg font-bold leading-snug text-slate-700 shadow-[0_8px_0_rgba(30,60,80,.14)]"
          >
            {BUBBLE_TEXT[phase]}
          </p>
        </main>

        {/* 우: 선택 사항 */}
        <aside className="flex w-1/4 max-w-[300px] shrink-0 flex-col justify-center gap-5 p-3">
          <section>
            <h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
              Mission
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              <li className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-lg font-extrabold ${
                    stepOneDone ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  ✓
                </span>
                <span className="text-sm font-bold text-slate-600">
                  Press the button {stepOneDone ? "(done)" : ""}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-lg font-extrabold ${
                    stepTwoDone ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  ✓
                </span>
                <span className="text-sm font-bold text-slate-600">
                  Wait for the green light {stepTwoDone ? "(done)" : ""}
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2
              id="dino-color-label"
              className="px-1 text-sm font-extrabold uppercase tracking-wide text-slate-500"
            >
              Colour
            </h2>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="dino-color-label">
              {DINO_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setDinoColor(c.value);
                    haptic("tap");
                  }}
                  aria-label={c.label}
                  aria-pressed={dinoColor === c.value}
                  className={`h-11 w-11 rounded-2xl border-4 transition ${
                    dinoColor === c.value
                      ? "border-slate-700 scale-105"
                      : "border-white hover:border-slate-300"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="px-1 text-sm font-extrabold uppercase tracking-wide text-slate-500">
              Sound
            </h2>
            <button
              type="button"
              onClick={() => setSoundOn((on) => !on)}
              aria-pressed={soundOn}
              className="mt-2 min-h-11 w-full rounded-2xl border-4 border-white bg-white px-3 py-2 text-base font-extrabold text-slate-600 shadow-[0_5px_0_rgba(30,60,80,.15)] transition active:translate-y-1"
            >
              {soundOn ? "🔊 Sound on" : "🔇 Sound off"}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
