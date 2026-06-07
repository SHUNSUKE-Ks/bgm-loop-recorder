# 弐音 / BGM Loop Recorder 開発Report

作成日: 2026-06-07  
対象Project: `bgm-loop-recorder`  
GitHub: `SHUNSUKE-Ks/bgm-loop-recorder`

## 目的

弐音は、コード進行を見ながら上段・下段のループ録音を重ねていくためのSolidJSアプリです。  
今回の開発では、ゲーム基盤用のSolidJS構成をベースにしながら、音楽アプリとして使いやすい画面遷移、コード進行選択、BPM/Key操作、コードブロック追加、PWA対応までを進めました。

## 現在できていること

- Title画面を表示できる。
- 「はじまり」ボタンからコード進行選択画面へ遷移できる。
- コード進行選択画面でGrid/List表示を切り替えられる。
- 曲を選択するとRecorder画面へ遷移できる。
- HeaderにBPM/Keyを表示できる。
- BPM/Keyはクリック時だけ開く設定Panelから変更できる。
- Keyに応じて使用可能コード表記を切り替えられる。
- BPMランプは4拍単位で進む。
- コードは1コード4拍として進行する。
- 全体再生ではコードブロック配列を順番に再生する。
- リピートON/OFFの状態が見える。
- コードブロックを＋Buttonから追加できる。
- 追加されたコードブロックはA2/A3...として縦に追加される。
- 追加後は末尾へスクロールする。
- 上段/下段の個別再生時に波形編集Overlayを表示できる。
- PWA用Icon 192/512を組み込み済み。
- Title画面では指定された元画像 `nion-title.png` を直接表示する。

## まだ未実装のこと

- 実マイク録音。
- `MediaRecorder` による音声Blob保存。
- 録音音声の実再生。
- 実波形データの描画。
- トリミング範囲を音声Blobに反映する処理。
- 無音部分を解析してTrim bar位置を自動調整する処理。
- IndexedDB/Dexieなどを使った録音データ永続化。

現状のRECは「録音UIの流れ」を確認するためのモックです。  
REC押下、カウントイン、録音中State、Stop時のTake追加、波形Overlay表示までは動きますが、実音声はまだ保存されません。

## 主な実装履歴

### Title / PWA

- Project名を「弐音」に変更。
- `public/nion-title.png` に元画像を配置。
- Title画面では `/nion-title.png` を直接参照。
- PWA用に `public/icon_192x192.png` と `public/icon_512x512.png` を生成。

関連Commit:

- `00c95eb Add Nion title screen and PWA icons`
- `b1c7e50 Simplify title screen to logo start`
- `9adbc13 Make title logo start selectable`
- `c1f97f3 Use original Nion logo assets`

### 画面遷移

- Title画面、Select画面、Recorder画面の3画面構成に整理。
- `App.tsx` で `createSignal` と `Switch/Match` による画面切り替えに修正。

関連Commit:

- `e4c6d9e Fix reactive title navigation`

### コード進行選択

- Grid Gallery表示を追加。
- List表示を調整。
- Listではアーティスト/再生数を削除し、Key + コード進行を表示。
- Galleryは画面内に収まる3列Gridへ調整。

関連Commit:

- `b2bbff0 Make gallery a compact grid`

### Recorder画面

- BPM/Key表示と開閉式設定Panelを実装。
- Keyに応じた使用可能コード表記を表示。
- BPMランプを4拍で進める。
- コード進行は1コード4拍に修正。
- Stop文字を削除し、再生/停止Iconを状態で切り替え。
- 個別再生時のみ波形編集Overlayを画面上部へ表示。
- コードブロック追加を配列化。

関連Commit:

- `12ab783 Fix code block stack scrolling`
- `7dd81c9 Fix code block add cloning`

## 発生した問題と解決法

## 1. Titleの「はじまり」ボタンで遷移しない

### 症状

Title画面の「はじまり」を押しても、Select画面へ切り替わらなかった。

### 原因

