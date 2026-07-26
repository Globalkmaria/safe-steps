"use client";

import { Modal } from "@/shared/ui/modal";
import { QuizTitle } from "./QuizTitle";
import { DinoFace } from "@/views/game/ui/DinoFace";
import { signalPixels } from "@/views/game/model/scene";

/** 퀴즈의 두 선택지. 상태 기계와 무관한 팝업만의 개념이다. */
export type SignalChoice = "green" | "red";

const LIT = { green: "#5cf06a", red: "#ff5347" } as const;

/** 씬의 신호등 패널과 같은 도트 패턴을 쓴다 — 팝업에서 고른 그림을 화면에서 다시 만난다. */
function SignalLamp({ kind }: { kind: SignalChoice }) {
  const { rows, columns } = signalPixels(kind === "green");
  const lit = LIT[kind];

  return (
    <span
      aria-hidden
      className="grid rounded-lg border-4 border-[#0e1012] bg-[#17191c] p-2"
      style={{
        gridTemplateColumns: `repeat(${columns},1fr)`,
        gap: 2,
        width: columns * 14 + 20,
      }}
    >
      {rows.flatMap((row, r) =>
        row.split("").map((cell, c) => (
          <span
            key={`${r}-${c}`}
            className="aspect-square rounded-[1px]"
            style={{
              background: cell === "1" ? lit : "rgba(255,255,255,.05)",
              boxShadow: cell === "1" ? `0 0 8px ${lit}` : "none",
            }}
          />
        )),
      )}
    </span>
  );
}

function ChoiceButton({
  kind,
  label,
  onSelect,
}: {
  kind: SignalChoice;
  label: string;
  onSelect: (choice: SignalChoice) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(kind)}
      className="group flex min-h-14 flex-col items-center gap-3 rounded-3xl border-4 border-white bg-white/70 p-4 shadow-[0_8px_0_rgba(30,60,80,.16)] transition duration-150 hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_12px_0_rgba(30,60,80,.2)] active:translate-y-1 active:shadow-[0_4px_0_rgba(30,60,80,.16)]"
    >
      {/* 램프도 같이 반응한다 — 무엇을 고르는 중인지가 색으로 드러나야 한다 */}
      <span className="transition duration-150 group-hover:scale-105">
        <SignalLamp kind={kind} />
      </span>
      <span className="text-lg font-extrabold text-slate-700 transition group-hover:text-slate-900">
        {label}
      </span>
    </button>
  );
}

/**
 * 신호 판단 퀴즈.
 *
 * 왼쪽이 초록불, 오른쪽이 빨간불이고 가운데에 캐릭터가 묻는 구도다.
 * 정답을 글로 설명하지 않는다 — 고르면 그 결과가 씬에서 벌어진다.
 */
export function SignalQuiz({ onSelect }: { onSelect: (choice: SignalChoice) => void }) {
  return (
    <Modal labelledBy="signal-quiz-title">
      <QuizTitle id="signal-quiz-title">Which light means it is safe to cross?</QuizTitle>

      <div className="mt-6 flex items-center justify-center gap-5">
        <ChoiceButton kind="green" label="Green" onSelect={onSelect} />
        <DinoFace size={150} />
        <ChoiceButton kind="red" label="Red" onSelect={onSelect} />
      </div>
    </Modal>
  );
}
