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

/**
 * 월드 좌표 이동량을 화면 픽셀 이동량으로.
 *
 * 소수 3자리로 끊는다 — 이 값이 인라인 style 의 transform 문자열이 되는데,
 * 서버가 찍은 `-268.5823645469246px` 를 브라우저는 `-268.582px` 로 정규화해서
 * hydration mismatch 경고가 난다. 렌더 결과에는 차이가 없는 자릿수다.
 */
export function screenDelta(
  ex: number,
  ey: number,
  ez: number,
): { dx: number; dy: number } {
  const round = (v: number) => Math.round(v * 1000) / 1000;
  return {
    dx: round(CAMERA_SCALE * (Math.cos(CAMERA_PHI) * ex - Math.sin(CAMERA_PHI) * ey)),
    dy: round(
      CAMERA_SCALE *
        (Math.cos(CAMERA_THETA) * Math.sin(CAMERA_PHI) * ex +
          Math.cos(CAMERA_THETA) * Math.cos(CAMERA_PHI) * ey -
          Math.sin(CAMERA_THETA) * ez),
    ),
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
  // 0deg = 가로 줄무늬. 원본은 90deg(세로)였는데, 카메라를 90° 돌리면서 줄무늬가
  // 진행 방향과 어긋났다. 텍스처도 같이 90° 돌린다.
  const stripes = `repeating-linear-gradient(0deg, ${STRIPE} 0 ${1.4 * UNIT}px, ${roadTop} ${1.4 * UNIT}px ${2.4 * UNIT}px)`;

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
  B(HEAD_X, HEAD_Y, HEAD_Z, HEAD_W, HEAD_D, HEAD_H, POST); // 함체
  B(-3.4, 14.65, 3.3, 0.4, 2.5, 3.1, "#4b525b"); // 제어함

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

/**
 * 캐릭터가 서 있는 기준 월드 y. buildDino 가 이 자리에 모델을 세우고,
 * 화면상 이동은 이 값과 현재 y 의 차이로 계산한다.
 */
export const DINO_BUILD_Y = 15.5;

/** 플레이어 캐릭터(공룡). 몸 색만 파라미터로 받는다. */
export function buildDino(bodyColor: string): Face[] {
  const faces: Face[] = [];

  // 원본 모델은 -y 를 향한다. 진행 방향을 왼쪽→오른쪽으로 뒤집었으므로 캐릭터도
  // 180° 돌려 세워야 뒤로 걷는 것처럼 보이지 않는다. 좌표를 26개 손으로 고치는 대신
  // 상자 목록을 먼저 모아 경계를 재고, 그 중심을 축으로 뒤집는다 — 제자리는 유지된다.
  const specs: Array<[number, number, number, number, number, number, string]> = [];
  const B = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    c: string,
  ) => {
    specs.push([x, y, z, w, d, h, c]);
  };

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

  // 수직축 180° 회전 = x·y 를 각 축의 경계 중심으로 반사. AABB 이므로
  // 시작 좌표는 (2*중심 − 시작 − 길이) 가 되고 크기는 그대로다.
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y, , w, d] of specs) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + w);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + d);
  }
  const spanX = minX + maxX;
  const spanY = minY + maxY;

  for (const [x, y, z, w, d, h, c] of specs) {
    box(faces, spanX - x - w + 3.6, spanY - y - d + DINO_BUILD_Y, z + 1.2, w, d, h, c);
  }

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

/**
 * 신호등 머리 크기 배율(원본 = 1).
 *
 * 이 게임에서 아이가 "지금 건너도 되는가" 를 판단할 근거는 신호색 하나뿐이다.
 * 씬이 중앙 열(약 512px)에 맞춰 절반 크기로 축소돼 렌더되므로, 원본 크기로는
 * 정작 읽어야 할 것이 가장 안 읽힌다. 함체와 패널이 이 값 하나로 같이 커진다.
 */
const SIGNAL_SCALE = 1.4;

/** 기둥 중심 y. 함체와 패널을 여기에 맞춰 세운다. */
const POST_CENTER_Y = 16.0;

const HEAD_W = 2.1 * SIGNAL_SCALE;
const HEAD_D = 3.2 * SIGNAL_SCALE;
const HEAD_H = 4.1 * SIGNAL_SCALE;
/** 기둥 바깥면(-2.2)에 붙이고 카메라 쪽으로 자란다 */
const HEAD_X = -2.2 - HEAD_W;
const HEAD_Y = POST_CENTER_Y - HEAD_D / 2;
const HEAD_Z = 9.6;

/** 패널이 붙는 함체 앞면 — 살짝 띄워 z-fighting 을 피한다 */
export const SIGNAL_FACE_X = HEAD_X - 0.05;
export const SIGNAL_PANEL_W = 2.5 * SIGNAL_SCALE;
export const SIGNAL_PANEL_H = 3.1 * SIGNAL_SCALE;
/** 함체 앞면 안에서 가로·세로 모두 가운데 */
export const SIGNAL_PANEL_Y = POST_CENTER_Y - SIGNAL_PANEL_W / 2;
export const SIGNAL_PANEL_Z = HEAD_Z + HEAD_H - (HEAD_H - SIGNAL_PANEL_H) / 2;
