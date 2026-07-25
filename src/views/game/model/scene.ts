import type { CSSProperties } from "react";

/**
 * 아이소메트릭 복셀 씬의 순수 지오메트리.
 *
 * 3D 라이브러리 없이 CSS 3D transform 만으로 그린다. 상자 하나를 4개의 면(div)으로
 * 펼치고, 카메라 각도로 계산한 깊이(dep)로 정렬해 화가 알고리즘처럼 겹쳐 그린다.
 *
 * 이 파일은 순수 함수만 담는다 — React 도, 상태도, DOM 도 모른다.
 */

/** 월드 1칸의 픽셀 크기 */
export const UNIT = 20;

/** 원본 디자인 캔버스 크기. 이 비율을 유지한 채 화면에 맞춰 스케일한다. */
export const STAGE_WIDTH = 1040;
export const STAGE_HEIGHT = 720;

/** 카메라 기울기(위에서 내려다보는 각) */
const CAMERA_THETA_DEG = 52;

/**
 * 카메라 회전(수평으로 도는 각).
 *
 * 원본 프로토타입은 -24° 였다. 회전 이력: -24 → 66 → 156 → 66.
 *
 * 참고 — 180° 회전은 "뒷모습" 요구를 만족할 수 없다(뒷모습의 정반대는 앞모습).
 * 그리고 156° 에서만 신호등 패널이 카메라를 향해 빨강/초록이 보인다. 현재 66° 에서는
 * 패널이 반대편을 보므로 불빛이 화면에 안 나온다 — 신호 판단을 화면 밖 단서(말풍선·
 * 미션 체크)에 의존하게 되므로, 게임 기획 단계에서 다시 볼 것.
 *
 * ⚠️ 이 값 하나가 세 곳을 동시에 지배한다: CSS 카메라 transform, 면 깊이 정렬(depth),
 * 캐릭터 이동의 화면 방향(screenDelta). 셋이 어긋나면 겹침 순서가 뒤집히거나
 * 캐릭터가 엉뚱한 방향으로 걷는다. 그래서 상수 하나에서 전부 파생시킨다.
 */
const CAMERA_PHI_DEG = 66;

const CAMERA_THETA = (CAMERA_THETA_DEG * Math.PI) / 180;
const CAMERA_PHI = (CAMERA_PHI_DEG * Math.PI) / 180;
const CAMERA_SCALE = 0.7;

/**
 * 회전 후 씬이 스테이지 중앙에 오도록 하는 보정값.
 * 각도에 종속적이다 — 원본(-24°)의 (3,135) 를 156° 기준으로 실측해 다시 잡았다.
 * CAMERA_PHI_DEG 를 바꾸면 이 값도 다시 재야 한다(브라우저에서 면들의 bounding box
 * 중심을 재서 스테이지 중심 520,360 과의 차이를 넣는다).
 */
const CAMERA_OFFSET_X = -135;
const CAMERA_OFFSET_Y = 23;

/** 모든 면에 공통으로 적용되는 카메라 transform */
export const CAMERA_TRANSFORM =
  `translate(${CAMERA_OFFSET_X}px,${CAMERA_OFFSET_Y}px) scale(${CAMERA_SCALE}) rotateX(${CAMERA_THETA_DEG}deg) rotateZ(${CAMERA_PHI_DEG}deg)`;

export interface Face {
  /** 정렬용 깊이. 작을수록 뒤. */
  dep: number;
  style: CSSProperties;
}

