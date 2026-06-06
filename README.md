# 弐音

GameCollection向けの短いループBGM制作アプリです。  
現在はPhase 1として、`screen03_score` の状態駆動UIモックを実装しています。

## 起動

```powershell
cd C:\Users\enjoy\InBox2026\InBox0601\06_AppList\bgm-loop-recorder
npm run dev -- --host 127.0.0.1 --port 5174
```

## 実装済み

- SolidJS + Vite + TailwindCSS + PWA
- GameCollection Ver1.1のpackage構成をベースにした新規アプリ
- Pixel 6a縦画面想定の `screen03_score`
- Header / BPMランプ / 調号 / 使用可能音 / コード録音ブロック
- REC押下後の4カウントモック
- カウント後のTakeIcon追加
- Stopによる状態リセット
- TakeIcon長押しによる `armedPlayback` 切替
- ActiveStateFooterでの状態表示

## 次フェーズ候補

- Androidマイク録音
- wav/mp3保存
- Howlerによる再生管理
- DexieによるTake/曲データ保存
- `100_Collection/BGMDB` への完成BGM登録
