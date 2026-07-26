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
/**
 * 헬멧을 손에 든 채로 잠깐 보여준 뒤 머리로 올리기까지.
 * 곧바로 올리면 손에 들었다는 게 안 읽히고 그냥 처음부터 쓴 것처럼 보인다.
 */
const HELMET_LIFT_MS = 550;
/**
 * 헬멧 쓰고 자전거에 오른 모습을 보여준 뒤 축하 팝업이 뜨기까지.
 * 드는 동작(HELMET_LIFT_MS + 올라가는 0.85s)이 끝나고도 쓴 모습이 한 박자 남도록 잡는다.
 */
const HELMET_ON_MS = 2600;
/** 자전거에서 내리는 동작이 끝나고 다음 질문이 뜨기까지 */
const DISMOUNT_MS = 1600;
/** 횡단보도를 벗어나 도로에 들어섰다 되돌아오는 동작이 끝나기까지 */
const STRAY_MS = 1600;
/** 재시도 팝업이 뜨기 전에 캐릭터가 인도로 돌아와 있어야 하는 여유 */
const STRAY_RETURN_LEAD_MS = 400;
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

/**
 * 지금 떠 있는 화면. 팝업은 언제나 하나이거나 없다 — 하나의 값으로 두어야
 * "둘이 동시에 뜬다" 는 상태가 표현 자체로 불가능해진다. boolean 을 늘리지 말 것.
 */
type Popup =
  | "intro"
  | "gearQuiz"
  | "gearRetry"
  | "gearSuccess"
  | "modeQuiz"
  | "modeRetry"
  | "signalQuiz"
  | "signalRetry"
  | "placeQuiz"
  | "placeRetry"
  | "finish"
  | "none";