SolidJSのSignal値を一度だけ通常変数に退避していたためです。

悪い例:

```tsx
const currentScreen = screen();

if (currentScreen === "title") {
  return <TitleScreen onStart={() => setScreen("select")} />;
}
```

この書き方だと `currentScreen` は初回Render時の値で固定されます。  
`setScreen("select")` が呼ばれても、JSX側がSignalの再評価として追従しにくくなります。

### 解決法

JSX内で `screen()` を直接読むか、`Switch/Match` を使ってReactiveに評価させる。

現在の形:

```tsx
return (
  <Switch>
    <Match when={screen() === "title"}>
      <TitleScreen onStart={() => setScreen("select")} />
    </Match>
    <Match when={screen() === "select"}>
      <ChordSelectScreen songs={songs} onSelect={openScore} />
    </Match>
    <Match when={screen() === "score"}>
      <BgmLoopRecorderScreen song={selectedSong()} onBack={() => setScreen("select")} />
    </Match>
  </Switch>
);
```

### 再発防止

- SolidJSではSignalを「値」ではなく「関数」として扱う。
- JSXの条件分岐では `screen()` を直接読む。
- `const value = signal()` をコンポーネント直下に置くと、固定値になりやすいので注意する。
- 派生値が必要な場合は関数にする。

良い例:

```tsx
const isTitle = () => screen() === "title";
```

## 2. ＋Buttonを押してもコードブロックが追加されない

### 症状

＋Buttonを押してもA2/A3が表示されず、追加されていないように見えた。

### 原因A: 表示領域がスクロールできていなかった

親の `phone-shell` が `overflow-hidden` で、コードブロックのStack側に十分なFlex制約がないと、追加された要素が下側でクリップされます。

### 解決A

`.codeblock-stack` にスクロール領域として必要な指定を追加。

```css
.codeblock-stack {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
```

`min-height: 0` が重要です。  
Flex内のスクロール領域では、これがないと子要素が縮まず、親の外に押し出されることがあります。

### 原因B: Solid StoreのProxyを直接 `structuredClone` していた

追加関数で `structuredClone(blocks[0])` を使っていました。  
しかし `createStore` の中身はSolidのProxyです。ブラウザ実行時にProxyを直接cloneすると失敗する可能性があります。

悪い例:

```tsx
const block = structuredClone(blocks[0]);
```

### 解決B

`unwrap` でStoreのProxyを外してからcloneする。

```tsx
import { createStore, unwrap } from "solid-js/store";

const createEmptyCodeBlock = (
  baseBlock: RecorderBlockState,
  index: number
): RecorderBlockState => {
  const nextNumber = index + 1;
  const block = structuredClone(unwrap(baseBlock));

  block.blockId = `codeblock_${String(nextNumber).padStart(3, "0")}`;
  block.label = `A${nextNumber}`;
  block.activeChord = 0;
  block.overdubTarget = "top";
  block.lanes.top.recording = false;
  block.lanes.top.playing = false;
  block.lanes.top.armedPlayback = true;
  block.lanes.top.takes = [];
  block.lanes.bottom.recording = false;
  block.lanes.bottom.playing = false;
  block.lanes.bottom.armedPlayback = false;
  block.lanes.bottom.takes = [];

  return block;
};
```

追加処理:

```tsx
const handleAddCodeBlock = () => {
  const nextIndex = blocks.length;
  setBlocks((items) => [...items, createEmptyCodeBlock(items[0], nextIndex)]);
  setActiveBlockIndex(nextIndex);

  requestAnimationFrame(() => {
    if (!codeBlockStackRef) return;
    codeBlockStackRef.scrollTop = codeBlockStackRef.scrollHeight;
  });
};
```

### 再発防止

- `createStore` の中身を外部APIや `structuredClone` に渡す時は `unwrap` を検討する。
- 追加直後に見える必要があるUIは `requestAnimationFrame` 後にscrollする。
- 配列追加は `setBlocks((items) => [...items, next])` のように現在値から作る。
- 表示されない時は「Stateが増えていない」のか「DOMにはあるが見えていない」のかを分けて確認する。

