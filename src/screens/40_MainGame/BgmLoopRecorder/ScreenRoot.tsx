import { createStore, unwrap } from "solid-js/store";
import { createSignal, For, onCleanup } from "solid-js";
import { ActiveStateFooter } from "../../../components/bgmLoopRecorder/ActiveStateFooter";
import { BpmLampControlBar } from "../../../components/bgmLoopRecorder/BpmLampControlBar";
import { CodeBlockRecorder } from "../../../components/bgmLoopRecorder/CodeBlockRecorder";
import { CountInOverlay } from "../../../components/bgmLoopRecorder/CountInOverlay";
import { HeaderSongBar } from "../../../components/bgmLoopRecorder/HeaderSongBar";
import { KeySignatureBar } from "../../../components/bgmLoopRecorder/KeySignatureBar";
import { WaveformEditPanel } from "../../../components/bgmLoopRecorder/WaveformEditPanel";
import { createAudioRecorder } from "../../../hooks/useAudioRecorder";
import { decodeAudioBlob, getAudioDuration } from "../../../utils/audioBuffer";
import { buildWaveformPeaks, detectSilenceTrimPercent } from "../../../utils/waveform";
import type { SongOption } from "../../02_ChordSelect/ChordSelectScreen";
import { beatDurationMs, initialScreen03State, nextTakeId } from "./screen03State";
import type { AudioTake, LaneId, RecorderBlockState } from "./screen03Types";

type WaveformSelection = {
  blockIndex: number;
  laneId: LaneId;
  takeId: string;
  start: number;
  end: number;
  durationSec: number;
  waveformPeaks: number[];
};

type ActiveRecording = {
  blockIndex: number;
  laneId: LaneId;
};

const noteAccidentalMap: Record<string, string[]> = {
  C: ["C", "Dm", "Em", "F", "G", "Am", "Bm"],
  G: ["G", "Am", "Bm", "C", "D", "Em", "F♯m"],
  D: ["D", "Em", "F♯m", "G", "A", "Bm", "C♯m"],
  A: ["A", "Bm", "C♯m", "D", "E", "F♯m", "G♯m"],
  E: ["E", "F♯m", "G♯m", "A", "B", "C♯m", "D♯m"],
  B: ["B", "C♯m", "D♯m", "E", "F♯", "G♯m", "A♯m"],
  F: ["F", "Gm", "Am", "B♭", "C", "Dm", "Em"],
  Bb: ["B♭", "Cm", "Dm", "E♭", "F", "Gm", "Am"],
  Eb: ["E♭", "Fm", "Gm", "A♭", "B♭", "Cm", "Dm"],
  Ab: ["A♭", "B♭m", "Cm", "D♭", "E♭", "Fm", "Gm"],
  Db: ["D♭", "E♭m", "Fm", "G♭", "A♭", "B♭m", "Cm"],
  "A minor": ["Am", "Bm", "C", "Dm", "Em", "F", "G"],
  "E minor": ["Em", "F♯m", "G", "Am", "Bm", "C", "D"],
  "D Dorian": ["Dm", "Em", "F", "G", "Am", "Bm", "C"],
  "E Phrygian": ["Em", "F", "G", "Am", "Bm", "C", "Dm"],
  "C Lydian": ["C", "D", "Em", "F♯m", "G", "Am", "Bm"]
};

const keySignatureDisplayMap: Record<string, { clef: "treble"; accidentals: string[]; display: string }> = {
  C: { clef: "treble", accidentals: [], display: "C natural" },
  G: { clef: "treble", accidentals: ["F#"], display: "F#" },
  D: { clef: "treble", accidentals: ["F#", "C#"], display: "F#, C#" },
  A: { clef: "treble", accidentals: ["F#", "C#", "G#"], display: "F#, C#, G#" },
  E: { clef: "treble", accidentals: ["F#", "C#", "G#", "D#"], display: "F#, C#, G#, D#" },
  B: { clef: "treble", accidentals: ["F#", "C#", "G#", "D#", "A#"], display: "F#, C#, G#, D#, A#" },
  F: { clef: "treble", accidentals: ["Bb"], display: "Bb" },
  Bb: { clef: "treble", accidentals: ["Bb", "Eb"], display: "Bb, Eb" },
  Eb: { clef: "treble", accidentals: ["Bb", "Eb", "Ab"], display: "Bb, Eb, Ab" },
  Ab: { clef: "treble", accidentals: ["Bb", "Eb", "Ab", "Db"], display: "Bb, Eb, Ab, Db" },
  Db: { clef: "treble", accidentals: ["Bb", "Eb", "Ab", "Db", "Gb"], display: "Bb, Eb, Ab, Db, Gb" },
  "A minor": { clef: "treble", accidentals: [], display: "A minor" },
  "E minor": { clef: "treble", accidentals: ["F#"], display: "F#" },
  "D Dorian": { clef: "treble", accidentals: [], display: "D Dorian" },
  "E Phrygian": { clef: "treble", accidentals: [], display: "E Phrygian" },
  "C Lydian": { clef: "treble", accidentals: ["F#"], display: "F#" }
};

