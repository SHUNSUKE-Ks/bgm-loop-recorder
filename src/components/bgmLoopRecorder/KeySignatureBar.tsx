type KeySignatureBarProps = {
  keyName: string;
  clef: "treble";
  accidentals: string[];
  display: string;
  notes: string[];
};

export function KeySignatureBar(props: KeySignatureBarProps) {
  const keyAccidentalMap: Record<string, string[]> = {
    C: [],
    G: ["♯"],
    D: ["♯", "♯"],
    A: ["♯", "♯", "♯"],
    E: ["♯", "♯", "♯", "♯"],
    B: ["♯", "♯", "♯", "♯", "♯"],
    F: ["♭"],
    Bb: ["♭", "♭"],
    Eb: ["♭", "♭", "♭"],
    Ab: ["♭", "♭", "♭", "♭"],
    Db: ["♭", "♭", "♭", "♭", "♭"]
  };
  const marks = () => {
    const mapped = keyAccidentalMap[props.keyName] ?? props.accidentals.map((mark) => (mark.includes("b") ? "♭" : "♯"));
    return mapped;
  };

  return (
    <section class="score-band" aria-label={`${props.keyName} ${props.display}`}>
      <div class="score-clef" aria-hidden="true">
        𝄞
      </div>
      <div class="score-accidentals" aria-hidden="true">
        {marks().map((mark) => (
          <span>{mark}</span>
        ))}
      </div>
      <div class="score-note-line">
        {props.notes.map((note) => (
          <span class="score-note">{note}</span>
        ))}
      </div>
    </section>
  );
}
