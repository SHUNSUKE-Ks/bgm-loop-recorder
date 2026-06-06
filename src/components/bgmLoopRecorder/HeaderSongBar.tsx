import { Show, createSignal } from "solid-js";

type HeaderSongBarProps = {
  title: string;
  bpm: number;
  keyName: string;
  onBack: () => void;
  onBpmChange: (bpm: number) => void;
  onKeyChange: (keyName: string) => void;
};

export function HeaderSongBar(props: HeaderSongBarProps) {
  const [settingsOpen, setSettingsOpen] = createSignal(false);
  const keyOptions = ["C", "G", "D", "A", "E", "B", "F", "Bb", "Eb", "Ab", "Db"];
  const clampBpm = (value: number) => Math.min(220, Math.max(40, Math.round(value || 40)));

  return (
    <header class="relative px-6 pb-3 pt-7">
      <button
        type="button"
        class="header-meta-button"
        aria-expanded={settingsOpen()}
        aria-label="BPMとKey設定を開く"
        onClick={() => setSettingsOpen(!settingsOpen())}
      >
        <span>BPM:{props.bpm}</span>
        <span>Key:{props.keyName}</span>
      </button>
      <Show when={settingsOpen()}>
        <div class="header-settings-panel">
          <label class="header-control-row">
            <span>BPM</span>
            <input
              class="bpm-slider"
              type="range"
              min="40"
              max="220"
              step="1"
              value={props.bpm}
              onInput={(event) => props.onBpmChange(clampBpm(Number(event.currentTarget.value)))}
            />
            <input
              class="bpm-number"
              type="number"
              min="40"
              max="220"
              step="1"
              inputmode="numeric"
              value={props.bpm}
              onInput={(event) => props.onBpmChange(clampBpm(Number(event.currentTarget.value)))}
            />
          </label>
          <label class="header-key-row">
            <span>Key</span>
            <select
              class="key-select"
              value={props.keyName}
              onChange={(event) => props.onKeyChange(event.currentTarget.value)}
            >
              {keyOptions.map((keyName) => (
                <option value={keyName}>{keyName}</option>
              ))}
            </select>
          </label>
        </div>
      </Show>
      <div class="mt-1 flex items-center gap-5">
        <button
          type="button"
          class="icon-button h-9 w-9 text-3xl"
          aria-label="戻る"
          title="戻る"
          onClick={props.onBack}
        >
          ‹
        </button>
        <h1 class="truncate text-[28px] font-black leading-none tracking-normal text-slate-950">{props.title}</h1>
      </div>
    </header>
  );
}
