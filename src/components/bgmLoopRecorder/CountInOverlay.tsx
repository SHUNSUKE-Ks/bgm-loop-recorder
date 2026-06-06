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
    <Show when={props.status !== "idle"}>
      <div class="absolute inset-0 z-20 grid place-items-center bg-slate-950/35 backdrop-blur-[1px]">
        <div ref={numberRef} class="count-overlay-card">
          <div class="text-sm font-black tracking-normal text-amber-500">
            {props.status === "counting" ? "COUNT IN" : "REC"}
          </div>
          <div class="text-7xl font-black leading-none">
            {props.status === "counting" ? props.currentBeat : "●"}
          </div>
          <div class="text-xs font-bold text-slate-500">
            {props.status === "counting" ? `${props.currentBeat} / ${props.beats}` : "mock recording"}
          </div>
        </div>
      </div>
    </Show>
  );
}
