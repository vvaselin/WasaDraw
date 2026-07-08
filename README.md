# WasaDraw

WasaDraw は、OpenSiv3D の即時描画スタイルに影響を受けた、小さな TypeScript 製 Canvas 2D 描画ライブラリです。

Webサイト上で、図形、絵文字、軽いアニメーション演出をコンパクトなAPIで書くことを目的にしています。本格的なゲームエンジンではなく、Siv3D完全互換も目指していません。

## 対象

- Webサイトの装飾やビジュアルスケッチ
- 図解、軽いアニメーション、絵文字演出
- フレームワーク非依存の Canvas 2D 描画
- 即時描画に近い感覚で書きたいコード

## 対象外

- 本格的なゲームエンジン機能
- PixiJS 的なシーン管理
- Vue / React / Nuxt / Astro 用コンポーネントラッパー
- WebGL 描画
- 物理演算
- 画像編集ツール
- 通常のUI部品を Canvas UI で置き換えること

## 基本方針

- TypeScript を使う
- ESM として出力する
- Canvas 2D のみを使う
- runtime dependency を増やさない
- コアはフレームワーク非依存にする
- 即時描画スタイルを基本にする
- 抽象化より小さく動くAPIを優先する
- 暗黙のフォールバックを入れない

WasaDraw は、重要な処理に失敗した場合に明確に例外を投げます。たとえば `createCanvasApp()` は 2D context を取得できなければ throw します。未対応の描画機能を、別の描画方法へ勝手に置き換えることはしません。

`createCanvasApp()` の第1引数には `HTMLCanvasElement` または CSS selector 文字列を渡せます。selector 指定は canvas 取得を楽にするための便利APIであり、フォールバックではありません。selector が何にも一致しない場合、または canvas 以外の要素に一致した場合は throw します。

## ローカル利用

このプロジェクトは、現時点では npm からインストールする前提ではなく、ローカルで使う前提です。

```sh
npm install
npm run build
```

サンプルはローカルHTTPサーバー経由で開いてください。

```txt
examples/basic.html
examples/geometry.html
examples/shapes.html
examples/colors.html
examples/transform.html
examples/camera2d.html
examples/state.html
examples/animation.html
examples/render-target.html
examples/images.html
examples/lifecycle.html
examples/offscreen.html
examples/reduced-motion.html
examples/showcase.html
```

サンプルは `../dist/index.js` を import します。`src/` を変更した後は `npm run build` を実行してください。

## Examples

- `examples/basic.html`
  - `createCanvasApp`
  - geometry value + `draw.shape()`
  - `contains()` hover / `hsl()`
  - emoji / 複数行テキスト
  - `EffectManager` click ripple
  - `pauseWhenHidden: true`

- `examples/geometry.html`
  - `vec2()` / `centerOf()`
  - `contains()` によるホバー判定
  - `moved()`

- `examples/shapes.html`
  - geometry values
  - circle / rect / line helpers
  - `draw.shape()`
  - `moved()`
  - `centerOf()`
  - ellipse / triangle / polygon / polyline / arc
  - dashed lines
  - gradient fill / stroke（vertical / horizontal / diagonal / radial）
  - `draw.frame()` / `draw.arrow()` / `draw.doubleHeadedArrow()`
  - 頂点ヘルパー（`star()` / `nStar()` / `hexagon()` / `rhombus()` / `plus()` / `cross()` / `stairs()` / `astroid()`）
  - `draw.heart()` / `draw.squircle()` / `draw.rectBalloon()` / `draw.shadow()`
  - `draw.bezier()` / `draw.spline()`（open / closed）

- `examples/colors.html`
  - `rgb()` / `rgba()` / `hsl()` / `hsla()`
  - `Color`
  - hue animation
  - Palette 色見本

- `examples/transform.html`
  - `draw.withTransform()`
  - rotate / scale animation
  - 入れ子 transform

- `examples/camera2d.html`
  - `createCamera2D()`
  - `draw.withCamera()`
  - world grid / screen-to-world mouse
  - drag pan / wheel zoom

- `examples/state.html`
  - `draw.withState()`
  - glow / blend / group alpha / filter
  - `withTransform` との nest

- `examples/animation.html`
  - `createAnimation()` の複数トラック（x / y / scale / alpha）
  - `anim.at(time)` / `anim.value(name, time)` / `anim.duration`
  - `loop` 指定と `createCanvasApp` の `time` を渡す標準パターン
  - easing 比較（linear / Sine / Cubic / Back / Elastic / Bounce）

- `examples/render-target.html`
  - `createRenderTarget()`
  - 1 回だけ描いて複数箇所に再描画
  - クリックで描き直し

- `examples/images.html`
  - `draw.image()` / `loadImage()`
  - scale / rotation / mirrored / alpha
  - canvas を source にした描画

- `examples/lifecycle.html`
  - `pauseWhenHidden: true`
  - frame count / deltaTime readout
  - `stop()` / `start()`

- `examples/offscreen.html`
  - `pauseWhenOffscreen: true`
  - scroll で pause / resume
  - fixed HUD

- `examples/reduced-motion.html`
  - `respectReducedMotion: true`
  - reduce で停止 / 解除で再開
  - 開始時に 1 frame だけ描画

