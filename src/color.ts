export function rgb(r: number, g: number, b: number): string {
  assertInRange("rgb", "r", r, 0, 255);
  assertInRange("rgb", "g", g, 0, 255);
  assertInRange("rgb", "b", b, 0, 255);

  return `rgb(${r} ${g} ${b})`;
}

export function rgba(r: number, g: number, b: number, a: number): string {
  assertInRange("rgba", "r", r, 0, 255);
  assertInRange("rgba", "g", g, 0, 255);
  assertInRange("rgba", "b", b, 0, 255);
  assertInRange("rgba", "a", a, 0, 1);

  return `rgb(${r} ${g} ${b} / ${a})`;
}

export function hsl(h: number, s: number, l: number): string {
  assertFinite("hsl", "h", h);
  assertInRange("hsl", "s", s, 0, 100);
  assertInRange("hsl", "l", l, 0, 100);

  return `hsl(${h} ${s}% ${l}%)`;
}

export function hsla(h: number, s: number, l: number, a: number): string {
  assertFinite("hsla", "h", h);
  assertInRange("hsla", "s", s, 0, 100);
  assertInRange("hsla", "l", l, 0, 100);
  assertInRange("hsla", "a", a, 0, 1);

  return `hsl(${h} ${s}% ${l}% / ${a})`;
}

function assertFinite(fn: string, name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${fn}: ${name} must be a finite number.`);
  }
}

function assertInRange(
  fn: string,
  name: string,
  value: number,
  min: number,
  max: number,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(
      `${fn}: ${name} must be a finite number in the range ${min}-${max}.`,
    );
  }
}
