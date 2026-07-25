"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  buildDino,
  buildWorld,
  CAMERA_TRANSFORM,
  DINO_BUILD_Y,
  screenDelta,
  signalPixels,
  SIGNAL_FACE_X,
  SIGNAL_PANEL_H,
  SIGNAL_PANEL_W,
  SIGNAL_PANEL_Y,
  SIGNAL_PANEL_Z,
  SIGNAL_TURN_DEG,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  UNIT,
} from "@/views/game/model/scene";
import type { GamePhase } from "@/views/game/model/use-crosswalk-game";

interface CrosswalkSceneProps {
  phase: GamePhase;
  isGreen: boolean;
  dinoY: number;
  instant: boolean;
  dinoColor: string;
  crossSeconds: number;
  onWalk: () => void;
}

/**
 * 원본 디자인은 1040×720 고정 캔버스다. 이 컴포넌트는 그 캔버스를 그대로 두고
 * 컨테이너 크기에 맞춰 통째로 스케일한다 — 비율이 유지되므로 레이아웃이 깨지지 않고,
 * 좁은 화면에서도 씬 전체가 항상 보인다.
 */
export function CrosswalkScene({
  phase,
  isGreen,
  dinoY,
  instant,
  dinoColor,
  crossSeconds,
  onWalk,
}: CrosswalkSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const worldFaces = useMemo(() => buildWorld(), []);
  const dinoFaces = useMemo(() => buildDino(dinoColor), [dinoColor]);
  const { rows, columns } = useMemo(() => signalPixels(isGreen), [isGreen]);

  const litColor = isGreen ? "#5cf06a" : "#ff5347";

  const panelStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transformOrigin: "0 0",
    width: SIGNAL_PANEL_W * UNIT,
    height: SIGNAL_PANEL_H * UNIT,
    display: "grid",
    gridTemplateColumns: `repeat(${columns},1fr)`,
    gap: 1,
    padding: 3,
    boxSizing: "border-box",
    background: "#17191c",
    border: "2px solid #0e1012",
    borderRadius: 3,
    // 함체를 90° 돌린 것에 맞춰 패널도 같이 돌린다. rotateZ 가 월드 수직축 회전이고,
    // rotateX(-90deg) 이 평면을 세운다. 순서가 바뀌면 엉뚱한 축으로 돈다.
    transform: `${CAMERA_TRANSFORM} translate3d(${SIGNAL_FACE_X * UNIT}px,${-SIGNAL_PANEL_Y * UNIT}px,${SIGNAL_PANEL_Z * UNIT}px) rotateZ(${SIGNAL_TURN_DEG}deg) rotateX(-90deg)`,
    animation:
      phase === "oops"
        ? "ss-flash .5s steps(1,end) 3"
        : phase === "waiting"
          ? "ss-flash 1s ease-in-out infinite"
          : "none",
  };

  const delta = screenDelta(0, (DINO_BUILD_Y - dinoY) * UNIT, 0);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%,-50%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {/* 스테이지 배경은 투명하다 — 하늘 그라디언트는 페이지 전체가 깔고 있어
            레터박스 여백과 이음매 없이 이어진다. */}
        <div
          className="relative select-none"
          style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
        >
          {/* 구름 */}
          <div className="absolute left-[90px] top-[60px] h-[44px] w-[150px] rounded-full bg-white/85" />
          <div className="absolute left-[160px] top-[34px] h-[52px] w-[96px] rounded-full bg-white/90" />
          <div className="absolute left-[700px] top-[88px] h-[46px] w-[180px] rounded-full bg-white/80" />
          <div className="absolute left-[760px] top-[62px] h-[50px] w-[100px] rounded-full bg-white/85" />

          <div
            className="absolute inset-0"
            style={{ perspective: "1700px", perspectiveOrigin: "50% 42%" }}
          >
            <div className="absolute left-1/2 top-1/2 h-0 w-0">
              {worldFaces.map((face, i) => (
                <div key={`w${i}`} style={face.style} />
              ))}

              <div style={panelStyle}>
                {rows.flatMap((row, r) =>
                  row.split("").map((cell, c) => (
                    <div
                      key={`p${r}-${c}`}
                      style={{
                        background: cell === "1" ? litColor : "rgba(255,255,255,.045)",
                        borderRadius: 1,
                        boxShadow: cell === "1" ? `0 0 6px ${litColor}` : "none",
                      }}
                    />
                  )),
                )}
              </div>

              <button
                type="button"
                onClick={onWalk}
                aria-label={isGreen ? "Cross the road now" : "Try to cross the road"}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transform: `translate(${delta.dx}px,${delta.dy}px)`,
                  transition: instant ? "none" : `transform ${crossSeconds}s linear`,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    transformOrigin: "0 0",
                    width: 6.4 * UNIT,
                    height: 6.6 * UNIT,
                    transform: `${CAMERA_TRANSFORM} translate3d(${2.9 * UNIT}px,${-21.2 * UNIT}px,${1.26 * UNIT}px)`,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(ellipse at center, rgba(20,40,20,.34), rgba(20,40,20,0) 68%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    animation:
                      phase === "crossing"
                        ? "ss-walkbob .5s ease-in-out infinite"
                        : phase === "oops"
                          ? "ss-shake .5s ease-in-out 2"
                          : "ss-bob 2.6s ease-in-out infinite",
                  }}
                >
                  {dinoFaces.map((face, i) => (
                    <div key={`d${i}`} style={face.style} />
                  ))}
                </div>
              </button>
            </div>
          </div>

          {phase === "success" && (
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 34 }, (_, i) => {
                const colors = ["#f2b21c", "#5fbb3f", "#4a9df0", "#f0723a", "#ffffff", "#e857a0"];
                return (
                  <div
                    key={`c${i}`}
                    style={{
                      position: "absolute",
                      left: `${(i * 2.97) % 100}%`,
                      top: -30,
                      width: 14 + (i % 3) * 6,
                      height: 14 + (i % 2) * 8,
                      background: colors[i % colors.length],
                      borderRadius: 3,
                      animation: `ss-fall ${2.4 + (i % 5) * 0.45}s linear ${(i % 7) * 0.18}s infinite`,
                    }}
                  />
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