- `examples/showcase.html`
  - v0.7 までの主要APIをまとめた総合デモ（6パネル同時アニメーション）
  - gradient fill / stroke（5種の factory）
  - 頂点ヘルパー 8 種 + `withTransform` 回転
  - `draw.bezier()` / `draw.spline()`（open / closed 塗り）
  - `draw.frame()` / `draw.arrow()`（マウス追従） / `draw.doubleHeadedArrow()`
  - `draw.shadow()` + 本体重ね描き / `draw.heart()` / `draw.squircle()` / `draw.rectBalloon()`
  - `createAnimation()` + easing（Bounce / Expo / Back）、`Transform2D.skew`
  - `getPointByAngle()` / `rotatedAt()` などの geometry helper
  - `pauseWhenHidden` + `pauseWhenOffscreen` + `respectReducedMotion`

## 最小サンプル

```ts
import {
  createCanvasApp,
  Palette,
} from "./dist/index.js";

createCanvasApp("#canvas", ({ draw, size }) => {
  draw.clear("#0f1117");

  draw.circle(size.center, 40, {
    fill: Palette.Skyblue,
  });
}, {
  autoStart: true,
  maxDpr: 2,
});
```

## createCanvasApp options

- `autoStart` は自動で開始するかどうかです。既定値は `false` です。
- `maxDpr` は Canvas の最大 devicePixelRatio です。
- `clearEachFrame` は毎フレーム自動で clear するかどうかです。既定値は `false` です。
- `pauseWhenHidden` は Web ページが非表示の間だけ Canvas の rAF loop を止めるかどうかです。既定値は `false` です。`hidden` で停止し、`visible` で再開します。再開直後に `deltaTime` が跳ねないように `lastTime` をリセットします。`time` は wall-clock なので pause 中も進みます。`stop()` 後は `visible` になっても再開しません。`destroy()` は `visibilitychange` listener も外します。
- `pauseWhenOffscreen` は Canvas が viewport 外にある間だけ rAF loop を止めるかどうかです。既定値は `false` です。複数の Canvas 装飾を置くページで、画面外の Canvas が描き続けないようにするための設定です。内部では `IntersectionObserver` を使います。再開時は `lastTime` をリセットするため、`deltaTime` は大きく跳ねません。`stop()` で止めた場合は、viewport に戻っても再開しません。`destroy()` は `IntersectionObserver.disconnect()` も呼びます。`IntersectionObserver` がない環境への fallback はありません。`pauseWhenHidden` と両方 `true` の場合、hidden または offscreen のどちらかなら停止し、visible かつ onscreen のときだけ再開します。
- `respectReducedMotion` は、ユーザーが OS で「視差効果を減らす」などの `prefers-reduced-motion: reduce` を選んでいる間、rAF loop を進めない設定です。既定値は `false` です。空白の Canvas を避けるため、`start()` 時は 1 frame だけ描画して静止画を残します。アニメーション中に reduce になった場合は最後の frame が残り、解除されると再開します。再開時は `lastTime` をリセットするため、`deltaTime` は跳ねません。`stop()` 後は、解除されても再開しません。`destroy()` は media query の `change` listener も外します。`matchMedia` がない環境への fallback はありません。`pauseWhenHidden` / `pauseWhenOffscreen` と組み合わせた場合、visible かつ onscreen かつ reduce でないときだけ loop が進みます。

frame callback には `{ draw, time, deltaTime, frame, size, input }` が渡されます。`size` は `{ width, height, center }` です。`input.mouse` は `{ position, delta, left }` で、`delta` はそのフレーム内の移動量、`left` は `{ pressed, down, up }`(押している間 / 押した瞬間 / 離した瞬間)です。

```ts
createCanvasApp("#canvas", frame, {
  autoStart: true,
  pauseWhenHidden: true,
  pauseWhenOffscreen: true,
  respectReducedMotion: true,
});
```

## 図形描画

`draw` には基本図形を描くメソッドがあります。style は `ShapeStyle` オブジェクトで指定します。単色塗りだけは `Palette.White` のような文字列短縮形も使えます。

```ts
draw.ellipse({ x: 160, y: 120 }, 80, 40, {
  fill: "#7aa2ff",
});

draw.triangle(
  { x: 320, y: 80 },
  { x: 260, y: 180 },
  { x: 380, y: 180 },
  {
    fill: "#ffb86c",
  },
);

draw.polygon([
  { x: 480, y: 80 },
  { x: 540, y: 120 },
  { x: 520, y: 190 },
  { x: 440, y: 190 },
  { x: 420, y: 120 },
], {
  fill: "#50fa7b",
  stroke: "#ffffff66",
  width: 2,
});

draw.polyline([
  { x: 80, y: 280 },
  { x: 160, y: 240 },
  { x: 240, y: 300 },
  { x: 320, y: 260 },
], {
  stroke: "#ffffff99",
  width: 3,
  dash: [8, 6],
});

draw.arc({ x: 480, y: 280 }, 60, 0, Math.PI * 1.5, {
  stroke: "#ff79c6",
  width: 4,
});
```

`ShapeStyle` には `dash?: number[]` があります。`line()` / `polyline()` / `arc()` などで `ctx.setLineDash()` を使い、点線を描けます。dash はその描画呼び出し内だけに閉じます。

`arc()` の角度はラジアンで指定します。現時点の `arc()` は線として描くだけで、扇形塗りは実装していません。`polygon()` は3点未満、`polyline()` は2点未満なら throw します。矢印は `draw.arrow()`、ベジェ・スプラインは `draw.bezier()` / `draw.spline()` で描けます。

## グラデーション

