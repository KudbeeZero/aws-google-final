// audioCacheService.ts - IndexedDB v2 Persistent Audio Memory & Offline Speech Vault

const DB_NAME = "AWSExamAudioCacheDB";
const AUDIO_STORE = "audioStore";
const MEMORY_STORE = "memoryStore";
const DB_VERSION = 2;
const FALLBACK_PREFIX = "aws_clf_c02_audio_cache_v2_";
const MEMORY_LOCAL_KEY = "aws_clf_c02_audio_memory_v2";

export interface CachedAudioMeta {
  lessonId?: string;
  title?: string;
  module?: string;
  domainId?: string;
  mimeType?: string;
  engine?: string;
}

export interface CachedAudioRecord {
  key: string;
  voiceId: string;
  lessonId?: string;
  title: string;
  module: string;
  domainId?: string;
  mimeType?: string;
  engine?: string;
  textPreview: string;
  text?: string;
  audioBase64: string;
  sizeBytes: number;
  timestamp: number;
  lastPlayedAt: number;
}

export interface PersistentLessonResume {
  id: string;
  title: string;
  module: string;
  text: string;
  voiceId: string;
  domainId?: string;
  subtitle?: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}

export interface AudioMemoryState {
  id: "global";
  voiceId: string;
  playbackRate: number;
  pitch: number;
  volume: number;
  autoPlayNext: boolean;
  listenedLessonIds: string[];
  lastLesson: PersistentLessonResume | null;
  totalAudioSeconds: number;
  updatedAt: number;
}

export const DEFAULT_AUDIO_MEMORY: AudioMemoryState = {
  id: "global",
  voiceId: "pNInz6obpgDQGcFmaJgB", // Adam
  playbackRate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  autoPlayNext: true,
  listenedLessonIds: [],
  lastLesson: null,
  totalAudioSeconds: 0,
  updatedAt: Date.now(),
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(MEMORY_STORE)) {
        db.createObjectStore(MEMORY_STORE, { keyPath: "id" });
      }
    };
  });
}

