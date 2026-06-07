import { For } from "solid-js";
import type { LaneId, RecLaneState } from "../../screens/40_MainGame/BgmLoopRecorder/screen03Types";
import { RecordedTakeIcon } from "./RecordedTakeIcon";

type RecLaneRowProps = {
  laneId: LaneId;
  lane: RecLaneState;
  onRec: (laneId: LaneId) => void;
  onPlayLane: (laneId: LaneId) => void;
  onToggleTakeArmed: (laneId: LaneId, takeId: string) => void;
};

export function RecLaneRow(props: RecLaneRowProps) {
  return (
    <div class="grid h-[40px] grid-cols-[54px_1fr_64px] items-center gap-2">
      <button
        type="button"
        class="rec-button"
        classList={{ recording: props.lane.recording }}
        disabled={!props.lane.recordEnabled}
        onClick={() => props.onRec(props.laneId)}
      >
        REC
      </button>
      <div class="lane-wave">
        <For each={props.lane.takes}>
          {(take) => (
            <RecordedTakeIcon
              takeId={take.takeId}
              durationSec={take.durationSec}
              armed={props.lane.armedPlayback}
              onClick={() => props.onPlayLane(props.laneId)}
              onLongPress={() => props.onToggleTakeArmed(props.laneId, take.takeId)}
            />
          )}
        </For>
      </div>
      <button
        type="button"
        class="lane-play-button"
        classList={{ playing: props.lane.playing }}
        aria-label={`${props.laneId}を再生`}
        title={`${props.laneId}を再生`}
        onClick={() => props.onPlayLane(props.laneId)}
      >
        ▶
      </button>
    </div>
  );
}
