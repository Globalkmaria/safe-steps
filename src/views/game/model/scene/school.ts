import { SCENE_CAMERA, box } from "./voxel";
import type { CameraConfig, Face } from "./voxel";

/**
 * 길 건너 학교 — 마지막 스텝의 목적지.
 *
 * 참고 이미지를 따랐다. 집과 갈리는 지점은 크기가 아니라 **표정**이다:
 *  - 모래빛 벽에 알록달록한 창 패널이 불규칙하게 박힌다(집은 단색에 창 두어 개)
 *  - 평지붕 + 짙은 회색 난간
 *  - 지붕선 위로 솟은 큰 간판 — 한눈에 "여기가 학교" 라고 말하는 요소
 *  - 어두운 차양 아래 들어간 현관, 계단, 화단
 */
export function buildSchool(cam: CameraConfig = SCENE_CAMERA): Face[] {
  const faces: Face[] = [];
  const B = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    c: string,
    depthBias = 0,
  ) => box(faces, cam, x, y, z, w, d, h, c, undefined, depthBias);

  /**
   * 벽이 14칸짜리 한 덩어리라, 중심점 하나로 정렬하면 벽 한쪽에 붙은 패널이
   * 벽 뒤로 밀려 사라진다(기둥이 지면에 먹혔던 것과 같은 문제).
   * 벽만 뒤로 밀어 벽에 붙는 것들이 항상 앞에 오게 한다.
   */
  const WALL_BACK = -400;

  const WALL = "#d3b47e";
  const PARAPET = "#4a4844";
  const ROOF = "#c7bba4";
  const SIGN_FRAME = "#3a3733";
  const SIGN_FACE = "#d9d29b";
  const SIGN_INK = "#2b2925";
  const CANOPY = "#3a3733";
  const STEP = "#b9bcbd";
  const PLANTER = "#7a4a2c";
  const BUSH = "#7cc153";

  const TEAL = "#45a5b8";
  const ORANGE = "#e07b39";
  const RED = "#d1503f";
  const PURPLE = "#8b5aa8";
  const LIME = "#8cc63f";
  const BLUE = "#4a7bb8";

  const X0 = 1.5;
  const W = 14;
  const FRONT = 23.0;
  const DEPTH = 6.4;
  const H = 7.2;
  const FACE = FRONT - 0.3; // 벽 앞에 붙는 것들의 y

  // 몸체
  B(X0, FRONT, 0.5, W, DEPTH, H, WALL, WALL_BACK);

  // 평지붕 — 짙은 난간을 네 줄로 두르고 안쪽을 채운다
  B(X0 + 0.3, FRONT + 0.3, H + 0.5, W - 0.6, DEPTH - 0.6, 0.4, ROOF);
  B(X0 - 0.3, FRONT - 0.3, H + 0.5, W + 0.6, 0.6, 1.0, PARAPET);
  B(X0 - 0.3, FRONT + DEPTH - 0.3, H + 0.5, W + 0.6, 0.6, 1.0, PARAPET);
  B(X0 - 0.3, FRONT - 0.3, H + 0.5, 0.6, DEPTH + 0.6, 1.0, PARAPET);
  B(X0 + W - 0.3, FRONT - 0.3, H + 0.5, 0.6, DEPTH + 0.6, 1.0, PARAPET);

  // 창 패널 — 크기도 색도 제각각인 것이 이 학교의 표정이다.
  // [x, z, 너비, 높이, 색]
  const PANELS: Array<[number, number, number, number, string]> = [
    [0.6, 1.0, 1.5, 3.0, TEAL],
    [2.4, 1.0, 1.2, 1.4, ORANGE],
    [2.4, 2.7, 1.2, 1.3, LIME],
    [2.4, 4.3, 1.2, 1.8, PURPLE],
    [0.6, 4.3, 1.5, 1.8, RED],
    [4.1, 1.0, 1.3, 2.0, BLUE],
    [4.1, 3.3, 1.3, 2.8, ORANGE],
    [9.6, 1.0, 1.4, 1.6, RED],
    [9.6, 2.9, 1.4, 3.2, TEAL],
    [11.4, 1.0, 1.2, 2.6, LIME],
    [11.4, 3.9, 1.2, 2.2, BLUE],
    [12.9, 1.0, 0.9, 5.1, ORANGE],
  ];
  for (const [px, pz, pw, ph, color] of PANELS) {
    B(X0 + px, FACE, pz, pw, 0.3, ph, color);
  }

  // 현관 — 어두운 차양 아래로 들어간 문
  const DOOR_X = X0 + 5.9;
  B(DOOR_X - 0.5, FACE - 0.5, 0.5, 3.6, 0.5, 0.6, CANOPY); // 문틀 아래
  B(DOOR_X, FACE - 0.2, 0.5, 1.2, 0.3, 4.0, TEAL);
  B(DOOR_X + 1.3, FACE - 0.2, 0.5, 1.2, 0.3, 4.0, ORANGE);
  B(DOOR_X - 0.6, FACE - 0.7, 4.5, 3.8, 0.9, 0.7, CANOPY); // 차양

  // 계단
  B(DOOR_X - 0.4, FACE - 1.3, 0.5, 3.4, 0.7, 0.35, STEP);
  B(DOOR_X - 0.7, FACE - 1.9, 0.5, 4.0, 0.6, 0.18, STEP);

  // 화단 — 현관 양옆
  B(X0 + 3.2, FACE - 1.6, 0.5, 2.2, 1.3, 0.7, PLANTER);
  B(X0 + 3.4, FACE - 1.4, 1.2, 1.8, 0.9, 0.7, BUSH);
  B(X0 + 9.0, FACE - 1.6, 0.5, 2.2, 1.3, 0.7, PLANTER);
  B(X0 + 9.2, FACE - 1.4, 1.2, 1.8, 0.9, 0.7, BUSH);

  // 간판 — 지붕 위로 솟는다. 이 학교의 얼굴이다.
  const SIGN_X = X0 + 6.2;
  const SIGN_Z = H - 0.6;
  B(SIGN_X - 0.2, FACE - 0.9, SIGN_Z, 5.2, 0.5, 3.6, SIGN_FRAME);
  B(SIGN_X + 0.2, FACE - 1.05, SIGN_Z + 0.45, 4.4, 0.3, 2.7, SIGN_FACE);
  // 글자 자리 — 이 크기에서 글씨는 안 읽히므로 두 줄의 잉크 띠로 암시한다
  B(SIGN_X + 0.7, FACE - 1.15, SIGN_Z + 1.95, 3.4, 0.25, 0.45, SIGN_INK);
  B(SIGN_X + 0.7, FACE - 1.15, SIGN_Z + 1.1, 2.7, 0.25, 0.45, SIGN_INK);

  // 깃발 — 지붕 위 깃대에 하나. 학교임을 알리는 또 하나의 신호다.
  const FLAG_YELLOW = "#f5c518";
  const FLAG_SHADE = "#d9a209";

  const POLE_X = X0 + 11.4;
  const POLE_Y = FRONT + 2.4;
  const POLE_Z = H + 0.9; // 지붕면 위
  const POLE_H = 5.6;
  B(POLE_X, POLE_Y, POLE_Z, 0.3, 0.3, POLE_H, "#e8e4da");
  B(POLE_X - 0.15, POLE_Y - 0.15, POLE_Z + POLE_H, 0.6, 0.6, 0.35, "#d8ac3a"); // 깃봉

  // 펄럭이는 결은 폭을 정확히 나눠 갖는 세로 띠로 낸다. 좁은 조각을 깃발 앞에
  // 덧대면 깊이 정렬에서 밀려 나와 별개의 판때기 세 장처럼 보인다 — 겹치지 않게
  // 타일링하면 그 문제가 아예 생기지 않는다.
  const FLAG_W = 3.2;
  const FLAG_H = 2.38;
  const FLAG_BANDS = 4;
  const BAND_W = FLAG_W / FLAG_BANDS;
  const FLAG_Z = POLE_Z + POLE_H - FLAG_H - 0.25;
  for (let i = 0; i < FLAG_BANDS; i++) {
    B(
      POLE_X + 0.28 + i * BAND_W,
      POLE_Y + 0.03,
      FLAG_Z,
      BAND_W,
      0.22,
      FLAG_H,
      i % 2 === 0 ? FLAG_YELLOW : FLAG_SHADE,
    );
  }

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}