`ShapeStyle.fill` / `stroke` の型は `Fill = string | Gradient` です。色文字列のほか、gradient factory が返す `Gradient` を渡せます。グラデーションは図形の bounding box を基準に展開され、`from` / `to` / `center` は bbox に対する正規化座標（0..1）で指定します。

- `linearGradient(from, to, colors)` は任意方向の線形グラデーションです。`colors` は色文字列の配列（等間隔に配置）または `{ offset, color }` の `GradientStop` 配列です。
- `verticalGradient(top, bottom)` は上→下、`horizontalGradient(left, right)` は左→右、`diagonalGradient(topLeft, bottomRight)` は左上→右下の短縮形です。
- `radialGradient(inner, outer, { center?, radius? })` は放射グラデーションです。`center` の既定値は `{ x: 0.5, y: 0.5 }`、`radius` は bbox の長辺の半分を 1 とする倍率で既定値は `1` です。

```ts
draw.rect(card, {
  fill: verticalGradient("#7aa2ff", "#1c2740"),
});

draw.circle(pos, 48, {
  fill: radialGradient("#fff7c0", "#ff8c42", { center: vec2(0.4, 0.35) }),
});

draw.triangle(p1, p2, p3, {
  fill: linearGradient(vec2(0, 0), vec2(1, 1), ["#ffb86c", "#ff79c6", "#7aa2ff"]),
});

draw.circle(pos, 44, {
  stroke: horizontalGradient("#50fa7b", "#7aa2ff"),
  width: 8,
});
```

`colors` が2色未満、`GradientStop.offset` が 0..1 の範囲外なら throw します。

## frame / arrow

`draw.frame(rectOrCircle, thickness, style?)` は、図形の輪郭に沿った枠を描きます。`thickness` は `number`（内外に均等）または `{ inner?, outer? }`（パス内側・外側への広がり）です。

`draw.arrow(from, to, options?, style?)` / `draw.doubleHeadedArrow(from, to, options?, style?)` は、矢印全体を1つの polygon として描きます。`options` は `{ width?, headSize? }` で、`width` は軸線の太さ、`headSize` は矢じりの幅と長さ（`Vec2`）です。polygon として描くため、`fill` にグラデーションも指定できます。

```ts
draw.frame(rect(80, 40, 140, 80), { inner: 2, outer: 8 }, {
  fill: Palette.Orange,
});

draw.arrow(vec2(40, 120), vec2(190, 46), {
  width: 8,
  headSize: vec2(24, 20),
}, {
  fill: Palette.White,
});

draw.doubleHeadedArrow(vec2(250, 80), vec2(410, 80), {
  width: 10,
}, {
  fill: horizontalGradient("#50fa7b", "#7aa2ff"),
});
```

## ベジェ / スプライン

`bezier2(p0, p1, p2)` / `bezier3(p0, p1, p2, p3)` は `kind` 付きの曲線データを作り、`draw.bezier(curve, style?)` で描画します。`pointOnBezier2(curve, t)` / `pointOnBezier3(curve, t)` は曲線上の点を返すので、曲線に沿った移動アニメーションにも使えます。

`draw.spline(points, options?, style?)` は点列を滑らかに通過する Catmull-Rom 風スプラインです。`options` は `{ closed?, tension? }`（既定値 `closed: false` / `tension: 0.5`）で、`closed: true` は閉じたパスになり塗りも指定できます。`splineToBeziers(points, options?)` を使うと、スプラインを `Bezier3[]` として取り出せます。

```ts
draw.bezier(bezier2(vec2(80, 200), vec2(180, 90), vec2(280, 200)), {
  stroke: Palette.Skyblue,
  width: 4,
});

draw.spline(points, { tension: 0.5 }, {
  stroke: "#50fa7b",
  width: 3,
});

draw.spline(blob, { closed: true, tension: 0.6 }, {
  fill: radialGradient("#ff9ecb", "#b23a67"),
});
```

## 頂点ヘルパー

`shapes.ts` の頂点ヘルパーは `Vec2[]` を返す純粋関数で、そのまま `draw.polygon(points, style?)` に渡せます。角度は 0 が真上、正が時計回りです。

- `ngon(center, n, r, angle?)` は正 n 角形、`pentagon(center, r, angle?)` / `hexagon(center, r, angle?)` はその短縮形です。
- `nStar(center, n, rOuter, rInner, angle?)` は n 頂点の星形、`star(center, r, angle?)` は五芒星です。
- `rhombus(center, w, h, angle?)` はひし形、`plus(center, r, width, angle?)` は十字、`cross(center, r, width, angle?)` は X 字です。
- `stairs(base, w, h, steps, upStairs?)` は階段形で、`base` は左下の頂点です。
- `astroid(center, a, b?, angle?)` はアステロイド曲線を64分割サンプリングした頂点列です。

```ts
draw.polygon(star(vec2(110, 90), 46), {
  fill: "#ffd166",
});

draw.polygon(nStar(vec2(240, 90), 8, 46, 24), {
  fill: "#ff79c6",
});

draw.polygon(hexagon(vec2(370, 90), 46, deg(15)), {
  fill: "#50fa7b",
});
```

## shadow / heart / squircle / rectBalloon

`draw.shadow(rectOrCircle, options?)` は影だけを描きます。本体は後から重ねて描いてください。`options` は `{ offset?, blur?, color?, radius? }` で、既定値は `offset: { x: 2, y: 2 }` / `blur: 8` / `color: "rgba(0, 0, 0, 0.5)"` / `radius: 0`（Rect のみ有効な角丸半径）です。CSS の `spread` に相当する機能はない近似です。Canvas の `shadowOffset` は変換行列の影響を受けないため、`withTransform` / `withCamera` の scale・rotate の内側では影の位置がずれる制約があります。

