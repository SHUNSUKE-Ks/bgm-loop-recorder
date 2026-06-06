type KeySignatureBarProps = {
  keyName: string;
  clef: "treble";
  accidentals: string[];
  display: string;
  notes: string[];
};

export function KeySignatureBar(props: KeySignatureBarProps) {
  const notePositions = [
    { left: "2%", top: "44px" },
    { left: "16%", top: "34px" },
    { left: "30%", top: "24px" },
    { left: "44%", top: "14px" },
    { left: "58%", top: "34px" },
    { left: "72%", top: "24px" },
    { left: "86%", top: "14px" }
  ];
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
      <div class="score-note-staff">
        {props.notes.map((note, index) => (
          <span class="score-note" style={notePositions[index % notePositions.length]}>
            {note}
          </span>
        ))}
      </div>
    </section>
  );
}
