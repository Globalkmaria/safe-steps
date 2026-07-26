import { PROFILE_CAMERA, box } from "./voxel";
import type { CameraConfig, Face } from "./voxel";

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
/**
 * 씬에서 캐릭터가 자전거를 탈 때의 배치값.
 * 자전거 원점은 바퀴가 인도(z 1.2)에 닿는 높이이고, 캐릭터는 안장 높이만큼 올라탄다.
 * 자전거는 두께가 얇은 판이라 x 는 캐릭터 몸 중심(6.4)에 판 두께의 절반을 뺀 값이다.
 */
export const SCENE_BIKE_ORIGIN = { x: 6.09, y: 17.8, z: 1.2 };
export const SCENE_BIKE_LIFT = 3.4;

/** 자전거를 부위별로. 바퀴를 따로 돌리려면 프레임과 분리돼 있어야 한다. */
export interface BikeParts {
  frame: Face[];
  rearWheel: Face[];
  frontWheel: Face[];
  /** 바퀴가 도는 축(월드 좌표). 화면 좌표로 바꿔 transform-origin 에 쓴다. */
  rearHub: { x: number; y: number; z: number };
  frontHub: { x: number; y: number; z: number };
}

const BIKE_REAR_Y = -3.4;
const BIKE_FRONT_Y = 3.4;
const BIKE_HUB_Z = 2.6;
const BIKE_R = 2.5;

export function buildBikeParts(
  cam: CameraConfig = PROFILE_CAMERA,
  origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
): BikeParts {
  const frame: Face[] = [];
  const rearWheel: Face[] = [];
  const frontWheel: Face[] = [];

  const at =
    (out: Face[]) =>
    (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
      box(out, cam, x + origin.x, y + origin.y, z + origin.z, w, d, h, c);

  ring(at(rearWheel), BIKE_REAR_Y, BIKE_HUB_Z, BIKE_R, 0.62, TYRE);
  ring(at(frontWheel), BIKE_FRONT_Y, BIKE_HUB_Z, BIKE_R, 0.62, TYRE);

  const B = at(frame);
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

  for (const list of [frame, rearWheel, frontWheel]) list.sort((a, b) => a.dep - b.dep);

  return {
    frame,
    rearWheel,
    frontWheel,
    rearHub: { x: origin.x, y: origin.y + BIKE_REAR_Y, z: origin.z + BIKE_HUB_Z },
    frontHub: { x: origin.x, y: origin.y + BIKE_FRONT_Y, z: origin.z + BIKE_HUB_Z },
  };
}

/** 옆에서 본 자전거 한 덩어리. 바퀴를 돌릴 필요가 없는 곳에서 쓴다. */
export function buildBike(
  cam: CameraConfig = PROFILE_CAMERA,
  origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
): Face[] {
  const p = buildBikeParts(cam, origin);
  const all = [...p.frame, ...p.rearWheel, ...p.frontWheel];
  all.sort((a, b) => a.dep - b.dep);
  return all;
}
