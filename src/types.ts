import type { InputState } from "./mouse.js";
import type { Circle, Rect, Shape, Vec2 } from "./geometry.js";
import type { Bezier2, Bezier3 } from "./curve.js";
import type { Camera2D } from "./camera2d.js";
import type { Fill } from "./gradient.js";

export type { Circle, Line, Rect, Shape, Vec2 } from "./geometry.js";
export type { Bezier2, Bezier3 } from "./curve.js";
export type {
  Fill,
  Gradient,
  GradientStop,
  LinearGradient,
  RadialGradient,
} from "./gradient.js";

export type Size2D = {
  width: number;
  height: number;
  center: Vec2;
};

export type RenderState2D = {
  alpha?: number;
  blend?: GlobalCompositeOperation;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffset?: Vec2;
  filter?: string;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
};

export type Transform2D = {
  translate?: Vec2;
  rotate?: number;
  scale?: number | Vec2;
  /** せん断角（ラジアン）。x は X 軸方向、y は Y 軸方向の傾斜。 */
  skew?: Vec2;
};

/**
 * 枠線の太さ指定。inner はパス内側、outer はパス外側への広がり。
 */
export type FrameOptions = {
  inner?: number;
  outer?: number;
};

/**
 * 矢印の形状指定。width は軸線の太さ、headSize は矢じりの幅と長さ。
 */
export type ArrowOptions = {
  width?: number;
  headSize?: Vec2;
};

export type SplineOptions = {
  closed?: boolean;
  tension?: number;
};

export type ShadowOptions = {
  offset?: Vec2;   // 既定 {x: 2, y: 2}
  blur?: number;   // 既定 8
  color?: string;  // 既定 "rgba(0, 0, 0, 0.5)"
  radius?: number; // Rect のみ有効。roundRect の角丸半径。既定 0
};

export type ShapeStyle = {
  fill?: Fill;
  stroke?: Fill;
  width?: number;
  alpha?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  dash?: number[];
};

export type TextStyle = {
  size?: number;
  lineHeight?: number;
  font?: string;
  fill?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  alpha?: number;
};

export type ImageStyle = {
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  mirrored?: boolean;
  alpha?: number;
};

export type EmojiStyle = {
  size?: number;
  font?: string;
  rotation?: number;
  scale?: number;
  mirrored?: boolean;
  alpha?: number;
};

export type DrawContext = {
  clear(color?: string): void;
  withTransform(transform: Transform2D, callback: () => void): void;
  withCamera(camera: Camera2D, viewportSize: Size2D, callback: () => void): void;
  withState(state: RenderState2D, callback: () => void): void;
  shape(shape: Shape, style?: ShapeStyle | string): void;
  circle(pos: Vec2, radius: number, style?: ShapeStyle | string): void;
  ellipse(
    pos: Vec2,
    radiusX: number,
    radiusY: number,
    style?: ShapeStyle | string,
  ): void;
  rect(rect: Rect, style?: ShapeStyle | string): void;
  roundRect(rect: Rect, radius: number, style?: ShapeStyle | string): void;
  triangle(
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
    style?: ShapeStyle | string,
  ): void;
  polygon(points: Vec2[], style?: ShapeStyle | string): void;
  frame(
    shape: Rect | Circle,
    thickness: number | FrameOptions,
    style?: ShapeStyle | string,
  ): void;
  arrow(
    from: Vec2,
    to: Vec2,
    options?: ArrowOptions,
    style?: ShapeStyle | string,
  ): void;
  doubleHeadedArrow(
    from: Vec2,
    to: Vec2,
    options?: ArrowOptions,
    style?: ShapeStyle | string,
  ): void;
  line(from: Vec2, to: Vec2, style?: ShapeStyle | string): void;
  polyline(points: Vec2[], style?: ShapeStyle | string): void;
  arc(
    pos: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: ShapeStyle | string,
  ): void;
  text(text: string, pos: Vec2, style?: TextStyle | string): void;
  emoji(emoji: string, pos: Vec2, style?: EmojiStyle): void;
  image(image: CanvasImageSource, pos: Vec2, style?: ImageStyle): void;
  bezier(curve: Bezier2 | Bezier3, style?: ShapeStyle | string): void;
  spline(points: Vec2[], options?: SplineOptions, style?: ShapeStyle | string): void;
  shadow(shape: Rect | Circle, options?: ShadowOptions): void;
  heart(center: Vec2, r: number, style?: ShapeStyle | string): void;
  squircle(
    center: Vec2,
    r: number,
    options?: { exponent?: number },
    style?: ShapeStyle | string,
  ): void;
  rectBalloon(rect: Rect, target: Vec2, style?: ShapeStyle | string): void;
};

export type CanvasFrameContext = {
  draw: DrawContext;
  time: number;
  deltaTime: number;
  frame: number;
  size: Size2D;
  input: InputState;
};
