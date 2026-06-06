import { createSignal } from "solid-js";
import { ChordSelectScreen, type SongOption } from "./screens/02_ChordSelect/ChordSelectScreen";
import { BgmLoopRecorderScreen } from "./screens/40_MainGame/BgmLoopRecorder/ScreenRoot";

export default function App() {
  const songs: SongOption[] = [
    {
      id: "church",
      title: "教会の祈り",
      bpm: 120,
      key: "C",
      chords: ["Dm7", "G", "C", "Am"],
      colorA: "#dbeafe",
      colorB: "#fef3c7"
    },
    {
      id: "rain",
      title: "雨上がりの路地",
      bpm: 92,
      key: "F",
      chords: ["F", "Gm", "C", "Dm"],
      colorA: "#0f172a",
      colorB: "#38bdf8"
    },
    {
      id: "sky",
      title: "空に伸びる光",
      bpm: 138,
      key: "G",
      chords: ["G", "D", "Em", "C"],
      colorA: "#818cf8",
      colorB: "#f0abfc"
    },
    {
      id: "night",
      title: "夜明け前の決意",
      bpm: 112,
      key: "D",
      chords: ["Bm", "G", "D", "A"],
      colorA: "#312e81",
      colorB: "#fb7185"
    }
  ];
  const [screen, setScreen] = createSignal<"select" | "score">("select");
  const [selectedSong, setSelectedSong] = createSignal<SongOption>(songs[0]);

  const openScore = (song: SongOption) => {
    setSelectedSong(song);
    setScreen("score");
  };

  return screen() === "select" ? (
    <ChordSelectScreen songs={songs} onSelect={openScore} />
  ) : (
    <BgmLoopRecorderScreen song={selectedSong()} onBack={() => setScreen("select")} />
  );
}
