type RecordedTakeIconProps = {
  takeId: string;
  durationSec: number;
  armed: boolean;
  muted?: boolean;
  onClick: () => void;
  onLongPress: () => void;
};

export function RecordedTakeIcon(props: RecordedTakeIconProps) {
  let timerId: number | undefined;
  let longPressed = false;

  const clearPress = () => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timerId = undefined;
    }
  };

  const startPress = () => {
    longPressed = false;
    timerId = window.setTimeout(() => {
      longPressed = true;
      props.onLongPress();
    }, 520);
  };

  const finishPress = () => {
    clearPress();
    if (!longPressed) {
      props.onClick();
    }
  };

  return (
    <button
      type="button"
      class="take-icon"
      classList={{ armed: props.armed, muted: props.muted }}
      aria-label={`${props.takeId}を再生`}
      title={`${props.takeId} / 長押しで重ね録り対象を切替`}
      onPointerDown={startPress}
      onPointerUp={finishPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
    >
      {Math.max(1, Math.round(props.durationSec))}
    </button>
  );
}
