"use client";

import { useMemo } from "react";
import { Modal } from "@/shared/ui/modal";
import { QuizTitle } from "@/views/game/ui/QuizTitle";
import { VoxelFigure } from "@/views/game/ui/VoxelFigure";
import type { Face } from "@/views/game/model/scene";
import {
  buildBikeParts,
  buildDino,
  PROFILE_CAMERA,
  projectPoint,
  SCENE_BIKE_LIFT,
  SCENE_BIKE_ORIGIN,
} from "@/views/game/model/scene";

/** 세 번째 스텝의 선택지. walk 가 정답이다. */
export type CrossingMode = "ride" | "walk";

const TILE_W = 230;
const TILE_H = 150;

/**
 * 선택지 미리보기 — 고르기 전에 그 행동이 어떤 모습인지 3초 동안 보여준다.
 *
 * 글로 "타고 건넌다 / 내려서 끌고 건넌다" 라고 적으면 아이는 차이를 상상해야 한다.
 * 움직임으로 보여주면 그냥 보인다.
 */
function ModePreview({ mode, bodyColor }: { mode: CrossingMode; bodyColor: string }) {
  // 자전거를 캐릭터 발밑 좌표에 놓아 씬과 같은 관계로 만든다 — 둘을 따로 중앙
  // 정렬하면 서로의 상대 위치가 사라져 캐릭터가 자전거에서 떨어져 보인다.
  const bike = useMemo(() => buildBikeParts(PROFILE_CAMERA, SCENE_BIKE_ORIGIN), []);
  // 바퀴는 축(허브)을 중심으로 돈다. 그룹 원점을 축으로 삼으면 바퀴가 통째로
  // 궤도를 그리며 날아간다 — 엄마 팔을 어깨에서 돌린 것과 같은 이유다.
  const rearPivot = useMemo(
    () => projectPoint(PROFILE_CAMERA, bike.rearHub.x, bike.rearHub.y, bike.rearHub.z),
    [bike],
  );
  const frontPivot = useMemo(
    () => projectPoint(PROFILE_CAMERA, bike.frontHub.x, bike.frontHub.y, bike.frontHub.z),
    [bike],
  );
  // 타고 갈 때가 끌고 갈 때보다 빠르다.
  const spin = mode === "ride" ? ".55s" : "1.1s";
  // 타고 갈 때는 안장 높이로 올라타고, 끌고 갈 때는 땅에 내려선다.
  const rider = useMemo(
    () => buildDino(bodyColor, PROFILE_CAMERA, {
      withHelmet: true,
      lift: mode === "ride" ? SCENE_BIKE_LIFT : 0,
    }),
    [bodyColor, mode],
  );

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#eef6fb]" style={{ width: TILE_W, height: TILE_H }}>
      {/* 길바닥 */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-[#d9d2c4]" />
      <div
        className="absolute inset-0"
        style={{ animation: "ss-cross-loop 3s linear infinite" }}
      >
        <VoxelFigure
          faces={bike.frame}
          width={TILE_W}
          height={TILE_H}
          nudge={PREVIEW_NUDGE}
          style={{ position: "absolute", inset: 0 }}
        />
        <Wheel
          faces={bike.rearWheel}
          pivot={rearPivot}
          duration={spin}
        />
        <Wheel
          faces={bike.frontWheel}
          pivot={frontPivot}
          duration={spin}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            // 끌고 갈 때는 걷는 흔들림을, 타고 갈 때는 잔잔한 흔들림을 준다
            animation:
              mode === "walk"
                ? "ss-walkbob .5s ease-in-out infinite"
                : "ss-bob 2.2s ease-in-out infinite",
          }}
        >
          <VoxelFigure
            faces={rider}
            width={TILE_W}
            height={TILE_H}
            nudge={PREVIEW_NUDGE}
            style={{ position: "absolute", inset: 0 }}
          />
        </div>
      </div>
    </div>
  );
}

/** 축을 중심으로 구르는 바퀴 */
function Wheel({
  faces,
  pivot,
  duration,
}: {
  faces: Face[];
  pivot: { x: number; y: number };
  duration: string;
}) {
  return (
    // VoxelFigure 와 같은 계층으로 맞춘다: 바깥 칸 → 중앙 이동 → 회전 → 면들.
    // 회전과 이동을 한 요소에 두면 애니메이션의 transform 이 이동을 덮어쓴다.
    <div aria-hidden className="absolute inset-0">
      <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: PREVIEW_NUDGE }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: `${pivot.x}px ${pivot.y}px`,
            animation: `ss-wheel ${duration} linear infinite`,
          }}
        >
          {faces.map((face, i) => (
            <div key={i} className={face.className} style={face.style} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({
  mode,
  label,
  bodyColor,
  onSelect,
}: {
  mode: CrossingMode;
  label: string;
  bodyColor: string;
  onSelect: (mode: CrossingMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className="group flex min-h-14 flex-col items-center gap-2 rounded-3xl border-4 border-white bg-white/70 p-3 shadow-[0_8px_0_rgba(30,60,80,.16)] transition duration-150 hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_12px_0_rgba(30,60,80,.2)] active:translate-y-1 active:shadow-[0_4px_0_rgba(30,60,80,.16)]"
    >
      <ModePreview mode={mode} bodyColor={bodyColor} />
      <span className="text-lg font-extrabold text-slate-700 transition group-hover:text-slate-900">
        {label}
      </span>
    </button>
  );
}

/** 세 번째 스텝 — 자전거를 타고 횡단보도에 도착했다. 어떻게 건널까. */
export function CrossingModeQuiz({
  bodyColor,
  onSelect,
}: {
  bodyColor: string;
  onSelect: (mode: CrossingMode) => void;
}) {
  return (
    <Modal labelledBy="crossing-mode-title">
      <QuizTitle id="crossing-mode-title">You reached the crossing. How do you get across?</QuizTitle>

      <div className="mt-5 flex items-start justify-center gap-4">
        <ChoiceButton
          mode="ride"
          label="Ride across"
          bodyColor={bodyColor}
          onSelect={onSelect}
        />
        <ChoiceButton
          mode="walk"
          label="Get off and walk"
          bodyColor={bodyColor}
          onSelect={onSelect}
        />
      </div>
    </Modal>
  );
}

/**
 * 자전거와 캐릭터가 **같은 보정값**을 쓴다. 둘은 이미 월드에서 올바른 관계로 놓여
 * 있으므로, 같은 양만큼 옮겨야 그 관계가 유지된다.
 */
const PREVIEW_NUDGE = "translate(-185px,73px)";
