export const buildWaveformPeaks = (audioBuffer: AudioBuffer, barCount = 72) => {
  const channel = audioBuffer.getChannelData(0);
  const samplesPerBar = Math.max(1, Math.floor(channel.length / barCount));

  return Array.from({ length: barCount }, (_, index) => {
    const start = index * samplesPerBar;
    const end = Math.min(channel.length, start + samplesPerBar);
    let peak = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(channel[sampleIndex]));
    }

    return Math.min(1, peak);
  });
};

export const detectSilenceTrimPercent = (audioBuffer: AudioBuffer, threshold = 0.025, marginSec = 0.04) => {
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const marginSamples = Math.round(sampleRate * marginSec);
  let startSample = 0;
  let endSample = channel.length - 1;

  while (startSample < channel.length && Math.abs(channel[startSample]) < threshold) {
    startSample += 1;
  }

  while (endSample > startSample && Math.abs(channel[endSample]) < threshold) {
    endSample -= 1;
  }

  if (startSample >= endSample) {
    return { start: 0, end: 100 };
  }

  const start = Math.max(0, startSample - marginSamples);
  const end = Math.min(channel.length - 1, endSample + marginSamples);

  return {
    start: Math.round((start / channel.length) * 100),
    end: Math.round((end / channel.length) * 100)
  };
};