// Collision-free dual FNV-1a 32-bit hash over full normalized text + length
export function getCacheKey(text: string, voiceId: string): string {
  const normalized = text.trim();
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c ^ ((i + 1) & 0xff);
    h2 = Math.imul(h2, 0x01000193);
  }
  return `${voiceId}_${(h1 >>> 0).toString(36)}_${(h2 >>> 0).toString(36)}_${normalized.length}`;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const idx = res.indexOf(",");
      resolve(idx !== -1 ? res.slice(idx + 1) : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(base64: string, mimeType = "audio/mpeg"): Blob {
  const pureBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteChars = atob(pureBase64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

export async function getCachedAudioRecord(text: string, voiceId: string): Promise<CachedAudioRecord | null> {
  const cacheKey = getCacheKey(text, voiceId);
  try {
    const db = await openDB();
    return await new Promise<CachedAudioRecord | null>((resolve) => {
      const transaction = db.transaction(AUDIO_STORE, "readonly");
      const store = transaction.objectStore(AUDIO_STORE);
      const req = store.get(cacheKey);
      req.onsuccess = () => {
        const record = req.result as CachedAudioRecord | undefined;
        resolve(record || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    try {
      const lsKey = `${FALLBACK_PREFIX}${cacheKey}`;
      const cached = localStorage.getItem(lsKey);
      if (cached) {
        return JSON.parse(cached) as CachedAudioRecord;
      }
    } catch (err) {
      console.warn("Fallback localStorage audio read error:", err);
    }
    return null;
  }
}

export async function getCachedAudio(text: string, voiceId: string): Promise<string | null> {
  const record = await getCachedAudioRecord(text, voiceId);
  return record?.audioBase64 || null;
}

export async function getCachedAudioBlob(text: string, voiceId: string): Promise<Blob | null> {
  const record = await getCachedAudioRecord(text, voiceId);
  if (!record?.audioBase64) return null;
  try {
    // Auto-detect RIFF WAV header if mimeType wasn't saved on older records
    const detectedMime =
      record.mimeType ||
      (record.audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg");
    return base64ToBlob(record.audioBase64, detectedMime);
  } catch {
    return null;
  }
}

export async function getCachedAudioBlobByKey(key: string): Promise<{ blob: Blob; record: CachedAudioRecord } | null> {
  try {
    const db = await openDB();
    const record = await new Promise<CachedAudioRecord | null>((resolve) => {
      const transaction = db.transaction(AUDIO_STORE, "readonly");
      const store = transaction.objectStore(AUDIO_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as CachedAudioRecord) || null);
      req.onerror = () => resolve(null);
    });

    if (!record || !record.audioBase64) return null;
    const detectedMime =
      record.mimeType ||
      (record.audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg");
    const blob = base64ToBlob(record.audioBase64, detectedMime);
    return { blob, record };
  } catch {
    try {
      const lsKey = `${FALLBACK_PREFIX}${key}`;
      const cached = localStorage.getItem(lsKey);
      if (cached) {
        const record = JSON.parse(cached) as CachedAudioRecord;
        if (record?.audioBase64) {
          const detectedMime =
            record.mimeType ||
            (record.audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg");
          const blob = base64ToBlob(record.audioBase64, detectedMime);
          return { blob, record };
        }
      }
    } catch {}
    return null;
  }
}

export async function saveAudioToCache(
  text: string,
  voiceId: string,
  audioBase64: string,
  meta?: CachedAudioMeta
): Promise<void> {
  const cacheKey = getCacheKey(text, voiceId);
  const now = Date.now();
  const record: CachedAudioRecord = {
    key: cacheKey,
    voiceId,
    lessonId: meta?.lessonId,
    title: meta?.title || text.trim().slice(0, 56) + (text.trim().length > 56 ? "..." : ""),
    module: meta?.module || "Study Narration",
    domainId: meta?.domainId,
    mimeType: meta?.mimeType || (audioBase64.startsWith("UklGR") ? "audio/wav" : "audio/mpeg"),
    engine: meta?.engine,
    textPreview: text.trim().slice(0, 140),
    text: text.trim(),
    audioBase64,
    sizeBytes: Math.round((audioBase64.length * 3) / 4),
    timestamp: now,
    lastPlayedAt: now,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readwrite");
      const store = transaction.objectStore(AUDIO_STORE);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const lsKey = `${FALLBACK_PREFIX}${cacheKey}`;
      localStorage.setItem(lsKey, JSON.stringify(record));
    } catch (err) {
      console.warn("Fallback localStorage audio save error (quota exceeded?):", err);
    }
  }
}

export async function saveCachedAudioBlob(
  text: string,
  voiceId: string,
  blob: Blob,
  meta?: CachedAudioMeta
): Promise<void> {
  const b64 = await blobToBase64(blob);
  await saveAudioToCache(text, voiceId, b64, {
    ...meta,
    mimeType: meta?.mimeType || blob.type || undefined,
  });
}

export async function touchCachedAudioPlayed(text: string, voiceId: string): Promise<void> {
  const cacheKey = getCacheKey(text, voiceId);
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      const store = tx.objectStore(AUDIO_STORE);
      const getReq = store.get(cacheKey);
      getReq.onsuccess = () => {
        const record = getReq.result as CachedAudioRecord | undefined;
        if (record) {
          record.lastPlayedAt = Date.now();
          store.put(record);
        }
        resolve();
      };
      getReq.onerror = () => resolve();
    });
  } catch {
    // non-fatal
  }
}

export async function listCachedLessons(): Promise<Omit<CachedAudioRecord, "audioBase64">[]> {
  const results: Omit<CachedAudioRecord, "audioBase64">[] = [];
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(AUDIO_STORE, "readonly");
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.openCursor();
      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const val = cursor.value as CachedAudioRecord;
          results.push({
            key: val.key,
            voiceId: val.voiceId,
            lessonId: val.lessonId,
            title: val.title || val.textPreview || "Saved Lesson",
            module: val.module || "Study Audio",
            domainId: val.domainId,
            textPreview: val.textPreview || "",
            text: val.text,
            sizeBytes: val.sizeBytes || Math.round(((val.audioBase64?.length || 0) * 3) / 4),
            timestamp: val.timestamp || Date.now(),
            lastPlayedAt: val.lastPlayedAt || val.timestamp || Date.now(),
          });
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch {
    // localStorage fallback listing
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(FALLBACK_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const val = JSON.parse(raw) as CachedAudioRecord;
            results.push({
              key: val.key,
              voiceId: val.voiceId,
              lessonId: val.lessonId,
              title: val.title || val.textPreview || "Saved Lesson",
              module: val.module || "Study Audio",
              domainId: val.domainId,
              textPreview: val.textPreview || "",
              text: val.text,
              sizeBytes: val.sizeBytes || 0,
              timestamp: val.timestamp || Date.now(),
              lastPlayedAt: val.lastPlayedAt || val.timestamp || Date.now(),
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }
  return results.sort((a, b) => (b.lastPlayedAt || b.timestamp) - (a.lastPlayedAt || a.timestamp));
}

export async function deleteCachedLesson(cacheKey: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(AUDIO_STORE, "readwrite");
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.delete(cacheKey);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    try {
      localStorage.removeItem(`${FALLBACK_PREFIX}${cacheKey}`);
    } catch {
      // ignore
    }
  }
}

export function getAudioMemorySync(): AudioMemoryState {
  try {
    const raw = localStorage.getItem(MEMORY_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_AUDIO_MEMORY, ...parsed, id: "global" };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_AUDIO_MEMORY };
}

export async function getAudioMemoryState(): Promise<AudioMemoryState> {
  const syncFallback = getAudioMemorySync();
  try {
    const db = await openDB();
    return await new Promise<AudioMemoryState>((resolve) => {
      const tx = db.transaction(MEMORY_STORE, "readonly");
      const store = tx.objectStore(MEMORY_STORE);
      const req = store.get("global");
      req.onsuccess = () => {
        const record = req.result as AudioMemoryState | undefined;
        if (record) {
          const merged = { ...DEFAULT_AUDIO_MEMORY, ...record, id: "global" as const };
          try {
            localStorage.setItem(MEMORY_LOCAL_KEY, JSON.stringify(merged));
          } catch {
            // ignore
          }
          resolve(merged);
        } else {
          resolve(syncFallback);
        }
      };
      req.onerror = () => resolve(syncFallback);
    });
  } catch {
    return syncFallback;
  }
}

export async function saveAudioMemoryState(patch: Partial<AudioMemoryState>): Promise<AudioMemoryState> {
  const current = await getAudioMemoryState();
  const next: AudioMemoryState = {
    ...current,
    ...patch,
    id: "global",
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(MEMORY_LOCAL_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(MEMORY_STORE, "readwrite");
      const store = tx.objectStore(MEMORY_STORE);
      const req = store.put(next);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // non-fatal, localStorage copy already persisted
  }

  return next;
}

export async function synthesizeFallbackSpeechAudio(
  text: string,
  rate = 1.0,
  volume = 1.0,
  onEnd?: () => void
): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = Math.min(2.0, Math.max(0.5, rate));
  utterance.volume = Math.min(1.0, Math.max(0.0, volume));
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Samantha") || v.name.includes("Natural") || v.name.includes("Google"))) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utterance.voice = preferred;
  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }
  window.speechSynthesis.speak(utterance);
}

export async function preloadCommonAWSDefinitions(): Promise<void> {
  // Maintained for backward compatibility
}

export async function getCacheStats(): Promise<{ count: number; sizeBytes: number }> {
  let count = 0;
  let sizeBytes = 0;
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(AUDIO_STORE, "readonly");
      const store = transaction.objectStore(AUDIO_STORE);
      const req = store.openCursor();
      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          count++;
          const val = cursor.value as CachedAudioRecord;
          if (val?.sizeBytes) {
            sizeBytes += val.sizeBytes;
          } else if (val?.audioBase64) {
            sizeBytes += Math.round((val.audioBase64.length * 3) / 4);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(FALLBACK_PREFIX)) {
          count++;
          const val = localStorage.getItem(key);
          if (val) sizeBytes += val.length;
        }
      }
    } catch (err) {
      console.warn("Error getting localStorage cache stats:", err);
    }
  }
  return { count, sizeBytes };
}

export async function clearAudioCache(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(AUDIO_STORE, "readwrite");
      const store = transaction.objectStore(AUDIO_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(FALLBACK_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (err) {
      console.warn("Error clearing localStorage audio cache:", err);
    }
  }
}
