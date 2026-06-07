import chordProgressionDb from "./music_chord_progression_db.json";
import moodTabDb from "./music_mood_tab_db.json";
import soundDb from "./sound_db.json";

export type GuitarTabGuide = {
  upper: string;
  lower: string;
  suggestedNotes: string[];
};

export type MusicProgression = {
  id: string;
  title: string;
  scene: string;
  key: string;
  bpm: number;
  chords: string[];
  moodTags: string[];
  sceneTags: string[];
  loopRole: string;
  guitarTab: GuitarTabGuide;
  colorA: string;
  colorB: string;
};

export type MusicMood = {
  id: string;
  label: string;
  sceneUse: string;
  energy: number;
};

export const musicProgressions = chordProgressionDb.progressions as MusicProgression[];
export const musicMoods = moodTabDb.moods as MusicMood[];
export const soundDatabase = soundDb;
