import { createStore } from "solid-js/store";
import { createSignal, For, onCleanup } from "solid-js";
import { ActiveStateFooter } from "../../../components/bgmLoopRecorder/ActiveStateFooter";
import { BpmLampControlBar } from "../../../components/bgmLoopRecorder/BpmLampControlBar";
import { CodeBlockRecorder } from "../../../components/bgmLoopRecorder/CodeBlockRecorder";
import { CountInOverlay } from "../../../components/bgmLoopRecorder/CountInOverlay";
import { HeaderSongBar } from "../../../components/bgmLoopRecorder/HeaderSongBar";
import { KeySignatureBar } from "../../../components/bgmLoopRecorder/KeySignatureBar";
import { beatDurationMs, initialScreen03State, nextTakeId } from "./screen03State";
import type { LaneId, RecorderBlockState } from "./screen03Types";

export function BgmLoopRecorderScreen() {
  const [state, setState] = createStore(structuredClone(initialScreen03State));
  const [blocks, setBlocks] = createStore<RecorderBlockState[]>([structuredClone(initialScreen03State.recorderBlock)]);
  const [activeBlockIndex, setActiveBlockIndex] = createSignal(0);
  const timers = new Set<number>();
  let playbackBeatStep = 0;

  const activeBlock = () => blocks[activeBlockIndex()] ?? blocks[0];

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
    setBlocks((block) => block.map((item) => ({
      ...item,
      activeChord: 0,
      lanes: {
        top: { ...item.lanes.top, recording: false, playing: false },
        bottom: { ...item.lanes.bottom, recording: false, playing: false }
      }
    })));
  };

  const startBeatClock = (blockIndex: number) => {
    clearTimers();
    setActiveBlockIndex(blockIndex);
    playbackBeatStep = 0;
    setBlocks(blockIndex, "activeChord", 0);
    setState("controlBar", "beatLamp", 1);
    setState("controlBar", { playing: true, stopped: false });
    const beatMs = beatDurationMs(state.bpm);
    const timerId = window.setInterval(() => {
      playbackBeatStep += 1;
      const nextBeat = (playbackBeatStep % 4) + 1;
      const nextChord = Math.floor(playbackBeatStep / 4) % blocks[blockIndex].chords.length;
      setState("controlBar", "beatLamp", nextBeat);
      setBlocks(blockIndex, "activeChord", nextChord);
    }, beatMs);
    timers.add(timerId);
  };

  const startRecordingBeatClock = (blockIndex: number) => {
    playbackBeatStep = 0;
    setState("controlBar", "beatLamp", 1);
    setBlocks(blockIndex, "activeChord", 0);
    const beatMs = beatDurationMs(state.bpm);
    const timerId = window.setInterval(() => {
      playbackBeatStep += 1;
      const nextBeat = (playbackBeatStep % 4) + 1;
      const nextChord = Math.floor(playbackBeatStep / 4) % blocks[blockIndex].chords.length;
      setState("controlBar", "beatLamp", nextBeat);
      setBlocks(blockIndex, "activeChord", nextChord);
    }, beatMs);
    timers.add(timerId);
  };

  const handleAllPlay = () => {
    if (state.controlBar.playing) {
      stopAll();
      return;
    }
    startBeatClock(activeBlockIndex());
  };

  const handlePlayLane = (blockIndex: number, laneId: LaneId) => {
    setActiveBlockIndex(blockIndex);
    const nextPlaying = !blocks[blockIndex].lanes[laneId].playing;
    setBlocks((block) => block.map((item, index) => ({
      ...item,
      lanes: {
        top: { ...item.lanes.top, playing: index === blockIndex && laneId === "top" ? nextPlaying : false },
        bottom: { ...item.lanes.bottom, playing: index === blockIndex && laneId === "bottom" ? nextPlaying : false }
      }
    })));
    if (nextPlaying) {
      startBeatClock(blockIndex);
    } else {
      stopAll();
    }
  };

  const handleRec = (blockIndex: number, laneId: LaneId) => {
    if (state.countIn.status !== "idle") return;

    setActiveBlockIndex(blockIndex);
    clearTimers();
    const beatMs = beatDurationMs(state.bpm);
    setState("countIn", { currentBeat: 1, status: "counting" });
    setState("controlBar", { playing: false, stopped: false, beatLamp: 1 });

    const timerId = window.setInterval(() => {
      const nextBeat = state.countIn.currentBeat + 1;

      if (nextBeat <= state.countIn.beats) {
        setState("countIn", "currentBeat", nextBeat);
        setState("controlBar", "beatLamp", nextBeat);
        setBlocks(blockIndex, "activeChord", 0);
        return;
      }

      window.clearInterval(timerId);
      timers.delete(timerId);
      setState("countIn", "status", "recording");
      setBlocks(blockIndex, "lanes", laneId, "recording", true);
      setState("controlBar", { playing: true, stopped: false, beatLamp: 1 });
      startRecordingBeatClock(blockIndex);

      const armedLane = blocks[blockIndex].overdubTarget;
      if (armedLane) {
        setBlocks(blockIndex, "lanes", armedLane, "playing", true);
      }

      const finishTimer = window.setTimeout(() => {
        const takes = blocks[blockIndex].lanes[laneId].takes;
        clearTimers();
        setBlocks(blockIndex, "lanes", laneId, "takes", [...takes, nextTakeId(laneId, takes.length)]);
        setBlocks(blockIndex, "lanes", laneId, "recording", false);
        setBlocks(blockIndex, "lanes", "top", "playing", false);
        setBlocks(blockIndex, "lanes", "bottom", "playing", false);
        setState("countIn", { currentBeat: 0, status: "idle" });
        setState("controlBar", { playing: false, stopped: true, beatLamp: 1 });
        setBlocks(blockIndex, "activeChord", 0);
      }, beatMs * blocks[blockIndex].chords.length * 4);
      timers.add(finishTimer);
    }, beatMs);

    timers.add(timerId);
  };

  const handleToggleTakeArmed = (blockIndex: number, laneId: LaneId) => {
    setActiveBlockIndex(blockIndex);
    const nextArmed = !blocks[blockIndex].lanes[laneId].armedPlayback;
    const otherLane: LaneId = laneId === "top" ? "bottom" : "top";
    setBlocks(blockIndex, "lanes", laneId, "armedPlayback", nextArmed);
    setBlocks(blockIndex, "lanes", otherLane, "armedPlayback", false);
    setBlocks(blockIndex, "overdubTarget", nextArmed ? laneId : null);
  };

  const handleChangeLabel = (blockIndex: number, value: string) => {
    setBlocks(blockIndex, "label", value.trim() || `A${blockIndex + 1}`);
  };

  const handleAddCodeBlock = () => {
    const nextIndex = blocks.length;
    const block = structuredClone(blocks[0]);
    block.blockId = `codeblock_${String(nextIndex + 1).padStart(3, "0")}`;
    block.label = `A${nextIndex + 1}`;
    block.activeChord = 0;
    block.overdubTarget = "top";
    block.lanes.top.recording = false;
    block.lanes.top.playing = false;
    block.lanes.top.armedPlayback = true;
    block.lanes.top.takes = [];
    block.lanes.bottom.recording = false;
    block.lanes.bottom.playing = false;
    block.lanes.bottom.armedPlayback = false;
    block.lanes.bottom.takes = [];
    setBlocks(blocks.length, block);
    setActiveBlockIndex(nextIndex);
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
            notes={state.availableNotes.notes}
          />
          <div class="codeblock-stack">
            <For each={blocks}>
              {(block, index) => (
                <CodeBlockRecorder
                  blockId={block.blockId}
                  label={block.label}
                  chords={block.chords}
                  activeChord={block.activeChord}
                  lanes={block.lanes}
                  overdubTarget={block.overdubTarget}
                  onRec={(laneId) => handleRec(index(), laneId)}
                  onPlayLane={(laneId) => handlePlayLane(index(), laneId)}
                  onToggleTakeArmed={(laneId) => handleToggleTakeArmed(index(), laneId)}
                  onChangeLabel={(value) => handleChangeLabel(index(), value)}
                />
              )}
            </For>
            <button type="button" class="add-codeblock-button" aria-label="コードブロックを追加" title="コードブロックを追加" onClick={handleAddCodeBlock}>
              +
            </button>
          </div>
          <div class="flex-1 bg-white" />
          <ActiveStateFooter
            screen={state.screen}
            label={activeBlock().label}
            activeLane={activeBlock().overdubTarget}
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
