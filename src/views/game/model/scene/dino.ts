import { HELMET_SHELL, HELMET_SHELL_TOP, HELMET_VISOR, SCENE_CAMERA, box, shade } from "./voxel";
import type { CameraConfig, Face } from "./voxel";

/**
 * 캐릭터가 서 있는 기준 월드 y. buildDino 가 이 자리에 모델을 세우고,
 * 화면상 이동은 이 값과 현재 y 의 차이로 계산한다.
 */
export const DINO_BUILD_Y = 15.5;

/**
 * 머리 위(쓴 자리)에서 손(든 자리)까지의 월드 오프셋.
 *
 * 팔의 실제 좌표가 아니라 화면상 이동량을 보고 정한다 — 이 투영에서는 -x 가 화면
 * 위로 가서 -z 로 내린 만큼을 상쇄하므로, 팔 좌표를 그대로 넣으면 헬멧이 20px 남짓
 * 움직이고 만다. 바꿀 때는 screenDelta 를 통과시킨 결과로 판단할 것.
 */
export const HELMET_HAND_OFFSET = { x: 0.5, y: 1.2, z: -8.0 };

/** 플레이어 캐릭터(공룡). 몸 색만 파라미터로 받는다. */
export interface DinoOptions {
  /** 머리에 헬멧을 씌운다 — 자전거 스텝을 통과한 뒤의 모습 */
  withHelmet?: boolean;
  /**
   * 헬멧 면을 몸과 섞지 않고 여기에 담는다. 한 배열로 받으면 헬멧만 따로 움직일 수 없다.
   */
  helmetOut?: Face[];
  /** 안장에 앉도록 통째로 들어올린다(자전거를 탈 때) */
  lift?: number;
  /** 앞치마를 두르고, 인사하는 팔은 따로 그리도록 한쪽을 비운다(엄마 공룡) */
  apron?: { color: string; trim: string };
  /**
   * 인사하는 팔을 buildWavingArm 으로 따로 그린다 — 몸통에서 그 자리 팔을 뺀다.
   * 빼지 않으면 팔이 두 개가 된다. apron 과는 별개다: 아기는 앞치마를 안 입지만
   * 인사는 한다.
   */
  wavingArm?: boolean;
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
  const {
    withHelmet = false,
    lift = 0,
    apron,
    faceAway = false,
    wavingArm = false,
    helmetOut,
  } = options;
  const faces: Face[] = [];

  // 원본 모델은 -y 를 향한다. 진행 방향을 왼쪽→오른쪽으로 뒤집었으므로 캐릭터도
  // 180° 돌려 세워야 뒤로 걷는 것처럼 보이지 않는다. 좌표를 26개 손으로 고치는 대신
  // 상자 목록을 먼저 모아 경계를 재고, 그 중심을 축으로 뒤집는다 — 제자리는 유지된다.
  type Spec = [number, number, number, number, number, number, string];
  const specs: Spec[] = [];
  // 넣은 스펙을 그대로 돌려준다. 나중에 머리·팔을 다시 찾아야 하는데, 치수로 찾으면
  // 디자인을 조금만 바꿔도 조용히 못 찾고 그 기능이 통째로 사라진다.
  const B = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    c: string,
  ): Spec => {
    const spec: Spec = [x, y, z, w, d, h, c];
    specs.push(spec);
    return spec;
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
  // 인사하는 팔이 서는 자리는 뒤집기에 따라 갈린다. 거울 반전을 하면(엄마) 원본의
  // +x 팔이 그 자리로 오고, 반전을 끄면(아기) 원본의 -x 팔이 그대로 그 자리다.
  const nearArm = B(-0.6, 1.2, 3.4, 0.8, 1.5, 1.6, g); // 팔
  const farArm = B(4.8, 1.2, 3.4, 0.8, 1.5, 1.6, g);
  const head = B(0.2, -0.5, 5.5, 4.6, 3.3, 3.2, g); // 머리
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

  for (const spec of specs) {
    if (wavingArm && spec === (faceAway ? nearArm : farArm)) continue;
    const [x, y, z, w, d, h, c] = spec;
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
    {
      const [hx, hy, hz, hw, hd, hh] = head;
      const cx = (faceAway ? hx : spanX - hx - hw) + 3.6 + hw / 2;
      const cy = (faceAway ? hy : spanY - hy - hd) + DINO_BUILD_Y + hd / 2;
      const top = hz + 1.2 + lift + hh;

      const shell = helmetOut ?? faces;
      const HB = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) =>
        box(shell, cam, x, y, z, w, d, h, c);
      const CELL = 0.62;
      const SHELL = HELMET_SHELL;
      const SHELL_TOP = HELMET_SHELL_TOP;

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
      HB(cx - 1.7, cy + (faceAway ? -2.1 : 1.7), top - 0.45, 3.4, 0.8, 0.4, HELMET_VISOR);
      // 따로 담았으면 별도의 쌓임 맥락에 그려지므로 자기들끼리 다시 정렬해야 한다.
      if (helmetOut) helmetOut.sort((a, b) => a.dep - b.dep);
    }
  }

  faces.sort((a, b) => a.dep - b.dep);
  return faces;
}

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
