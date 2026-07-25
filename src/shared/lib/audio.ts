/**
 * Capability: 오디오.
 *
 * 정책 — progressive enhancement. Web Audio 를 못 쓰는 환경에서도 조용히 no-op 하고,
 * 제품은 소리 없이 완전히 동작해야 한다. 호출부는 지원 여부를 묻지 않는다.
 *
 * iOS 는 사용자 제스처 안에서 한 번 컨텍스트를 깨워야 이후 재생이 허용된다.
 * 그래서 첫 탭 핸들러에서 unlockAudio() 를 부른다.
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let muted = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** 사용자 제스처 핸들러 안에서 호출한다. iOS 오디오 잠금 해제. */
export function unlockAudio(): void {
  const ac = getContext();
  if (ac && ac.state === "suspended") void ac.resume();
}

export function setMuted(next: boolean): void {
  muted = next;
}

export function isMuted(): boolean {
  return muted;
}

export interface ToneOptions {
  freq: number;
  durationSec: number;
  type?: OscillatorType;
  volume?: number;
}

/** 단음 재생. 지원하지 않거나 음소거면 아무 일도 하지 않는다. */
export function tone({ freq, durationSec, type = "sine", volume = 0.12 }: ToneOptions): void {
  if (muted) return;
  const ac = getContext();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ac.destination);
    const t = ac.currentTime;
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationSec);
    osc.start(t);
    osc.stop(t + durationSec + 0.05);
  } catch {
    // 오디오는 부가 기능이다 — 실패해도 게임 흐름을 끊지 않는다.
  }
}
