import type { LaneId } from "../../screens/40_MainGame/BgmLoopRecorder/screen03Types";

type ActiveStateFooterProps = {
  screen: string;
  label: string;
  activeLane: LaneId | null;
  status: string;
  beat: number;
  onSave: () => void;
};

export function ActiveStateFooter(props: ActiveStateFooterProps) {
  return (
    <footer class="flex items-center justify-between border-t-2 border-slate-950 bg-slate-950 px-4 py-3 text-xs font-black text-white">
      <span class="truncate">
        ACTIVE: {props.screen} / {props.label} / {props.activeLane ?? "none"} / {props.status} / beat {props.beat}
      </span>
      <button type="button" class="ml-3 rounded bg-amber-400 px-3 py-1 text-slate-950" onClick={props.onSave}>
        SAVE
      </button>
    </footer>
  );
}
