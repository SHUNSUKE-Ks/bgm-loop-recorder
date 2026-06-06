import { For } from "solid-js";
import type { LaneId, RecLaneState } from "../../screens/40_MainGame/BgmLoopRecorder/screen03Types";
import { ChordButton } from "./ChordButton";
import { RecLaneRow } from "./RecLaneRow";

type CodeBlockRecorderProps = {
  blockId: string;
  label: string;
  chords: string[];
  activeChord: number;
  lanes: Record<LaneId, RecLaneState>;
  onRec: (laneId: LaneId) => void;
  onPlayLane: (laneId: LaneId) => void;
  onToggleTakeArmed: (laneId: LaneId, takeId: string) => void;
  onChangeLabel: (value: string) => void;
};

export function CodeBlockRecorder(props: CodeBlockRecorderProps) {
  return (
    <section class="recorder-block" aria-label={props.blockId}>
      <RecLaneRow
        laneId="top"
        lane={props.lanes.top}
        onRec={props.onRec}
        onPlayLane={props.onPlayLane}
        onToggleTakeArmed={props.onToggleTakeArmed}
      />
      <div class="grid h-[52px] grid-cols-[58px_1fr] items-center gap-2">
        <input
          class="label-input"
          value={props.label}
          aria-label="コードブロック名"
          onChange={(event) => props.onChangeLabel(event.currentTarget.value)}
        />
        <div class="grid grid-cols-4 gap-2">
          <For each={props.chords}>
            {(chord, index) => (
              <ChordButton chord={chord} index={index()} active={props.activeChord === index()} />
            )}
          </For>
        </div>
      </div>
      <RecLaneRow
        laneId="bottom"
        lane={props.lanes.bottom}
        onRec={props.onRec}
        onPlayLane={props.onPlayLane}
        onToggleTakeArmed={props.onToggleTakeArmed}
      />
    </section>
  );
}
