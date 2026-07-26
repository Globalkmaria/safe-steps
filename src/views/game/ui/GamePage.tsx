"use client";

import { useEffect, useState } from "react";
import { CrosswalkScene } from "@/views/game/ui/CrosswalkScene";
import { ResultDialog } from "@/views/game/ui/ResultDialog";
import { BikeQuiz } from "@/views/game/ui/BikeQuiz";
import type { BikeChoice } from "@/views/game/ui/BikeQuiz";
import { CrossingModeQuiz } from "@/views/game/ui/CrossingModeQuiz";
import type { CrossingMode } from "@/views/game/ui/CrossingModeQuiz";
import { SignalQuiz } from "@/views/game/ui/SignalQuiz";
import type { SignalChoice } from "@/views/game/ui/SignalQuiz";
import { WhereToCrossQuiz } from "@/views/game/ui/WhereToCrossQuiz";
import type { CrossingPlace } from "@/views/game/ui/WhereToCrossQuiz";
import { IntroScreen } from "@/views/game/ui/IntroScreen";
import { useCrosswalkGame } from "@/views/game/model/use-crosswalk-game";

/** 캐릭터 몸 색. 선택 UI 가 사라져 지금은 고정값이다. */
const DINO_COLOR = "#62b73a";

/**
 * 버튼을 누르고 초록불까지의 시간. 신호 전환이 "바로" 느껴지도록 짧게 잡되 0 은 아니다 —
 * 색이 즉시 튀면 고장처럼 보이고, 이 구간의 깜빡임이 곧 "기다리는 중" 이라는 신호다.
 */
const WAIT_SECONDS = 0.6;
const CROSS_SECONDS = 3.4;

/** 축하 연출(색종이)을 보고 난 뒤 마무리 팝업이 뜨기까지 */
const CELEBRATE_MS = 2200;
/**
 * 빨간불에 나서려다 멈추는 동작을 다 보여준 뒤 실패 팝업이 뜨기까지.
 * 팝업이 곧바로 덮으면 "왜 위험한지"를 보여주는 장면이 통째로 가려진다.
 */
const ABORT_MS = 1400;
/** 헬멧 쓰고 자전거에 오른 모습을 보여준 뒤 축하 팝업이 뜨기까지 */
const HELMET_ON_MS = 1600;
/** 자전거에서 내리는 동작이 끝나고 다음 질문이 뜨기까지 */
const DISMOUNT_MS = 1600;
/** 횡단보도를 벗어나 도로에 들어섰다 되돌아오는 동작이 끝나기까지 */
const STRAY_MS = 1600;
/** 불이 초록으로 바뀐 것을 보고 난 뒤 마지막 질문이 뜨기까지 */
const GREEN_BEAT_MS = 900;

const BUBBLE_TEXT = {
  idle: "Get ready to ride to the crossing.",
  waiting: "The light is changing…",
  green: "Green light! It's safe now.",
  crossing: "Here we go — walking the bike across!",
  success: "Great job! You made a safe choice.",
  oops: "Wait! It's not safe to cross yet.",
} as const;

/**
 * 이야기 순서.
 *  1. 자전거를 탈 때 무엇을 챙길까 (헬멧)
 *  2. 횡단보도에서 타고 갈까, 내려서 끌고 갈까
 *  3. 어느 불에 건널까
 *  4. 어디로 건널까 — 그리고 자전거를 끌고 학교로 건너간다
 */
type Step = 1 | 2 | 3 | 4;

