"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  buildBike,
  buildDino,
  buildSchool,
  buildWorld,
  CAMERA_TRANSFORM,
  DINO_BUILD_Y,
  HELMET_HAND_OFFSET,
  screenDelta,
  signalPixels,
  SIGNAL_FACE_X,
  SIGNAL_PANEL_H,
  SIGNAL_PANEL_W,
  SIGNAL_PANEL_Y,
  SIGNAL_PANEL_Z,
  SCENE_BIKE_LIFT,
  SCENE_CAMERA,
  SCENE_BIKE_ORIGIN,
  SIGNAL_TURN_DEG,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  UNIT,
} from "@/views/game/model/scene";
import type { Face } from "@/views/game/model/scene";
import type { GamePhase } from "@/views/game/model/use-crosswalk-game";

interface CrosswalkSceneProps {
  phase: GamePhase;
  isGreen: boolean;
  dinoY: number;
  instant: boolean;
  dinoColor: string;
  /** 자전거 스텝을 통과하면 헬멧을 쓴다 */
  wearsHelmet?: boolean;
  /** 아직 손에 들고 있다 — 여기서 false 로 바뀌면 머리로 올라간다 */
  helmetInHand?: boolean;
  /** 자전거에서 내렸다 — 캐릭터만 안장 높이에서 땅으로 내려온다 */
  dismounted?: boolean;
  /** 길 건너 학교를 보여준다 — 마지막 스텝의 목적지 */
  showSchool?: boolean;
  /** 무단횡단 — 횡단보도를 벗어나 도로로 들어섰다가 되돌아온다 */
  strayed?: boolean;
  crossSeconds: number;
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
  wearsHelmet = false,
  helmetInHand = false,
  dismounted = false,
  showSchool = false,
  strayed = false,
  crossSeconds,
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
  // 헬멧을 썼다는 것은 자전거 스텝을 통과했다는 뜻이라, 자전거도 같이 탄다.
  const ridesBike = wearsHelmet;
  // 헬멧은 손에서 머리로 올라가야 하므로 몸과 따로 받는다. 위치는 그대로
  // 머리 기준으로 계산되고, 손에 든 상태만 화면 좌표로 옮겨서 표현한다.
  const { dinoFaces, helmetFaces } = useMemo(() => {
    const helmet: Face[] = [];
    const body = buildDino(dinoColor, undefined, {
      withHelmet: wearsHelmet,
      lift: ridesBike ? SCENE_BIKE_LIFT : 0,
      helmetOut: helmet,
    });
    return { dinoFaces: body, helmetFaces: helmet };
  }, [dinoColor, wearsHelmet, ridesBike]);
  const bikeFaces = useMemo(
    () => (ridesBike ? buildBike(SCENE_CAMERA, SCENE_BIKE_ORIGIN) : []),
    [ridesBike],
  );
  const { rows, columns } = useMemo(() => signalPixels(isGreen), [isGreen]);
  const schoolFaces = useMemo(() => (showSchool ? buildSchool(SCENE_CAMERA) : []), [showSchool]);

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

  // 내리는 동작은 모델을 다시 짓지 않고 화면 좌표로만 내린다 — 태운 높이가 지오메트리에
  // 박혀 있어 매 프레임 다시 지으면 비싸고, 전환도 부드럽지 않다.
  const dropped = screenDelta(0, 0, -SCENE_BIKE_LIFT * UNIT);
  // 횡단보도 오른쪽 끝 바깥으로 벗어나며 도로에 발을 들이는 이동
  const stray = screenDelta(11 * UNIT, -8.5 * UNIT, 0);
  // 내리는 것은 캐릭터만의 동작이라 캐릭터에만 건다.
  const dismountStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: dismounted ? `translate(${dropped.dx}px,${dropped.dy}px)` : "none",
    transition: "transform 1s ease-in-out",
  };

  // 손에 든 자리 → 머리. 헬멧은 늘 머리에 맞춰 지어지므로, 든 상태 쪽을 오프셋으로 둔다.
  const held = screenDelta(
    HELMET_HAND_OFFSET.x * UNIT,
    HELMET_HAND_OFFSET.y * UNIT,
    HELMET_HAND_OFFSET.z * UNIT,
  );
  const helmetStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: helmetInHand ? `translate(${held.dx}px,${held.dy}px)` : "none",
    // 들어올리는 동작이라 끝을 부드럽게 놓는다 — 머리에 얹히는 느낌.
    transition: "transform .85s cubic-bezier(.36,.06,.28,1)",
  };

  // 무단횡단은 자전거를 끌고 함께 벗어나는 것이므로 둘 다 감싸서 옮긴다.
  const strayStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: strayed ? `translate(${stray.dx}px,${stray.dy}px)` : "none",
    transition: "transform .9s ease-in-out",
  };

  return (
    // 씬은 통째로 장식이다 — 글자도 이미지도 없는 수백 개의 div 이고, 지금 무슨 일이
    // 벌어지는지는 옆의 role="status" 문구가 말해준다. 보조기술에는 그쪽만 남긴다.
    <div aria-hidden ref={containerRef} className="relative h-full w-full overflow-hidden">
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
                <div key={`w${i}`} className={face.className} style={face.style} />
              ))}
              {schoolFaces.map((face, i) => (
                <div key={`s${i}`} className={face.className} style={face.style} />
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

              {/*
                예전에는 이 자리가 캐릭터를 직접 누르는 버튼이었다. 지금 이야기에서는
                모든 판단을 팝업으로 묻기 때문에 이 탭이 답해야 할 질문이 없는데,
                버튼은 팝업이 없는 구간(불이 바뀌길 기다리는 0.6초, 무단횡단 연출 1.6초)에도
                살아 있었다. 그 틈에 누르면 walk() 가 "지금 어떤 질문에 답하는 중인지"
                모른 채 phase 만 보고 성공 처리를 해 버려서, 빨간불을 고르고도
                "Great job!" 이 뜨거나 재시도 팝업과 성공 팝업이 함께 뜨는 일이 있었다.
              */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translate(${delta.dx}px,${delta.dy}px)`,
                  transition: instant ? "none" : `transform ${crossSeconds}s linear`,
                }}
              >
                <div style={strayStyle}>
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
                  {bikeFaces.map((face, i) => (
                    <div key={`b${i}`} className={face.className} style={face.style} />
                  ))}
                  <div style={dismountStyle}>
                    {dinoFaces.map((face, i) => (
                      <div key={`d${i}`} className={face.className} style={face.style} />
                    ))}
                    <div style={helmetStyle}>
                      {helmetFaces.map((face, i) => (
                        <div key={`h${i}`} className={face.className} style={face.style} />
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              </div>
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
