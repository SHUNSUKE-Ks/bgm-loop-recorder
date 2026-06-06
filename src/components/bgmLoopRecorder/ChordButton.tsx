type ChordButtonProps = {
  chord: string;
  active: boolean;
  index: number;
};

export function ChordButton(props: ChordButtonProps) {
  return (
    <button
      type="button"
      class="chord-button"
      classList={{ active: props.active }}
      aria-label={`${props.index + 1}番目のコード ${props.chord}`}
    >
      {props.chord}
    </button>
  );
}