export function GamePage() {
  const game = useCrosswalkGame({
    waitSeconds: WAIT_SECONDS,
    crossSeconds: CROSS_SECONDS,
  });

  const { phase, isGreen, pressButton, walk, tryAgain, reset } = game;

  /** 인트로 — 엄마의 배웅. 여기서 시작해 스텝 1 로 넘어간다. */
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState<Step>(1);

  // 스텝 1 — 헬멧
  const [gearResult, setGearResult] = useState<"retry" | "success" | null>(null);
  const [showGearSuccess, setShowGearSuccess] = useState(false);
  const [wearsHelmet, setWearsHelmet] = useState(false);

  // 스텝 2 — 타고 갈까 끌고 갈까
  const [showModeQuiz, setShowModeQuiz] = useState(false);
  const [modeRetry, setModeRetry] = useState(false);
  const [dismounted, setDismounted] = useState(false);

  // 스텝 3 — 신호
  const [showSignalQuiz, setShowSignalQuiz] = useState(false);
  const [showSignalRetry, setShowSignalRetry] = useState(false);

  // 스텝 4 — 어디로 건널까
  const [showPlaceQuiz, setShowPlaceQuiz] = useState(false);
  const [placeRetry, setPlaceRetry] = useState(false);
  const [strayed, setStrayed] = useState(false);
  const [showFinish, setShowFinish] = useState(false);

  /** 신호가 초록이 되면 스스로 건넌다 — 아이에게 같은 판단을 두 번 시키지 않는다 */
  const [autoCross, setAutoCross] = useState(false);

  useEffect(() => {
    if (autoCross && phase === "green") walk();
  }, [autoCross, phase, walk]);

  // 스텝 1: 헬멧 쓰고 자전거에 오른 모습을 보여준 뒤 축하 팝업.
  useEffect(() => {
    if (gearResult !== "success") return;
    const t = setTimeout(() => setShowGearSuccess(true), HELMET_ON_MS);
    return () => clearTimeout(t);
  }, [gearResult]);

  // 스텝 3: 내리는 동작이 끝나면 신호를 묻는다.
  useEffect(() => {
    if (step !== 3) return;
    const t = setTimeout(() => setShowSignalQuiz(true), DISMOUNT_MS);
    return () => clearTimeout(t);
  }, [step]);

  // 스텝 4: 불이 초록으로 바뀌면 길 건너 학교를 보여주며 어디로 건널지 묻는다.
  useEffect(() => {
    if (step !== 3 || phase !== "green") return;
    // 불이 바뀌는 순간을 눈으로 확인할 틈을 준 뒤 묻는다.
    const t = setTimeout(() => {
      setStep(4);
      setShowPlaceQuiz(true);
    }, GREEN_BEAT_MS);
    return () => clearTimeout(t);
  }, [step, phase]);

  // 빨간불에 나서려다 멈추는 동작을 다 보여준 뒤 실패 팝업.
  useEffect(() => {
    if (phase !== "oops") return;
    const t = setTimeout(() => setShowSignalRetry(true), ABORT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // 다 건너면 축하 연출을 보여준 뒤 마무리 팝업.
  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => setShowFinish(true), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  /** 스텝 1 — 헬멧을 고르면 쓰고 자전거에 오른다 */
  const handleGearChoice = (picked: BikeChoice) => {
    if (picked !== "helmet") {
      setGearResult("retry");
      return;
    }
    setGearResult("success");
    setWearsHelmet(true);
  };

  /** 스텝 2 — 내려서 끌고 가야 정답 */
  const handleModeChoice = (mode: CrossingMode) => {
    setShowModeQuiz(false);
    if (mode === "ride") {
      setModeRetry(true);
      return;
    }
    setDismounted(true);
    setStep(3);
  };

  /**
   * 스텝 3 — 초록을 고르면 불만 바꾼다. 아직 건너지 않는다:
   * 어디로 건널지는 다음 스텝에서 묻는다.
   */
  const handleSignalChoice = (picked: SignalChoice) => {
    setShowSignalQuiz(false);
    if (picked === "green") pressButton();
    else walk();
  };

  /** 스텝 4 — 횡단보도로 건너야 정답. 무단횡단은 도로에 들어섰다가 되돌아온다. */
  const handlePlaceChoice = (place: CrossingPlace) => {
    setShowPlaceQuiz(false);
    if (place === "crossing") {
      setAutoCross(true); // 불은 이미 초록이라 곧바로 건너기 시작한다
      return;
    }
    setStrayed(true);
    setTimeout(() => setStrayed(false), STRAY_MS - 400);
    setTimeout(() => setPlaceRetry(true), STRAY_MS);
  };

  const handleSignalRetry = () => {
    setShowSignalRetry(false);
    setAutoCross(false);
    tryAgain();
    setShowSignalQuiz(true);
  };

  /** 처음부터 다시 — 씬과 팝업 상태를 모두 되돌린다 */
  const handleRestartAll = () => {
    setShowIntro(true);
    setStep(1);
    setGearResult(null);
    setShowGearSuccess(false);
    setWearsHelmet(false);
    setShowModeQuiz(false);
    setModeRetry(false);
    setDismounted(false);
    setShowSignalQuiz(false);
    setShowSignalRetry(false);
    setShowPlaceQuiz(false);
    setPlaceRetry(false);
    setStrayed(false);
    setShowFinish(false);
    setAutoCross(false);
    reset();
  };

  return (
    <div
      className="w-full"
      // body 여백만큼 뺀 높이. 그대로 100dvh 를 쓰면 여백이 더해져 스크롤이 생긴다.
      style={{
        minHeight: "calc(100dvh - 2 * var(--app-inset))",
        background: "linear-gradient(#8fd0f5 0%, #b9e4f7 52%, #d8f0e2 100%)",
      }}
    >
      <main
        className="relative mx-auto flex w-full max-w-[1024px] flex-col"
        style={{ height: "calc(100dvh - 2 * var(--app-inset))" }}
      >
        <div className="min-h-0 flex-1">
          <CrosswalkScene
            phase={phase}
            isGreen={isGreen}
            dinoY={game.dinoY}
            instant={game.instant}
            dinoColor={DINO_COLOR}
            wearsHelmet={wearsHelmet}
            dismounted={dismounted}
            showSchool={step === 4}
            strayed={strayed}
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

      {showIntro && <IntroScreen onStart={() => setShowIntro(false)} />}

      {/* --- 스텝 1: 자전거를 탈 때 챙길 것 --- */}
      {!showIntro && step === 1 && gearResult === null && (
        <BikeQuiz onSelect={handleGearChoice} />
      )}

      {step === 1 && gearResult === "retry" && (
        <ResultDialog
          tone="retry"
          title="Pizza is not safety gear!"
          message="A snack will not protect your head. Try again and pick the thing that keeps you safe."
          actionLabel="Try again"
          onAction={() => setGearResult(null)}
        />
      )}

      {step === 1 && showGearSuccess && (
        <ResultDialog
          tone="success"
          title="Helmet on — well done!"
          message="A helmet protects your head every time you ride. Now off you go!"
          actionLabel="Next"
          onAction={() => {
            // 자전거 탄 모습은 이 팝업이 뜨기 전에 이미 보여줬으므로 곧바로 다음 질문으로.
            setShowGearSuccess(false);
            setStep(2);
            setShowModeQuiz(true);
          }}
        />
      )}

      {/* --- 스텝 2: 타고 갈까, 내려서 끌고 갈까 --- */}
      {step === 2 && showModeQuiz && (
        <CrossingModeQuiz bodyColor={DINO_COLOR} onSelect={handleModeChoice} />
      )}

      {step === 2 && modeRetry && (
        <ResultDialog
          tone="retry"
          title="Do not ride across!"
          message="Riding across is risky — drivers see you late and you cannot stop quickly. Get off and walk your bike."
          actionLabel="Try again"
          onAction={() => {
            setModeRetry(false);
            setShowModeQuiz(true);
          }}
        />
      )}

      {/* --- 스텝 3: 어느 불에 건널까 --- */}
      {step === 3 && showSignalQuiz && <SignalQuiz onSelect={handleSignalChoice} />}

      {step === 3 && showSignalRetry && (
        <ResultDialog
          tone="retry"
          title="That was the red light!"
          message="Red means stop. Cars are still going, so we wait on the pavement."
          actionLabel="Try again"
          onAction={handleSignalRetry}
        />
      )}

      {/* --- 스텝 4: 어디로 건널까 --- */}
      {step === 4 && showPlaceQuiz && (
        <WhereToCrossQuiz bodyColor={DINO_COLOR} onSelect={handlePlaceChoice} />
      )}

      {step === 4 && placeRetry && (
        <ResultDialog
          tone="retry"
          title="Not there!"
          message="Stepping straight into the road is dangerous. Drivers do not expect you there. Use the crossing."
          actionLabel="Try again"
          onAction={() => {
            setPlaceRetry(false);
            setShowPlaceQuiz(true);
          }}
        />
      )}

      {step === 4 && showFinish && (
        <ResultDialog
          tone="success"
          title="You made it to school!"
          message="Helmet on, off the bike, waited for green, and crossed on the crossing. That is how it is done!"
          actionLabel="Play again"
          onAction={handleRestartAll}
        />
      )}
    </div>
  );
}