```ts
draw.shadow(card, { offset: vec2(0, 10), blur: 18, radius: 16 });
draw.roundRect(card, 16, { fill: "#f6f2e8" });
```

`draw.heart(center, r, style?)` はハート形、`draw.squircle(center, r, options?, style?)` はスーパー楕円（`options.exponent` の既定値は `4`、大きいほど正方形に近づく）です。`draw.rectBalloon(rect, target, style?)` は `target` へ向かう尾付きの吹き出しで、`target` が矩形内部なら尾なしの通常矩形として描きます。

```ts
draw.heart(vec2(120, 90), 46, {
  fill: verticalGradient("#ff8fab", "#e63965"),
});

draw.squircle(vec2(280, 90), 46, { exponent: 4 }, {
  fill: "#7aa2ff",
});

draw.rectBalloon(rect(380, 40, 180, 72), vec2(420, 170), {
  fill: "#f6f2e8",
});
```

## イージング

`easing.ts` は easings.net の標準数式に基づくイージング関数を提供します。`easeIn / easeOut / easeInOut` × `Sine / Quad / Cubic / Quart / Quint / Expo / Circ / Back / Elastic / Bounce` の 30 種に `linear` を加えた計 31 種です。すべて `EasingFn = (t: number) => number` 型で、`t` は 0..1 を想定し、クランプは行いません。`createAnimation()` の keyframe の `ease` にそのまま渡せるほか、単独の補間関数としても使えます。

```ts
import { easeOutBounce, easeInOutCubic } from "./dist/index.js";

const y = lerp(100, 300, easeOutBounce(t));
```

## キーフレームアニメーション

`createAnimation(tracks, options?)` は、名前付きトラックのキーフレーム列から値を評価する軽量アニメーションを作ります。keyframe は `{ time, value, ease? }`（`time` は秒）で、`ease` は「直前のキーフレームからその keyframe へ到達する区間」に適用されます。省略時は線形です。

`options.loop` に周期（秒）を指定すると、評価時刻がその周期で折り返されます。`createCanvasApp` の frame callback に渡される `time` をそのまま渡すのが標準パターンです。

- `anim.value(name, time)` は単一トラックの値を返します。未知のトラック名は throw します。
- `anim.at(time)` は全トラックをまとめて評価したオブジェクトを返します。
- `anim.duration` は全トラック中で最大のキーフレーム時刻です。

```ts
const ball = createAnimation({
  x: [
    { time: 0, value: 160 },
    { time: 2, value: 1040, ease: easeInOutCubic },
    { time: 4, value: 160, ease: easeInOutCubic },
  ],
  alpha: [
    { time: 0, value: 0.4 },
    { time: 2, value: 1, ease: easeInOutSine },
    { time: 4, value: 0.4, ease: easeInOutSine },
  ],
}, {
  loop: 4,
});

createCanvasApp("#canvas", ({ draw, time }) => {
  draw.clear("#0f1117");

  const v = ball.at(time);

  draw.circle(vec2(v.x, 200), 26, {
    fill: Palette.Skyblue,
    alpha: v.alpha,
  });
}, {
  autoStart: true,
});
```

keyframe の `time` / `value` が非有限、time が昇順でない、トラックが空、`loop` が正の有限数でない場合は throw します。動く例は `examples/animation.html` を参照してください。

## Effect

`createEffectManager()` は、クリック時の波紋、粒子、絵文字の発生、ホバー時の一時演出など、短命な描画エフェクトを管理します。

effect 関数は経過時間 `t` と現在の frame context を受け取ります。`true` を返すと継続し、`false` を返すと削除されます。effect 内で発生した例外は catch せず、そのまま外へ伝わります。非同期 effect、Promise、自動フォールバックは扱いません。

```ts
import {
  createCanvasApp,
  createEffectManager,
  Palette,
  type CanvasFrameContext,
} from "./dist/index.js";

const effects = createEffectManager<CanvasFrameContext>();

createCanvasApp("#canvas", (context) => {
  const { draw, input, deltaTime } = context;

  draw.clear("#0f1117");

  if (input.mouse.left.down) {
    const pos = { ...input.mouse.position };

    effects.add((t, { draw }) => {
      draw.circle(pos, t * 120, {
        stroke: Palette.White,
        width: 2,
        alpha: 1 - t,
      });

      return t < 1.0;
    });
  }

  effects.update(deltaTime, context);
}, {
  autoStart: true,
});
```

## Geometry Values

`geometry.ts` は、軽量な図形データ型と helper 関数を提供します。図形はクラスではなく plain object なので、値として保持し、描画や当たり判定へ渡しやすい形です。

- `vec2(x, y)` は点またはベクトルを作ります。
- `rect(x, y, w, h)` は `kind: "rect"` 付きの矩形を作ります。
- `circle(center, r)` は `kind: "circle"` 付きの円を作ります。
- `line(from, to)` は `kind: "line"` 付きの線分データを作ります。
- `contains(shape, point)` は点が矩形・円・多角形（`Vec2[]`）の内側にあるか判定します。境界上も含みます。
- `intersects(a, b)` は rect / circle / line / polygon（`Vec2[]`）の組み合わせの交差を判定します。接しているだけの場合も交差として扱います。
- `moved(shape, offset)` は元の図形を変更せず、移動後の新しい図形を返します。

