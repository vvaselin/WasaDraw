/** easings.net の標準数式に基づくイージング関数群。t は 0..1 を想定し、クランプは行わない。 */
export type EasingFn = (t: number) => number;

export { easeOutCubic, easeInOutCubic } from "./math.js";

export function linear(t: number): number {
  return t;
}

export function easeInSine(t: number): number {
  return 1 - Math.cos((t * Math.PI) / 2);
}

export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeInQuart(t: number): number {
  return t * t * t * t;
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function easeInQuint(t: number): number {
  return t * t * t * t * t;
}

export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

export function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutExpo(t: number): number {
  if (t === 0) {
    return 0;
  }
  if (t === 1) {
    return 1;
  }
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export function easeInCirc(t: number): number {
  return 1 - Math.sqrt(1 - Math.pow(t, 2));
}

export function easeOutCirc(t: number): number {
  return Math.sqrt(1 - Math.pow(t - 1, 2));
}

export function easeInOutCirc(t: number): number {
  return t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
}

const BACK_C1 = 1.70158;
const BACK_C2 = BACK_C1 * 1.525;
const BACK_C3 = BACK_C1 + 1;

export function easeInBack(t: number): number {
  return BACK_C3 * t * t * t - BACK_C1 * t * t;
}

export function easeOutBack(t: number): number {
  return (
    1 + BACK_C3 * Math.pow(t - 1, 3) + BACK_C1 * Math.pow(t - 1, 2)
  );
}

export function easeInOutBack(t: number): number {
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((BACK_C2 + 1) * 2 * t - BACK_C2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((BACK_C2 + 1) * (t * 2 - 2) + BACK_C2) + 2) /
        2;
}

const ELASTIC_C4 = (2 * Math.PI) / 3;
const ELASTIC_C5 = (2 * Math.PI) / 4.5;

export function easeInElastic(t: number): number {
  if (t === 0) {
    return 0;
  }
  if (t === 1) {
    return 1;
  }
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ELASTIC_C4);
}

export function easeOutElastic(t: number): number {
  if (t === 0) {
    return 0;
  }
  if (t === 1) {
    return 1;
  }
  return (
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ELASTIC_C4) + 1
  );
}

export function easeInOutElastic(t: number): number {
  if (t === 0) {
    return 0;
  }
  if (t === 1) {
    return 1;
  }
  return t < 0.5
    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) /
        2
    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ELASTIC_C5)) /
        2 +
        1;
}

const BOUNCE_N1 = 7.5625;
const BOUNCE_D1 = 2.75;

export function easeOutBounce(t: number): number {
  if (t < 1 / BOUNCE_D1) {
    return BOUNCE_N1 * t * t;
  } else if (t < 2 / BOUNCE_D1) {
    const t2 = t - 1.5 / BOUNCE_D1;
    return BOUNCE_N1 * t2 * t2 + 0.75;
  } else if (t < 2.5 / BOUNCE_D1) {
    const t2 = t - 2.25 / BOUNCE_D1;
    return BOUNCE_N1 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / BOUNCE_D1;
    return BOUNCE_N1 * t2 * t2 + 0.984375;
  }
}

export function easeInBounce(t: number): number {
  return 1 - easeOutBounce(1 - t);
}

export function easeInOutBounce(t: number): number {
  return t < 0.5
    ? (1 - easeOutBounce(1 - 2 * t)) / 2
    : (1 + easeOutBounce(2 * t - 1)) / 2;
}
