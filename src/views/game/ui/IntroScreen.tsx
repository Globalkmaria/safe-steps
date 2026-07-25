"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildDino,
  buildWavingArm,
  PORTRAIT_CAMERA,
  projectPoint,
} from "@/views/game/model/scene";

/** 엄마 공룡은 아이보다 크고 색이 조금 짙다 */
const MOTHER_COLOR = "#4f9c34";
const CHILD_COLOR = "#62b73a";
const APRON = "#f2e3c9";
const APRON_TRIM = "#e0796d";

/** 초상 카메라를 그대로 쓰되 화면에 다 들어오도록 배율만 조정한다 */
const MOTHER_CAMERA = { ...PORTRAIT_CAMERA, scale: 1.45 };
/** 아기는 엄마보다 작다 */
const CHILD_CAMERA = { ...PORTRAIT_CAMERA, scale: 1.0 };

/**
 * 두 캐릭터가 놓이는 무대 크기. 배치값(NUDGE)이 이 크기의 중심을 기준으로 잡혀 있어
 * 무대가 줄어들면 캐릭터가 밖으로 밀려난다. 그래서 무대는 크기를 고정하고,
 * 화면이 좁으면 통째로 축소한다 — 게임 씬과 같은 방식이다.
 */
const STAGE_W = 420;
const STAGE_H = 380;

/** 인사하는 팔이 돌아갈 어깨. 몸을 돌려 세운 아기는 y 가 다르다. */
const MOTHER_SHOULDER = { x: 3.5, y: 18.3, z: 4.9 };
const CHILD_SHOULDER = { x: 3.5, y: 16.9, z: 4.9 };

/**
 * 인트로 — 엄마 공룡이 앞치마를 두르고 손을 흔들며 배웅하고,
 * 아기 공룡은 엄마를 바라보며(= 카메라를 등지고) 마주 인사한다.
 *
 * 팔은 몸통과 따로 그린다. 한 덩어리로 그리면 팔만 돌릴 수 없기 때문이다.
 * 회전축은 어깨의 화면 좌표를 계산해 transform-origin 으로 넣는다 —
 * 그렇게 하지 않으면 팔이 그룹 원점(발밑 저 멀리)을 축으로 크게 휘둘린다.
 */
export function IntroScreen({ onStart }: { onStart: () => void }) {
  const motherBody = useMemo(
    () => buildDino(MOTHER_COLOR, MOTHER_CAMERA, { apron: { color: APRON, trim: APRON_TRIM } }),
    [],
  );
  const motherArm = useMemo(
    () => buildWavingArm(MOTHER_COLOR, MOTHER_CAMERA, MOTHER_SHOULDER),
    [],
  );
  const motherPivot = useMemo(
    () => projectPoint(MOTHER_CAMERA, MOTHER_SHOULDER.x, MOTHER_SHOULDER.y, MOTHER_SHOULDER.z),
    [],
  );

  // faceAway 로 뒤집기를 꺼서 원래 향(-y)을 유지한다 → 정면 카메라에서 뒷모습이 된다.
  const childBody = useMemo(() => buildDino(CHILD_COLOR, CHILD_CAMERA, { faceAway: true }), []);
  const childArm = useMemo(
    () => buildWavingArm(CHILD_COLOR, CHILD_CAMERA, CHILD_SHOULDER),
    [],
  );
  const childPivot = useMemo(
    () => projectPoint(CHILD_CAMERA, CHILD_SHOULDER.x, CHILD_SHOULDER.y, CHILD_SHOULDER.z),
    [],
  );

  // 무대를 남은 공간에 맞춰 축소한다. 확대는 하지 않는다(1 이 상한).
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setScale(Math.min(1, width / STAGE_W, height / STAGE_H));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4"
      style={{ background: "linear-gradient(#ffe9c2 0%, #ffd7d2 55%, #ffeede 100%)" }}
    >
      <div ref={stageRef} className="relative min-h-0 w-full max-w-[420px] flex-1">
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%,-50%) scale(${scale})`,
        }}
      >
        {/* 엄마 — 뒤쪽에 선다 */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: MOTHER_NUDGE }}>
          {motherBody.map((face, i) => (
            <div key={`m${i}`} style={face.style} />
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: `${motherPivot.x}px ${motherPivot.y}px`,
              animation: "ss-wave 1.1s ease-in-out infinite",
            }}
          >
            {motherArm.map((face, i) => (
              <div key={`ma${i}`} style={face.style} />
            ))}
          </div>
        </div>

        {/* 아기 — 엄마보다 앞이므로 나중에 그려 위에 오게 한다 */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: CHILD_NUDGE }}>
          {childBody.map((face, i) => (
            <div key={`c${i}`} style={face.style} />
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: `${childPivot.x}px ${childPivot.y}px`,
              // 엄마와 박자를 어긋내야 둘이 기계처럼 똑같이 움직이지 않는다
              animation: "ss-wave 1.1s ease-in-out .35s infinite",
            }}
          >
            {childArm.map((face, i) => (
              <div key={`ca${i}`} style={face.style} />
            ))}
          </div>
        </div>
      </div>
      </div>

      <p className="shrink-0 rounded-[2rem] border-4 border-white bg-[#fffdf7] px-6 py-3 text-center font-[family-name:var(--font-baloo)] text-2xl font-extrabold text-slate-800 shadow-[0_10px_0_rgba(30,60,80,.16)] sm:border-8 sm:px-8 sm:py-5 sm:text-3xl">
        Have a good day at school!
      </p>

      <button
        type="button"
        onClick={onStart}
        className="min-h-14 shrink-0 rounded-3xl border-4 border-white/90 px-10 py-3 text-xl font-extrabold text-white shadow-[0_8px_0_#3b7d21] sm:py-4 sm:text-2xl transition duration-150 hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_12px_0_#3b7d21] active:translate-y-1 active:shadow-[0_4px_0_#3b7d21]"
        style={{ background: "linear-gradient(#6fca4a,#4da12c)" }}
      >
        Bye, Mum!
      </button>
    </div>
  );
}

/**
 * 배치값. 각자를 상자 한가운데 놓는 값을 브라우저에서 재고, 거기서 엄마는 뒤쪽 위로,
 * 아기는 앞쪽 아래로 밀어 앞뒤 관계를 만든다. 카메라를 바꾸면 다시 재야 한다.
 */
const MOTHER_NUDGE = "translate(118px,6px)";
const CHILD_NUDGE = "translate(163px,116px)";