export function GamePage() {
  const game = useCrosswalkGame({
    waitSeconds: WAIT_SECONDS,
    crossSeconds: CROSS_SECONDS,
  });

  const { phase, isGreen, pressButton, walk, tryAgain, reset } = game;

  const [popup, setPopup] = useState<Popup>("intro");
  const [step, setStep] = useState<Step>(1);

  // 씬 위 캐릭터의 상태. 팝업과는 다른 축이다 — 헬멧은 스텝 2~4 내내 쓴 채로 있다.
  const [wearsHelmet, setWearsHelmet] = useState(false);
  const [helmetInHand, setHelmetInHand] = useState(false);
  const [dismounted, setDismounted] = useState(false);
  const [strayed, setStrayed] = useState(false);
  /** 무단횡단 연출을 다시 돌릴 때마다 증가 — 타이머 useEffect 의 트리거 */
  const [strayRun, setStrayRun] = useState(0);

  /** 신호가 초록이 되면 스스로 건넌다 — 아이에게 같은 판단을 두 번 시키지 않는다 */
  const [autoCross, setAutoCross] = useState(false);

  useEffect(() => {
    if (autoCross && phase === "green") walk();
  }, [autoCross, phase, walk]);

  // 스텝 1: 손에 든 헬멧을 머리에 쓰는 동작을 보여준 뒤 축하 팝업.
  useEffect(() => {
    if (!wearsHelmet) return;
    const lift = setTimeout(() => setHelmetInHand(false), HELMET_LIFT_MS);
    const done = setTimeout(() => setPopup("gearSuccess"), HELMET_ON_MS);
    return () => {
      clearTimeout(lift);
      clearTimeout(done);
    };
  }, [wearsHelmet]);

  // 스텝 3: 내리는 동작이 끝나면 신호를 묻는다.
  useEffect(() => {
    if (step !== 3) return;
    const t = setTimeout(() => setPopup("signalQuiz"), DISMOUNT_MS);
    return () => clearTimeout(t);
  }, [step]);

  // 스텝 4: 불이 초록으로 바뀌면 길 건너 학교를 보여주며 어디로 건널지 묻는다.
  useEffect(() => {
    if (step !== 3 || phase !== "green") return;
    // 불이 바뀌는 순간을 눈으로 확인할 틈을 준 뒤 묻는다.
    const t = setTimeout(() => {
      setStep(4);
      setPopup("placeQuiz");
    }, GREEN_BEAT_MS);
    return () => clearTimeout(t);
  }, [step, phase]);

  // 빨간불에 나서려다 멈추는 동작을 다 보여준 뒤 실패 팝업.
  // 렌더가 아니라 여기서 스텝을 거른다 — 안 보이는 팝업이 예약되지 않도록.
  useEffect(() => {
    if (phase !== "oops" || step !== 3) return;
    const t = setTimeout(() => setPopup("signalRetry"), ABORT_MS);
    return () => clearTimeout(t);
  }, [phase, step]);

  // 다 건너면 축하 연출을 보여준 뒤 마무리 팝업.
  useEffect(() => {
    if (phase !== "success" || step !== 4) return;
    const t = setTimeout(() => setPopup("finish"), CELEBRATE_MS);
    return () => clearTimeout(t);
  }, [phase, step]);

  // 무단횡단 — 도로로 나섰다 되돌아온 뒤 다시 묻는다.
  // 타이머를 핸들러가 아니라 여기서 잡아야 언마운트 시 정리된다.
  useEffect(() => {
    if (strayRun === 0) return;
    const back = setTimeout(() => setStrayed(false), STRAY_MS - STRAY_RETURN_LEAD_MS);
    const ask = setTimeout(() => setPopup("placeRetry"), STRAY_MS);
    return () => {
      clearTimeout(back);
      clearTimeout(ask);
    };
  }, [strayRun]);

  /** 스텝 1 — 헬멧을 고르면 쓰고 자전거에 오른다 */
  const handleGearChoice = (picked: BikeChoice) => {
    if (picked !== "helmet") {
      setPopup("gearRetry");
      return;
    }
    setPopup("none");
    // 헬멧은 손에 든 채로 먼저 나타난다. 위 useEffect 가 곧 머리로 올린다.
    setHelmetInHand(true);
    setWearsHelmet(true);
  };

  /** 스텝 2 — 내려서 끌고 가야 정답 */
  const handleModeChoice = (mode: CrossingMode) => {
    if (mode === "ride") {
      setPopup("modeRetry");
      return;
    }
    setPopup("none");
    setDismounted(true);
    setStep(3);
  };

  /**
   * 스텝 3 — 초록을 고르면 불만 바꾼다. 아직 건너지 않는다:
   * 어디로 건널지는 다음 스텝에서 묻는다.
   */
  const handleSignalChoice = (picked: SignalChoice) => {
    setPopup("none");
    if (picked === "green") pressButton();
    else walk();
  };

  /** 스텝 4 — 횡단보도로 건너야 정답. 무단횡단은 도로에 들어섰다가 되돌아온다. */
  const handlePlaceChoice = (place: CrossingPlace) => {
    setPopup("none");
    if (place === "crossing") {
      setAutoCross(true); // 불은 이미 초록이라 곧바로 건너기 시작한다
      return;
    }
    setStrayed(true);
    setStrayRun((n) => n + 1);
  };

  const handleSignalRetry = () => {
    setAutoCross(false);
    tryAgain();
    setPopup("signalQuiz");
  };

  /** 처음부터 다시 — 씬과 팝업 상태를 모두 되돌린다 */
  const handleRestartAll = () => {
    setPopup("intro");
    setStep(1);
    setWearsHelmet(false);
    setHelmetInHand(false);
    setDismounted(false);
    setStrayed(false);
    setStrayRun(0);
    setAutoCross(false);
    reset();
  };

  return (
    <div
      className="w-full"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(#8fd0f5 0%, #b9e4f7 52%, #d8f0e2 100%)",
      }}
    >
      {/* 팝업 중 배경 비활성 — 없으면 Shift+Tab 으로 모달 밖 씬에 닿는다 */}
      <main
        inert={popup !== "none"}
        className="relative mx-auto flex h-dvh w-full max-w-[1024px] flex-col"
      >
        <div className="min-h-0 flex-1">
          <CrosswalkScene
            phase={phase}
            isGreen={isGreen}
            dinoY={game.dinoY}
            instant={game.instant}
            dinoColor={DINO_COLOR}
            wearsHelmet={wearsHelmet}
            helmetInHand={helmetInHand}
            dismounted={dismounted}
            showSchool={step === 4}
            strayed={strayed}
            crossSeconds={CROSS_SECONDS}
          />
        </div>

        <p
          role="status"
          className="pointer-events-none absolute inset-x-2 bottom-4 rounded-3xl border-4 border-white bg-[#fffdf7]/95 px-5 py-3 text-center text-lg font-bold leading-snug text-slate-700 shadow-[0_8px_0_rgba(30,60,80,.14)]"
        >
          {BUBBLE_TEXT[phase]}
        </p>
      </main>

      {popup === "intro" && <IntroScreen onStart={() => setPopup("gearQuiz")} />}

      {/* --- 스텝 1: 자전거를 탈 때 챙길 것 --- */}
      {popup === "gearQuiz" && <BikeQuiz onSelect={handleGearChoice} />}

      {popup === "gearRetry" && (
        <ResultDialog
          tone="retry"
          title="Pizza is not safety gear!"
          message="A snack will not protect your head. Try again and pick the thing that keeps you safe."
          actionLabel="Try again"
          onAction={() => setPopup("gearQuiz")}
        />
      )}

      {popup === "gearSuccess" && (
        <ResultDialog
          tone="success"
          title="Helmet on — well done!"
          message="A helmet protects your head every time you ride. Now off you go!"
          actionLabel="Next"
          onAction={() => {
            // 자전거 탄 모습은 이 팝업이 뜨기 전에 이미 보여줬으므로 곧바로 다음 질문으로.
            setStep(2);
            setPopup("modeQuiz");
          }}
        />
      )}

      {/* --- 스텝 2: 타고 갈까, 내려서 끌고 갈까 --- */}
      {popup === "modeQuiz" && (
        <CrossingModeQuiz bodyColor={DINO_COLOR} onSelect={handleModeChoice} />
      )}

      {popup === "modeRetry" && (
        <ResultDialog
          tone="retry"
          title="Do not ride across!"
          message="Riding across is risky — drivers see you late and you cannot stop quickly. Get off and walk your bike."
          actionLabel="Try again"
          onAction={() => setPopup("modeQuiz")}
        />
      )}

      {/* --- 스텝 3: 어느 불에 건널까 --- */}
      {popup === "signalQuiz" && <SignalQuiz onSelect={handleSignalChoice} />}

      {popup === "signalRetry" && (
        <ResultDialog
          tone="retry"
          title="That was the red light!"
          message="Red means stop. Cars are still going, so we wait on the pavement."
          actionLabel="Try again"
          onAction={handleSignalRetry}
        />
      )}

      {/* --- 스텝 4: 어디로 건널까 --- */}
      {popup === "placeQuiz" && (
        <WhereToCrossQuiz bodyColor={DINO_COLOR} onSelect={handlePlaceChoice} />
      )}

      {popup === "placeRetry" && (
        <ResultDialog
          tone="retry"
          title="Not there!"
          message="Stepping straight into the road is dangerous. Drivers do not expect you there. Use the crossing."
          actionLabel="Try again"
          onAction={() => setPopup("placeQuiz")}
        />
      )}

      {popup === "finish" && (
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