## 3. Titleロゴが崩れて表示された

### 症状

PWA用IconをTitleにも使っていたため、元画像の見え方と違う表示になった。

### 原因

Title表示に `/icon_512x512.png` を使っていた。  
PWA用Iconはサイズ調整済みの派生画像なので、Titleで見せたい元画像とは役割が違います。

### 解決法

Title表示専用に `public/nion-title.png` を置き、TitleScreenから直接参照。

```tsx
<img src="/nion-title.png" alt="弐音" class="title-logo" />
```

PWAには引き続き `icon_192x192.png` / `icon_512x512.png` を使う。

### 再発防止

- Title表示用の元画像とPWA/Icon用の派生画像を分ける。
- 「そのまま使う」指示がある画像は、UI表示側では加工済みIconを参照しない。
- PWA Iconはmanifest用、Title logoは画面表示用として命名を分ける。

## 4. RECは実録音ではなくモックだった

### 症状

RECを押すと録音中の動きはするが、実際の音声は録れていない。

### 現在の状態

今のRECは以下だけ実装済みです。

- Count in
- Recording state
- Stop時にTake ID追加
- 波形Overlay表示

### 次の解決方針

実録音に進むには以下を追加する。

- `navigator.mediaDevices.getUserMedia({ audio: true })`
- `MediaRecorder`
- 録音Blobの保存
- `URL.createObjectURL(blob)` によるPreview再生
- `AudioContext.decodeAudioData` による波形生成
- Trim start/endをBlobまたは再生範囲に反映

## SolidJS開発での注意Checklist

### Signal

- JSXで反応させたい値は `signal()` として読む。
- `const value = signal()` をコンポーネント直下に置かない。
- 派生状態は `const derived = () => signal() + 1` のように関数化する。

### Store

- `createStore` の値はProxyである。
- clone、保存、外部API渡し、console保存用には `unwrap` を使う。
- 深い更新は `setStore(index, "path", value)` を使う。
- 配列追加は現在値から新配列を返す。

### 条件分岐

- 画面切り替えは `Switch/Match` または `Show` を使う。
- 複数画面の状態名はUnion型にする。

```tsx
const [screen, setScreen] =
  createSignal<"title" | "select" | "score">("title");
```

### List表示

- Solidでは `.map()` より `<For each={items}>` を優先する。
- indexが必要な時は `index()` として読む。

### Scroll / Layout

- Flex子要素をスクロール領域にする時は `min-height: 0` を忘れない。
- 親に `overflow-hidden` がある時は、子に `flex: 1 1 auto` と `overflow-y: auto` を指定する。
- 追加直後に末尾へ移動する時は、DOM更新後にscrollする。

```tsx
requestAnimationFrame(() => {
  listRef.scrollTop = listRef.scrollHeight;
});
```

### Timer

- `setInterval` / `setTimeout` はSetで管理し、画面終了時に `onCleanup` で必ず解除する。
- 再生、録音、Count inは同時にTimerが増えないよう `clearTimers()` を先に呼ぶ。

## 動作確認コマンド

開発Serverは自動起動しない運用です。確認時は手動で実行します。

```powershell
cd C:\Users\enjoy\InBox2026\InBox0601\06_AppList\bgm-loop-recorder
npm run dev -- --host 127.0.0.1 --port 5174
```

型チェック:

```powershell
npx tsc --noEmit
```

Build:

```powershell
npm run build
```

## 次にやるとよい作業

1. 実マイク録音を `MediaRecorder` で実装する。
2. 録音Blobを上段/下段/コードブロックごとにStoreへ保持する。
3. 波形描画を実データから生成する。
4. Preview再生を実音声に切り替える。
5. Trim start/endを再生範囲へ反映する。
6. Dexieで録音データを永続化する。
7. ブラウザ上でTitle遷移、Select遷移、＋追加、全体再生、RECモックを手動確認する。
