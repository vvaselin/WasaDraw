# CanvasKit

CanvasKit は、OpenSiv3D の即時描画スタイルに影響を受けた、小さな TypeScript 製 Canvas 2D 描画ライブラリです。

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

CanvasKit は、重要な処理に失敗した場合に明確に例外を投げます。たとえば `createCanvasApp()` は 2D context を取得できなければ throw します。未対応の描画機能を、別の描画方法へ勝手に置き換えることはしません。

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
```

サンプルは `../dist/index.js` を import します。`src/` を変更した後は `npm run build` を実行してください。

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

## Geometry

`geometry.ts` は、軽量な図形データ型と helper 関数を提供します。図形はクラスではなく plain object なので、値として保持し、描画や当たり判定へ渡しやすい形です。

- `vec2(x, y)` は点またはベクトルを作ります。
- `rect(x, y, w, h)` は軸に沿った矩形を作ります。
- `circle(center, r)` は円を作ります。
- `line(from, to)` は線分データを作ります。
- `contains(shape, point)` は点が矩形または円の内側にあるか判定します。境界上も含みます。
- `intersects(a, b)` は rect/rect、circle/circle、rect/circle の交差を判定します。接しているだけの場合も交差として扱います。
- `moved(shape, offset)` は元の図形を変更せず、移動後の新しい図形を返します。

回転Rect、Polygon、Line交差判定はまだ対応していません。未対応のgeometry処理を近似的な別処理へ置き換えるフォールバックも入れていません。

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

## 絵文字描画

`draw.emoji()` は、現時点では Canvas の text 描画、つまり `fillText()` で実装しています。

絵文字の見た目は、ブラウザ、OS、インストールされている絵文字フォントに依存します。CanvasKit は絵文字画像アセットを読み込まず、独自に絵文字をラスタライズせず、絵文字フォントがない場合に代替図形を描くこともしません。

## フォールバック方針

この段階では、フォールバックを意図的に入れていません。

- `CanvasRenderingContext2D` を取得できない場合のフォールバックはしない
- selector が一致しない場合に canvas を自動生成しない
- selector が canvas 以外に一致した場合に別要素へフォールバックしない
- 未対応の描画機能を別の描画方法で代替しない
- `OffscreenCanvas` から通常 Canvas への自動フォールバックはしない
- 絵文字画像アセット方式へのフォールバックはしない
- 画像読み込み失敗時の透明プレースホルダーは作らない
- 複雑なブラウザ互換レイヤーは入れない

代替手段が必要になった場合は、API設計を決めたうえで明示的に追加します。暫定的なフォールバックは TODO に留めます。

## 現在のAPI

- `createCanvasApp(canvasOrSelector, frame, options?)`
- `createEffectManager()`
- `Palette`
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

描画メソッドは、frame callback に渡される `draw` オブジェクトから使います。

- `draw.clear(color?)`
- `draw.circle(pos, radius, style?)`
- `draw.rect(rect, style?)`
- `draw.roundRect(rect, radius, style?)`
- `draw.line(from, to, style?)`
- `draw.text(text, pos, style?)`
- `draw.emoji(emoji, pos, style?)`

## ロードマップ

### v0.1

- createCanvasApp
- draw.clear
- draw.circle
- draw.rect
- draw.roundRect
- draw.line
- draw.text
- draw.emoji
- Palette
- math helpers
- mouse input
- EffectManager

### v0.2

- Vec2 / Rect / Circle helper
- contains
- intersects
- ellipse
- triangle
- polygon
- polyline
- arc

### v0.3

- draw.image
- transform helper
- withTransform
- pauseWhenHidden
- pauseWhenOffscreen
- respectReducedMotion

### v0.4

- RenderState
- withState
- RenderTarget
- Camera2D
