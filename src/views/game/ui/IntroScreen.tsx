"use client";

import { useMemo } from "react";
import {
  buildDino,
  buildWavingArm,
  MOTHER_SHOULDER,
  PORTRAIT_CAMERA,
  projectPoint,
} from "@/views/game/model/scene";

/** 엄마 공룡은 아이보다 크고 색이 조금 짙다 */
const MOTHER_COLOR = "#4f9c34";
const APRON = "#f2e3c9";
const APRON_TRIM = "#e0796d";

/** 초상 카메라를 그대로 쓰되 엄마가 화면에 다 들어오도록 조금 작게 */
const MOTHER_CAMERA = { ...PORTRAIT_CAMERA, scale: 1.45 };

/**
 * 인트로 — 엄마 공룡이 앞치마를 두르고 손을 흔들며 배웅한다.
 *
 * 팔은 몸통과 따로 그린다. 한 덩어리로 그리면 팔만 돌릴 수 없기 때문이다.
 * 회전축은 어깨의 화면 좌표를 계산해 transform-origin 으로 넣는다 —
 * 그렇게 하지 않으면 팔이 그룹 원점(발밑 저 멀리)을 축으로 크게 휘둘린다.
 */
export function IntroScreen({ onStart }: { onStart: () => void }) {
  const body = useMemo(
    () => buildDino(MOTHER_COLOR, MOTHER_CAMERA, false, 0, {
      apronColor: APRON,
      apronTrim: APRON_TRIM,
    }),
    [],
  );
  const arm = useMemo(() => buildWavingArm(MOTHER_COLOR, MOTHER_CAMERA), []);
  const shoulder = useMemo(
    () => projectPoint(MOTHER_CAMERA, MOTHER_SHOULDER.x, MOTHER_SHOULDER.y, MOTHER_SHOULDER.z),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: "linear-gradient(#ffe9c2 0%, #ffd7d2 55%, #ffeede 100%)" }}
    >
      <div className="relative overflow-hidden" style={{ width: 380, height: 380 }}>
        <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: MOTHER_NUDGE }}>
          {body.map((face, i) => (
            <div key={`m${i}`} style={face.style} />
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              transformOrigin: `${shoulder.x}px ${shoulder.y}px`,
              animation: "ss-wave 1.1s ease-in-out infinite",
            }}
          >
            {arm.map((face, i) => (
              <div key={`a${i}`} style={face.style} />
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

/** 브라우저에서 실측한 중앙 보정 — MOTHER_CAMERA 를 바꾸면 다시 재야 한다 */
const MOTHER_NUDGE = "translate(168px,56px)";
