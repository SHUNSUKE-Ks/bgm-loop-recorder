type HeaderSongBarProps = {
  title: string;
  bpm: number;
  keyName: string;
  onBack: () => void;
};

export function HeaderSongBar(props: HeaderSongBarProps) {
  return (
    <header class="px-6 pb-3 pt-7">
      <div class="ml-11 flex gap-4 text-sm font-bold text-slate-500">
        <span>BPM:{props.bpm}</span>
        <span>Key:{props.keyName}</span>
      </div>
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
