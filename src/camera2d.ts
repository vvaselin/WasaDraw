import type { Size2D, Vec2 } from "./types.js";

export type Camera2DOptions = {
  center?: Vec2;
  zoom?: number;
};

export type Camera2D = {
  center: Vec2;
  zoom: number;

  worldToScreen(point: Vec2, viewportSize: Size2D): Vec2;
  screenToWorld(point: Vec2, viewportSize: Size2D): Vec2;

  moveBy(offset: Vec2): void;
  movedBy(offset: Vec2): Camera2D;

  setCenter(center: Vec2): void;
  setZoom(zoom: number): void;

  zoomAt(screenPoint: Vec2, zoomFactor: number, viewportSize: Size2D): void;
};

export function createCamera2D(options: Camera2DOptions = {}): Camera2D {
  return new BasicCamera2D(options);
}

class BasicCamera2D implements Camera2D {
  center: Vec2;
  zoom: number;

  constructor(options: Camera2DOptions) {
    this.center = { ...(options.center ?? { x: 0, y: 0 }) };
    this.zoom = options.zoom ?? 1;

    assertFiniteVec2("camera.center", this.center);
    assertPositiveFinite("camera.zoom", this.zoom);
  }

  worldToScreen(point: Vec2, viewportSize: Size2D): Vec2 {
    this.assertValidState();
    assertFiniteVec2("point", point);
    assertViewportSize(viewportSize);

    return {
      x: (point.x - this.center.x) * this.zoom + viewportSize.width / 2,
      y: (point.y - this.center.y) * this.zoom + viewportSize.height / 2,
    };
  }

  screenToWorld(point: Vec2, viewportSize: Size2D): Vec2 {
    this.assertValidState();
    assertFiniteVec2("point", point);
    assertViewportSize(viewportSize);

    return {
      x: (point.x - viewportSize.width / 2) / this.zoom + this.center.x,
      y: (point.y - viewportSize.height / 2) / this.zoom + this.center.y,
    };
  }

  moveBy(offset: Vec2): void {
    this.assertValidState();
    assertFiniteVec2("offset", offset);

    this.center = {
      x: this.center.x + offset.x,
      y: this.center.y + offset.y,
    };
  }

  movedBy(offset: Vec2): Camera2D {
    this.assertValidState();
    assertFiniteVec2("offset", offset);

    return createCamera2D({
      center: {
        x: this.center.x + offset.x,
        y: this.center.y + offset.y,
      },
      zoom: this.zoom,
    });
  }

  setCenter(center: Vec2): void {
    assertFiniteVec2("center", center);
    this.center = { ...center };
  }

  setZoom(zoom: number): void {
    assertPositiveFinite("zoom", zoom);
    this.zoom = zoom;
  }

  zoomAt(screenPoint: Vec2, zoomFactor: number, viewportSize: Size2D): void {
    assertFiniteVec2("screenPoint", screenPoint);
    assertPositiveFinite("zoomFactor", zoomFactor);
    assertViewportSize(viewportSize);

    const before = this.screenToWorld(screenPoint, viewportSize);
    this.setZoom(this.zoom * zoomFactor);
    const after = this.screenToWorld(screenPoint, viewportSize);

    this.moveBy({
      x: before.x - after.x,
      y: before.y - after.y,
    });
  }

  private assertValidState(): void {
    assertFiniteVec2("camera.center", this.center);
    assertPositiveFinite("camera.zoom", this.zoom);
  }
}

function assertViewportSize(viewportSize: Size2D): void {
  assertPositiveFinite("viewportSize.width", viewportSize.width);
  assertPositiveFinite("viewportSize.height", viewportSize.height);
}

function assertFiniteVec2(name: string, value: Vec2): void {
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) {
    throw new RangeError(`${name} must contain finite numbers.`);
  }
}

function assertPositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite number greater than 0.`);
  }
}
