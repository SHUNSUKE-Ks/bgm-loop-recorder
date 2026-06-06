type KeySignatureBarProps = {
  keyName: string;
  clef: "treble";
  accidentals: string[];
  display: string;
};

export function KeySignatureBar(props: KeySignatureBarProps) {
  const marks = () => (props.accidentals.length > 0 ? props.accidentals.join("  ") : "natural");

  return (
    <section class="score-band">
      <div class="score-clef" aria-hidden="true">
        𝄞
      </div>
      <div class="flex min-w-0 flex-col justify-center">
        <div class="text-xs font-black uppercase text-slate-400">Key Signature</div>
        <div class="truncate text-xl font-black text-slate-900">
          {props.keyName} / {marks()}
        </div>
        <div class="truncate text-xs font-bold text-slate-500">{props.display}</div>
      </div>
    </section>
  );
}
