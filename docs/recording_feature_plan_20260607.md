# 弐音 録音機能 実装Plan / 工数 / TODO

作成日: 2026-06-07  
対象Project: `bgm-loop-recorder`  
目的: 現在モックになっているRECを、実マイク録音・再生・波形表示・トリミング可能な機能へ進める。

## 結論

録音機能は段階実装が安全です。  
最初から保存・波形・トリミングまで一気に作ると、マイク権限、Blob管理、AudioContext、UI Stateが絡んで不具合原因が見えにくくなります。

おすすめ順は以下です。

1. マイク録音してBlobを作る。
2. 上段/下段/コードブロックごとにTakeとして保持する。
3. 個別再生を実音声再生に切り替える。
4. AudioBufferから波形を描画する。
5. Trim start/endを再生範囲に反映する。
6. Dexieなどで永続化する。

## 想定工数

| Phase | 内容 | 目安 |
| --- | --- | ---: |
| 1 | 録音基盤 `MediaRecorder` 実装 | 0.5日 |
| 2 | Takeデータ構造とStore拡張 | 0.5日 |
| 3 | 上段/下段の実音声Preview再生 | 0.5日 |
| 4 | 実波形描画 | 0.5〜1日 |
| 5 | Trim UIと再生範囲反映 | 0.5〜1日 |
| 6 | 無音Trim自動検出 | 0.5〜1日 |
| 7 | IndexedDB永続化 | 1日 |
| 8 | 手動QA / Edge case修正 | 0.5〜1日 |

合計目安: 4〜6.5日

最短で「録って、聴ける」だけなら 1〜1.5日。  
「波形を見ながらTrimして保存」までなら 4日以上を見ておくと安全です。

## 追加Package方針

### まずは追加Packageなし

録音・再生・波形の初期実装はWeb標準APIだけで可能です。

- `navigator.mediaDevices.getUserMedia`
- `MediaRecorder`
- `AudioContext`
- `HTMLAudioElement`
- `URL.createObjectURL`

### 後から追加候補

| Package | 用途 | 導入タイミング |
| --- | --- | --- |
| `dexie` | IndexedDB保存を扱いやすくする | 録音データ永続化時 |
| `howler` | 複数音声再生、音量、Loop管理 | 再生制御が複雑になった時 |

初期実装ではPackageを増やさず、必要になった時点で追加する方針がよいです。

## 実装対象ファイル案

### 新規

- `src/hooks/useAudioRecorder.ts`
- `src/utils/audioBuffer.ts`
- `src/utils/waveform.ts`
- `src/stores/recordingStore.ts`

### 変更

- `src/screens/40_MainGame/BgmLoopRecorder/screen03Types.ts`
- `src/screens/40_MainGame/BgmLoopRecorder/screen03State.ts`
- `src/screens/40_MainGame/BgmLoopRecorder/ScreenRoot.tsx`
- `src/components/bgmLoopRecorder/CodeBlockRecorder.tsx`
- `src/components/bgmLoopRecorder/WaveformEditPanel.tsx`

## データ設計

現在の `takes` は `string[]` です。  
実録音ではTakeごとに音声Blob、長さ、Trim位置、波形情報が必要になります。

提案型:

```ts
export type AudioTake = {
  takeId: string;
  laneId: LaneId;
  blockId: string;
  createdAt: number;
  blob: Blob;
  objectUrl: string;
  durationSec: number;
  trimStartSec: number;
  trimEndSec: number;
  waveformPeaks: number[];
};
```

Lane側:

```ts
export type RecLaneState = {
  id: LaneId;
  recordEnabled: boolean;
  recording: boolean;
  playing: boolean;
  armedPlayback: boolean;
  takes: AudioTake[];
};
```

注意:

- StoreにBlobを直接入れると永続化やcloneで扱いに注意が必要。
- `structuredClone` / `unwrap` と組み合わせる場合は、Blobが混ざる箇所を明確にする。
- 永続化前はMemory保持でよい。
- 保存実装時はDexie側にBlobを保存する。

