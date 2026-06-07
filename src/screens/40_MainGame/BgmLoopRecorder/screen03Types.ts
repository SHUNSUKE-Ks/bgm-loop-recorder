export type LaneId = "top" | "bottom";
export type CountInStatus = "idle" | "counting" | "recording";

export type AudioTake = {
  takeId: string;
  blockId: string;
  laneId: LaneId;
  createdAt: number;
  blob: Blob;
  objectUrl: string;
  durationSec: number;
  trimStartSec: number;
  trimEndSec: number;
  waveformPeaks: number[];
};

export type CountInState = {
  enabled: boolean;
  beats: 4;
  currentBeat: number;
  status: CountInStatus;
};

export type ControlBarState = {
  repeat: boolean;
  beatLamp: number;
  playing: boolean;
  stopped: boolean;
};

export type KeySignatureState = {
  clef: "treble";
  accidentals: string[];
  display: string;
};

export type AvailableNotesState = {
  notes: string[];
  quality: string[];
  symbols: string[];
};

export type RecLaneState = {
  id: LaneId;
  recordEnabled: boolean;
  recording: boolean;
  playing: boolean;
  armedPlayback: boolean;
  takes: AudioTake[];
};

export type RecorderBlockState = {
  blockId: string;
  label: string;
  chords: string[];
  activeChord: number;
  overdubTarget: LaneId | null;
  lanes: Record<LaneId, RecLaneState>;
};

export type Screen03State = {
  file?: string;
  screen: "03_score";
  title: string;
  bpm: number;
  key: string;
  countIn: CountInState;
  controlBar: ControlBarState;
  keySignature: KeySignatureState;
  availableNotes: AvailableNotesState;
  recorderBlock: RecorderBlockState;
};
