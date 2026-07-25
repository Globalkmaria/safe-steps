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

const CAMERA_SCALE = 0.7;

/**
 * 회전 후 씬이 스테이지 중앙에 오도록 하는 보정값.
 * 각도와 지면 범위에 종속적이다 — 카메라 각이나 월드 크기를 바꾸면 다시 재야 한다.
 * CAMERA_PHI_DEG 를 바꾸면 이 값도 다시 재야 한다(브라우저에서 면들의 bounding box
 * 중심을 재서 스테이지 중심 520,360 과의 차이를 넣는다).
 */
const CAMERA_OFFSET_X = -109;
const CAMERA_OFFSET_Y = 27;


/**
 * 카메라 설정. 같은 복셀 모델을 다른 각도로 그리기 위해 파라미터로 뺐다 —
 * 씬은 캐릭터 뒷모습을 보지만, 팝업의 초상은 정면을 봐야 한다.
 */
export interface CameraConfig {
  thetaDeg: number;
  phiDeg: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** 게임 화면의 카메라 */
export const SCENE_CAMERA: CameraConfig = {
  thetaDeg: CAMERA_THETA_DEG,
  phiDeg: CAMERA_PHI_DEG,
  scale: CAMERA_SCALE,
  offsetX: CAMERA_OFFSET_X,
  offsetY: CAMERA_OFFSET_Y,
};

/**
 * 팝업 초상용 카메라.
 *
 * phiDeg 0/180 처럼 90의 배수여야 상자의 한 면이 카메라와 정면으로 마주 본다 —
 * 씬처럼 비스듬한 각이면 얼굴이 3/4 측면으로 보인다. 캐릭터가 +y 를 향하므로 180 이다.
 * thetaDeg 는 클수록 눈높이다(작을수록 위에서 내려다본다).
 * 중앙 정렬은 DinoFace 의 PORTRAIT_NUDGE 가 맡는다.
 */
export const PORTRAIT_CAMERA: CameraConfig = {
  thetaDeg: 78,
  phiDeg: 180,
  scale: 1.35,
  offsetX: 0,
  offsetY: 0,
};

/**
 * 팝업 선택지 썸네일용 카메라. 초상보다 훨씬 작게 잡는다 — 피자 한 판은
 * 캐릭터 머리보다 크므로 같은 배율로는 상자를 넘친다.
 */
export const THUMB_CAMERA: CameraConfig = {
  thetaDeg: 58,
  phiDeg: 205,
  scale: 0.62,
  offsetX: 0,
  offsetY: 0,
};

/**
 * 헬멧 썸네일용 카메라.
 *
 * 헬멧의 얼굴 구멍은 앞(-y)을 향한다. 그 구멍이 보이려면 카메라가 앞쪽에 있어야 하므로
 * phi 를 0 근처로 두되, 정면 정통은 밋밋하니 살짝 틀어 3/4 로 본다.
 */
export const HELMET_CAMERA: CameraConfig = {
  thetaDeg: 62,
  phiDeg: 26,
  scale: 0.6,
  offsetX: 0,
  offsetY: 0,
};

/**
 * 자전거를 탄 옆모습용 카메라. 초상과 같은 눈높이지만 90° 돌려 측면을 본다 —
 * 자전거를 타고 지나가는 것은 옆에서 봐야 읽힌다.
 */
export const PROFILE_CAMERA: CameraConfig = {
  thetaDeg: 78,
  phiDeg: 90,
  scale: 0.52,
  offsetX: 0,
  offsetY: 0,
};

function cameraTransform(c: CameraConfig): string {
  return `translate(${c.offsetX}px,${c.offsetY}px) scale(${c.scale}) rotateX(${c.thetaDeg}deg) rotateZ(${c.phiDeg}deg)`;
}

const CAMERA_THETA = (CAMERA_THETA_DEG * Math.PI) / 180;
const CAMERA_PHI = (CAMERA_PHI_DEG * Math.PI) / 180;

/** 씬 카메라의 transform — 신호등 패널처럼 씬에 직접 얹는 요소가 쓴다 */
export const CAMERA_TRANSFORM = cameraTransform(SCENE_CAMERA);

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
 * 월드의 한 점이 그룹 원점 기준 화면 어디에 찍히는지.
 * 팔을 어깨에서 돌리려면 transform-origin 을 그 지점에 둬야 한다.
 */
export function projectPoint(
  cam: CameraConfig,
  x: number,
  y: number,
  z: number,
): { x: number; y: number } {
  const th = (cam.thetaDeg * Math.PI) / 180;
  const ph = (cam.phiDeg * Math.PI) / 180;
  const X = x * UNIT;
  const Y = -y * UNIT;
  const Z = z * UNIT;
  const rx = X * Math.cos(ph) - Y * Math.sin(ph);
  const ry = X * Math.sin(ph) + Y * Math.cos(ph);
  return {
    x: cam.offsetX + cam.scale * rx,
    y: cam.offsetY + cam.scale * (ry * Math.cos(th) - Z * Math.sin(th)),
  };
}

/**
 * 상자 하나를 4개 면으로 펼쳐 out 에 담는다.
 * (x,y,z) 는 월드 좌표, (w,dp,h) 는 가로·깊이·높이.
 */
function box(
  out: Face[],
  cam: CameraConfig,
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
  const C = cameraTransform(cam);
  const th = (cam.thetaDeg * Math.PI) / 180;
  const ph = (cam.phiDeg * Math.PI) / 180;
  const ex = (x + w / 2) * U;
  const ey = -(y + dp / 2) * U;
  const ez = (z + h / 2) * U;
  const dep =
    Math.sin(th) * Math.sin(ph) * ex +
    Math.sin(th) * Math.cos(ph) * ey +
    Math.cos(th) * ez +
    depthBias;
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
  ) => box(faces, SCENE_CAMERA, x, y, z, w, dp, h, col, topImage, depthBias);

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
  // 집이 캐릭터 출발 쪽으로 옮겨갔으므로 잔디밭 깊이도 양쪽을 맞바꾼다 —
  // 집이 앉을 자리가 필요한 쪽은 이제 가까운 쪽(y 음수)이다.
  B(-13, -15.5, 0, 34, 6.5, 0.5, GRASS, undefined, GROUND);
  B(-13, -9, 0, 34, 9, 1.2, WALK, undefined, GROUND);
  B(-13, 14, 0, 34, 8, 1.2, WALK, undefined, GROUND);
  // 도로는 x −13~21 을 세 구간으로 나눠 쓴다: 평범한 도로 / 횡단보도 / 평범한 도로.
  // 전체 폭은 인도·잔디와 같아야 하므로 고정이고, 경계만 움직여 비율을 바꾼다.
  // 횡단보도를 넓히면 그만큼 양옆 도로가 줄어든다.
  const CROSSING_X0 = -9;
  const CROSSING_X1 = 17;
  B(-13, 0, 0, CROSSING_X0 - -13, 14, 1.05, ROAD, undefined, GROUND);
  B(CROSSING_X1, 0, 0, 21 - CROSSING_X1, 14, 1.05, ROAD, undefined, GROUND);
  B(CROSSING_X0, 0, 0, CROSSING_X1 - CROSSING_X0, 14, 1.05, ROAD, stripes, GROUND); // 횡단보도
  B(-13, 22, 0, 34, 7, 0.5, GRASS, undefined, GROUND); // 건너편 — 학교가 앉는다

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

