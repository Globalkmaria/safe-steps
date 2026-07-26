"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * 화면 전체를 덮는 단순한 대화상자.
 *
 * 닫기 버튼이 없다 — 아이가 답을 고르거나 다시 시도를 누를 때까지 유지되는 것이
 * 이 게임의 흐름이라, 바깥 클릭·ESC 로 빠져나가는 경로를 두지 않는다.
 * 대신 열릴 때 포커스를 안으로 옮겨 키보드 사용자가 곧바로 선택할 수 있게 한다.
 *
 * 내용이 화면보다 높으면 통째로 축소한다. 팝업마다 글자·그림 크기를 따로 손보는 대신
 * 껍데기 한 곳에서 처리하므로, 새 팝업을 추가해도 자동으로 같은 규칙을 따른다.
 */
export function Modal({
  labelledBy,
  children,
}: {
  labelledBy: string;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ frame: 0, card: 0 });

  useEffect(() => {
    const first = cardRef.current?.querySelector<HTMLElement>("button");
    first?.focus();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const card = cardRef.current;
    if (!frame || !card) return;

    // transform 은 레이아웃 크기를 바꾸지 않으므로 offsetHeight 는 늘 원래 높이다.
    // 되먹임 없이 안정적으로 측정된다.
    const measure = () =>
      setSize({ frame: frame.clientHeight, card: card.offsetHeight });

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const scale = size.frame && size.card ? Math.min(1, size.frame / size.card) : 1;

  return (
    // fixed 는 body 여백을 무시하므로 직접 같은 만큼 안쪽에 붙인다
    <div
      className="fixed z-50 bg-slate-900/45 p-2 backdrop-blur-sm sm:p-4"
      style={{ inset: "var(--app-inset)" }}
    >
      <div ref={frameRef} className="flex h-full w-full items-center justify-center">
        {/*
          축소한 뒤의 높이를 자리로 잡아준다. 이게 없으면 원래 높이를 기준으로 가운데
          정렬돼서, 줄어든 팝업이 위아래 어느 한쪽으로 밀린다.
        */}
        <div
          className="w-full max-w-2xl"
          style={{ height: size.card ? size.card * scale : undefined }}
        >
          {/* 맞춤 축소와 등장 애니메이션을 다른 요소에 건다 — 한 요소에 두면
              ss-pop 이 transform: scale(1) 로 끝나며 축소를 덮어쓴다. */}
          <div
            ref={cardRef}
            style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              className="rounded-[2rem] border-8 border-white bg-[#fffdf7] p-4 shadow-[0_18px_0_rgba(30,60,80,.18),0_28px_60px_rgba(20,50,70,.28)] sm:p-6"
              style={{ animation: "ss-pop .35s cubic-bezier(.2,1.4,.5,1) both" }}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
