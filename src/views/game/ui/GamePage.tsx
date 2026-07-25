"use client";

import { useEffect, useState } from "react";
import { CrosswalkScene } from "@/views/game/ui/CrosswalkScene";
import { ResultDialog } from "@/views/game/ui/ResultDialog";
import { SignalQuiz } from "@/views/game/ui/SignalQuiz";
import type { SignalChoice } from "@/views/game/ui/SignalQuiz";
import { BikeQuiz } from "@/views/game/ui/BikeQuiz";
import type { BikeChoice } from "@/views/game/ui/BikeQuiz";
import { useCrosswalkGame } from "@/views/game/model/use-crosswalk-game";

/** 캐릭터 몸 색. 선택 UI 가 사라져 지금은 고정값이다. */
const DINO_COLOR = "#62b73a";

/**
 * 버튼을 누르고 초록불까지의 시간. 신호 전환이 "바로" 느껴지도록 짧게 잡되 0 은 아니다 —
 * 색이 즉시 튀면 고장처럼 보이고, 이 구간의 깜빡임이 곧 "기다리는 중" 이라는 신호다.
 */
const WAIT_SECONDS = 0.6;
const CROSS_SECONDS = 3.4;

/** 성공 연출(색종이)을 보고 난 뒤 다음 스텝이 뜨기까지 */
const CELEBRATE_MS = 2200;
/**
 * 빨간불에 나서려다 멈추는 동작을 다 보여준 뒤 실패 팝업이 뜨기까지.
 * 팝업이 곧바로 덮으면 "왜 위험한지"를 보여주는 장면이 통째로 가려진다.
 */
const ABORT_MS = 1400;

const BUBBLE_TEXT = {
  idle: "Let's cross safely! Wait for the green light.",
  waiting: "The light is changing…",
  green: "Green light! It's safe now — tap the character to cross.",
  crossing: "Here we go — walking safely!",
  success: "Great job! You made a safe choice.",
  oops: "Wait! It's not safe to cross yet.",
} as const;

/** 스텝 1 = 신호 판단, 스텝 2 = 자전거 준비물 */
type Step = 1 | 2;

export function GamePage() {
  const game = useCrosswalkGame({
    waitSeconds: WAIT_SECONDS,
    crossSeconds: CROSS_SECONDS,
  });

  const { phase, isGreen, pressButton, walk, tryAgain, reset } = game;

  /**
   * 팝업 레이어의 상태. 씬과 상태 기계는 665a9f4 그대로 두고, 그 위에서만 관리한다.
   * null = 아직 안 골랐다(퀴즈 표시 중).
   */
  const [step, setStep] = useState<Step>(1);
  const [choice, setChoice] = useState<SignalChoice | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [bikeResult, setBikeResult] = useState<"retry" | "success" | null>(null);

  // 초록을 골랐으면 불이 바뀌는 순간 자동으로 건넌다 — 아이가 같은 판단을 두 번
  // 하게 만들지 않는다. 기계에 새 단계를 넣는 대신 기존 walk() 를 부른다.
  useEffect(() => {
    if (choice === "green" && phase === "green") walk();
  }, [choice, phase, walk]);

  // oops 를 벗어나는 경로는 handleRetry 뿐이고 거기서 직접 닫으므로,
  // 여기서는 예약만 한다(이펙트 본문의 동기 setState 는 연쇄 렌더를 부른다).
  useEffect(() => {
    if (phase !== "oops") return;
    const t = setTimeout(() => setShowRetry(true), ABORT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // 길을 건넜으면 축하 연출을 충분히 보여준 뒤 다음 스텝으로 넘어간다.
  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => setStep(2), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const handleSignalChoice = (picked: SignalChoice) => {
    setChoice(picked);
    // 초록 → 신호를 바꾼다. 빨강 → 빨간불에 건너려다 멈추는 기존 실패 경로를 탄다.
    if (picked === "green") pressButton();
    else walk();
  };

  const handleRetry = () => {
    setShowRetry(false);
    setChoice(null);
    tryAgain();
  };

  const handleBikeChoice = (picked: BikeChoice) => {
    setBikeResult(picked === "helmet" ? "success" : "retry");
  };

  /** 처음부터 다시 — 씬과 팝업 상태를 모두 되돌린다 */
  const handleRestartAll = () => {
    setBikeResult(null);
    setStep(1);
    setChoice(null);
    setShowRetry(false);
    reset();
  };

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
            onWalk={walk}
          />
        </div>

        <p
          role="status"
          className="pointer-events-none absolute inset-x-2 bottom-4 rounded-3xl border-4 border-white bg-[#fffdf7]/95 px-5 py-3 text-center text-lg font-bold leading-snug text-slate-700 shadow-[0_8px_0_rgba(30,60,80,.14)]"
        >
          {BUBBLE_TEXT[phase]}
        </p>
      </main>

      {/* --- 스텝 1: 신호 판단 --- */}
      {step === 1 && choice === null && phase === "idle" && (
        <SignalQuiz onSelect={handleSignalChoice} />
      )}

      {step === 1 && showRetry && (
        <ResultDialog
          tone="retry"
          title="That was the red light!"
          message="Red means stop. Cars are still going, so we wait on the pavement."
          actionLabel="Try again"
          onAction={handleRetry}
        />
      )}

      {/* --- 스텝 2: 자전거 준비물 --- */}
      {step === 2 && bikeResult === null && <BikeQuiz onSelect={handleBikeChoice} />}

      {step === 2 && bikeResult === "retry" && (
        <ResultDialog
          tone="retry"
          title="Pizza is not safety gear!"
          message="A snack will not protect your head. Try again and pick the thing that keeps you safe."
          actionLabel="Try again"
          onAction={() => setBikeResult(null)}
        />
      )}

      {step === 2 && bikeResult === "success" && (
        <ResultDialog
          tone="success"
          title="Helmet on — well done!"
          message="A helmet protects your head every time you ride. Always put it on before you set off."
          actionLabel="Play again"
          onAction={handleRestartAll}
        />
      )}
    </div>
  );
}