`circle()` / `rect()` / `line()` は描画ではなく、`kind` 付きの geometry value を作る関数です。一方、`draw.circle()` / `draw.rect()` / `draw.line()` は実際に Canvas へ描画する関数です。

`draw.shape(shape, style)` を使うと、`Circle` / `Rect` / `Line` を分解せずにそのまま描画できます。現時点で `draw.shape()` が対応するのは `Circle` / `Rect` / `Line` のみです。`draw.roundRect()` のように追加引数が必要な描画は、専用メソッドを使います。

WasaDraw は `shape.draw()` 形式や図形クラス化ではなく、plain object + draw call 形式を採用しています。`draw.shape()` はその方針のまま、geometry value を描くときの冗長さを減らすためのAPIです。同じ図形を何度も使う、`moved()` で別図形を作る、`contains()` / `intersects()` の判定にも使う、といった場合は geometry helper で図形を変数として保持すると読みやすくなります。

Line 交差判定と Polygon（頂点配列）の `contains` / `intersects` は v0.7 で対応しました。未対応のgeometry処理を近似的な別処理へ置き換えるフォールバックは入れていません。

```ts
const c = circle(vec2(120, 80), 32);
const shifted = moved(c, vec2(80, 0));

draw.circle(c.center, c.r, {
  fill: Palette.Skyblue,
});

draw.circle(shifted.center, shifted.r, {
  stroke: Palette.White,
  width: 2,
});
```

```ts
const c = circle(vec2(120, 80), 32);
const shifted = moved(c, vec2(80, 0));

draw.shape(c, {
  fill: Palette.Skyblue,
});

draw.shape(shifted, {
  stroke: Palette.White,
  width: 2,
});
```

```ts
const button = rect(40, 40, 220, 72);
const hovered = contains(button, input.mouse.position);

draw.roundRect(button, 16, {
  fill: hovered ? "#263246" : "#171d2a",
});

draw.text("Button", centerOf(button), {
  size: 20,
  fill: Palette.White,
  align: "center",
  baseline: "middle",
});
```

## 図形操作 helper

geometry value を非破壊で加工・計測する helper があります。いずれも元の図形は変更せず、新しい値を返します。

- `boundsOf(shape)` は Rect / Circle / Line の軸平行バウンディングボックスを返します。`boundingRect` は Siv3D の `boundingRect()` 相当の別名です。`boundsOfPoints(points)` は点列の bbox です。
- `scaled(shape, factor)` は中心基準の拡大縮小です。Rect は `number | Vec2`、Circle は `number` を受けます。`scaledAt(shape, pos, factor)` は基準点指定版です。
- `stretched(rect, all)` / `stretched(rect, x, y)` / `stretched(rect, top, right, bottom, left)` は矩形の辺を外側へ伸ばします。
- `rotatedAt(point, center, angle)` / `rotatedPointsAt(points, center, angle)` は点・点列の回転です。`rotatedRectAt(rect, center, angle)` は回転後の4頂点 `[Vec2, Vec2, Vec2, Vec2]` を返すので、`draw.polygon()` に渡せます。
- `area(rectOrCircle)` / `areaOfPolygon(points)` は面積、`perimeter(shape)` / `perimeterOfPolygon(points)` は周長です。
- `getPointByAngle(circle, angle)` は円周上の点を返します。角度 0 が真上、正が時計回りです。
- `shearedX(rect, px)` / `shearedY(rect, px)` はピクセル量、`skewedX(rect, angle)` / `skewedY(rect, angle)` は角度（ラジアン）でせん断した4頂点を返します。

```ts
const card = rect(80, 80, 200, 120);
const hit = stretched(card, 12);
const corners = rotatedRectAt(card, centerOf(card), deg(20));

draw.polygon(corners, {
  stroke: Palette.White,
  width: 2,
});
```

## Style Objects

図形のstyleは、基本的にオブジェクトで指定します。オプションが増えても意味が読みやすいためです。

```ts
draw.circle(pos, 32, {
  fill: Palette.White,
});

draw.circle(pos, 32, {
  stroke: Palette.Red,
  width: 2,
});
```

単色塗りだけは短縮形を使えます。

```ts
draw.circle(pos, 32, Palette.White);
```

`fill, stroke, width` を位置引数で並べるような、意味が分かりづらい可変長引数APIは用意しません。

## テキスト描画

`draw.text(text, pos, style?)` は Canvas 2D の `fillText()` で文字列を描画します。`text` に `\n` が含まれる場合は複数行として描画します。`\r\n` と `\r` も改行として扱いますが、HTML として解釈しないため `<br>` は改行になりません。自動折り返しは未対応です。

`TextStyle.lineHeight` で行間を指定できます。既定値は `1.2` で、実際の行間は `size * lineHeight` です。`lineHeight` は有限の正の数のみ許可され、それ以外を渡すと `RangeError` を投げます。

```ts
draw.text("WasaDraw\nmultiline text", vec2(80, 80), {
  size: 24,
  lineHeight: 1.3,
  fill: Palette.White,
  font: "system-ui, sans-serif",
});
```

## 色

`rgb()` / `rgba()` / `hsl()` / `hsla()` は CSS color string を返します。`fill` / `stroke` / `draw.clear()` など、色文字列を受け取る場所でそのまま使えます。出力は `rgb(255 128 0)` や `hsl(210 80% 60%)` のような modern space-separated syntax です。

範囲は `r/g/b: 0..255`、`s/l: 0..100`、`a: 0..1` です。`h` は有限の角度なら任意の値を渡せます。範囲外や `NaN` / `Infinity` は `RangeError` です。勝手に clamp しません。

