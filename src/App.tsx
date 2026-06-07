import { Match, Switch, createSignal } from "solid-js";
import { ChordSelectScreen, type SongOption } from "./screens/02_ChordSelect/ChordSelectScreen";
import { BgmLoopRecorderScreen } from "./screens/40_MainGame/BgmLoopRecorder/ScreenRoot";
import { TitleScreen } from "./screens/10_Title/TitleScreen";
import { CollectionScreen } from "./screens/100_Collection/CollectionScreen";
import { musicProgressions } from "./data/bgmRecorder/musicDictionary";

export default function App() {
  const songs: SongOption[] = musicProgressions;
  const [screen, setScreen] = createSignal<"title" | "select" | "score" | "collection">("title");
  const [selectedSong, setSelectedSong] = createSignal<SongOption>(songs[0]);

  const openScore = (song: SongOption) => {
    setSelectedSong(song);
    setScreen("score");
  };

  return (
    <Switch>
      <Match when={screen() === "title"}>
        <TitleScreen onStart={() => setScreen("select")} onCollection={() => setScreen("collection")} />
      </Match>
      <Match when={screen() === "select"}>
        <ChordSelectScreen songs={songs} onSelect={openScore} />
      </Match>
      <Match when={screen() === "score"}>
        <BgmLoopRecorderScreen song={selectedSong()} onBack={() => setScreen("select")} />
      </Match>
      <Match when={screen() === "collection"}>
        <CollectionScreen onBack={() => setScreen("title")} />
      </Match>
    </Switch>
  );
}
