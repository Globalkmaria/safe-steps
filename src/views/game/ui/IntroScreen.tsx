"use client";

import { useMemo } from "react";
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

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: "linear-gradient(#ffe9c2 0%, #ffd7d2 55%, #ffeede 100%)" }}
    >
      <div className="relative overflow-hidden" style={{ width: 420, height: 380 }}>
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

      <p className="rounded-[2rem] border-8 border-white bg-[#fffdf7] px-8 py-5 text-center font-[family-name:var(--font-baloo)] text-3xl font-extrabold text-slate-800 shadow-[0_14px_0_rgba(30,60,80,.16)]">
        Have a good day at school!
      </p>

      <button
        type="button"
        onClick={onStart}
        className="min-h-14 rounded-3xl border-4 border-white/90 px-10 py-4 text-2xl font-extrabold text-white shadow-[0_8px_0_#3b7d21] transition duration-150 hover:-translate-y-1 hover:brightness-110 hover:shadow-[0_12px_0_#3b7d21] active:translate-y-1 active:shadow-[0_4px_0_#3b7d21]"
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
