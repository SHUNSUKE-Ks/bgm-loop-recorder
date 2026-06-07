let sharedAudioContext: AudioContext | undefined;

const getAudioContext = () => {
  sharedAudioContext ??= new AudioContext();
  return sharedAudioContext;
};

export const decodeAudioBlob = async (blob: Blob) => {
  const context = getAudioContext();
  const buffer = await blob.arrayBuffer();
  return context.decodeAudioData(buffer.slice(0));
};

export const getAudioDuration = async (blob: Blob) => {
  try {
    const audioBuffer = await decodeAudioBlob(blob);
    return audioBuffer.duration;
  } catch {
    return new Promise<number>((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      }, { once: true });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        resolve(0);
      }, { once: true });
    });
  }
};
