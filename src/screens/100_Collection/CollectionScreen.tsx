import { For, Show, createSignal } from "solid-js";
import { musicMoods, musicProgressions, soundDatabase } from "../../data/bgmRecorder/musicDictionary";

type CollectionTab = "sound" | "progression" | "mood";

type CollectionScreenProps = {
  onBack: () => void;
};

export function CollectionScreen(props: CollectionScreenProps) {
  const [tab, setTab] = createSignal<CollectionTab>("sound");

  return (
    <main class="min-h-screen bg-black text-white">
      <div class="mx-auto flex min-h-screen w-full max-w-[520px] items-start justify-center px-3 py-5">
        <section class="collection-shell h-[calc(100vh-40px)] min-h-[720px] w-full max-w-[420px]">
          <header class="collection-header">
            <button type="button" class="collection-back-button" onClick={props.onBack} aria-label="戻る">
              ‹
            </button>
            <div>
              <p>Collection DB</p>
              <h1>辞書と録音DB</h1>
            </div>
          </header>

          <div class="collection-tabs" role="tablist" aria-label="Collection DB切替">
            <button type="button" classList={{ active: tab() === "sound" }} onClick={() => setTab("sound")}>
              SoundDB
            </button>
            <button type="button" classList={{ active: tab() === "progression" }} onClick={() => setTab("progression")}>
              コード進行
            </button>
            <button type="button" classList={{ active: tab() === "mood" }} onClick={() => setTab("mood")}>
              雰囲気
            </button>
          </div>

          <div class="collection-body">
            <Show when={tab() === "sound"}>
              <section class="db-panel">
                <div class="db-panel-title">
                  <strong>{soundDatabase.databaseId}</strong>
                  <span>{soundDatabase.storagePlan.phase1} → {soundDatabase.storagePlan.phase2}</span>
                </div>
                <p>{soundDatabase.description}</p>
                <For each={soundDatabase.soundTypes}>
                  {(item) => (
                    <article class="db-row">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </article>
                  )}
                </For>
                <article class="db-row">
                  <strong>現在の録音Take</strong>
                  <span>{soundDatabase.takes.length}件 / 実録音実装後にここへ集約</span>
                </article>
              </section>
            </Show>

            <Show when={tab() === "progression"}>
              <section class="db-list">
                <For each={musicProgressions}>
                  {(progression) => (
                    <article class="progression-db-card">
                      <div class="progression-db-cover" style={{ "--cover-a": progression.colorA, "--cover-b": progression.colorB }} />
                      <div>
                        <strong>{progression.title}</strong>
                        <span>Key:{progression.key} / BPM:{progression.bpm}</span>
                        <span>{progression.chords.join(" - ")}</span>
                        <small>{progression.moodTags.join(" / ")}</small>
                      </div>
                    </article>
                  )}
                </For>
              </section>
            </Show>

            <Show when={tab() === "mood"}>
              <section class="mood-db-grid">
                <For each={musicMoods}>
                  {(mood) => (
                    <article class="mood-db-card">
                      <strong>{mood.label}</strong>
                      <span>Energy {mood.energy}</span>
                      <p>{mood.sceneUse}</p>
                    </article>
                  )}
                </For>
              </section>
            </Show>
          </div>
        </section>
      </div>
    </main>
  );
}
