import type {
  ArrowOptions,
  Circle,
  DrawContext,
  EmojiStyle,
  Fill,
  FrameOptions,
  ImageStyle,
  Rect,
  RenderState2D,
  Shape,
  ShadowOptions,
  ShapeStyle,
  Size2D,
  SplineOptions,
  TextStyle,
  Transform2D,
  Vec2,
} from "./types.js";
import type { Bezier2, Bezier3 } from "./curve.js";
import type { Camera2D } from "./camera2d.js";
import { boundsOfPoints, contains, rect as makeRect } from "./geometry.js";
import { splineToBeziers } from "./curve.js";
import { resolveFill } from "./gradient.js";

const defaultFill = "#ffffff";
const defaultTextFont = "sans-serif";
const defaultEmojiFont =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

export class CanvasDrawContext implements DrawContext {
  private size: Size2D = {
    width: 0,
    height: 0,
    center: { x: 0, y: 0 },
  };

  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  setSize(size: Size2D): void {
    this.size = size;
  }

  clear(color?: string): void {
    const { ctx } = this;

    ctx.save();
    ctx.clearRect(0, 0, this.size.width, this.size.height);

    if (color !== undefined) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, this.size.width, this.size.height);
    }

    ctx.restore();
  }

  withTransform(transform: Transform2D, callback: () => void): void {
    const { ctx } = this;
    const { translate, rotate, scale, skew } = transform;

    // Canvas 2D は非有限値の変換を黙って無視するため、ここで明示的に検証します。
    if (translate !== undefined) {
      assertFiniteTransform("translate.x", translate.x);
      assertFiniteTransform("translate.y", translate.y);
    }

    if (rotate !== undefined) {
      assertFiniteTransform("rotate", rotate);
    }

    const scaleVec =
      scale === undefined
        ? undefined
        : typeof scale === "number"
          ? { x: scale, y: scale }
          : scale;

    if (scaleVec !== undefined) {
      assertFiniteTransform("scale.x", scaleVec.x);
      assertFiniteTransform("scale.y", scaleVec.y);
    }

    if (skew !== undefined) {
      assertFiniteTransform("skew.x", skew.x);
      assertFiniteTransform("skew.y", skew.y);
    }

    ctx.save();

    try {
      if (translate !== undefined) {
        ctx.translate(translate.x, translate.y);
      }

      if (rotate !== undefined) {
        ctx.rotate(rotate);
      }

      if (scaleVec !== undefined) {
        ctx.scale(scaleVec.x, scaleVec.y);
      }

      if (skew !== undefined) {
        // せん断は角度（ラジアン）指定。tan で Canvas の行列成分へ変換する。
        ctx.transform(1, Math.tan(skew.y), Math.tan(skew.x), 1, 0, 0);
      }

      callback();
    } finally {
      ctx.restore();
    }
  }

  withCamera(camera: Camera2D, viewportSize: Size2D, callback: () => void): void {
    const { ctx } = this;

    if (
      !Number.isFinite(camera.center.x) ||
      !Number.isFinite(camera.center.y)
    ) {
      throw new RangeError(
        "draw.withCamera: camera.center must contain finite numbers.",
      );
    }

    if (!Number.isFinite(camera.zoom) || camera.zoom <= 0) {
      throw new RangeError(
        "draw.withCamera: camera.zoom must be a finite number greater than 0.",
      );
    }

    assertPositiveFiniteDrawCameraValue(
      "viewportSize.width",
      viewportSize.width,
    );
    assertPositiveFiniteDrawCameraValue(
      "viewportSize.height",
      viewportSize.height,
    );

    ctx.save();

    try {
      ctx.translate(viewportSize.width / 2, viewportSize.height / 2);
      ctx.scale(camera.zoom, camera.zoom);
      ctx.translate(-camera.center.x, -camera.center.y);
      callback();
    } finally {
      ctx.restore();
    }
  }

  withState(state: RenderState2D, callback: () => void): void {
    const { ctx } = this;
    const {
      alpha,
      blend,
      shadowBlur,
      shadowColor,
      shadowOffset,
      filter,
      lineCap,
      lineJoin,
    } = state;

    if (alpha !== undefined && (!Number.isFinite(alpha) || alpha < 0 || alpha > 1)) {
      throw new RangeError(
        "draw.withState: alpha must be a finite number in the range 0-1.",
      );
    }

    if (
      shadowBlur !== undefined &&
      (!Number.isFinite(shadowBlur) || shadowBlur < 0)
    ) {
      throw new RangeError(
        "draw.withState: shadowBlur must be a finite number greater than or equal to 0.",
      );
    }

    if (shadowOffset !== undefined) {
      if (!Number.isFinite(shadowOffset.x) || !Number.isFinite(shadowOffset.y)) {
        throw new RangeError(
          "draw.withState: shadowOffset must contain finite numbers.",
        );
      }
    }

    ctx.save();

    try {
      // alpha は置き換えではなく乗算です。withState の入れ子や
      // style.alpha との組み合わせが自然に合成されます。
      if (alpha !== undefined) {
        ctx.globalAlpha = ctx.globalAlpha * alpha;
      }

      if (blend !== undefined) {
        ctx.globalCompositeOperation = blend;
      }

      if (shadowBlur !== undefined) {
        ctx.shadowBlur = shadowBlur;
      }

      if (shadowColor !== undefined) {
        ctx.shadowColor = shadowColor;
      }

      if (shadowOffset !== undefined) {
        ctx.shadowOffsetX = shadowOffset.x;
        ctx.shadowOffsetY = shadowOffset.y;
      }

      if (filter !== undefined) {
        ctx.filter = filter;
      }

      if (lineCap !== undefined) {
        ctx.lineCap = lineCap;
      }

      if (lineJoin !== undefined) {
        ctx.lineJoin = lineJoin;
      }

      callback();
    } finally {
      ctx.restore();
    }
  }

  shape(shape: Shape, style?: ShapeStyle | string): void {
    if (shape === null || typeof shape !== "object" || !("kind" in shape)) {
      throw new Error("draw.shape: unsupported shape kind.");
    }

    switch (shape.kind) {
      case "circle":
        this.circle(shape.center, shape.r, style);
        return;
      case "rect":
        this.rect(shape, style);
        return;
      case "line":
        this.line(shape.from, shape.to, style);
        return;
      default:
        throw new Error("draw.shape: unsupported shape kind.");
    }
  }

  circle(pos: Vec2, radius: number, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style, () =>
      makeRect(pos.x - radius, pos.y - radius, radius * 2, radius * 2),
    );
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    this.fillAndStroke(style);
    ctx.restore();
  }

  ellipse(
    pos: Vec2,
    radiusX: number,
    radiusY: number,
    style?: ShapeStyle | string,
  ): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style, () =>
      makeRect(pos.x - radiusX, pos.y - radiusY, radiusX * 2, radiusY * 2),
    );
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, radiusX, radiusY, 0, 0, Math.PI * 2);
    this.fillAndStroke(style);
    ctx.restore();
  }

  rect(rect: Rect, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style, () => rect);
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    this.fillAndStroke(style);
    ctx.restore();
  }

  roundRect(rect: Rect, radius: number, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style, () => rect);
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
    this.fillAndStroke(style);
    ctx.restore();
  }

  triangle(
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
    style?: ShapeStyle | string,
  ): void {
    const { ctx } = this;

    ctx.save();
    this.applyShapeStyle(style, () => boundsOfPoints([p1, p2, p3]));
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    this.fillAndStroke(style);
    ctx.restore();
  }

  polygon(points: Vec2[], style?: ShapeStyle | string): void {
    if (points.length < 3) {
      throw new Error("draw.polygon: points must contain at least 3 points.");
    }

    const { ctx } = this;
    const first = points[0]!;

    ctx.save();
    this.applyShapeStyle(style, () => boundsOfPoints(points));
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i += 1) {
      const point = points[i]!;
      ctx.lineTo(point.x, point.y);
    }

    ctx.closePath();
    this.fillAndStroke(style);
    ctx.restore();
  }

  frame(
    shape: Rect | Circle,
    thickness: number | FrameOptions,
    style?: ShapeStyle | string,
  ): void {
    const { inner, outer } = normalizeFrameThickness(thickness);
    const total = inner + outer;

    if (total === 0) {
      return;
    }

    // ストロークは中心線から両側へ半分ずつ広がるため、
    // パスを (outer - inner) / 2 だけ外側へずらすと内外の太さ指定を再現できる。
    const offset = (outer - inner) / 2;
    const { ctx } = this;
    const paint = frameStyle(style);

    if (shape.kind === "rect") {
      const bounds = makeRect(
        shape.x - outer,
        shape.y - outer,
        shape.w + outer * 2,
        shape.h + outer * 2,
      );

      ctx.save();
      this.applyShapeStyle(paint, () => bounds);
      ctx.lineWidth = total;
      ctx.beginPath();
      ctx.rect(
        shape.x - offset,
        shape.y - offset,
        shape.w + offset * 2,
        shape.h + offset * 2,
      );
      ctx.stroke();
      ctx.restore();
      return;
    }

    const strokeRadius = shape.r + offset;

    if (strokeRadius <= 0) {
      return;
    }

    const outerRadius = shape.r + outer;
    const bounds = makeRect(
      shape.center.x - outerRadius,
      shape.center.y - outerRadius,
      outerRadius * 2,
      outerRadius * 2,
    );

    ctx.save();
    this.applyShapeStyle(paint, () => bounds);
    ctx.lineWidth = total;
    ctx.beginPath();
    ctx.arc(shape.center.x, shape.center.y, strokeRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  arrow(
    from: Vec2,
    to: Vec2,
    options: ArrowOptions = {},
    style?: ShapeStyle | string,
  ): void {
    this.polygon(arrowPolygon(from, to, options, false), style);
  }

  doubleHeadedArrow(
    from: Vec2,
    to: Vec2,
    options: ArrowOptions = {},
    style?: ShapeStyle | string,
  ): void {
    this.polygon(arrowPolygon(from, to, options, true), style);
  }

  line(from: Vec2, to: Vec2, style?: ShapeStyle | string): void {
    const { ctx } = this;

    ctx.save();
    this.applyLineStyle(style, () => boundsOfPoints([from, to]));
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }

  polyline(points: Vec2[], style?: ShapeStyle | string): void {
    if (points.length < 2) {
      throw new Error("draw.polyline: points must contain at least 2 points.");
    }

    const { ctx } = this;
    const first = points[0]!;

    ctx.save();
    this.applyLineStyle(style, () => boundsOfPoints(points));
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i += 1) {
      const point = points[i]!;
      ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  arc(
    pos: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: ShapeStyle | string,
  ): void {
    const { ctx } = this;

    ctx.save();
    this.applyLineStyle(style, () =>
      makeRect(pos.x - radius, pos.y - radius, radius * 2, radius * 2),
    );
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, startAngle, endAngle);
    ctx.stroke();
    ctx.restore();
  }

  text(text: string, pos: Vec2, style?: TextStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeTextStyle(style);
    const size = normalized.size ?? 16;
    const lineHeight = normalized.lineHeight ?? 1.2;
    const font = normalized.font ?? defaultTextFont;
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

    if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
      throw new RangeError(
        "draw.text: lineHeight must be a finite number greater than 0.",
      );
    }

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * (normalized.alpha ?? 1);
    ctx.fillStyle = normalized.fill ?? defaultFill;
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = normalized.align ?? "start";
    ctx.textBaseline = normalized.baseline ?? "alphabetic";

    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i]!, pos.x, pos.y + i * size * lineHeight);
    }

    ctx.restore();
  }

  emoji(emoji: string, pos: Vec2, style: EmojiStyle = {}): void {
    const { ctx } = this;
    const size = style.size ?? 48;
    const font = style.font ?? defaultEmojiFont;
    const rotation = style.rotation ?? 0;
    const scale = style.scale ?? 1;
    const scaleX = style.mirrored === true ? -scale : scale;

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * (style.alpha ?? 1);
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scale);
    ctx.font = `${size}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  }

  image(image: CanvasImageSource, pos: Vec2, style: ImageStyle = {}): void {
    const { ctx } = this;
    const natural = getImageSize(image);
    const width = style.width ?? natural.width;
    const height = style.height ?? natural.height;
    const scale = style.scale ?? 1;
    const rotation = style.rotation ?? 0;

    assertPositiveFinite("width", width);
    assertPositiveFinite("height", height);
    assertFiniteImageValue("scale", scale);
    assertFiniteImageValue("rotation", rotation);

    const scaleX = style.mirrored === true ? -scale : scale;

    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * (style.alpha ?? 1);
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scale);
    ctx.drawImage(image, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  bezier(curve: Bezier2 | Bezier3, style?: ShapeStyle | string): void {
    const { ctx } = this;
    const points: Vec2[] =
      curve.kind === "bezier2"
        ? [curve.p0, curve.p1, curve.p2]
        : [curve.p0, curve.p1, curve.p2, curve.p3];

    ctx.save();
    this.applyLineStyle(style, () => boundsOfPoints(points));
    ctx.beginPath();
    ctx.moveTo(curve.p0.x, curve.p0.y);

    if (curve.kind === "bezier2") {
      ctx.quadraticCurveTo(curve.p1.x, curve.p1.y, curve.p2.x, curve.p2.y);
    } else {
      ctx.bezierCurveTo(
        curve.p1.x,
        curve.p1.y,
        curve.p2.x,
        curve.p2.y,
        curve.p3.x,
        curve.p3.y,
      );
    }

    ctx.stroke();
    ctx.restore();
  }

  spline(
    points: Vec2[],
    options: SplineOptions = {},
    style?: ShapeStyle | string,
  ): void {
    const { ctx } = this;
    // exactOptionalPropertyTypes 有効のため undefined を明示的に渡さない。
    const splineOptions: { closed?: boolean; tension?: number } = {};

    if (options.closed !== undefined) {
      splineOptions.closed = options.closed;
    }

    if (options.tension !== undefined) {
      splineOptions.tension = options.tension;
    }

    // points.length < 2 の検証は curve.ts 側に委ねる（throw が伝播する）。
    const beziers = splineToBeziers(points, splineOptions);
    const closed = options.closed ?? false;
    const first = beziers[0]!;

    // bbox は全区間の全制御点。
    const allPoints: Vec2[] = [first.p0];
    for (const b of beziers) {
      allPoints.push(b.p1, b.p2, b.p3);
    }

    ctx.save();

    const buildPath = (): void => {
      ctx.beginPath();
      ctx.moveTo(first.p0.x, first.p0.y);
      for (const b of beziers) {
        ctx.bezierCurveTo(b.p1.x, b.p1.y, b.p2.x, b.p2.y, b.p3.x, b.p3.y);
      }
    };

    if (closed) {
      this.applyShapeStyle(style, () => boundsOfPoints(allPoints));
      buildPath();
      ctx.closePath();
      this.fillAndStroke(style);
    } else {
      this.applyLineStyle(style, () => boundsOfPoints(allPoints));
      buildPath();
      ctx.stroke();
    }

    ctx.restore();
  }

  shadow(shape: Rect | Circle, options: ShadowOptions = {}): void {
    const { ctx } = this;
    const offset = options.offset ?? { x: 2, y: 2 };
    const blur = options.blur ?? 8;
    const color = options.color ?? "rgba(0, 0, 0, 0.5)";
    const radius = options.radius ?? 0;

    if (!Number.isFinite(blur) || blur < 0) {
      throw new RangeError(
        "draw.shadow: blur must be a finite number greater than or equal to 0.",
      );
    }

    if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y)) {
      throw new RangeError("draw.shadow: offset must contain finite numbers.");
    }

    if (!Number.isFinite(radius) || radius < 0) {
      throw new RangeError(
        "draw.shadow: radius must be a finite number greater than or equal to 0.",
      );
    }

    // 本体形状を画面外へ描き、影だけを画面内へ落とすオフセット技法。
    // 注意: Canvas の shadowOffset は変換行列の影響を受けないため、
    // withTransform / withCamera の scale・rotate の内側では影の位置がずれます。
    const OFFSCREEN = 100000;

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = offset.x + OFFSCREEN;
    ctx.shadowOffsetY = offset.y;
    ctx.fillStyle = "#000";
    ctx.beginPath();

    if (shape.kind === "rect") {
      if (radius > 0) {
        ctx.roundRect(shape.x - OFFSCREEN, shape.y, shape.w, shape.h, radius);
      } else {
        ctx.rect(shape.x - OFFSCREEN, shape.y, shape.w, shape.h);
      }
    } else {
      ctx.arc(
        shape.center.x - OFFSCREEN,
        shape.center.y,
        shape.r,
        0,
        Math.PI * 2,
      );
    }

    ctx.fill();
    ctx.restore();
  }

  heart(center: Vec2, r: number, style?: ShapeStyle | string): void {
    if (!Number.isFinite(r) || r <= 0) {
      throw new RangeError(
        "draw.heart: r must be a finite number greater than 0.",
      );
    }

    const { ctx } = this;
    // ローカル単位座標（-1..1、y 下向き正）を r 倍 + center 平行移動する。
    const at = (ux: number, uy: number): Vec2 => ({
      x: center.x + ux * r,
      y: center.y + uy * r,
    });

    ctx.save();
    this.applyShapeStyle(style, () =>
      makeRect(center.x - r, center.y - r, r * 2, r * 2),
    );

    const start = at(0, -0.35);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);

    const cubic = (
      c1: [number, number],
      c2: [number, number],
      end: [number, number],
    ): void => {
      const p1 = at(c1[0], c1[1]);
      const p2 = at(c2[0], c2[1]);
      const p3 = at(end[0], end[1]);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    };

    // 左半分
    cubic([-0.55, -1.0], [-1.0, -0.6], [-1.0, -0.2]);
    cubic([-1.0, 0.3], [-0.5, 0.7], [0, 1.0]);
    // 右半分（対称）
    cubic([0.5, 0.7], [1.0, 0.3], [1.0, -0.2]);
    cubic([1.0, -0.6], [0.55, -1.0], [0, -0.35]);

    ctx.closePath();
    this.fillAndStroke(style);
    ctx.restore();
  }

  squircle(
    center: Vec2,
    r: number,
    options: { exponent?: number } = {},
    style?: ShapeStyle | string,
  ): void {
    if (!Number.isFinite(r) || r <= 0) {
      throw new RangeError(
        "draw.squircle: r must be a finite number greater than 0.",
      );
    }

    const exponent = options.exponent ?? 4;

    if (!Number.isFinite(exponent) || exponent < 1) {
      throw new RangeError(
        "draw.squircle: exponent must be a finite number greater than or equal to 1.",
      );
    }

    const { ctx } = this;
    const segments = 64;
    const p = 2 / exponent;

    ctx.save();
    this.applyShapeStyle(style, () =>
      makeRect(center.x - r, center.y - r, r * 2, r * 2),
    );
    ctx.beginPath();

    for (let i = 0; i <= segments; i += 1) {
      const t = (i / segments) * Math.PI * 2;
      const cos = Math.cos(t);
      const sin = Math.sin(t);
      const x = center.x + r * Math.sign(cos) * Math.abs(cos) ** p;
      const y = center.y + r * Math.sign(sin) * Math.abs(sin) ** p;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    this.fillAndStroke(style);
    ctx.restore();
  }

  rectBalloon(rect: Rect, target: Vec2, style?: ShapeStyle | string): void {
    // target が矩形内部（境界含む）なら尾なしで通常描画にフォールバック。
    if (contains(rect, target)) {
      this.rect(rect, style);
      return;
    }

    const left = rect.x;
    const right = rect.x + rect.w;
    const top = rect.y;
    const bottom = rect.y + rect.h;

    // 尾を出す辺の決定。左右と上下が両方成り立つ場合は、
    // 辺までの距離が大きい方の軸を採用する。
    const outLeft = target.x < left;
    const outRight = target.x > right;
    const outTop = target.y < top;
    const outBottom = target.y > bottom;

    const dx = outLeft ? left - target.x : outRight ? target.x - right : 0;
    const dy = outTop ? top - target.y : outBottom ? target.y - bottom : 0;

    const horizontal = (outLeft || outRight) && dx >= dy;

    const tailHalf = Math.min(rect.w, rect.h) * 0.15;

    // 矩形の 4 頂点を時計回り（左上→右上→右下→左下）に。
    const topLeft: Vec2 = { x: left, y: top };
    const topRight: Vec2 = { x: right, y: top };
    const bottomRight: Vec2 = { x: right, y: bottom };
    const bottomLeft: Vec2 = { x: left, y: bottom };

    const clamp = (v: number, lo: number, hi: number): number =>
      Math.min(Math.max(v, lo), hi);

    let points: Vec2[];

    if (horizontal) {
      // 尾の根元は上下方向へ clamp。
      const cy = clamp(target.y, top + tailHalf, bottom - tailHalf);

      if (outLeft) {
        // 左辺は時計回りで bottomLeft から topLeft へ（下→上）たどるため、
        // 根元は下側 root2 → target → 上側 root1 の順に挿入する。
        const root1: Vec2 = { x: left, y: cy - tailHalf };
        const root2: Vec2 = { x: left, y: cy + tailHalf };
        points = [topLeft, topRight, bottomRight, bottomLeft, root2, target, root1];
      } else {
        // 右辺（上→下の順）。
        const root1: Vec2 = { x: right, y: cy - tailHalf };
        const root2: Vec2 = { x: right, y: cy + tailHalf };
        points = [topLeft, topRight, root1, target, root2, bottomRight, bottomLeft];
      }
    } else {
      const cx = clamp(target.x, left + tailHalf, right - tailHalf);

      if (outTop) {
        // 上辺（左→右の順）。
        const root1: Vec2 = { x: cx - tailHalf, y: top };
        const root2: Vec2 = { x: cx + tailHalf, y: top };
        points = [topLeft, root1, target, root2, topRight, bottomRight, bottomLeft];
      } else {
        // 下辺（右→左の順）。
        const root1: Vec2 = { x: cx + tailHalf, y: bottom };
        const root2: Vec2 = { x: cx - tailHalf, y: bottom };
        points = [topLeft, topRight, bottomRight, root1, target, root2, bottomLeft];
      }
    }

    this.polygon(points, style);
  }

  // グラデーション解決に必要な bbox は遅延評価で受け取り、
  // 単色指定のときは頂点走査などの計算を発生させません。
  private applyShapeStyle(
    style: ShapeStyle | string | undefined,
    boundsFn: () => Rect,
  ): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);
    let bounds: Rect | undefined;
    const getBounds = (): Rect => (bounds ??= boundsFn());

    // withState({ alpha }) の中では外側の alpha と乗算で合成されます。
    ctx.globalAlpha = ctx.globalAlpha * (normalized.alpha ?? 1);

    if (normalized.fill !== undefined) {
      ctx.fillStyle = this.resolvePaint(normalized.fill, getBounds);
    }

    if (normalized.stroke !== undefined) {
      ctx.strokeStyle = this.resolvePaint(normalized.stroke, getBounds);
      ctx.lineWidth = normalized.width ?? 1;
    }

    if (normalized.lineCap !== undefined) {
      ctx.lineCap = normalized.lineCap;
    }

    if (normalized.lineJoin !== undefined) {
      ctx.lineJoin = normalized.lineJoin;
    }

    if (normalized.dash !== undefined) {
      ctx.setLineDash(normalized.dash);
    }
  }

  private applyLineStyle(
    style: ShapeStyle | string | undefined,
    boundsFn: () => Rect,
  ): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);
    let bounds: Rect | undefined;
    const getBounds = (): Rect => (bounds ??= boundsFn());

    ctx.globalAlpha = ctx.globalAlpha * (normalized.alpha ?? 1);
    ctx.strokeStyle = this.resolvePaint(
      normalized.stroke ?? normalized.fill ?? defaultFill,
      getBounds,
    );
    ctx.lineWidth = normalized.width ?? 1;

    if (normalized.lineCap !== undefined) {
      ctx.lineCap = normalized.lineCap;
    }

    if (normalized.lineJoin !== undefined) {
      ctx.lineJoin = normalized.lineJoin;
    }

    if (normalized.dash !== undefined) {
      ctx.setLineDash(normalized.dash);
    }
  }

  private resolvePaint(
    fill: Fill,
    getBounds: () => Rect,
  ): string | CanvasGradient {
    if (typeof fill === "string") {
      return fill;
    }

    return resolveFill(this.ctx, fill, getBounds());
  }

  private fillAndStroke(style?: ShapeStyle | string): void {
    const { ctx } = this;
    const normalized = normalizeShapeStyle(style);
    const hasFill = normalized.fill !== undefined;
    const hasStroke = normalized.stroke !== undefined;

    if (!hasFill && !hasStroke) {
      ctx.fillStyle = defaultFill;
      ctx.fill();
      return;
    }

    if (hasFill) {
      ctx.fill();
    }

    if (hasStroke) {
      ctx.stroke();
    }
  }
}

// 未ロード画像やサイズ0のsourceは、Canvas 2D では黙って何も描かれません。
// 暗黙の失敗を避けるため、ここで明示的に検証して throw します。
function getImageSize(source: CanvasImageSource): {
  width: number;
  height: number;
} {
  if (
    typeof HTMLImageElement !== "undefined" &&
    source instanceof HTMLImageElement
  ) {
    if (!source.complete || source.naturalWidth === 0) {
      throw new Error(
        "draw.image: image is not loaded yet. Use loadImage() or wait for the load event.",
      );
    }

    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  if (
    typeof HTMLCanvasElement !== "undefined" &&
    source instanceof HTMLCanvasElement
  ) {
    if (source.width === 0 || source.height === 0) {
      throw new Error("draw.image: canvas source has zero size.");
    }

    return { width: source.width, height: source.height };
  }

  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    if (source.width === 0 || source.height === 0) {
      throw new Error("draw.image: ImageBitmap source has zero size.");
    }

    return { width: source.width, height: source.height };
  }

  if (
    typeof HTMLVideoElement !== "undefined" &&
    source instanceof HTMLVideoElement
  ) {
    if (source.videoWidth === 0 || source.videoHeight === 0) {
      throw new Error("draw.image: video source is not ready yet.");
    }

    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (
    typeof OffscreenCanvas !== "undefined" &&
    source instanceof OffscreenCanvas
  ) {
    if (source.width === 0 || source.height === 0) {
      throw new Error("draw.image: OffscreenCanvas source has zero size.");
    }

    return { width: source.width, height: source.height };
  }

  throw new Error("draw.image: unsupported image source.");
}

function assertPositiveFinite(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `draw.image: ${name} must be a finite number greater than 0.`,
    );
  }
}

function assertFiniteImageValue(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`draw.image: ${name} must be a finite number.`);
  }
}

function assertFiniteTransform(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `draw.withTransform: ${name} must be a finite number.`,
    );
  }
}

function assertPositiveFiniteDrawCameraValue(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `draw.withCamera: ${name} must be a finite number greater than 0.`,
    );
  }
}

function normalizeFrameThickness(thickness: number | FrameOptions): {
  inner: number;
  outer: number;
} {
  // 数値 1 つの指定は Siv3D の drawFrame(thickness) と同じく内外へ半分ずつ。
  const inner = typeof thickness === "number" ? thickness / 2 : (thickness.inner ?? 0);
  const outer = typeof thickness === "number" ? thickness / 2 : (thickness.outer ?? 0);

  if (!Number.isFinite(inner) || inner < 0) {
    throw new RangeError(
      "draw.frame: inner must be a finite number greater than or equal to 0.",
    );
  }

  if (!Number.isFinite(outer) || outer < 0) {
    throw new RangeError(
      "draw.frame: outer must be a finite number greater than or equal to 0.",
    );
  }

  return { inner, outer };
}

// frame は塗りではなくストロークで描くため、fill 指定を stroke へ読み替える。
function frameStyle(style?: ShapeStyle | string): ShapeStyle {
  const normalized = normalizeShapeStyle(style);
  const { fill, stroke, width: _width, ...rest } = normalized;
  return { ...rest, stroke: stroke ?? fill ?? defaultFill };
}

function arrowPolygon(
  from: Vec2,
  to: Vec2,
  options: ArrowOptions,
  doubleHeaded: boolean,
): Vec2[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (!Number.isFinite(length) || length === 0) {
    throw new Error("draw.arrow: from and to must be different points.");
  }

  const width = options.width ?? 1;

  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError(
      "draw.arrow: width must be a finite number greater than 0.",
    );
  }

  const headSize = options.headSize ?? {
    x: width * 2 + 6,
    y: width * 2 + 6,
  };

  if (
    !Number.isFinite(headSize.x) ||
    !Number.isFinite(headSize.y) ||
    headSize.x <= 0 ||
    headSize.y <= 0
  ) {
    throw new RangeError(
      "draw.arrow: headSize must contain finite numbers greater than 0.",
    );
  }

  // 軸方向の単位ベクトル u と、その法線 n。
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const halfWidth = width / 2;
  const halfHead = headSize.x / 2;
  // 矢じりが軸より長い場合は潰れないように切り詰める。
  const headLength = Math.min(headSize.y, doubleHeaded ? length / 2 : length);

  const at = (base: Vec2, along: number, aside: number): Vec2 => ({
    x: base.x + ux * along + nx * aside,
    y: base.y + uy * along + ny * aside,
  });

  if (!doubleHeaded) {
    const base = at(to, -headLength, 0);

    return [
      at(from, 0, halfWidth),
      at(base, 0, halfWidth),
      at(base, 0, halfHead),
      to,
      at(base, 0, -halfHead),
      at(base, 0, -halfWidth),
      at(from, 0, -halfWidth),
    ];
  }

  const tailBase = at(from, headLength, 0);
  const headBase = at(to, -headLength, 0);

  return [
    from,
    at(tailBase, 0, halfHead),
    at(tailBase, 0, halfWidth),
    at(headBase, 0, halfWidth),
    at(headBase, 0, halfHead),
    to,
    at(headBase, 0, -halfHead),
    at(headBase, 0, -halfWidth),
    at(tailBase, 0, -halfWidth),
    at(tailBase, 0, -halfHead),
  ];
}

function normalizeShapeStyle(style?: ShapeStyle | string): ShapeStyle {
  return typeof style === "string" ? { fill: style } : (style ?? {});
}

function normalizeTextStyle(style?: TextStyle | string): TextStyle {
  return typeof style === "string" ? { fill: style } : (style ?? {});
}
