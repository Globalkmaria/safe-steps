"use client";

import { useMemo } from "react";
import { buildDino, PORTRAIT_CAMERA } from "@/views/game/model/scene";

/**
 * 팝업에 쓰는 캐릭터 초상.
 *
 * 별도의 2D 일러스트가 아니라 **씬에 서 있는 바로 그 복셀 모델**을 다른 각도로 다시
 * 그린 것이다. 아이가 팝업에서 본 얼굴과 도로 위의 캐릭터가 같은 존재로 읽혀야 한다.
 *
 * 씬 카메라는 뒷모습을 보므로, 초상은 180° 돌리고 기울기를 낮춘 PORTRAIT_CAMERA 를 쓴다.
 */
export function DinoFace({
  size = 132,
  bodyColor = "#62b73a",
}: {
  size?: number;
  bodyColor?: string;
}) {
  const faces = useMemo(() => buildDino(bodyColor, PORTRAIT_CAMERA), [bodyColor]);

  return (
    <div
      aria-hidden
      className="relative flex-none overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* 모델은 월드 좌표에 세워져 있으므로, 상자 중앙으로 끌어와야 화면에 들어온다. */}
      <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: PORTRAIT_NUDGE }}>
        {faces.map((face, i) => (
          <div key={i} style={face.style} />
        ))}
      </div>
    </div>
  );
}

/**
 * 초상 카메라에서 모델이 초상 상자 가운데 오도록 하는 보정.
 * 브라우저에서 면들의 bounding box 중심을 재서 잡은 값이다 —
 * PORTRAIT_CAMERA 의 각도나 배율을 바꾸면 다시 재야 한다.
 */
const PORTRAIT_NUDGE = "translate(78px,25px)";
