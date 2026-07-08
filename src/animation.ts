import type { EasingFn } from "./easing.js";

export type Keyframe = {
  /** 秒 */
  time: number;
  value: number;
  /** 直前のキーフレームからこのキーフレームへ到達する区間に適用するイージング。既定は線形 */
  ease?: EasingFn;
};

export type AnimationTracks = Record<string, readonly Keyframe[]>;

export type AnimationOptions = {
  /** ループ周期（秒）。指定時は time をこの周期で折り返す。省略時はループしない */
  loop?: number;
};

export type Animation<T extends AnimationTracks> = {
  value(name: keyof T & string, time: number): number;
  at(time: number): { [K in keyof T]: number };
  /** 全トラック中で最大のキーフレーム時刻 */
  readonly duration: number;
};

function linearEase(t: number): number {
  return t;
}

function evaluateTrack(track: readonly Keyframe[], time: number): number {
  const first = track[0] as Keyframe;
  if (time <= first.time) {
    return first.value;
  }

  const last = track[track.length - 1] as Keyframe;
  if (time >= last.time) {
    return last.value;
  }

  for (let i = track.length - 2; i >= 0; i--) {
    const from = track[i] as Keyframe;
    const to = track[i + 1] as Keyframe;

    if (time >= from.time && time <= to.time) {
      const span = to.time - from.time;
      if (span === 0) {
        return to.value;
      }

      const u = (time - from.time) / span;
      const eased = (to.ease ?? linearEase)(u);
      return from.value + (to.value - from.value) * eased;
    }
  }

  return last.value;
}

export function createAnimation<T extends AnimationTracks>(
  tracks: T,
  options?: AnimationOptions,
): Animation<T> {
  const trackNames = Object.keys(tracks);

  for (const name of trackNames) {
    const track = tracks[name] as readonly Keyframe[];

    if (track.length === 0) {
      throw new Error(
        `createAnimation: track "${name}" must contain at least 1 keyframe.`,
      );
    }

    for (let i = 0; i < track.length; i++) {
      const keyframe = track[i] as Keyframe;

      if (!Number.isFinite(keyframe.time) || !Number.isFinite(keyframe.value)) {
        throw new RangeError(
          `createAnimation: track "${name}" keyframe time/value must be finite numbers.`,
        );
      }

      if (i > 0 && keyframe.time < (track[i - 1] as Keyframe).time) {
        throw new Error(
          `createAnimation: track "${name}" keyframes must be sorted by time.`,
        );
      }
    }
  }

  const loop = options?.loop;
  if (loop !== undefined) {
    if (!Number.isFinite(loop) || loop <= 0) {
      throw new RangeError("createAnimation: loop must be a positive finite number.");
    }
  }

  let duration = 0;
  for (const name of trackNames) {
    const track = tracks[name] as readonly Keyframe[];
    const lastTime = (track[track.length - 1] as Keyframe).time;
    if (lastTime > duration) {
      duration = lastTime;
    }
  }

  function resolveTime(time: number): number {
    if (loop === undefined) {
      return time;
    }
    return ((time % loop) + loop) % loop;
  }

  return {
    value(name: keyof T & string, time: number): number {
      const track = tracks[name];
      if (track === undefined) {
        throw new Error(`createAnimation: unknown track "${name}".`);
      }
      return evaluateTrack(track, resolveTime(time));
    },
    at(time: number): { [K in keyof T]: number } {
      const resolved = resolveTime(time);
      const result = {} as { [K in keyof T]: number };
      for (const name of trackNames) {
        (result as Record<string, number>)[name] = evaluateTrack(
          tracks[name] as readonly Keyframe[],
          resolved,
        );
      }
      return result;
    },
    duration,
  };
}
