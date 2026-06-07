import { For, createSignal } from "solid-js";

export type SongOption = {
  id: string;
  title: string;
  scene?: string;
  bpm: number;
  key: string;
  chords: string[];
  moodTags?: string[];
  sceneTags?: string[];
  loopRole?: string;
  guitarTab?: {
    upper: string;
    lower: string;
    suggestedNotes: string[];
  };
  colorA: string;
  colorB: string;
};

type ChordSelectScreenProps = {
  songs: SongOption[];
  onSelect: (song: SongOption) => void;
};

type ViewMode = "gallery" | "list";

export function ChordSelectScreen(props: ChordSelectScreenProps) {
  const [viewMode, setViewMode] = createSignal<ViewMode>("gallery");

  return (
    <main class="min-h-screen bg-black text-white">
      <div class="mx-auto flex min-h-screen w-full max-w-[520px] items-start justify-center px-3 py-5">
        <section class="select-shell h-[calc(100vh-40px)] min-h-[720px] w-full max-w-[420px] overflow-hidden">
          <header class="select-header">
            <div>
              <p>Chord Progression</p>
              <h1>コード進行選択</h1>
            </div>
            <div class="view-tabs" role="tablist" aria-label="表示切替">
              <button
                type="button"
                classList={{ active: viewMode() === "gallery" }}
                onClick={() => setViewMode("gallery")}
              >
                Grid
              </button>
              <button
                type="button"
                classList={{ active: viewMode() === "list" }}
                onClick={() => setViewMode("list")}
              >
                List
              </button>
            </div>
          </header>

          {viewMode() === "gallery" ? (
            <div class="song-gallery">
              <For each={props.songs}>
                {(song) => (
                  <button type="button" class="song-card" onClick={() => props.onSelect(song)}>
                    <span class="song-cover large" style={{ "--cover-a": song.colorA, "--cover-b": song.colorB }} />
                    <strong>{song.title}</strong>
                    <span>{song.key} / {song.chords.join(" - ")}</span>
                    <span>{song.moodTags?.join(" / ")}</span>
                  </button>
                )}
              </For>
            </div>
          ) : (
            <div class="song-list">
              <For each={props.songs}>
                {(song) => (
                  <button type="button" class="song-list-row" onClick={() => props.onSelect(song)}>
                    <span class="song-cover small" style={{ "--cover-a": song.colorA, "--cover-b": song.colorB }} />
                    <span class="song-list-text">
                      <strong>{song.title}</strong>
                      <span>Key:{song.key} / {song.chords.join(" - ")}</span>
                      <span>{song.moodTags?.join(" / ")}</span>
                    </span>
                    <span class="song-menu-dot">⋮</span>
                  </button>
                )}
              </For>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