/** hex 색을 배율만큼 밝게/어둡게 */
export function shade(hex: string, factor: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${clamp((n >> 16) & 255)},${clamp((n >> 8) & 255)},${clamp(n & 255)})`;
}

/** 면에 깔리는 격자 무늬 — 복셀 느낌을 주는 요소 */
function gridImage(): string {
  return (
    `repeating-linear-gradient(90deg, rgba(0,0,0,.09) 0 1px, rgba(0,0,0,0) 1px ${UNIT}px), ` +
    `repeating-linear-gradient(0deg, rgba(0,0,0,.09) 0 1px, rgba(0,0,0,0) 1px ${UNIT}px)`
  );
}

/** 월드 좌표의 화면상 깊이 */
export function depth(ex: number, ey: number, ez: number): number {
  return (
    Math.sin(CAMERA_THETA) * Math.sin(CAMERA_PHI) * ex +
    Math.sin(CAMERA_THETA) * Math.cos(CAMERA_PHI) * ey +
    Math.cos(CAMERA_THETA) * ez
  );
}

/** 월드 좌표 이동량을 화면 픽셀 이동량으로 */
export function screenDelta(
  ex: number,
  ey: number,
  ez: number,
): { dx: number; dy: number } {
  return {
    dx: CAMERA_SCALE * (Math.cos(CAMERA_PHI) * ex - Math.sin(CAMERA_PHI) * ey),
    dy:
      CAMERA_SCALE *
      (Math.cos(CAMERA_THETA) * Math.sin(CAMERA_PHI) * ex +
        Math.cos(CAMERA_THETA) * Math.cos(CAMERA_PHI) * ey -
        Math.sin(CAMERA_THETA) * ez),
  };
}

/**
 * 상자 하나를 4개 면으로 펼쳐 out 에 담는다.
 * (x,y,z) 는 월드 좌표, (w,dp,h) 는 가로·깊이·높이.
 */
function box(
  out: Face[],
  x: number,
  y: number,
  z: number,
  w: number,
  dp: number,
  h: number,
  col: string,
  topImage?: string,
  depthBias = 0,
): void {
  const U = UNIT;
  const g = gridImage();
  const C = CAMERA_TRANSFORM;
  const dep = depth((x + w / 2) * U, -(y + dp / 2) * U, (z + h / 2) * U) + depthBias;
  const base: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transformOrigin: "0 0",
    backgroundImage: g,
  };

  // 오른쪽 옆면
  out.push({
    dep,
    style: {
      ...base,
      width: dp * U,
      height: h * U,
      background: shade(col, 0.74),
      backgroundImage: g,
      transform: `${C} translate3d(${(x + w) * U}px,${-y * U}px,${(z + h) * U}px) rotateX(-90deg) rotateY(90deg)`,
    },
  });
  // 왼쪽 옆면
  out.push({
    dep,
    style: {
      ...base,
      width: dp * U,
      height: h * U,
      background: shade(col, 0.8),
      backgroundImage: g,
      transform: `${C} translate3d(${x * U}px,${-(y + dp) * U}px,${(z + h) * U}px) rotateX(-90deg) rotateY(-90deg)`,
    },
  });
  // 앞면
  out.push({
    dep,
    style: {
      ...base,
      width: w * U,
      height: h * U,
      background: shade(col, 0.9),
      backgroundImage: g,
      transform: `${C} translate3d(${x * U}px,${-y * U}px,${(z + h) * U}px) rotateX(-90deg)`,
    },
  });
  // 윗면
  out.push({
    dep,
    style: {
      ...base,
      width: w * U,
      height: dp * U,
      backgroundColor: shade(col, 1.14),
      backgroundImage: topImage ?? g,
      transform: `${C} translate3d(${x * U}px,${-(y + dp) * U}px,${(z + h) * U}px)`,
    },
  });
}

const GRASS = "#7cc153";
const ROAD = "#59606a";
const WALK = "#d9d2c4";
const STRIPE = "#f4f2ea";
const POST = "#3f454d";
const BROWN = "#8a5a34";
const LEAF = "#4f9b3c";

/** 도로·인도·신호등 기둥·나무·집 — 정적인 배경 월드 */
export function buildWorld(): Face[] {
  const faces: Face[] = [];
  const B = (
    x: number,
    y: number,
    z: number,
    w: number,
    dp: number,
    h: number,
    col: string,
    topImage?: string,
    depthBias?: number,
  ) => box(faces, x, y, z, w, dp, h, col, topImage, depthBias);

  const roadTop = shade(ROAD, 1.14);
  const stripes = `repeating-linear-gradient(90deg, ${STRIPE} 0 ${1.4 * UNIT}px, ${roadTop} ${1.4 * UNIT}px ${2.4 * UNIT}px)`;

  // 지면.
  //
  // 화가 알고리즘의 한계 보정 — 정렬 기준이 상자의 중심점 하나뿐이라, 34칸짜리
  // 인도·도로 슬래브는 중심이 그 위에 선 기둥·나무보다 앞으로 계산되어 덮어버린다.
  // 원본 카메라 각(-24°)에서는 우연히 드러나지 않았지만 66° 에서 기둥이 사라졌다.
  // 지면은 정의상 그 위의 모든 것보다 뒤이므로 큰 음수 바이어스로 항상 맨 뒤에 둔다.
  const GROUND = -1e6;
  B(-13, -11, 0, 34, 2, 0.5, GRASS, undefined, GROUND);
  B(-13, -9, 0, 34, 9, 1.2, WALK, undefined, GROUND);
  B(-13, 14, 0, 34, 8, 1.2, WALK, undefined, GROUND);
  B(-13, 0, 0, 13, 14, 1.05, ROAD, undefined, GROUND);
  B(12, 0, 0, 9, 14, 1.05, ROAD, undefined, GROUND);
  B(0, 0, 0, 12, 14, 1.05, ROAD, stripes, GROUND); // 횡단보도
  B(-13, 22, 0, 34, 6.5, 0.5, GRASS, undefined, GROUND);

  // 신호등 — 기둥의 수직축을 중심으로 원본에서 90° 돌려세웠다.
  //
  // 왜 90° 인가: 신호 패널은 두께 없는 평면이라 법선이 카메라를 향해야 보인다.
  // 원본 카메라(-24°)에서 정면이던 평면은 카메라를 +90° 돌린 지금 정확히 옆면이 되어
  // 두께 0으로 사라진다. 180° 로 뒤집어도 여전히 옆면이므로 소용이 없다.
  // 패널을 같이 90° 돌려야 법선이 카메라와 다시 정렬된다.
  //
  // 받침과 기둥은 축 대칭이라 좌표가 그대로고, 함체와 버튼함만 가로·세로가 뒤바뀐다.
  B(-3.6, 15.1, 1.2, 1.8, 1.8, 0.5, POST); // 받침
  B(-3.2, 15.5, 1.6, 1, 1, 8.2, POST); // 기둥
  B(-4.3, 14.4, 9.6, 2.1, 3.2, 4.1, POST); // 함체 (원본 3.2×2.1 → 2.1×3.2)
  B(-3.4, 14.65, 3.3, 0.4, 2.5, 3.1, "#4b525b"); // 버튼함 (원본 2.5×0.4 → 0.4×2.5)

  // 나무
  B(13.4, 15.2, 1.2, 1, 1, 2.4, BROWN);
  B(12.5, 14.3, 3.6, 2.8, 2.8, 2.4, LEAF);
  B(13.1, 14.9, 6, 1.6, 1.6, 1.4, "#5cae45");
  B(-6, 16.2, 1.2, 1, 1, 2.8, BROWN);
  B(-7, 15.2, 4, 3, 3, 2.6, LEAF);
  B(-6.4, 15.8, 6.6, 1.8, 1.8, 1.5, "#5cae45");
  B(20, 15.6, 1.2, 1, 1, 2.6, BROWN);
  B(19, 14.6, 3.8, 3, 3, 2.6, LEAF);

  // 집 두 채
  B(-10, 22.6, 0.5, 8.5, 5.4, 5.4, "#f0e0c2");
  B(-9, 23.4, 5.9, 6.5, 3.8, 1.6, "#c9583f");
  B(-7.6, 24.1, 7.5, 3.6, 2.2, 1.3, "#b94b34");
  B(-7.4, 22.4, 1, 2.2, 0.4, 3, "#8a5a34");
  B(5.5, 23, 0.5, 8, 5, 4.4, "#efe6d2");
  B(6.5, 23.8, 4.9, 6, 3.4, 1.5, "#5b8fbf");
  B(7.7, 24.6, 6.4, 3.6, 1.8, 1.3, "#4f7fac");

  // 울타리
  for (let i = 0; i < 6; i++) {
    B(-10.5 + i * 2.6, 21.2, 1.2, 0.5, 0.5, 1.5, "#f6f1e4");
  }

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}

/** 플레이어 캐릭터(공룡). 몸 색만 파라미터로 받는다. */
export function buildDino(bodyColor: string): Face[] {
  const faces: Face[] = [];
  const B = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    c: string,
  ) => box(faces, x + 3.6, y + 15.5, z + 1.2, w, d, h, c);

  const g = bodyColor;
  const ORANGE = "#f0871f";
  const DARK = "#26221f";
  const LIGHT = "#8ad25c";

  B(1.4, 3.3, 2.2, 2.2, 2.6, 1.6, g); // 꼬리
  B(1.8, 5.2, 2.8, 1.4, 1.4, 1.2, g);
  B(0.3, 1.3, 0, 1.7, 1.9, 2, g); // 다리
  B(3.1, 1.3, 0, 1.7, 1.9, 2, g);
  B(0.2, 1.9, -0.05, 1.9, 0.9, 0.5, "#4c8f2c"); // 발
  B(3, 1.9, -0.05, 1.9, 0.9, 0.5, "#4c8f2c");
  B(0, 0.7, 1.8, 5, 3.2, 3.9, g); // 몸통
  B(0.5, 0.35, 2.3, 4, 0.45, 2.6, LIGHT); // 배
  B(-0.6, 1.2, 3.4, 0.8, 1.5, 1.6, g); // 팔
  B(4.8, 1.2, 3.4, 0.8, 1.5, 1.6, g);
  B(0.2, -0.5, 5.5, 4.6, 3.3, 3.2, g); // 머리
  B(1.05, -1.6, 5.7, 2.9, 1.2, 1.9, LIGHT); // 주둥이
  B(1.3, -1.75, 6.05, 2.4, 0.2, 0.5, "#3c6f22");
  B(0.85, -0.72, 7.5, 1.1, 0.3, 1.1, "#fdfdf8"); // 눈 흰자
  B(3.05, -0.72, 7.5, 1.1, 0.3, 1.1, "#fdfdf8");
  B(1.05, -0.85, 7.7, 0.6, 0.25, 0.6, DARK); // 눈동자
  B(3.25, -0.85, 7.7, 0.6, 0.25, 0.6, DARK);
  B(1.5, -0.3, 8.7, 0.95, 0.95, 0.85, ORANGE); // 등지느러미
  B(1.5, 0.85, 8.7, 0.95, 0.95, 0.85, ORANGE);
  B(2, 1.9, 5.7, 0.95, 0.95, 0.85, ORANGE);
  B(2, 3, 5.35, 0.95, 0.95, 0.8, ORANGE);
  B(1.9, 4, 3.8, 0.85, 0.85, 0.75, ORANGE);
  B(0.9, 3.85, 2.6, 3.2, 1, 3, ORANGE);
  B(1.6, 3.6, 5.6, 1.8, 0.4, 0.5, shade(ORANGE, 0.85));
  B(1.5, 3.75, 3.6, 2, 0.35, 0.6, "#c96a11");

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}

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

/** 돌아간 함체에서 패널·버튼이 붙는 면의 x 좌표 */
export const SIGNAL_FACE_X = -4.35;
