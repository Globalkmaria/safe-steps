"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

const FOCUSABLE = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * 다이얼로그 안에서 Tab 을 돌린다.
 *
 * `aria-modal="true"` 를 선언하면 "밖으로 못 나간다"는 약속을 한 것이므로 실제로
 * 지켜야 한다. 배경을 inert 로 막는 것만으로는 부족하다 — 마지막 요소에서 Tab 을
 * 누르면 포커스가 페이지 밖(브라우저 주소창)으로 빠져나가고, 몇 번 더 눌러야 돌아온다.
 * 포커스 표시가 화면에서 사라졌다 나타나는 건 아이에게 특히 불안정하게 읽힌다.
 *
 * 리스너는 컨테이너가 아니라 document 에 건다. 다이얼로그 안이라도 포커스 불가한 곳
 * (제목, 그림)을 클릭하면 포커스가 body 로 빠지는데, 그러면 컨테이너까지 이벤트가
 * 올라오지 않아 트랩이 통째로 잠든다. 지금은 배경이 inert 라 tab 순서에 남는 게
 * 다이얼로그뿐이라 우연히 복구되지만, 그건 트랩이 한 일이 아니다 —
 * inert 를 빠뜨린 다이얼로그가 하나 생기는 순간 포커스가 그대로 새어 나간다.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      const active = document.activeElement;
      const inside = active instanceof Node && el.contains(active);

      // 밖에 있으면 방향에 맞는 끝으로 데려온다. 안에 있으면 양 끝에서만 감는다.
      if (!inside) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [ref]);
}