```ts
draw.circle(pos, 32, {
  fill: hsl(210, 80, 60),
  stroke: rgba(255, 255, 255, 0.4),
  width: 2,
});
```

## Color Class

`Color` は CSS color string を作るための軽量な値オブジェクトです。`Color.rgb()` / `Color.rgba()` / `Color.hsl()` / `Color.hsla()` で作成し、`withAlpha()` で alpha だけを変え、`Color.lerp()` で 2 色を補間できます。

`ShapeStyle.fill` / `stroke` は `Fill = string | Gradient` です。`Color` を直接渡すのではなく、`.toString()` で CSS color string にして渡します。`toString()` は `rgb(r g b / a)` の modern CSS syntax を返します。

```ts
const c1 = Color.rgb(120, 160, 255);
const c2 = c1.withAlpha(0.4);

draw.circle(pos, 40, {
  fill: c1.toString(),
  stroke: c2.toString(),
  width: 2,
});

const mixed = Color.lerp(
  Color.rgb(255, 120, 80),
  Color.rgb(80, 160, 255),
  t,
);

draw.rect(card, {
  fill: mixed.toString(),
});
```

`rgb()` / `rgba()` / `hsl()` / `hsla()` は、その場で CSS color string が欲しいときの小さな helper です。`Color` は色を値として保持し、alpha変更や補間をしたいときに使います。

任意の CSS color string parse、CSS named color parse、hex parse は未対応です。`Color` も入力値を勝手に clamp せず、範囲外や `NaN` / `Infinity` は `RangeError` を投げます。

## Transform

`draw.withTransform(transform, callback)` は、callback の間だけ描画座標を変換します。transform は `{ translate?, rotate?, scale?, skew? }` で、適用順は translate → rotate → scale → skew です。rotate はラジアン指定です。角度で書きたい場合は `deg()` を使えます。scale は `number` なら均等拡大、`Vec2` なら x / y 別々の拡大です。`skew` は `Vec2`（ラジアン）で、x は X 軸方向、y は Y 軸方向の傾斜です。

内部では `ctx.save()` / `ctx.restore()` を使います。callback が例外を投げても restore は実行されます。変換されるのは描画だけです。mouse input / `contains()` / `intersects()` の座標は変換しません。`NaN` / `Infinity` のような非有限値は `RangeError` です。origin、matrix API、mouse 座標の自動変換はまだありません。

```ts
draw.withTransform({
  translate: vec2(400, 300),
  rotate: deg(30),
  scale: 1.2,
}, () => {
  draw.shape(circle(vec2(0, 0), 48), {
    fill: Palette.Skyblue,
  });

  draw.emoji("🛰️", vec2(90, 0), {
    size: 48,
  });
});
```

## Camera2D

`createCamera2D()` は world座標と screen座標を変換するための最小APIです。`camera.center` は world座標における画面中心、`camera.zoom` は倍率です。`zoom = 1` のとき world座標1単位が screen座標1px になり、`zoom > 1` で拡大、`zoom < 1` で縮小します。

`worldToScreen(point, size)` は world座標を Canvas 左上原点の screen座標へ変換し、`screenToWorld(point, size)` は screen座標を world座標へ戻します。`moveBy(offset)` は camera center を world座標単位で破壊的に移動し、`movedBy(offset)` は元の camera を変えずに移動後の新しい camera を返します。`setCenter(center)` / `setZoom(zoom)` は値を更新します。`zoomAt(screenPoint, zoomFactor, size)` は、指定した screen座標の下にある world座標が zoom 後も同じ screen位置に残るように `center` を補正します。

`draw.withCamera(camera, size, callback)` の中では、`draw.circle()` / `draw.shape()` / `draw.text()` などを world座標で描けます。callback が例外を投げても Canvas の transform は restore されます。Camera2D は回転せず、Scene管理でもありません。入力操作も Camera2D 本体には持たせません。

mouse座標は自動変換しません。world mouse座標が必要な場合は `camera.screenToWorld(input.mouse.position, size)` を使います。回転camera、Camera controller、Scene管理は未対応です。`examples/camera2d.html` では example 側で drag pan / wheel zoom を実装しています。

```ts
const camera = createCamera2D({
  center: vec2(0, 0),
  zoom: 1,
});

createCanvasApp("#canvas", ({ draw, size, input }) => {
  const worldMouse = camera.screenToWorld(input.mouse.position, size);

  draw.clear("#0f1117");

  draw.withCamera(camera, size, () => {
    draw.shape(circle(vec2(0, 0), 40), {
      fill: Palette.Skyblue,
    });

    draw.shape(circle(worldMouse, 8), {
      fill: Palette.Orange,
    });
  });
}, {
  autoStart: true,
});
```

## RenderState

`draw.withState(state, callback)` は、callback の間だけ Canvas 2D の描画状態を適用します。state は `{ alpha?, blend?, shadowBlur?, shadowColor?, shadowOffset?, filter?, lineCap?, lineJoin? }` です。

`alpha` は `0..1` で、置き換えではなく掛け算で合成されます。入れ子の `withState` や `style.alpha` と自然に組み合わせられます。`blend` は `globalCompositeOperation`、`filter` は `ctx.filter` の CSS filter string です。filter の対応はブラウザに依存し、fallback はありません。

非有限値や範囲外の値は `RangeError` です。内部では `ctx.save()` / `ctx.restore()` を使い、callback が例外を投げても restore されます。状態は外に漏れません。`withTransform` とも nest できます。

