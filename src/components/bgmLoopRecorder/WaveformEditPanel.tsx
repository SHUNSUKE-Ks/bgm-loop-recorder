import { For } from "solid-js";
import type { LaneId } from "../../screens/40_MainGame/BgmLoopRecorder/screen03Types";

type WaveformSelection = {
  blockIndex: number;
  laneId: LaneId;
  takeId: string;
  start: number;
  end: number;
};

type WaveformEditPanelProps = {
  selection: WaveformSelection;
  onPreview: () => void;
  onTrimStartChange: (value: number) => void;
  onTrimEndChange: (value: number) => void;
  onAutoTrimSilence: () => void;
  onDelete: () => void;
};

export function WaveformEditPanel(props: WaveformEditPanelProps) {
  const bars = () => {
    const seed = props.selection.takeId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Array.from({ length: 72 }, (_, index) => {
      const wave = Math.abs(Math.sin((index + seed) * 0.52));
      return 8 + Math.round(wave * 34);
    });
  };

  const duration = "00:04.54";
  const startLabel = () => `00:0${Math.floor((props.selection.start / 100) * 4)}.${String(Math.floor((props.selection.start % 20) * 5)).padStart(2, "0")}`;

  return (
    <section class="wave-editor" aria-label={`${props.selection.laneId} ${props.selection.takeId} 波形編集`}>
      <div class="wave-editor-time">
        <span>{startLabel()}</span>
        <strong>{duration}</strong>
        <span>{duration}</span>
      </div>
      <div class="waveform-area">
        <div class="trim-window" style={{ left: `${props.selection.start}%`, right: `${100 - props.selection.end}%` }} />
        <For each={bars()}>
          {(height, index) => (
            <span class="wave-bar" style={{ height: `${height}px`, left: `${(index() / 71) * 100}%` }} />
          )}
        </For>
        <span class="trim-handle start" style={{ left: `${props.selection.start}%` }} />
        <span class="trim-handle end" style={{ left: `${props.selection.end}%` }} />
      </div>
      <div class="trim-controls">
        <input
          aria-label="開始トリム"
          type="range"
          min="0"
          max="94"
          value={props.selection.start}
          onInput={(event) => props.onTrimStartChange(Number(event.currentTarget.value))}
        />
        <input
          aria-label="終了トリム"
          type="range"
          min="6"
          max="100"
          value={props.selection.end}
          onInput={(event) => props.onTrimEndChange(Number(event.currentTarget.value))}
        />
      </div>
      <div class="wave-editor-actions">
        <button type="button" onClick={props.onPreview}>▶<span>プレビュー</span></button>
        <button type="button" onClick={props.onAutoTrimSilence}>⇥<span>無音トリム</span></button>
        <button type="button" onClick={props.onDelete}>⌫<span>削除</span></button>
        <button type="button">✂<span>トリミング</span></button>
      </div>
    </section>
  );
}
