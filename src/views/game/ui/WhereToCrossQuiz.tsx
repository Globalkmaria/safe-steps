"use client";

import { useMemo } from "react";
import { Modal } from "@/shared/ui/modal";
import { QuizTitle } from "./QuizTitle";
import { VoxelFigure } from "@/views/game/ui/VoxelFigure";
import {
  buildBike,
  buildDino,
  PROFILE_CAMERA,
  SCENE_BIKE_ORIGIN,
} from "@/views/game/model/scene";

/** 마지막 스텝의 선택지. crossing 이 정답이다. */
export type CrossingPlace = "jaywalk" | "crossing";

const TILE_W = 230;
const TILE_H = 150;

/**
 * 선택지 미리보기.
 *
 * 두 그림의 차이는 발밑이다 — 흰 줄무늬 위에 서 있는가, 맨 아스팔트 위에 서 있는가.
 * 캐릭터는 같으므로 바닥만 보면 무엇을 고르는지 알 수 있다.
 */
function PlacePreview({ place, bodyColor }: { place: CrossingPlace; bodyColor: string }) {
  const bike = useMemo(() => buildBike(PROFILE_CAMERA, SCENE_BIKE_ORIGIN), []);
  const rider = useMemo(
    () => buildDino(bodyColor, PROFILE_CAMERA, { withHelmet: true }),
    [bodyColor],
  );

  const stripes =
    "repeating-linear-gradient(90deg, #f4f2ea 0 16px, #59606a 16px 30px)";

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[#eef6fb]"
      style={{ width: TILE_W, height: TILE_H }}
    >
      {/* 도로 — 횡단보도 쪽만 흰 줄무늬가 있다 */}
      <div
        className="absolute inset-x-0 bottom-0 h-12"
        style={{ background: place === "crossing" ? stripes : "#59606a" }}
      />
      <div style={{ animation: "ss-cross-loop 3s linear infinite" }}>
        <VoxelFigure
          faces={bike}
          width={TILE_W}
          height={TILE_H}
          nudge={PREVIEW_NUDGE}
          style={{ position: "absolute", inset: 0 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            animation: "ss-walkbob .5s ease-in-out infinite",
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

function ChoiceButton({
  place,
  label,
  bodyColor,
  onSelect,
}: {
  place: CrossingPlace;
  label: string;
  bodyColor: string;
  onSelect: (place: CrossingPlace) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className="group flex min-h-14 flex-col items-center gap-2 rounded-3xl border-4 border-white bg-white/70 p-3 shadow-[0_8px_0_rgba(30,60,80,.16)] transition duration-150 hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_12px_0_rgba(30,60,80,.2)] active:translate-y-1 active:shadow-[0_4px_0_rgba(30,60,80,.16)]"
    >
      <PlacePreview place={place} bodyColor={bodyColor} />
      <span className="text-lg font-extrabold text-slate-700 transition group-hover:text-slate-900">
        {label}
      </span>
    </button>
  );
}

/** 마지막 스텝 — 학교는 길 건너에 있다. 어디로 건널까. */
export function WhereToCrossQuiz({
  bodyColor,
  onSelect,
}: {
  bodyColor: string;
  onSelect: (place: CrossingPlace) => void;
}) {
  return (
    <Modal labelledBy="where-to-cross-title">
      <QuizTitle id="where-to-cross-title">School is just across the road. Where do you cross?</QuizTitle>

      <div className="mt-5 flex items-start justify-center gap-4">
        <ChoiceButton
          place="jaywalk"
          label="Straight across"
          bodyColor={bodyColor}
          onSelect={onSelect}
        />
        <ChoiceButton
          place="crossing"
          label="On the crossing"
          bodyColor={bodyColor}
          onSelect={onSelect}
        />
      </div>
    </Modal>
  );
}

/** 자전거와 캐릭터가 같은 보정값을 쓴다 — 둘의 상대 위치를 유지하기 위해 */
const PREVIEW_NUDGE = "translate(-185px,73px)";