```ts
draw.withState({
  alpha: 0.6,
  blend: "lighter",
  shadowBlur: 16,
  shadowColor: "#7aa2ff",
}, () => {
  draw.shape(c, { fill: Palette.Skyblue });
});
```

## RenderTarget

`createRenderTarget(width, height, options?)` は、メイン Canvas とは別の内部 Canvas に描くための軽量な描画先です。複雑な図形の再描画、pattern 生成、簡単な cache に使います。`width` / `height` は CSS pixel 基準で、`options.maxDpr` で dpr を制限できます。内部 Canvas の pixel size は `width * dpr` / `height * dpr` です。

`target.render(callback)` の callback には `{ draw, size, canvas, context }` が渡されます。`draw` は `createCanvasApp()` と同じ API で、CSS pixel 座標のまま描けます。`render()` は自動 clear しません。必要なら `target.clear(color?)`、または callback 内の `draw.clear()` を使います。

`target.canvas` は内部 Canvas です。メイン Canvas へは `draw.image(target.canvas, pos, { width: target.width, height: target.height })` で描きます。`width` / `height` を渡さないと、内部 Canvas の pixel size、つまり dpr 倍の大きさで描かれるので注意してください。

`target.resize(w, h)` で再配置できます。`target.destroy()` 後の `render` / `clear` / `resize` は throw します。OffscreenCanvas は使いません。blur / post effect / multi pass は未対応です。`document` がない環境への fallback もしません。

```ts
const stamp = createRenderTarget(160, 160);
stamp.render(({ draw, size }) => {
  draw.clear();
  draw.circle(size.center, 60, { fill: Palette.Skyblue });
});

// main canvas 側
draw.image(stamp.canvas, vec2(200, 150), {
  width: stamp.width,
  height: stamp.height,
});
```

## 絵文字描画

`draw.emoji()` は、現時点では Canvas の text 描画、つまり `fillText()` で実装しています。

絵文字の見た目は、ブラウザ、OS、インストールされている絵文字フォントに依存します。WasaDraw は絵文字画像アセットを読み込まず、独自に絵文字をラスタライズせず、絵文字フォントがない場合に代替図形を描くこともしません。

## 画像描画

`draw.image(image, pos, style?)` は CanvasImageSource、つまり img / canvas / ImageBitmap / video / OffscreenCanvas を描きます。`pos` は中心基準で、`draw.emoji()` と同じです。

style は `{ width?, height?, scale?, rotation?, mirrored?, alpha? }` です。`width` / `height` 省略時は元サイズを使います。`scale` は倍率、`rotation` はラジアンです。

未ロードの `HTMLImageElement` は Canvas 2D では黙って何も描かれないため、WasaDraw は throw します。暗黙の fallback を入れない方針です。size 0 や未対応 source も throw します。

`loadImage(src)` は `Promise<HTMLImageElement>` を返します。読み込み失敗は reject します。cache / retry / placeholder はありません。

```ts
const logo = await loadImage("./logo.png");
draw.image(logo, vec2(200, 150));
draw.image(logo, vec2(400, 150), { scale: 0.5, rotation: deg(15), alpha: 0.8 });
```

## フォールバック方針

この段階では、フォールバックを意図的に入れていません。

- `CanvasRenderingContext2D` を取得できない場合のフォールバックはしない
- selector が一致しない場合に canvas を自動生成しない
- selector が canvas 以外に一致した場合に別要素へフォールバックしない
- 未対応の描画機能を別の描画方法で代替しない
- `OffscreenCanvas` から通常 Canvas への自動フォールバックはしない
- 絵文字画像アセット方式へのフォールバックはしない
- 画像読み込み失敗時の透明プレースホルダーは作らない
- `prefers-reduced-motion` を取得できない環境で勝手に `false` 扱いしない
- 未ロード画像を placeholder で描かない
- 画像読み込み失敗時に代替画像へ差し替えない
- 複雑なブラウザ互換レイヤーは入れない

代替手段が必要になった場合は、API設計を決めたうえで明示的に追加します。暫定的なフォールバックは TODO に留めます。

## 現在のAPI

- `createCanvasApp(canvasOrSelector, frame, options?)`
- `createEffectManager()`
- `createRenderTarget()`
- `createCamera2D()`
- `Palette`
- `Color`
- `rgb()`
- `rgba()`
- `hsl()`
- `hsla()`
- `Color.rgb()`
- `Color.rgba()`
- `Color.hsl()`
- `Color.hsla()`
- `Color.lerp()`
- `color.withAlpha()`
- `color.toString()`
- `loadImage()`
- `vec2()`
- `rect()`
- `circle()`
- `line()`
- `add()`
- `sub()`
- `mul()`
- `distance()`
- `length()`
- `centerOf()`
- `moved()`
- `contains()`
- `intersects()`
- `deg()`
- `rad()`
- `clamp()`
- `lerp()`
- `inverseLerp()`
- `mapRange()`
- `smoothstep()`
- `pingPong()`
- `easeOutCubic()`
- `easeInOutCubic()`
- `linearGradient()`
- `verticalGradient()`
- `horizontalGradient()`
- `diagonalGradient()`
- `radialGradient()`
- `boundsOf()`
- `boundingRect()`
- `boundsOfPoints()`
- `scaled()`
- `scaledAt()`
- `stretched()`
- `rotatedAt()`
- `rotatedPointsAt()`
- `rotatedRectAt()`
- `area()`
- `areaOfPolygon()`
- `perimeter()`
- `perimeterOfPolygon()`
- `getPointByAngle()`
- `shearedX()` / `shearedY()`
- `skewedX()` / `skewedY()`
- `bezier2()` / `bezier3()`
- `pointOnBezier2()` / `pointOnBezier3()`
- `splineToBeziers()`
- easing 31種（`linear()` + `easeInSine()` 〜 `easeInOutBounce()`、`EasingFn`）
- `createAnimation()`
- `anim.value()` / `anim.at()` / `anim.duration`
- `ngon()` / `pentagon()` / `hexagon()`
- `nStar()` / `star()`
- `rhombus()` / `plus()` / `cross()`
- `stairs()` / `astroid()`

