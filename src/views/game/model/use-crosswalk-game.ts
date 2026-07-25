"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tone, unlockAudio } from "@/shared/lib/audio";
import { haptic } from "@/shared/lib/haptics";

/**
 * 횡단보도 게임의 상태 기계.
 *
 *   idle ──press──▶ waiting ──(대기시간)──▶ green ──walk──▶ crossing ──▶ success
 *     │                 │                                                  │
 *     └──walk(성급함)───┴──▶ oops ──tryAgain──▶ (직전 상태 또는 green)      └─reset─▶ idle
 *
 * 교육 목적상 "성급하게 건너기"가 실패로 이어지는 경로가 핵심이다.
 */

export type GamePhase = "idle" | "waiting" | "green" | "crossing" | "success" | "oops";

/**
 * 캐릭터는 신호등 **건너편** 인도(화면 왼쪽)에서 출발해 신호등이 있는 쪽(오른쪽)으로
 * 건넌다. 화면상 왼쪽→오른쪽 이동이다.
 */
const DINO_START_Y = -5.5;
/** 길을 다 건너 신호등 쪽 인도에 도착한 위치 */
const DINO_END_Y = 15.5;

export interface CrosswalkGameOptions {
  /** 버튼을 누른 뒤 초록불까지 걸리는 시간(초) */
  waitSeconds: number;
  /** 길을 건너는 데 걸리는 시간(초) */
  crossSeconds: number;
}

export function useCrosswalkGame({ waitSeconds, crossSeconds }: CrosswalkGameOptions) {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [dinoY, setDinoY] = useState(DINO_START_Y);
  const [instant, setInstant] = useState(false);
  const [shake, setShake] = useState(0);

  const pendingGreen = useRef(false);
  const previousPhase = useRef<GamePhase>("idle");
  const phaseRef = useRef<GamePhase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 타이머 콜백과 이벤트 핸들러가 "지금" 단계를 읽어야 하는데, 클로저에 갇힌
  // phase 는 낡을 수 있다. 렌더 중 ref 를 쓰는 것은 동시성 렌더링에서 깨지므로
  // 커밋 이후에 동기화한다.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const playGreenChime = useCallback(() => {
    tone({ freq: 784, durationSec: 0.35, type: "triangle", volume: 0.13 });
    later(() => tone({ freq: 1046, durationSec: 0.5, type: "triangle", volume: 0.11 }), 130);
  }, [later]);

  /** 신호등 버튼 누르기 */
  const pressButton = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    unlockAudio(); // 첫 사용자 제스처 — iOS 오디오 잠금 해제 지점
    tone({ freq: 520, durationSec: 0.12, type: "square", volume: 0.1 });
    haptic("tap");
    setPhase("waiting");
    later(() => {
      if (phaseRef.current === "waiting") {
        setPhase("green");
        playGreenChime();
      } else if (phaseRef.current === "oops") {
        pendingGreen.current = true;
      }
    }, waitSeconds * 1000);
  }, [later, playGreenChime, waitSeconds]);

  /** 건너기 시도 — 초록불이 아니면 실패 */
  const walk = useCallback(() => {
    const current = phaseRef.current;
    if (current === "green") {
      unlockAudio();
      setPhase("crossing");
      setDinoY(DINO_END_Y);
      setInstant(false);
      later(() => {
        setPhase("success");
        haptic("success");
        tone({ freq: 659, durationSec: 0.3, type: "triangle", volume: 0.12 });
        later(() => tone({ freq: 988, durationSec: 0.6, type: "triangle", volume: 0.1 }), 180);
      }, crossSeconds * 1000);
      return;
    }
    if (current === "idle" || current === "waiting") {
      unlockAudio();
      tone({ freq: 180, durationSec: 0.35, type: "sine", volume: 0.1 });
      haptic("error");
      previousPhase.current = current;
      setPhase("oops");
      setShake((n) => n + 1);
    }
  }, [crossSeconds, later]);

  const tryAgain = useCallback(() => {
    if (pendingGreen.current) {
      pendingGreen.current = false;
      setPhase("green");
      playGreenChime();
      return;
    }
    setPhase(previousPhase.current);
  }, [playGreenChime]);

  const reset = useCallback(() => {
    pendingGreen.current = false;
    setPhase("idle");
    setDinoY(DINO_START_Y);
    setInstant(true);
    later(() => setInstant(false), 80);
  }, [later]);

  const isGreen = phase === "green" || phase === "crossing" || phase === "success";

  return {
    phase,
    isGreen,
    dinoY,
    instant,
    shake,
    dinoStartY: DINO_START_Y,
    pressButton,
    walk,
    tryAgain,
    reset,
  };
}