  // 집 두 채 + 울타리 — 캐릭터가 출발하는 가까운 쪽 잔디밭으로 옮겼다.
  //
  // 평행이동이 아니라 **반사**다. 그냥 옮기면 현관문과 지붕 굴뚝이 도로 반대편을
  // 보게 된다. HOUSE_MIRROR_Y 축으로 뒤집으면 앞뒤가 같이 뒤집혀 문이 도로를 향한다.
  // 축 값은 원래 자리(y 22.4~28.4)가 새 잔디밭에 정확히 앉도록 잡은 것이다.
  const HOUSE_MIRROR_Y = 6.65;
  const H = (
    x: number,
    y: number,
    z: number,
    w: number,
    dp: number,
    h: number,
    col: string,
  ) => B(x, 2 * HOUSE_MIRROR_Y - y - dp, z, w, dp, h, col);

  H(-10, 22.6, 0.5, 8.5, 5.4, 5.4, "#f0e0c2"); // 집 1
  H(-9, 23.4, 5.9, 6.5, 3.8, 1.6, "#c9583f");
  H(-7.6, 24.1, 7.5, 3.6, 2.2, 1.3, "#b94b34");
  H(-7.4, 22.4, 1, 2.2, 0.4, 3, "#8a5a34"); // 현관문 — 도로를 향한다
  H(5.5, 23, 0.5, 8, 5, 4.4, "#efe6d2"); // 집 2
  H(6.5, 23.8, 4.9, 6, 3.4, 1.5, "#5b8fbf");
  H(7.7, 24.6, 6.4, 3.6, 1.8, 1.3, "#4f7fac");

