export type AudioRecorderResult = {
  blob: Blob;
  mimeType: string;
};

export type AudioRecorderStatus = "idle" | "requesting" | "recording" | "error";

const pickMimeType = () => {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
};

export function createAudioRecorder() {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let chunks: BlobPart[] = [];
  let status: AudioRecorderStatus = "idle";
  let lastError = "";

  const stopStream = () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      lastError = "このブラウザはマイク録音に対応していません。";
      status = "error";
      throw new Error(lastError);
    }
    if (typeof MediaRecorder === "undefined") {
      lastError = "このブラウザはMediaRecorderに対応していません。";
      status = "error";
      throw new Error(lastError);
    }

    stopStream();
    chunks = [];
    status = "requesting";
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickMimeType();
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    });
    recorder.start();
    status = "recording";
  };

  const stopRecording = () => new Promise<AudioRecorderResult | null>((resolve) => {
    if (!recorder || recorder.state === "inactive") {
      stopStream();
      status = "idle";
      resolve(null);
      return;
    }

    const activeRecorder = recorder;
    activeRecorder.addEventListener("stop", () => {
      const mimeType = activeRecorder.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type: mimeType });
      chunks = [];
      recorder = null;
      stopStream();
      status = "idle";
      resolve({ blob, mimeType });
    }, { once: true });
    activeRecorder.stop();
  });

  const cancelRecording = () => {
    chunks = [];
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    recorder = null;
    stopStream();
    status = "idle";
  };

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    status: () => status,
    lastError: () => lastError
  };
}
