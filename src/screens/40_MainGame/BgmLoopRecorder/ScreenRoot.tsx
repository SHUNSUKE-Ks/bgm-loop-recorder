import { createStore } from "solid-js/store";
import { onCleanup } from "solid-js";
import { ActiveStateFooter } from "../../../components/bgmLoopRecorder/ActiveStateFooter";
import { AvailableNotesBar } from "../../../components/bgmLoopRecorder/AvailableNotesBar";
import { BpmLampControlBar } from "../../../components/bgmLoopRecorder/BpmLampControlBar";
import { CodeBlockRecorder } from "../../../components/bgmLoopRecorder/CodeBlockRecorder";
import { CountInOverlay } from "../../../components/bgmLoopRecorder/CountInOverlay";
import { HeaderSongBar } from "../../../components/bgmLoopRecorder/HeaderSongBar";
import { KeySignatureBar } from "../../../components/bgmLoopRecorder/KeySignatureBar";
import { beatDurationMs, initialScreen03State, nextTakeId } from "./screen03State";
import type { LaneId } from "./screen03Types";

export function BgmLoopRecorderScreen() {
  const [state, setState] = createStore(structuredClone(initialScreen03State));
  const timers = new Set<number>();

  const clearTimers = () => {
    timers.forEach((timerId) => window.clearInterval(timerId));
    timers.forEach((timerId) => window.clearTimeout(timerId));
    timers.clear();
  };

  onCleanup(clearTimers);

  const stopAll = () => {
    clearTimers();
    setState("countIn", { currentBeat: 0, status: "idle" });
    setState("controlBar", { playing: false, stopped: true, beatLamp: 1 });
    setState("recorderBlock", "activeChord", 0);
    setState("recorderBlock", "lanes", "top", { recording: false, playing: false });
    setState("recorderBlock", "lanes", "bottom", { recording: false, playing: false });
  };

  const startBeatClock = () => {
    clearTimers();
    setState("controlBar", { playing: true, stopped: false });
    const beatMs = beatDurationMs(state.bpm);
    const timerId = window.setInterval(() => {
      const nextBeat = state.controlBar.beatLamp >= 4 ? 1 : state.controlBar.beatLamp + 1;
      const nextChord = (nextBeat - 1) % state.recorderBlock.chords.length;
      setState("controlBar", "beatLamp", nextBeat);
      setState("recorderBlock", "activeChord", nextChord);
    }, beatMs);
    timers.add(timerId);
  };

  const handleAllPlay = () => {
    if (state.controlBar.playing) {
      stopAll();
      return;
    }
    startBeatClock();
  };

  const handlePlayLane = (laneId: LaneId) => {
    const nextPlaying = !state.recorderBlock.lanes[laneId].playing;
    setState("recorderBlock", "lanes", "top", "playing", laneId === "top" ? nextPlaying : false);
    setState("recorderBlock", "lanes", "bottom", "playing", laneId === "bottom" ? nextPlaying : false);
    if (nextPlaying) {
      startBeatClock();
    } else {
      stopAll();
    }
  };

  const handleRec = (laneId: LaneId) => {
    if (state.countIn.status !== "idle") return;

    clearTimers();
    const beatMs = beatDurationMs(state.bpm);
    setState("countIn", { currentBeat: 1, status: "counting" });
    setState("controlBar", { playing: false, stopped: false, beatLamp: 1 });

    const timerId = window.setInterval(() => {
      const nextBeat = state.countIn.currentBeat + 1;

      if (nextBeat <= state.countIn.beats) {
        setState("countIn", "currentBeat", nextBeat);
        setState("controlBar", "beatLamp", nextBeat);
        setState("recorderBlock", "activeChord", nextBeat - 1);
        return;
      }

      window.clearInterval(timerId);
      timers.delete(timerId);
      setState("countIn", "status", "recording");
      setState("recorderBlock", "lanes", laneId, "recording", true);
      setState("controlBar", { playing: true, stopped: false, beatLamp: 1 });

      const armedLane = state.recorderBlock.overdubTarget;
      if (armedLane) {
        setState("recorderBlock", "lanes", armedLane, "playing", true);
      }

      const finishTimer = window.setTimeout(() => {
        const takes = state.recorderBlock.lanes[laneId].takes;
        setState("recorderBlock", "lanes", laneId, "takes", [...takes, nextTakeId(laneId, takes.length)]);
        setState("recorderBlock", "lanes", laneId, "recording", false);
        setState("recorderBlock", "lanes", "top", "playing", false);
        setState("recorderBlock", "lanes", "bottom", "playing", false);
        setState("countIn", { currentBeat: 0, status: "idle" });
        setState("controlBar", { playing: false, stopped: true, beatLamp: 1 });
        setState("recorderBlock", "activeChord", 0);
        timers.delete(finishTimer);
      }, beatMs * 2);
      timers.add(finishTimer);
    }, beatMs);

    timers.add(timerId);
  };

  const handleToggleTakeArmed = (laneId: LaneId) => {
    const nextArmed = !state.recorderBlock.lanes[laneId].armedPlayback;
    const otherLane: LaneId = laneId === "top" ? "bottom" : "top";
    setState("recorderBlock", "lanes", laneId, "armedPlayback", nextArmed);
    setState("recorderBlock", "lanes", otherLane, "armedPlayback", false);
    setState("recorderBlock", "overdubTarget", nextArmed ? laneId : null);
  };

  const handleChangeLabel = (value: string) => {
    setState("recorderBlock", "label", value.trim() || "A1");
  };

  return (
    <main class="min-h-screen bg-slate-100 text-slate-950">
      <div class="mx-auto flex min-h-screen w-full max-w-[520px] items-start justify-center px-3 py-5">
        <section class="phone-shell relative flex h-[calc(100vh-40px)] min-h-[720px] w-full max-w-[420px] flex-col overflow-hidden bg-white">
          <HeaderSongBar
            title={state.title}
            bpm={state.bpm}
            keyName={state.key}
            onBack={() => console.info("back to song list")}
          />
          <BpmLampControlBar
            repeat={state.controlBar.repeat}
            currentBeat={state.controlBar.beatLamp}
            beatCount={4}
            playing={state.controlBar.playing}
            onToggleRepeat={() => setState("controlBar", "repeat", !state.controlBar.repeat)}
            onAllPlay={handleAllPlay}
            onStop={stopAll}
          />
          <KeySignatureBar
            keyName={state.key}
            clef={state.keySignature.clef}
            accidentals={state.keySignature.accidentals}
            display={state.keySignature.display}
          />
          <AvailableNotesBar
            notes={state.availableNotes.notes}
            quality={state.availableNotes.quality}
            symbols={state.availableNotes.symbols}
          />
          <CodeBlockRecorder
            blockId={state.recorderBlock.blockId}
            label={state.recorderBlock.label}
            chords={state.recorderBlock.chords}
            activeChord={state.recorderBlock.activeChord}
            lanes={state.recorderBlock.lanes}
            overdubTarget={state.recorderBlock.overdubTarget}
            onRec={handleRec}
            onPlayLane={handlePlayLane}
            onToggleTakeArmed={handleToggleTakeArmed}
            onChangeLabel={handleChangeLabel}
          />
          <div class="flex-1 bg-white" />
          <ActiveStateFooter
            screen={state.screen}
            label={state.recorderBlock.label}
            activeLane={state.recorderBlock.overdubTarget}
            status={state.countIn.status}
            beat={state.countIn.currentBeat || state.controlBar.beatLamp}
            onSave={() => console.info("mock save", structuredClone(state))}
          />
          <CountInOverlay
            status={state.countIn.status}
            currentBeat={state.countIn.currentBeat}
            beats={state.countIn.beats}
          />
        </section>
      </div>
    </main>
  );
}
