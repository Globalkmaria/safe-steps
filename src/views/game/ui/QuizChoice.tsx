import type { ReactNode } from "react";

/**
 * 퀴즈 선택지 버튼의 껍데기. 네 퀴즈가 공유한다 — 각자 두면 긴 클래스 문자열이
 * 소리 없이 갈린다.
 *
 * 가운데 미리보기는 퀴즈마다 다르므로 children 으로 받는다. hover 반응이 필요하면
 * group-hover 로 각자 붙인다 — button 에 group 이 있다.
 */
export function QuizChoice({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-14 flex-col items-center gap-2 rounded-3xl border-4 border-white bg-white/70 p-3 shadow-[0_8px_0_rgba(30,60,80,.16)] transition duration-150 hover:-translate-y-1 hover:border-sky-200 hover:bg-white hover:shadow-[0_12px_0_rgba(30,60,80,.2)] active:translate-y-1 active:shadow-[0_4px_0_rgba(30,60,80,.16)]"
    >
      {children}
      <span className="text-lg font-extrabold text-slate-700 transition group-hover:text-slate-900">
        {label}
      </span>
    </button>
  );
}
