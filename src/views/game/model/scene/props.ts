import { HELMET_CAMERA, PORTRAIT_CAMERA, box } from "./voxel";
import type { CameraConfig, Face } from "./voxel";

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
