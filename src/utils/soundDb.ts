import type { AudioTake, LaneId } from "../screens/40_MainGame/BgmLoopRecorder/screen03Types";

const DB_NAME = "nion_sound_db";
const DB_VERSION = 1;
const TAKE_STORE = "takes";

export type PersistedAudioTake = Omit<AudioTake, "objectUrl"> & {
  progressionId: string;
  blockIndex: number;
  blockLabel: string;
  chords: string[];
};

const requestToPromise = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.addEventListener("success", () => resolve(request.result));
  request.addEventListener("error", () => reject(request.error));
});

const openSoundDb = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.addEventListener("upgradeneeded", () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(TAKE_STORE)) {
      const store = db.createObjectStore(TAKE_STORE, { keyPath: "takeId" });
      store.createIndex("progressionId", "progressionId", { unique: false });
    }
  });

  request.addEventListener("success", () => resolve(request.result));
  request.addEventListener("error", () => reject(request.error));
});

const transactionDone = (transaction: IDBTransaction) => new Promise<void>((resolve, reject) => {
  transaction.addEventListener("complete", () => resolve());
  transaction.addEventListener("error", () => reject(transaction.error));
  transaction.addEventListener("abort", () => reject(transaction.error));
});

export const savePersistedTake = async (
  progressionId: string,
  blockIndex: number,
  blockLabel: string,
  chords: string[],
  take: AudioTake
) => {
  const db = await openSoundDb();
  const transaction = db.transaction(TAKE_STORE, "readwrite");
  const store = transaction.objectStore(TAKE_STORE);
  const { objectUrl: _objectUrl, ...takeForStorage } = take;
  const record: PersistedAudioTake = {
    ...takeForStorage,
    progressionId,
    blockIndex,
    blockLabel,
    chords
  };

  store.put(record);
  await transactionDone(transaction);
  db.close();
};

export const loadPersistedTakes = async (progressionId: string) => {
  const db = await openSoundDb();
  const transaction = db.transaction(TAKE_STORE, "readonly");
  const store = transaction.objectStore(TAKE_STORE);
  const index = store.index("progressionId");
  const records = await requestToPromise(index.getAll(progressionId)) as PersistedAudioTake[];
  db.close();
  return records;
};

export const updatePersistedTakeTrim = async (
  takeId: string,
  trimStartSec: number,
  trimEndSec: number
) => {
  const db = await openSoundDb();
  const transaction = db.transaction(TAKE_STORE, "readwrite");
  const store = transaction.objectStore(TAKE_STORE);
  const record = await requestToPromise(store.get(takeId)) as PersistedAudioTake | undefined;

  if (record) {
    store.put({ ...record, trimStartSec, trimEndSec });
  }

  await transactionDone(transaction);
  db.close();
};

export const deletePersistedTake = async (takeId: string) => {
  const db = await openSoundDb();
  const transaction = db.transaction(TAKE_STORE, "readwrite");
  transaction.objectStore(TAKE_STORE).delete(takeId);
  await transactionDone(transaction);
  db.close();
};

export const persistedToAudioTake = (record: PersistedAudioTake): AudioTake => ({
  takeId: record.takeId,
  blockId: record.blockId,
  laneId: record.laneId as LaneId,
  createdAt: record.createdAt,
  blob: record.blob,
  objectUrl: URL.createObjectURL(record.blob),
  durationSec: record.durationSec,
  trimStartSec: record.trimStartSec,
  trimEndSec: record.trimEndSec,
  waveformPeaks: record.waveformPeaks
});
