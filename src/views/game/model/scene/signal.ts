/** 신호등 패널의 픽셀 도트 — 손바닥(정지) / 걷는 사람(보행) */
const HAND_PIXELS = ["..1..", ".111.", "11111", "11111", "11111", ".111."];
const WALK_PIXELS = [
  "..11..",
  "..11..",
  ".1111.",
  "11111.",
  ".111..",
  ".1.1..",
  "1..11.",
  "1...11",
];

export function signalPixels(isGreen: boolean): { rows: string[]; columns: number } {
  const rows = isGreen ? WALK_PIXELS : HAND_PIXELS;
  return { rows, columns: rows[0]?.length ?? 0 };
}

/** 신호등을 기둥의 수직축으로 돌린 각. 함체 AABB 회전과 짝을 이룬다. */
export const SIGNAL_TURN_DEG = -90;

/**
 * 신호등 머리 크기 배율(원본 = 1).
 *
 * 이 게임에서 아이가 "지금 건너도 되는가" 를 판단할 근거는 신호색 하나뿐인데,
 * 씬은 화면에 맞춰 축소돼 렌더되므로 원본 크기로는 정작 읽어야 할 것이 가장 안 읽힌다.
 * 함체와 패널이 이 값 하나로 같이 커진다.
 */
export const SIGNAL_SCALE = 1.4;

/** 기둥 중심 y. 함체와 패널을 여기에 맞춰 세운다. */
export const POST_CENTER_Y = 16.0;

export const HEAD_W = 2.1 * SIGNAL_SCALE;
export const HEAD_D = 3.2 * SIGNAL_SCALE;
export const HEAD_H = 4.1 * SIGNAL_SCALE;
/** 기둥 바깥면(-2.2)에 붙이고 카메라 쪽으로 자란다 */
export const HEAD_X = -2.2 - HEAD_W;
export const HEAD_Y = POST_CENTER_Y - HEAD_D / 2;
export const HEAD_Z = 9.6;

/** 패널이 붙는 함체 앞면 — 살짝 띄워 z-fighting 을 피한다 */
export const SIGNAL_FACE_X = HEAD_X - 0.05;
export const SIGNAL_PANEL_W = 2.5 * SIGNAL_SCALE;
export const SIGNAL_PANEL_H = 3.1 * SIGNAL_SCALE;
/** 함체 앞면 안에서 가로·세로 모두 가운데 */
export const SIGNAL_PANEL_Y = POST_CENTER_Y - SIGNAL_PANEL_W / 2;
export const SIGNAL_PANEL_Z = HEAD_Z + HEAD_H - (HEAD_H - SIGNAL_PANEL_H) / 2;
