import { For } from "solid-js";
import type { LaneId } from "../../screens/40_MainGame/BgmLoopRecorder/screen03Types";

type WaveformSelection = {
  blockIndex: number;
  laneId: LaneId;
  takeId: string;
  start: number;
  end: number;
  durationSec: number;
  waveformPeaks: number[];
};

type WaveformEditPanelProps = {
  selection: WaveformSelection;
  repeat: boolean;
  playheadPercent: number;
  onPlayFromStart: () => void;
  onToggleRepeat: () => void;
  onSeek: (value: number) => void;
  onTrimStartChange: (value: number) => void;
  onTrimEndChange: (value: number) => void;
  onAutoTrimSilence: () => void;
  onDelete: () => void;
  onClose: () => void;
};

export function WaveformEditPanel(props: WaveformEditPanelProps) {
  const bars = () => {
    const peaks = props.selection.waveformPeaks.length > 0 ? props.selection.waveformPeaks : [0];
    return peaks.map((peak) => 8 + Math.round(Math.min(1, peak) * 42));
  };

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const rest = safeSeconds - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${rest.toFixed(2).padStart(5, "0")}`;
  };

  const startLabel = () => formatTime((props.selection.start / 100) * props.selection.durationSec);
  const endLabel = () => formatTime((props.selection.end / 100) * props.selection.durationSec);
  const duration = () => formatTime(props.selection.durationSec);

  return (
    <section class="wave-editor" aria-label={`${props.selection.laneId} ${props.selection.takeId} 波形編集`}>
      <button type="button" class="wave-editor-close" aria-label="トリミング画面を閉じる" title="閉じる" onClick={props.onClose}>
        ×
      </button>
      <div class="wave-editor-time">
        <span>{startLabel()}</span>
        <strong>{duration()}</strong>
        <span>{endLabel()}</span>
      </div>
      <div class="waveform-area">
        <div class="trim-window" style={{ left: `${props.selection.start}%`, right: `${100 - props.selection.end}%` }} />
        <For each={bars()}>
          {(height, index) => (
            <span class="wave-bar" style={{ height: `${height}px`, left: `${(index() / Math.max(1, bars().length - 1)) * 100}%` }} />
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
      <div class="wave-playback-row">
        <button type="button" class="wave-start-button" onClick={props.onPlayFromStart}>▶<span>始まりから</span></button>
        <input
          aria-label="再生位置"
          type="range"
          min="0"
          max="100"
          value={props.playheadPercent}
          onInput={(event) => props.onSeek(Number(event.currentTarget.value))}
        />
        <button
          type="button"
          class="wave-repeat-button"
          classList={{ active: props.repeat }}
          onClick={props.onToggleRepeat}
        >
          ↻<span>{props.repeat ? "ON" : "OFF"}</span>
        </button>
      </div>
      <div class="wave-editor-actions">
        <button type="button" onClick={props.onAutoTrimSilence}>⇥<span>無音トリム</span></button>
        <button type="button" onClick={props.onDelete}>⌫<span>削除</span></button>
        <button type="button">✂<span>トリミング</span></button>
      </div>
    </section>
  );
}
