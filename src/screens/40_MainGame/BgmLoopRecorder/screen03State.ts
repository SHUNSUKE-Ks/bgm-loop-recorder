import initialData from "../../../data/bgm/data_bgm_church_001.json";
import type { Screen03State } from "./screen03Types";

export const initialScreen03State = initialData as Screen03State;

export const beatDurationMs = (bpm: number) => Math.round(60000 / bpm);

export const nextTakeId = (laneId: "top" | "bottom", count: number) => {
  const serial = String(count + 1).padStart(3, "0");
  return `take_${laneId}_${serial}`;
};
