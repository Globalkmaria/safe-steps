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
 * ⚠️ 이 값 하나가 세 곳을 동시에 지배한다: CSS 카메라 transform, 면 깊이 정렬(depth),
 * 캐릭터 이동의 화면 방향(screenDelta). 셋이 어긋나면 겹침 순서가 뒤집히거나
 * 캐릭터가 엉뚱한 방향으로 걷는다. 그래서 상수 하나에서 전부 파생시킨다.
 *
 * 이 각에서는 신호등 함체가 카메라를 등지므로, 패널은 SIGNAL_TURN_DEG 로 따로 돌려
 * 세운다. 카메라 각을 바꾸면 그 값도 같이 봐야 불빛이 화면에서 사라지지 않는다.
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
  /** 격자 무늬 클래스. 윗면에 별도 무늬(횡단보도 줄무늬)를 깔면 비운다. */
  className?: string;
}

/** hex 색을 배율만큼 밝게/어둡게 */
export function shade(hex: string, factor: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${clamp((n >> 16) & 255)},${clamp((n >> 8) & 255)},${clamp(n & 255)})`;
}

/**
 * 면에 깔리는 격자 무늬는 CSS 클래스(.voxel-face)로 둔다.
 * 인라인으로 넣으면 프로덕션 미니파이어가 값을 깨뜨린다 — globals.css 의 설명 참고.
 */
const GRID_CLASS = "voxel-face";

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
export function box(
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
  };

  // 오른쪽 옆면
  out.push({
    dep,
    className: GRID_CLASS,
    style: {
      ...base,
      width: dp * U,
      height: h * U,
      background: shade(col, 0.74),
      transform: `${C} translate3d(${(x + w) * U}px,${-y * U}px,${(z + h) * U}px) rotateX(-90deg) rotateY(90deg)`,
    },
  });
  // 왼쪽 옆면
  out.push({
    dep,
    className: GRID_CLASS,
    style: {
      ...base,
      width: dp * U,
      height: h * U,
      background: shade(col, 0.8),
      transform: `${C} translate3d(${x * U}px,${-(y + dp) * U}px,${(z + h) * U}px) rotateX(-90deg) rotateY(-90deg)`,
    },
  });
  // 앞면
  out.push({
    dep,
    className: GRID_CLASS,
    style: {
      ...base,
      width: w * U,
      height: h * U,
      background: shade(col, 0.9),
      transform: `${C} translate3d(${x * U}px,${-y * U}px,${(z + h) * U}px) rotateX(-90deg)`,
    },
  });
  // 윗면
  out.push({
    dep,
    className: topImage ? undefined : GRID_CLASS,
    style: {
      ...base,
      width: w * U,
      height: dp * U,
      backgroundColor: shade(col, 1.14),
      ...(topImage ? { backgroundImage: topImage } : {}),
      transform: `${C} translate3d(${x * U}px,${-(y + dp) * U}px,${(z + h) * U}px)`,
    },
  });
}
