"use client";

import type { CSSProperties } from "react";
import type { Face } from "@/views/game/model/scene";

/**
 * 복셀 모델을 고정 크기 상자 안에 그린다.
 *
 * 모델은 월드 좌표에 지어져 있어 그대로 두면 상자 밖에 있다. nudge 로 끌어와 앉히는데,
 * 그 값은 브라우저에서 면들의 bounding box 중심을 재서 잡는다 —
 * 카메라나 모델을 바꾸면 다시 재야 한다.
 */
export function VoxelFigure({
  faces,
  width,
  height,
  nudge,
  className,
  style,
}: {
  faces: Face[];
  width: number;
  height: number;
  nudge: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`flex-none ${className ?? ""}`}
      // position 은 인라인으로 준다 — Tailwind 의 relative/absolute 를 className 으로
      // 함께 넘기면 어느 쪽이 이길지 클래스 순서가 아니라 스타일시트 순서가 정하므로,
      // 겹쳐 그리려던 두 겹이 위아래로 쌓이는 사고가 난다.
      style={{ position: "relative", width, height, ...style }}
    >
      <div className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: nudge }}>
        {faces.map((face, i) => (
          <div key={i} className={face.className} style={face.style} />
        ))}
      </div>
    </div>
  );
}
