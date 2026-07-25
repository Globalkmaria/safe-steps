"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * 화면 전체를 덮는 단순한 대화상자.
 *
 * 닫기 버튼이 없다 — 아이가 답을 고르거나 다시 시도를 누를 때까지 유지되는 것이
 * 이 게임의 흐름이라, 바깥 클릭·ESC 로 빠져나가는 경로를 두지 않는다.
 * 대신 열릴 때 포커스를 안으로 옮겨 키보드 사용자가 곧바로 선택할 수 있게 한다.
 */
export function Modal({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("button");
    first?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full max-w-2xl rounded-[2rem] border-8 border-white bg-[#fffdf7] p-6 shadow-[0_18px_0_rgba(30,60,80,.18),0_28px_60px_rgba(20,50,70,.28)]"
        style={{ animation: "ss-pop .35s cubic-bezier(.2,1.4,.5,1) both" }}
      >
        {children}
      </div>
    </div>
  );
}