## Phase 1: 録音基盤

### 目的

REC押下後、カウントイン終了時に実マイク録音を開始し、StopでBlobを作成する。

### TODO

- [ ] `useAudioRecorder.ts` を作成する。
- [ ] `getUserMedia({ audio: true })` を呼び出す。
- [ ] マイク権限拒否時のError Stateを作る。
- [ ] `MediaRecorder` を作成する。
- [ ] `dataavailable` でChunkを集める。
- [ ] `stop` 時にBlobを作成する。
- [ ] 録音終了後にStream trackを停止する。
- [ ] 録音中は同時に別Lane録音できないようにする。

### 受け入れ条件

- REC後にブラウザのマイク許可が出る。
- StopするとBlobが生成される。
- ConsoleではなくUI Stateとして録音成功/失敗がわかる。

## Phase 2: Take保存

### 目的

録音Blobを上段/下段/コードブロックごとのTakeとして保持する。

### TODO

- [ ] `AudioTake` 型を追加する。
- [ ] `RecLaneState.takes` を `string[]` から `AudioTake[]` に変更する。
- [ ] `finishActiveRecording` で録音BlobをTake化する。
- [ ] `takeId` を `blockId + laneId + number` で一意にする。
- [ ] `URL.createObjectURL(blob)` を作成する。
- [ ] 不要になったObject URLは `URL.revokeObjectURL` する。
- [ ] 既存のモックTake ID追加処理を削除する。

### 受け入れ条件

- A1上段で録った音がA1上段のTakeとして残る。
- A1下段で録った音がA1下段のTakeとして残る。
- A2以降でも別Takeとして残る。

## Phase 3: 実音声再生

### 目的

上段/下段のPlay Buttonで、録音した音声をPreview再生する。

### TODO

- [ ] LaneにTakeがない場合はPlayを無効化、または何もしない。
- [ ] Takeの `objectUrl` を `Audio` で再生する。
- [ ] 再生中はLaneの `playing` をtrueにする。
- [ ] 再生終了時に `playing` をfalseへ戻す。
- [ ] Stopで全Audioを停止する。
- [ ] 全体再生中と個別再生中のState衝突を整理する。

### 受け入れ条件

- 上段Playで上段Takeだけ再生される。
- 下段Playで下段Takeだけ再生される。
- Stopで音が止まる。
- 再生/停止Iconが状態に追従する。

## Phase 4: 波形描画

### 目的

録音Blobから実波形を作り、Overlayに表示する。

### TODO

- [ ] BlobをArrayBufferへ変換する。
- [ ] `AudioContext.decodeAudioData` でAudioBuffer化する。
- [ ] Channel dataからpeak配列を作る。
- [ ] `waveformPeaks` をTakeに保存する。
- [ ] `WaveformEditPanel` を固定ダミー波形から実データ描画へ変更する。
- [ ] 長さ表示を実Durationにする。

### 受け入れ条件

- 録音した音量に応じて波形の高さが変わる。
- 先頭/末尾時間が実録音時間と一致する。
- 無音録音では波形が小さく見える。

## Phase 5: Trim再生

### 目的

Trim barのstart/endを動かし、その範囲だけPreview再生できるようにする。

### TODO

- [ ] `trimStartSec` / `trimEndSec` をTakeに保持する。
- [ ] OverlayのSlider値を秒数に変換する。
- [ ] Preview時に `audio.currentTime = trimStartSec` から再生する。
- [ ] `trimEndSec` で停止するTimerを入れる。
- [ ] Trim範囲外を視覚的に暗くする。
- [ ] DeleteでTakeを削除する。

### 受け入れ条件

- Trim startを動かすと再生開始位置が変わる。
- Trim endを動かすと停止位置が変わる。
- Deleteで対象TakeがLaneから消える。

## Phase 6: 無音Trim