  // 울타리 — 집과 한 세트라 같이 반사한다
  for (let i = 0; i < 6; i++) {
    H(-10.5 + i * 2.6, 21.2, 1.2, 0.5, 0.5, 1.5, "#f6f1e4");
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
export interface DinoOptions {
  /** 머리에 헬멧을 씌운다 — 자전거 스텝을 통과한 뒤의 모습 */
  withHelmet?: boolean;
  /** 안장에 앉도록 통째로 들어올린다(자전거를 탈 때) */
  lift?: number;
  /** 앞치마를 두르고, 인사하는 팔은 따로 그리도록 한쪽을 비운다(엄마 공룡) */
  apron?: { color: string; trim: string };
  /**
   * 카메라를 등지게 세운다.
   *
   * 원본 스펙은 -y 를 보고 있고, 기본값은 그것을 뒤집어 +y(카메라 쪽)를 보게 한다.
   * 뒤집기를 끄면 원래대로 -y 를 보므로 정면 카메라에서는 뒷모습이 된다.
   */
  faceAway?: boolean;
}

export function buildDino(
  bodyColor: string,
  cam: CameraConfig = SCENE_CAMERA,
  options: DinoOptions = {},
): Face[] {
  const { withHelmet = false, lift = 0, apron, faceAway = false } = options;
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
    // 엄마는 오른팔을 들어 인사하므로 몸통에서 빼고 따로 그린다.
    // 팔은 0.8×1.5×1.6 두 개뿐이라 치수로 구분하고, 그중 x 가 작은 쪽을 뺀다.
    if (apron && w === 0.8 && d === 1.5 && h === 1.6 && x > 4) continue;
    const fx = faceAway ? x : spanX - x - w;
    const fy = faceAway ? y : spanY - y - d;
    box(faces, cam, fx + 3.6, fy + DINO_BUILD_Y, z + 1.2 + lift, w, d, h, c);
  }

  if (apron) {
    const MB = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
      box(faces, cam, x, y, z, w, d, h, c);
    const { color: apronColor, trim: apronTrim } = apron;
    // 앞치마 — 배(+y 쪽) 앞면에 덧댄다
    MB(4.1, 20.0, 2.0, 4.0, 0.35, 3.6, apronColor);
    MB(4.1, 19.98, 2.0, 4.0, 0.4, 0.4, apronTrim); // 아랫단
    MB(4.5, 19.98, 5.4, 0.5, 0.4, 1.4, apronTrim); // 어깨끈
    MB(7.2, 19.98, 5.4, 0.5, 0.4, 1.4, apronTrim);
    MB(4.1, 19.98, 4.0, 4.0, 0.4, 0.35, apronTrim); // 허리끈
  }

  if (withHelmet) {
    // 머리 상자를 뒤집은 뒤의 실제 위치에 맞춰 씌운다. 좌표를 손으로 적으면 모델이
    // 바뀔 때 헬멧만 허공에 남으므로, 머리 스펙에서 그때그때 계산한다.
    const head = specs.find((sp) => sp[3] === 4.6 && sp[4] === 3.3);
    if (head) {
      const [hx, hy, hz, hw, hd, hh] = head;
      const cx = (faceAway ? hx : spanX - hx - hw) + 3.6 + hw / 2;
      const cy = (faceAway ? hy : spanY - hy - hd) + DINO_BUILD_Y + hd / 2;
      const top = hz + 1.2 + lift + hh;

      const HB = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
        box(faces, cam, x, y, z, w, d, h, c);
      const CELL = 0.62;
      const SHELL = "#c8302c";
      const SHELL_TOP = "#dc4038";

      // 머리를 덮는 작은 돔 — 정수리에서 아래로 살짝 내려앉게 시작점을 낮춘다
      for (let i = 0; i < 4; i++) {
        const r = 2.45 * Math.cos(((i / 4) * Math.PI) / 2.5);
        const z = top - 0.45 + i * CELL;
        const steps = Math.ceil(r / CELL) + 1;
        for (let ix = -steps; ix <= steps; ix++) {
          for (let iy = -steps; iy <= steps; iy++) {
            const x = ix * CELL;
            const y = iy * CELL;
            if (Math.hypot(x + CELL / 2, y + CELL / 2) > r) continue;
            HB(cx + x, cy + y, z, CELL, CELL, CELL + 0.04, i > 1 ? SHELL_TOP : SHELL);
          }
        }
      }
      // 챙 — 캐릭터가 +y 를 보므로 그쪽에 붙인다
      HB(cx - 1.7, cy + (faceAway ? -2.1 : 1.7), top - 0.45, 3.4, 0.8, 0.4, "#c3c9ce");
    }
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

/* ── 소품 복셀 모델 ──────────────────────────────────────────────
 * 팝업 선택지와 자전거를 씬과 같은 복셀 렌더러로 짓는다. 평면 도트로 그리면
 * 캐릭터·신호등과 그림체가 갈라지므로, 같은 box() 를 써서 한 벌로 맞춘다.
 */

const TYRE = "#1c1f22";
const FRAME = "#9aa4ab";

/**
 * 바퀴 — 작은 정육면체를 원둘레에 늘어놓아 링을 만든다.
 *
 * 자전거는 **y-z 평면**에 짓는다. 프로필 카메라(phi 90°)는 x 축을 따라 보므로,
 * x-z 평면에 지으면 자전거가 두께 0의 옆면으로 사라진다.
 */
function ring(
  push: (x: number, y: number, z: number, w: number, d: number, h: number, c: string) => void,
  cy: number,
  cz: number,
  radius: number,
  cube: number,
  color: string,
  steps = 22,
): void {
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    push(
      0,
      cy + Math.cos(a) * radius - cube / 2,
      cz + Math.sin(a) * radius - cube / 2,
      cube,
      cube,
      cube,
      color,
    );
  }
}

/** 옆에서 본 자전거. 캐릭터가 그 위에 올라탄다. */
/** 인사하는 팔이 돌아갈 어깨의 월드 좌표 */
export const MOTHER_SHOULDER = { x: 3.5, y: 18.3, z: 4.9 };

/** 들어 올려 흔드는 팔. 몸통과 따로 그려야 어깨를 축으로 돌릴 수 있다. */
export function buildWavingArm(
  bodyColor: string,
  cam: CameraConfig,
  shoulder: { x: number; y: number; z: number } = MOTHER_SHOULDER,
): Face[] {
  const faces: Face[] = [];
  const B = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
    box(faces, cam, shoulder.x + x, shoulder.y + y, shoulder.z + z, w, d, h, c);

  // 어깨에서 위로 뻗은 팔. 어깨 높이에서 시작해야 몸통과 붙어 보인다 —
  // 위에서 시작하면 손만 공중에 뜬 것처럼 읽힌다.
  B(-0.6, -0.8, -0.3, 0.85, 1.6, 1.5, bodyColor);
  B(-0.9, -0.8, 1.1, 0.85, 1.6, 1.5, bodyColor);
  B(-1.2, -0.9, 2.5, 1.05, 1.8, 1.3, bodyColor);

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}

/**
 * 씬에서 캐릭터가 자전거를 탈 때의 배치값.
 * 자전거 원점은 바퀴가 인도(z 1.2)에 닿는 높이이고, 캐릭터는 안장 높이만큼 올라탄다.
 * 자전거는 두께가 얇은 판이라 x 는 캐릭터 몸 중심(6.4)에 판 두께의 절반을 뺀 값이다.
 */
export const SCENE_BIKE_ORIGIN = { x: 6.09, y: 17.8, z: 1.2 };
export const SCENE_BIKE_LIFT = 3.4;

export function buildBike(
  cam: CameraConfig = PROFILE_CAMERA,
  /** 월드에 놓을 위치. 팝업은 원점, 씬은 캐릭터 발밑. */
  origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
): Face[] {
  const faces: Face[] = [];
  const B = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
    box(faces, cam, x + origin.x, y + origin.y, z + origin.z, w, d, h, c);

  const REAR_Y = -3.4;
  const FRONT_Y = 3.4;
  const HUB_Z = 2.6;
  const R = 2.5;

  ring(B, REAR_Y, HUB_Z, R, 0.62, TYRE);
  ring(B, FRONT_Y, HUB_Z, R, 0.62, TYRE);

  // 프레임 — 대각선은 복셀이라 계단으로 만든다
  B(0, -2.0, 5.0, 0.45, 3.9, 0.45, FRAME); // 탑 튜브
  B(0, -2.2, 2.6, 0.45, 0.45, 2.6, FRAME); // 시트 튜브
  B(0, -3.4, 2.4, 0.45, 1.6, 0.45, FRAME); // 체인 스테이
  for (let i = 0; i < 5; i++) {
    B(0, -1.7 + i * 0.75, 2.9 + i * 0.42, 0.45, 0.75, 0.45, FRAME); // 다운 튜브
  }
  for (let i = 0; i < 4; i++) {
    B(0, 2.6 + i * 0.28, 5.0 - i * 0.72, 0.45, 0.5, 0.8, FRAME); // 앞 포크
  }

  B(0, -2.9, 5.5, 0.5, 1.5, 0.4, "#2c3a44"); // 안장
  B(0, 2.8, 5.5, 0.5, 1.6, 0.4, "#2c3a44"); // 핸들바

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}

/**
 * 원판 한 층 — 반지름 안에 드는 격자 칸만 채운다.
 * 복셀에서 둥근 형태는 이렇게 층을 쌓아 만든다(헬멧 돔, 피자 판).
 */
function disc(
  push: (x: number, y: number, z: number, w: number, d: number, h: number, c: string) => void,
  radius: number,
  z: number,
  h: number,
  color: string,
  cell = 1,
  /** 껍데기만 그린다 — 속을 채우면 내부 상자의 옆면이 깊이 정렬에서 이웃 앞으로
   *  튀어나와 표면이 격자처럼 뚫려 보인다. 어차피 보이지 않는 부분이다. */
  hollow = false,
): void {
  const steps = Math.ceil(radius / cell) + 1;
  for (let ix = -steps; ix <= steps; ix++) {
    for (let iy = -steps; iy <= steps; iy++) {
      const x = ix * cell;
      const y = iy * cell;
      const d = Math.hypot(x + cell / 2, y + cell / 2);
      if (d > radius) continue;
      if (hollow && d < radius - cell) continue;
      push(x, y, z, cell, cell, h, color);
    }
  }
}

/**
 * 자전거 헬멧.
 *
 * 핵심은 **속이 비어 있고 앞이 열려 있다**는 것이다. 통짜 돔으로 만들면 머리가 들어갈
 * 구멍이 없어 헬멧으로 안 읽힌다. 그래서:
 *  - 돔은 두께 2칸짜리 껍데기로만 쌓고(속은 비운다),
 *  - 앞쪽 아래를 도려내 얼굴 구멍을 만든다.
 * 뚫린 속은 box() 가 뒷면·밑면을 안 그리므로 그대로 배경이 비쳐 보인다 — 레퍼런스의
 * 투명한 구멍과 같은 결과다.
 */
export function buildHelmet(cam: CameraConfig = HELMET_CAMERA): Face[] {
  const faces: Face[] = [];
  const B = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
    box(faces, cam, x, y, z, w, d, h, c);

  const SHELL = "#c8302c";
  const SHELL_TOP = "#dc4038";
  const VISOR = "#c3c9ce";
  const STRAP = "#a6231f";

  const CELL = 0.8;
  const LAYERS = 8;
  const MAX_R = 4.8;
  /** 껍데기 두께 */
  const THICK = 1.7;
  /** 얼굴 구멍 — 앞쪽(-y) 이 높이 이 아래로 뚫린다 */
  const MOUTH_Z = 2.6;
  const MOUTH_Y = -0.6;

  for (let i = 0; i < LAYERS; i++) {
    // 반지름을 코사인으로 줄여야 돔이 된다(선형이면 원뿔).
    const r = MAX_R * Math.cos(((i / LAYERS) * Math.PI) / 2.4);
    const z = i * CELL;
    const steps = Math.ceil(r / CELL) + 1;

    for (let ix = -steps; ix <= steps; ix++) {
      for (let iy = -steps; iy <= steps; iy++) {
        const x = ix * CELL;
        const y = iy * CELL;
        const d = Math.hypot(x + CELL / 2, y + CELL / 2);
        if (d > r) continue;
        // 위 두 층은 뚜껑이라 속을 채우고, 아래는 껍데기만 남긴다
        const isCap = i >= LAYERS - 2;
        if (!isCap && d < r - THICK) continue;
        // 앞쪽 아래를 도려내 얼굴 구멍을 만든다
        if (z < MOUTH_Z && y + CELL / 2 < MOUTH_Y) continue;
        B(x, y, z, CELL, CELL, CELL + 0.04, i > 4 ? SHELL_TOP : SHELL);
      }
    }
  }

  // 챙 — 구멍 위를 덮는 회색 테
  B(-3.2, -4.9, MOUTH_Z, 6.4, 1.5, 0.55, VISOR);

  // 턱끈 — 구멍 양옆에서 내려오며 안쪽으로 모여 버클에서 만난다.
  // 복셀이라 사선은 계단으로 만든다.
  for (let i = 0; i < 3; i++) {
    const z = -1.3 - i * 1.15;
    const inset = i * 0.55;
    B(-3.9 + inset, -1.4, z, 0.7, 0.7, 1.2, STRAP);
    B(3.2 - inset, -1.4, z, 0.7, 0.7, 1.2, STRAP);
  }
  B(-2.8, -1.4, -4.9, 5.6, 0.7, 0.7, STRAP); // 턱 아래를 지나는 끈
  B(-0.8, -1.6, -5.5, 1.6, 1.1, 0.8, "#8f1c19"); // 버클

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}

/**
 * 피자 한 판 — 헬멧과 나란히 놓이므로 같은 복셀로 짓는다.
 *
 * 원형은 격자 위에서 반지름 안에 드는 칸만 채워 만든다. 층을 쌓아 도우 → 소스 →
 * 치즈 순으로 올리고, 토핑은 치즈 위에 개별 상자로 얹는다.
 */
export function buildPizza(cam: CameraConfig = PORTRAIT_CAMERA): Face[] {
  const faces: Face[] = [];
  const B = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
    box(faces, cam, x, y, z, w, d, h, c);

  const DOUGH = "#e0b878";
  const SAUCE = "#d8342a";
  const CHEESE = "#efeda8";
  const PEPPERONI = "#cf3428";
  const OLIVE = "#241f1f";
  const PEPPER = "#3f9c35";
  const MUSHROOM = "#9c7a52";

  const R = 5.6;

  disc(B, R, 0, 0.9, DOUGH); // 도우 + 크러스트 테두리
  disc(B, R - 1.1, 0.9, 0.25, SAUCE); // 소스 링
  disc(B, R - 2.0, 1.15, 0.2, CHEESE); // 치즈

  // 토핑 — 페퍼로니는 2×2 로 조금 크게, 나머지는 한 칸
  const PEPPERONIS: Array<[number, number]> = [
    [-4, -2], [-1, -4], [2, -3], [-3, 1], [0, 0], [3, 0], [-2, 3], [1, 3],
  ];
  for (const [x, y] of PEPPERONIS) B(x, y, 1.35, 2, 2, 0.3, PEPPERONI);

  const SMALL: Array<[number, number, string]> = [
    [-2, -3, PEPPER], [1, -2, OLIVE], [4, -1, MUSHROOM], [-4, 0, PEPPER],
    [2, 2, OLIVE], [-1, 4, MUSHROOM], [3, 3, PEPPER], [-4, 2, OLIVE],
  ];
  for (const [x, y, c] of SMALL) B(x, y, 1.35, 1, 1, 0.35, c);

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}


/**
 * 길 건너 학교. 마지막 스텝에서 "저기로 가는 거야" 를 보여주는 목적지다.
 *
 * 씬 카메라로만 그리므로 건물 하나를 통째로 짓는다 — 몸체, 지붕, 문, 창, 시계탑.
 */
export function buildSchool(cam: CameraConfig = SCENE_CAMERA): Face[] {
  const faces: Face[] = [];
  const B = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
    box(faces, cam, x, y, z, w, d, h, c);

  const WALL = "#f2e0c0";
  const ROOF = "#b8503f";
  const TRIM = "#d9c39c";
  const DOOR = "#8a5a34";
  const WINDOW = "#7ec2e8";

  // 본관
  B(-1, 23.2, 0.5, 13, 4.6, 6.2, WALL);
  B(-1.6, 22.8, 6.7, 14.2, 5.4, 1.5, ROOF);
  B(-0.6, 23.4, 8.2, 12.2, 4.2, 0.8, ROOF);

  // 정문 — 도로 쪽(-y)을 향한다
  B(4.6, 23.0, 0.5, 2.8, 0.4, 3.4, DOOR);
  B(4.4, 22.95, 3.9, 3.2, 0.4, 0.5, TRIM);

  // 창문 두 줄
  for (let i = 0; i < 4; i++) {
    B(0.2 + i * 2.6, 23.0, 1.6, 1.6, 0.35, 1.6, WINDOW);
    B(0.2 + i * 2.6, 23.0, 4.2, 1.6, 0.35, 1.6, WINDOW);
  }

  // 시계탑
  B(9.4, 23.6, 6.7, 2.6, 2.6, 3.4, WALL);
  B(9.0, 23.2, 10.1, 3.4, 3.4, 1.0, ROOF);
  B(9.9, 23.5, 8.0, 1.6, 0.3, 1.6, "#fdfbf3"); // 시계판

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}
