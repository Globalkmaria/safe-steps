"use client";

import { Modal } from "@/shared/ui/modal";
import { DinoFace } from "@/views/game/ui/DinoFace";

/**
 * 오답 후 "다시 시도" / 성공 후 "다시 하기" 공용 팝업.
 *
 * 오답 팝업은 캐릭터가 도로에 나갔다 되돌아오는 장면이 **끝난 뒤에** 뜬다.
 * 무엇이 잘못됐는지는 이미 장면이 보여줬으므로, 여기서는 짧게 짚고 다시 기회를 준다.
 */
export function ResultDialog({
  tone,
  title,
  message,
  actionLabel,
  onAction,
}: {
  tone: "retry" | "success";
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const isSuccess = tone === "success";

  return (
    <Modal labelledBy="result-title">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-6xl" aria-hidden>
          {isSuccess ? "🌟" : "✋"}
        </span>
        <DinoFace size={104} />

        <h2
          id="result-title"
          className="font-[family-name:var(--font-baloo)] text-3xl font-extrabold text-slate-800"
        >
          {title}
        </h2>
        <p className="max-w-md text-lg font-bold text-slate-600">{message}</p>

        <button
          type="button"
          onClick={onAction}
          className={`mt-2 min-h-14 rounded-3xl border-4 border-white/90 px-10 py-4 text-2xl font-extrabold text-white transition duration-150 hover:-translate-y-1 hover:brightness-110 active:translate-y-1 ${
            isSuccess
              ? "shadow-[0_8px_0_#3b7d21] hover:shadow-[0_12px_0_#3b7d21] active:shadow-[0_4px_0_#3b7d21]"
              : "shadow-[0_8px_0_#245f7e] hover:shadow-[0_12px_0_#245f7e] active:shadow-[0_4px_0_#245f7e]"
          }`}
          style={{
            background: isSuccess
              ? "linear-gradient(#6fca4a,#4da12c)"
              : "linear-gradient(#4aa9c9,#2f7fa8)",
          }}
        >
          {actionLabel}
        </button>
      </div>
    </Modal>
  );
}
