import { SCENE_CAMERA, UNIT, box, shade } from "./voxel";
import type { Face } from "./voxel";
import { HEAD_D, HEAD_H, HEAD_W, HEAD_X, HEAD_Y, HEAD_Z } from "./signal";

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
