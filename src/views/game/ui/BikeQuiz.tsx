"use client";

import { useMemo } from "react";
import { Modal } from "@/shared/ui/modal";
import { DinoOnBike } from "@/views/game/ui/DinoOnBike";
import { VoxelFigure } from "@/views/game/ui/VoxelFigure";
import { buildHelmet, buildPizza, THUMB_CAMERA } from "@/views/game/model/scene";

/** 두 번째 스텝의 선택지. helmet 이 정답이다. */
export type BikeChoice = "helmet" | "pizza";

const THUMB = 150;

function ChoiceButton({
  kind,
  label,
  nudge,
  faces,
  onSelect,
}: {
  kind: BikeChoice;
  label: string;
  nudge: string;
  faces: ReturnType<typeof buildHelmet>;
  onSelect: (choice: BikeChoice) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(kind)}
      className="group flex min-h-14 flex-col items-center gap-2 rounded-3xl border-4 border-white bg-white/70 p-3 shadow-[0_8px_0_rgba(30,60,80,.16)] transition duration-150 hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_12px_0_rgba(30,60,80,.2)] active:translate-y-1 active:shadow-[0_4px_0_rgba(30,60,80,.16)]"
    >
      <span className="block transition duration-150 group-hover:scale-105">
        <VoxelFigure faces={faces} width={THUMB} height={THUMB} nudge={nudge} />
      </span>
      <span className="text-lg font-extrabold text-slate-700 transition group-hover:text-slate-900">
        {label}
      </span>
    </button>
  );
}

/**
 * 두 번째 스텝 — 자전거를 탈 때 무엇을 챙길지 고른다.
 *
 * 첫 팝업에서 얼굴이 있던 자리로 캐릭터가 자전거를 타고 들어온다. 같은 구도에
 * 같은 캐릭터가 다른 상황으로 등장하니, 두 스텝이 한 이야기로 이어진다.
 */
export function BikeQuiz({ onSelect }: { onSelect: (choice: BikeChoice) => void }) {
  const pizza = useMemo(() => buildPizza(THUMB_CAMERA), []);
  const helmet = useMemo(() => buildHelmet(THUMB_CAMERA), []);

  return (
    <Modal labelledBy="bike-quiz-title">
      <h2
        id="bike-quiz-title"
        className="text-center font-[family-name:var(--font-baloo)] text-3xl font-extrabold text-slate-800"
      >
        You are riding your bike. What should you take?
      </h2>

      <div className="mt-4 flex items-center justify-center gap-3">
        <ChoiceButton
          kind="pizza"
          label="Pizza"
          faces={pizza}
          nudge={PIZZA_NUDGE}
          onSelect={onSelect}
        />
        {/* 첫 팝업에서 얼굴이 있던 가운데 자리 */}
        <div className="overflow-hidden">
          <DinoOnBike />
        </div>
        <ChoiceButton
          kind="helmet"
          label="Helmet"
          faces={helmet}
          nudge={HELMET_NUDGE}
          onSelect={onSelect}
        />
      </div>
    </Modal>
  );
}

/** 브라우저에서 실측한 중앙 보정 — PORTRAIT_CAMERA 를 바꾸면 다시 재야 한다 */
const PIZZA_NUDGE = "translate(0px,5px)";
const HELMET_NUDGE = "translate(-7px,24px)";