style object では次の properties を使えます。

- `ShapeStyle.fill`
- `ShapeStyle.stroke`
- `ShapeStyle.width`
- `ShapeStyle.alpha`
- `ShapeStyle.lineCap`
- `ShapeStyle.lineJoin`
- `ShapeStyle.dash`
- `TextStyle.size`
- `TextStyle.lineHeight`
- `TextStyle.font`
- `TextStyle.fill`
- `TextStyle.align`
- `TextStyle.baseline`
- `TextStyle.alpha`
- `EmojiStyle.size`
- `EmojiStyle.font`
- `EmojiStyle.rotation`
- `EmojiStyle.scale`
- `EmojiStyle.mirrored`
- `EmojiStyle.alpha`
- `ImageStyle.width`
- `ImageStyle.height`
- `ImageStyle.scale`
- `ImageStyle.rotation`
- `ImageStyle.mirrored`
- `ImageStyle.alpha`

`draw.withState()` では次の `RenderState2D` properties を使えます。

- `RenderState2D.alpha`
- `RenderState2D.blend`
- `RenderState2D.shadowBlur`
- `RenderState2D.shadowColor`
- `RenderState2D.shadowOffset`
- `RenderState2D.filter`
- `RenderState2D.lineCap`
- `RenderState2D.lineJoin`

描画メソッドは、frame callback に渡される `draw` オブジェクトから使います。

- `draw.clear(color?)`
- `draw.withTransform(transform, callback)`
- `draw.withCamera(camera, viewportSize, callback)`
- `draw.withState(state, callback)`
- `draw.shape(shape, style?)`
- `draw.circle(pos, radius, style?)`
- `draw.ellipse(pos, radiusX, radiusY, style?)`
- `draw.rect(rect, style?)`
- `draw.roundRect(rect, radius, style?)`
- `draw.triangle(p1, p2, p3, style?)`
- `draw.polygon(points, style?)`
- `draw.line(from, to, style?)`
- `draw.polyline(points, style?)`
- `draw.arc(pos, radius, startAngle, endAngle, style?)`
- `draw.frame(rectOrCircle, thickness, style?)`
- `draw.arrow(from, to, options?, style?)`
- `draw.doubleHeadedArrow(from, to, options?, style?)`
- `draw.bezier(curve, style?)`
- `draw.spline(points, options?, style?)`
- `draw.shadow(rectOrCircle, options?)`
- `draw.heart(center, r, style?)`
- `draw.squircle(center, r, options?, style?)`
- `draw.rectBalloon(rect, target, style?)`
- `draw.text(text, pos, style?)`
- `draw.emoji(emoji, pos, style?)`
- `draw.image(image, pos, style?)`

## ロードマップ

### v0.1 completed

- createCanvasApp
- draw.clear / circle / rect / roundRect / line / text / emoji
- Palette
- math helpers
- mouse input
- EffectManager

### v0.2 completed

- Vec2 / Rect / Circle / Line helper
- kind付きShape設計
- draw.shape()
- contains
- intersects
- ellipse
- triangle
- polygon
- polyline
- arc
- dashed line via ShapeStyle.dash

### v0.3 completed

- Palette拡張
- rgb() / rgba() / hsl() / hsla()
- withTransform
- pauseWhenHidden
- pauseWhenOffscreen
- respectReducedMotion
- draw.image

### v0.4 completed

- draw.withState() / RenderState2D
- RenderTarget
- Camera2D
- Color class
- draw.text() multiline support

### v0.5 completed

- gradients（`Fill = string | Gradient`、linear / vertical / horizontal / diagonal / radial factory）
- `draw.frame()`
- `draw.arrow()` / `draw.doubleHeadedArrow()`
- geometry 図形操作 helper（`boundsOf` / `scaled` / `stretched` / `rotatedRectAt` / `area` / `perimeter` / `getPointByAngle` / `sheared*` / `skewed*` など）

### v0.6 completed

- `bezier2` / `bezier3` / `pointOnBezier2` / `pointOnBezier3` / `splineToBeziers`
- `draw.bezier()` / `draw.spline()`
- `Transform2D.skew`
- easing 30種（`EasingFn`）
- `createAnimation()`（keyframe tracks / loop）

### v0.7 completed

- 頂点ヘルパー（`ngon` / `pentagon` / `hexagon` / `nStar` / `star` / `rhombus` / `plus` / `cross` / `stairs` / `astroid`）
- `contains()` の polygon 対応
- `intersects()` の line / polygon 対応
- `draw.shadow()`
- `draw.heart()` / `draw.squircle()` / `draw.rectBalloon()`

### v0.8 candidate

- CanvasPattern
- simple text box / maxWidth
- Camera2D controller helper
- npm package setup
- framework adapters
