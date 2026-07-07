export type Vec2 = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Circle = {
  center: Vec2;
  r: number;
};

export type Line = {
  from: Vec2;
  to: Vec2;
};

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function rect(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h };
}

export function circle(center: Vec2, r: number): Circle {
  return { center, r };
}

export function line(from: Vec2, to: Vec2): Line {
  return { from, to };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

export function mul(v: Vec2, scalar: number): Vec2 {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
  };
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function centerOf(rect: Rect): Vec2 {
  return {
    x: rect.x + rect.w / 2,
    y: rect.y + rect.h / 2,
  };
}

export function moved(shape: Rect, offset: Vec2): Rect;
export function moved(shape: Circle, offset: Vec2): Circle;
export function moved(shape: Line, offset: Vec2): Line;
export function moved(
  shape: Rect | Circle | Line,
  offset: Vec2,
): Rect | Circle | Line {
  if (isRect(shape)) {
    return {
      ...shape,
      x: shape.x + offset.x,
      y: shape.y + offset.y,
    };
  }

  if (isCircle(shape)) {
    return {
      ...shape,
      center: add(shape.center, offset),
    };
  }

  return {
    from: add(shape.from, offset),
    to: add(shape.to, offset),
  };
}

export function contains(rect: Rect, point: Vec2): boolean;
export function contains(circle: Circle, point: Vec2): boolean;
export function contains(shape: Rect | Circle, point: Vec2): boolean {
  if (isRect(shape)) {
    return (
      point.x >= shape.x &&
      point.x <= shape.x + shape.w &&
      point.y >= shape.y &&
      point.y <= shape.y + shape.h
    );
  }

  return distance(shape.center, point) <= shape.r;
}

export function intersects(a: Rect, b: Rect): boolean;
export function intersects(a: Circle, b: Circle): boolean;
export function intersects(a: Rect, b: Circle): boolean;
export function intersects(a: Circle, b: Rect): boolean;
export function intersects(a: Rect | Circle, b: Rect | Circle): boolean {
  if (isRect(a) && isRect(b)) {
    return (
      a.x <= b.x + b.w &&
      a.x + a.w >= b.x &&
      a.y <= b.y + b.h &&
      a.y + a.h >= b.y
    );
  }

  if (isCircle(a) && isCircle(b)) {
    return distance(a.center, b.center) <= a.r + b.r;
  }

  if (isRect(a) && isCircle(b)) {
    return intersectsRectCircle(a, b);
  }

  if (isCircle(a) && isRect(b)) {
    return intersectsRectCircle(b, a);
  }

  throw new Error("intersects: unsupported shape combination.");
}

function intersectsRectCircle(rect: Rect, circle: Circle): boolean {
  const nearest = {
    x: clamp(circle.center.x, rect.x, rect.x + rect.w),
    y: clamp(circle.center.y, rect.y, rect.y + rect.h),
  };

  return distance(nearest, circle.center) <= circle.r;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isRect(shape: Rect | Circle | Line): shape is Rect {
  return "x" in shape;
}

function isCircle(shape: Rect | Circle | Line): shape is Circle {
  return "center" in shape;
}