type BgmLoopRecorderScreenProps = {
  song: SongOption;
  onBack: () => void;
};

export function BgmLoopRecorderScreen(props: BgmLoopRecorderScreenProps) {
  const initialState = structuredClone(initialScreen03State);
  initialState.title = props.song.title;
  initialState.bpm = props.song.bpm;
  initialState.key = props.song.key;
  initialState.keySignature = keySignatureDisplayMap[props.song.key] ?? keySignatureDisplayMap.C;
  initialState.availableNotes.notes = noteAccidentalMap[props.song.key] ?? noteAccidentalMap.C;
  initialState.recorderBlock.chords = props.song.chords;
  const initialBlock = structuredClone(initialState.recorderBlock);
  const [state, setState] = createStore(initialState);
  const [blocks, setBlocks] = createStore<RecorderBlockState[]>([initialBlock]);
  const [activeBlockIndex, setActiveBlockIndex] = createSignal(0);
  const [waveformSelection, setWaveformSelection] = createSignal<WaveformSelection | null>(null);
  const [activeRecording, setActiveRecording] = createSignal<ActiveRecording | null>(null);
  const audioRecorder = createAudioRecorder();
  const audioPlayers = new Map<string, HTMLAudioElement>();
  const timers = new Set<number>();
  let codeBlockStackRef: HTMLDivElement | undefined;
  let playbackBeatStep = 0;

  const activeBlock = () => blocks[activeBlockIndex()] ?? blocks[0];
  const scoreNotes = () => props.song.guitarTab?.suggestedNotes ?? noteAccidentalMap[state.key] ?? noteAccidentalMap.C;

  const clearTimers = () => {
    timers.forEach((timerId) => window.clearInterval(timerId));
    timers.forEach((timerId) => window.clearTimeout(timerId));
    timers.clear();
  };

  const stopAudioPlayers = () => {
    audioPlayers.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioPlayers.clear();
  };

  const findTake = (blockIndex: number, laneId: LaneId, takeId?: string) => {
    const takes = blocks[blockIndex]?.lanes[laneId].takes ?? [];
    return takeId ? takes.find((take) => take.takeId === takeId) : takes[0];
  };

  const toWaveformSelection = (blockIndex: number, laneId: LaneId, take: AudioTake): WaveformSelection => ({
    blockIndex,
    laneId,
    takeId: take.takeId,
    start: take.durationSec > 0 ? Math.round((take.trimStartSec / take.durationSec) * 100) : 0,
    end: take.durationSec > 0 ? Math.round((take.trimEndSec / take.durationSec) * 100) : 100,
    durationSec: take.durationSec,
    waveformPeaks: take.waveformPeaks
  });

  const updateTakeTrim = (selection: WaveformSelection) => {
    const takeIndex = blocks[selection.blockIndex].lanes[selection.laneId].takes.findIndex((take) => take.takeId === selection.takeId);
    if (takeIndex < 0) return;
    const trimStartSec = (selection.start / 100) * selection.durationSec;
    const trimEndSec = (selection.end / 100) * selection.durationSec;
    setBlocks(selection.blockIndex, "lanes", selection.laneId, "takes", takeIndex, "trimStartSec", trimStartSec);
    setBlocks(selection.blockIndex, "lanes", selection.laneId, "takes", takeIndex, "trimEndSec", trimEndSec);
  };

  const createTakeFromBlob = async (recording: ActiveRecording, blob: Blob): Promise<AudioTake> => {
    const takes = blocks[recording.blockIndex].lanes[recording.laneId].takes;
    const takeId = nextTakeId(recording.laneId, takes.length);
    const objectUrl = URL.createObjectURL(blob);
    let durationSec = await getAudioDuration(blob);
    let waveformPeaks: number[] = [];

    try {
      const audioBuffer = await decodeAudioBlob(blob);
      durationSec = audioBuffer.duration;
      waveformPeaks = buildWaveformPeaks(audioBuffer);
    } catch {
      waveformPeaks = [];
    }

    const safeDuration = Math.max(0.1, durationSec || 0.1);

    return {
      takeId,
      blockId: blocks[recording.blockIndex].blockId,
      laneId: recording.laneId,
      createdAt: Date.now(),
      blob,
      objectUrl,
      durationSec: safeDuration,
      trimStartSec: 0,
      trimEndSec: safeDuration,
      waveformPeaks
    };
  };

  onCleanup(() => {
    clearTimers();
    stopAudioPlayers();
    audioRecorder.cancelRecording();
    blocks.forEach((block) => {
      block.lanes.top.takes.forEach((take) => URL.revokeObjectURL(take.objectUrl));
      block.lanes.bottom.takes.forEach((take) => URL.revokeObjectURL(take.objectUrl));
    });
  });

  const finishActiveRecording = async () => {
    const recording = activeRecording();
    if (!recording) return;

    const result = await audioRecorder.stopRecording();
    let createdTake: AudioTake | null = null;

    if (result?.blob && result.blob.size > 0) {
      createdTake = await createTakeFromBlob(recording, result.blob);
      const takes = blocks[recording.blockIndex].lanes[recording.laneId].takes;
      setBlocks(recording.blockIndex, "lanes", recording.laneId, "takes", [...takes, createdTake]);
    }

    setBlocks(recording.blockIndex, "lanes", recording.laneId, "recording", false);
    setBlocks(recording.blockIndex, "lanes", "top", "playing", false);
    setBlocks(recording.blockIndex, "lanes", "bottom", "playing", false);
    setBlocks(recording.blockIndex, "activeChord", 0);
    if (createdTake) {
      setWaveformSelection(toWaveformSelection(recording.blockIndex, recording.laneId, createdTake));
    }
    setActiveRecording(null);
  };

  const stopAll = async () => {
    const wasRecording = activeRecording() !== null;
    await finishActiveRecording();
    clearTimers();
    stopAudioPlayers();
    setState("countIn", { currentBeat: 0, status: "idle" });
    setState("controlBar", { playing: false, stopped: true, beatLamp: 1 });
    if (!wasRecording) {
      setWaveformSelection(null);
    }
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

  const startSequenceBeatClock = () => {
    clearTimers();
    playbackBeatStep = 0;
    setWaveformSelection(null);
    setState("controlBar", "beatLamp", 1);
    setState("controlBar", { playing: true, stopped: false });
    setBlocks((block) => block.map((item) => ({ ...item, activeChord: 0 })));

    const beatMs = beatDurationMs(state.bpm);
    const timerId = window.setInterval(() => {
      playbackBeatStep += 1;
      const nextBeat = (playbackBeatStep % 4) + 1;
      const blockSpan = 4 * blocks[0].chords.length;
      const totalSpan = blockSpan * blocks.length;
      const sequenceBeat = state.controlBar.repeat ? playbackBeatStep % totalSpan : playbackBeatStep;
      const nextBlockIndex = Math.min(Math.floor(sequenceBeat / blockSpan), blocks.length - 1);
      const nextChord = Math.floor((sequenceBeat % blockSpan) / 4);

      if (!state.controlBar.repeat && playbackBeatStep >= totalSpan) {
        void stopAll();
        return;
      }

      setActiveBlockIndex(nextBlockIndex);
      setState("controlBar", "beatLamp", nextBeat);
      setBlocks((block) => block.map((item, index) => ({
        ...item,
        activeChord: index === nextBlockIndex ? nextChord : 0
      })));
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
      void stopAll();
      return;
    }
    startSequenceBeatClock();
  };

  const finishLanePlayback = (blockIndex: number, laneId: LaneId) => {
    setBlocks(blockIndex, "lanes", laneId, "playing", false);
    setState("controlBar", { playing: false, stopped: true, beatLamp: 1 });
    clearTimers();
    stopAudioPlayers();
  };

  const playTakeAudio = (blockIndex: number, laneId: LaneId, take: AudioTake) => {
    stopAudioPlayers();
    const audio = new Audio(take.objectUrl);
    audio.currentTime = take.trimStartSec;
    audioPlayers.set(take.takeId, audio);
    const playMs = Math.max(100, (take.trimEndSec - take.trimStartSec) * 1000);
    const timerId = window.setTimeout(() => finishLanePlayback(blockIndex, laneId), playMs);
    timers.add(timerId);
    audio.addEventListener("ended", () => finishLanePlayback(blockIndex, laneId), { once: true });
    void audio.play().catch((error) => {
      console.error("audio preview failed", error);
      finishLanePlayback(blockIndex, laneId);
    });
  };

  const playArmedTakeAudio = (blockIndex: number, laneId: LaneId) => {
    const take = findTake(blockIndex, laneId);
    if (!take) return;
    const audio = new Audio(take.objectUrl);
    audio.currentTime = take.trimStartSec;
    audio.addEventListener("timeupdate", () => {
      if (audio.currentTime >= take.trimEndSec) {
        audio.currentTime = take.trimStartSec;
        void audio.play();
      }
    });
    audioPlayers.set(`${take.takeId}_armed`, audio);
    void audio.play().catch((error) => console.error("armed audio playback failed", error));
  };

  const handlePlayLane = (blockIndex: number, laneId: LaneId) => {
    setActiveBlockIndex(blockIndex);
    const nextPlaying = !blocks[blockIndex].lanes[laneId].playing;
    const take = findTake(blockIndex, laneId);
    if (nextPlaying && !take) return;
    setWaveformSelection(nextPlaying && take ? toWaveformSelection(blockIndex, laneId, take) : null);
    setBlocks((block) => block.map((item, index) => ({
      ...item,
      lanes: {
        top: { ...item.lanes.top, playing: index === blockIndex && laneId === "top" ? nextPlaying : false },
        bottom: { ...item.lanes.bottom, playing: index === blockIndex && laneId === "bottom" ? nextPlaying : false }
      }
    })));
    if (nextPlaying) {
      startBeatClock(blockIndex);
      playTakeAudio(blockIndex, laneId, take!);
    } else {
      void stopAll();
    }
  };

  const handleRec = (blockIndex: number, laneId: LaneId) => {
    if (state.countIn.status === "recording") {
      void stopAll();
      return;
    }
    if (state.countIn.status !== "idle") return;

    setActiveBlockIndex(blockIndex);
    setWaveformSelection(null);
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
      void audioRecorder.startRecording().then(() => {
        setState("countIn", "status", "recording");
        setActiveRecording({ blockIndex, laneId });
        setBlocks(blockIndex, "lanes", laneId, "recording", true);
        setState("controlBar", { playing: true, stopped: false, beatLamp: 1 });
        startRecordingBeatClock(blockIndex);

        const armedLane = blocks[blockIndex].overdubTarget;
        if (armedLane) {
          setBlocks(blockIndex, "lanes", armedLane, "playing", true);
          playArmedTakeAudio(blockIndex, armedLane);
        }
      }).catch((error) => {
        console.error("recording start failed", error);
        void stopAll();
      });
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

  const handleBpmChange = (bpm: number) => {
    const wasPlaying = state.controlBar.playing && state.countIn.status === "idle";
    setState("bpm", bpm);
    if (state.countIn.status !== "idle") {
      void stopAll();
      return;
    }
    if (wasPlaying) {
      startSequenceBeatClock();
    }
  };

  const handleKeyChange = (keyName: string) => {
    const keySignature = keySignatureDisplayMap[keyName] ?? keySignatureDisplayMap.C;
    setState("key", keyName);
    setState("keySignature", keySignature);
    setState("availableNotes", "notes", noteAccidentalMap[keyName] ?? noteAccidentalMap.C);
  };

  const createEmptyCodeBlock = (baseBlock: RecorderBlockState, index: number): RecorderBlockState => {
    const nextNumber = index + 1;
    const block = structuredClone(unwrap(baseBlock));
    block.blockId = `codeblock_${String(nextNumber).padStart(3, "0")}`;
    block.label = `A${nextNumber}`;
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
    return block;
  };

  const handleAddCodeBlock = () => {
    const nextIndex = blocks.length;
    setBlocks((items) => [...items, createEmptyCodeBlock(items[0], nextIndex)]);
    setActiveBlockIndex(nextIndex);
    requestAnimationFrame(() => {
      if (!codeBlockStackRef) return;
      codeBlockStackRef.scrollTop = codeBlockStackRef.scrollHeight;
    });
  };

  const updateTrimStart = (value: number) => {
    const selection = waveformSelection();
    if (!selection) return;
    const nextSelection = { ...selection, start: Math.min(value, selection.end - 5) };
    setWaveformSelection(nextSelection);
    updateTakeTrim(nextSelection);
  };

  const updateTrimEnd = (value: number) => {
    const selection = waveformSelection();
    if (!selection) return;
    const nextSelection = { ...selection, end: Math.max(value, selection.start + 5) };
    setWaveformSelection(nextSelection);
    updateTakeTrim(nextSelection);
  };

  const autoTrimSilence = async () => {
    const selection = waveformSelection();
    if (!selection) return;
    const take = findTake(selection.blockIndex, selection.laneId, selection.takeId);
    if (!take) return;
    try {
      const audioBuffer = await decodeAudioBlob(take.blob);
      const trim = detectSilenceTrimPercent(audioBuffer);
      const nextSelection = { ...selection, start: Math.min(trim.start, trim.end - 5), end: Math.max(trim.end, trim.start + 5) };
      setWaveformSelection(nextSelection);
      updateTakeTrim(nextSelection);
    } catch (error) {
      console.error("auto trim failed", error);
    }
  };

  const deleteSelectedTake = () => {
    const selection = waveformSelection();
    if (!selection) return;
    const take = findTake(selection.blockIndex, selection.laneId, selection.takeId);
    if (take) {
      URL.revokeObjectURL(take.objectUrl);
    }
    const takes = blocks[selection.blockIndex].lanes[selection.laneId].takes.filter((item) => item.takeId !== selection.takeId);
    setBlocks(selection.blockIndex, "lanes", selection.laneId, "takes", takes);
    setBlocks(selection.blockIndex, "lanes", selection.laneId, "playing", false);
    setWaveformSelection(null);
  };

  return (
    <main class="min-h-screen bg-slate-100 text-slate-950">
      <div class="mx-auto flex min-h-screen w-full max-w-[520px] items-start justify-center px-3 py-5">
        <section class="phone-shell relative flex h-[calc(100vh-40px)] min-h-[720px] w-full max-w-[420px] flex-col overflow-hidden bg-white">
          <HeaderSongBar
            title={state.title}
            bpm={state.bpm}
            keyName={state.key}
            onBack={props.onBack}
            onBpmChange={handleBpmChange}
            onKeyChange={handleKeyChange}
          />
          <BpmLampControlBar
            repeat={state.controlBar.repeat}
            currentBeat={state.controlBar.beatLamp}
            beatCount={4}
            playing={state.controlBar.playing}
            onToggleRepeat={() => setState("controlBar", "repeat", !state.controlBar.repeat)}
            onAllPlay={handleAllPlay}
            onStop={() => void stopAll()}
          />
          <KeySignatureBar
            keyName={state.key}
            clef={state.keySignature.clef}
            accidentals={state.keySignature.accidentals}
            display={state.keySignature.display}
            notes={scoreNotes()}
          />
          <div ref={codeBlockStackRef} class="codeblock-stack">
            <For each={blocks}>
              {(block, index) => (
                <CodeBlockRecorder
                  blockId={block.blockId}
                  label={block.label}
                  chords={block.chords}
                  activeChord={block.activeChord}
                  lanes={block.lanes}
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
          <ActiveStateFooter
            screen={state.screen}
            label={activeBlock().label}
            activeLane={activeBlock().overdubTarget}
            status={state.countIn.status}
            beat={state.countIn.currentBeat || state.controlBar.beatLamp}
            onSave={() => console.info("mock save", unwrap(state))}
          />
          <CountInOverlay
            status={state.countIn.status}
            currentBeat={state.countIn.currentBeat}
            beats={state.countIn.beats}
          />
          {waveformSelection() && (
            <div class="wave-editor-overlay">
              <WaveformEditPanel
                selection={waveformSelection()!}
                onPreview={() => handlePlayLane(waveformSelection()!.blockIndex, waveformSelection()!.laneId)}
                onTrimStartChange={updateTrimStart}
                onTrimEndChange={updateTrimEnd}
                onAutoTrimSilence={() => void autoTrimSilence()}
                onDelete={deleteSelectedTake}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
