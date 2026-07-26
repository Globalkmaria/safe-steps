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
 * 컨테이너에 리스너를 건다 — 포커스가 안에 있을 때만 개입하면 되기 때문이다.
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

      // 버튼이 하나뿐이면 어느 방향이든 자기 자신으로 되돌린다.
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [ref]);
}
