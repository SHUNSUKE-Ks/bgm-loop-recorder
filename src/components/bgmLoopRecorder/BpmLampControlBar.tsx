import { For } from "solid-js";

type BpmLampControlBarProps = {
  repeat: boolean;
  currentBeat: number;
  beatCount: 4;
  playing: boolean;
  onToggleRepeat: () => void;
  onAllPlay: () => void;
  onStop: () => void;
};

export function BpmLampControlBar(props: BpmLampControlBarProps) {
  return (
    <div class="mx-5 flex h-[86px] items-center gap-4 rounded-[22px] border border-slate-200 bg-slate-50 px-5 shadow-inner">
      <button
        type="button"
        classList={{ "is-active": props.repeat }}
        class="repeat-button"
        aria-label="リピート"
        title="リピート"
        onClick={props.onToggleRepeat}
      />
      <div class="flex flex-1 items-center justify-between gap-3">
        <For each={Array.from({ length: props.beatCount }, (_, index) => index + 1)}>
          {(beat) => (
            <span
              class="beat-lamp"
              classList={{ active: props.currentBeat === beat }}
              aria-label={`beat ${beat}`}
            />
          )}
        </For>
      </div>
      <div class="flex flex-col items-center gap-1">
        <button
          type="button"
          class="stop-button"
          aria-label={props.playing ? "停止" : "全体再生"}
          title={props.playing ? "停止" : "全体再生"}
          onClick={props.playing ? props.onStop : props.onAllPlay}
        >
          {props.playing ? "■" : "▶"}
        </button>
        <button type="button" class="text-[11px] font-black text-emerald-600" onClick={props.onStop}>
          STOP
        </button>
      </div>
    </div>
  );
}
