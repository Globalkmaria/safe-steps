"use client";

import { CrosswalkScene } from "@/views/game/ui/CrosswalkScene";
import { useCrosswalkGame } from "@/views/game/model/use-crosswalk-game";

/** 캐릭터 몸 색. 선택 UI 가 사라져 지금은 고정값이다. */
const DINO_COLOR = "#62b73a";

/**
 * 버튼을 누르고 초록불까지의 시간. 신호 전환이 "바로" 느껴지도록 짧게 잡되 0 은 아니다 —
 * 색이 즉시 튀면 고장처럼 보이고, 이 구간의 깜빡임이 곧 "기다리는 중" 이라는 신호다.
 */
const WAIT_SECONDS = 0.6;
const CROSS_SECONDS = 3.4;

const BUBBLE_TEXT = {
  idle: "Let's cross safely! Wait for the green light.",
  waiting: "The light is changing…",
  green: "Green light! It's safe now — tap the character to cross.",
  crossing: "Here we go — walking safely!",
  success: "Great job! You made a safe choice.",
  oops: "Wait! It's not safe to cross yet.",
} as const;

export function GamePage() {
  const game = useCrosswalkGame({
    waitSeconds: WAIT_SECONDS,
    crossSeconds: CROSS_SECONDS,
  });

  const { phase, isGreen } = game;

  return (
    <div
      className="min-h-dvh w-full"
      style={{ background: "linear-gradient(#8fd0f5 0%, #b9e4f7 52%, #d8f0e2 100%)" }}
    >
      <main className="relative mx-auto flex h-dvh w-full max-w-[1024px] flex-col">
        <div className="min-h-0 flex-1">
          <CrosswalkScene
            phase={phase}
            isGreen={isGreen}
            dinoY={game.dinoY}
            instant={game.instant}
            dinoColor={DINO_COLOR}
            crossSeconds={CROSS_SECONDS}
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
    </div>
  );
}
