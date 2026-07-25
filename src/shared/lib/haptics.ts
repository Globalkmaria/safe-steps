/**
 * Capability: 햅틱(진동).
 *
 * 지원 현황 — Android Chrome 계열만 동작한다. iOS Safari 는 어떤 버전에서도
 * Vibration API 를 제공하지 않는다(2026-07 기준). DOM 을 감싸는 폴리필은
 * 접근성·클릭 처리와 충돌해 채택하지 않았다.
 *
 * 정책 — 안드로이드 전용 보너스. 진동이 없어도 제품은 완전히 동작해야 하며,
 * 피드백의 주 채널이 될 수 없다(시각 + 오디오가 주 채널).
 *
 * 호출부는 밀리초 배열이 아니라 의도를 전달한다.
 */

export type HapticIntent = "tap" | "success" | "error";

const PATTERNS: Record<HapticIntent, VibratePattern> = {
  /** 버튼을 눌렀다 */
  tap: 12,
  /** 잘했다 */
  success: [18, 60, 18],
  /** 지금 건너면 위험하다 */
  error: [40, 70, 40],
};

function isSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** 미지원 환경에서는 조용히 아무 일도 하지 않는다. */
export function haptic(intent: HapticIntent): void {
  if (!isSupported()) return;
  try {
    navigator.vibrate(PATTERNS[intent]);
  } catch {
    // 무시 — 햅틱은 부가 기능이다.
  }
}
