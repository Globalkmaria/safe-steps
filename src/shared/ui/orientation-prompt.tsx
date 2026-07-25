"use client";

import type { ReactNode } from "react";
import { useMediaQuery } from "@/shared/lib/use-media-query";

/**
 * 세로가 긴 화면(높이 > 너비)에서는 콘텐츠 대신 전면 안내를 렌더링한다.
 *
 * 설계 근거
 * - 게임 화면이 좌(이동 버튼) · 중앙(장면) · 우(옵션) 3열이라 가로가 항상 길어야 한다.
 *   편의가 아니라 동작 조건이다.
 * - 닫기 버튼이 없다. 방향이 가로가 되는 순간 스스로 사라지므로 닫을 이유가 없다.
 * - 모달을 덮는 대신 콘텐츠 "자리에" 렌더링한다. DOM 에 다른 것이 없으므로
 *   포커스 트랩·aria-modal 문제가 애초에 생기지 않는다.
 * - 기기 종류를 가리지 않는다. 데스크톱에서 창을 세로로 길게 띄운 경우도 대상이다.
 *   단 문구는 갈린다 — 노트북 사용자에게 "기기를 돌리라"고 할 수는 없다.
 */
export function OrientationPrompt({ children }: { children: ReactNode }) {
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isTouch = useMediaQuery("(pointer: coarse)");

  // 서버 렌더 시점에는 판단할 수 없다. 콘텐츠를 먼저 보여주고,
  // 하이드레이션 후 세로면 안내로 교체한다.
  if (isPortrait !== true) return <>{children}</>;

  return (
    <div
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-sky-50 p-8 text-center"
    >
      <span className="animate-[rotate-hint_2.4s_ease-in-out_infinite] text-7xl" aria-hidden>
        📱
      </span>

      {isTouch ? (
        <>
          <h1 className="text-3xl font-extrabold text-slate-800">Turn your device sideways!</h1>
          <p className="max-w-sm text-lg text-slate-600">
            Safe Steps needs the wide view. Rotate your device to landscape and we will jump right
            back in.
          </p>
          <p className="max-w-sm text-sm text-slate-500">
            Screen not turning? Rotation Lock might be on. Open Control Center (iPhone or iPad) or
            Quick Settings (Android), turn the lock off, then rotate again.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-extrabold text-slate-800">Make this window wider!</h1>
          <p className="max-w-sm text-lg text-slate-600">
            Safe Steps needs the wide view. Stretch your browser window until it is wider than it is
            tall, and we will jump right back in.
          </p>
        </>
      )}
    </div>
  );
}