### 目的

波形の先頭/末尾の無音部分を解析し、Trim barを自動調整する。

### 方針

完全な音声編集ではなく、まずは閾値方式で十分です。

アルゴリズム案:

1. AudioBufferのサンプルを読む。
2. 絶対値がThresholdを超える最初の位置を探す。
3. 絶対値がThresholdを超える最後の位置を探す。
4. 前後に少しMarginを足す。
5. `trimStartSec` / `trimEndSec` に反映する。

### TODO

- [ ] Threshold値を決める。
- [ ] Margin秒数を決める。
- [ ] `detectSilenceTrim(audioBuffer)` を作る。
- [ ] 「無音Trim」Buttonから呼び出す。
- [ ] 全無音の場合のFallbackを作る。

### 受け入れ条件

- 先頭の無音がある録音でTrim startが右へ動く。
- 末尾の無音がある録音でTrim endが左へ動く。
- 音がない録音でも壊れない。

## Phase 7: 永続化

### 目的

ブラウザを閉じても録音Takeが残るようにする。

### Package候補

```powershell
npm install dexie
```

### TODO

- [ ] Dexieを導入する。
- [ ] Project / Song / Block / Lane / Takeの保存Schemaを決める。
- [ ] BlobをIndexedDBへ保存する。
- [ ] 起動時に保存Takeを復元する。
- [ ] Object URLは復元時に再生成する。
- [ ] PWA更新時のデータ互換を考える。

### 受け入れ条件

- 録音後にReloadしてもTakeが残る。
- Takeを削除するとDBからも消える。
- PWAとして開いても保存される。

## 実装時の注意点

### SolidJS

- Store内のBlobやAudioオブジェクトを `structuredClone` しない。
- `createStore` のProxyをcloneする必要がある場合は `unwrap` を使う。
- AudioElementなどDOM/APIオブジェクトはStoreに入れず、Mapで管理する。
- UIに必要な最小StateだけStoreに入れる。

### Audio

- マイク権限はHTTPSまたはlocalhostでしか使えない。
- Dev確認は `127.0.0.1` で行う。
- iOS/Safariは `MediaRecorder` の対応差に注意。
- AudioContextはユーザー操作後に開始する。
- Object URLは破棄しないとMemory leakになる。

### Timer

- Count in Timer、BPM Timer、Trim再生Stop Timerを混ぜない。
- Timer IDは用途別に管理する。
- `onCleanup` で確実に停止する。

## QA Checklist

- [ ] 初回RECでマイク許可Dialogが出る。
- [ ] 許可すると録音できる。
- [ ] 拒否しても画面が壊れない。
- [ ] 上段録音後、上段Playで音が鳴る。
- [ ] 下段録音後、下段Playで音が鳴る。
- [ ] A2追加後、A2で録音できる。
- [ ] A1とA2のTakeが混ざらない。
- [ ] Stopで録音/再生が止まる。
- [ ] 波形Overlayがコードブロックに被らない。
- [ ] Trim start/endが再生に反映される。
- [ ] DeleteでTakeが消える。
- [ ] Reload後も保存Takeが復元される。

## Milestone

### M1: 録って聴ける

- Phase 1
- Phase 2
- Phase 3

目安: 1〜1.5日

### M2: 波形を見ながら整えられる

- Phase 4
- Phase 5
- Phase 6

目安: 1.5〜3日

### M3: アプリとして使い続けられる

- Phase 7
- QA修正

目安: 1.5〜2日

## 最初に着手するTODO

次回の実装開始時は、まずここから始める。

- [ ] `src/hooks/useAudioRecorder.ts` を作成する。
- [ ] `startRecording()` / `stopRecording()` を返すHookにする。
- [ ] Stop時にBlobを返す。
- [ ] `ScreenRoot.tsx` の `handleRec` / `finishActiveRecording` に接続する。
- [ ] 既存のモックTake ID追加をAudioTake追加へ置き換える。
