type TitleScreenProps = {
  onStart: () => void;
};

export function TitleScreen(props: TitleScreenProps) {
  return (
    <main class="min-h-screen bg-white text-slate-950">
      <div class="mx-auto flex min-h-screen w-full max-w-[520px] items-start justify-center px-3 py-5">
        <section class="title-shell h-[calc(100vh-40px)] min-h-[720px] w-full max-w-[420px]">
          <div class="title-logo-wrap">
            <img src="/icon_512x512.png" alt="弐音" class="title-logo" />
          </div>
          <div class="title-content">
            <button type="button" onClick={props.onStart}>
              はじまり
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
