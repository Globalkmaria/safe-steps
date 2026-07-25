"use client";

import { useMemo } from "react";
import { buildBike, buildDino, PROFILE_CAMERA } from "@/views/game/model/scene";
import { VoxelFigure } from "@/views/game/ui/VoxelFigure";

/**
 * 자전거를 탄 캐릭터. 팝업이 열리면 왼쪽에서 타고 들어와 가운데에 선다.
 *
 * 자전거와 캐릭터를 하나의 면 목록으로 합치지 않고 두 겹으로 겹쳐 그린다.
 * 합쳐서 깊이 정렬하면 안장에 앉은 다리가 프레임 뒤로 숨는 등 오히려 어긋난다 —
 * 옆모습에서는 캐릭터가 자전거 앞에 오는 것이 언제나 맞다.
 */
export function DinoOnBike({
  width = 300,
  height = 190,
  bodyColor = "#62b73a",
}: {
  width?: number;
  height?: number;
  bodyColor?: string;
}) {
  const bike = useMemo(() => buildBike(PROFILE_CAMERA), []);
  const rider = useMemo(() => buildDino(bodyColor, PROFILE_CAMERA), [bodyColor]);

  return (
    <div
      aria-hidden
      className="relative flex-none"
      style={{ width, height, animation: "ss-ride-in .9s cubic-bezier(.25,.9,.35,1) both" }}
    >
      <VoxelFigure
        faces={bike}
        width={width}
        height={height}
        nudge={BIKE_NUDGE}
        style={{ position: "absolute", inset: 0 }}
      />
      <VoxelFigure
        faces={rider}
        width={width}
        height={height}
        nudge={RIDER_NUDGE}
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  );
}

/** 브라우저에서 실측한 중앙 보정 — PROFILE_CAMERA 를 바꾸면 다시 재야 한다 */
const BIKE_NUDGE = "translate(0px,28px)";
/** 캐릭터는 자전거보다 위(안장)에 앉는다 */
const RIDER_NUDGE = "translate(-184px,13px)";
