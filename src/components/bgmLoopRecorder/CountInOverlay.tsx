import { createEffect, Show } from "solid-js";
import { animate } from "motion";
import type { CountInStatus } from "../../screens/40_MainGame/BgmLoopRecorder/screen03Types";

type CountInOverlayProps = {
  status: CountInStatus;
  currentBeat: number;
  beats: 4;
};

export function CountInOverlay(props: CountInOverlayProps) {
  let numberRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!numberRef || props.status === "idle") return;
    animate(numberRef, { scale: [0.7, 1.08, 1], opacity: [0, 1, 1] }, { duration: 0.28 });
  });

  return (
    <Show when={props.status === "counting"}>
      <div class="count-in-top">
        <div ref={numberRef} class="count-in-pill">
          <span>COUNT</span>
          <strong>{props.currentBeat}</strong>
          <span>/ {props.beats}</span>
        </div>
      </div>
    </Show>
  );
}
