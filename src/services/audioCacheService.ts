// audioCacheService.ts - IndexedDB Audio Caching & Fallback Speech Service

const DB_NAME = "AWSExamAudioCacheDB";
const STORE_NAME = "audioStore";
const DB_VERSION = 1;
const FALLBACK_PREFIX = "aws_clf_c02_audio_cache_v1_";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error("IndexedDB not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
}

function getCacheKey(text: string, voiceId: string): string {
  try {
    return `${voiceId}_${btoa(encodeURIComponent(text.slice(0, 60)))}`;
  } catch {
    return `${voiceId}_${text.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "_")}`;
  }
}

export async function getCachedAudio(text: string, voiceId: string): Promise<string | null> {
  const cacheKey = getCacheKey(text, voiceId);
  try {
    const db = await openDB();
    return await new Promise<string | null>((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(cacheKey);
      req.onsuccess = () => {
        const record = req.result;
        if (record && record.audioBase64) {
          resolve(record.audioBase64);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    // Fallback to localStorage
    try {
      const lsKey = `${FALLBACK_PREFIX}_${cacheKey}`;
      const cached = localStorage.getItem(lsKey);
      if (cached) {
        const data = JSON.parse(cached);
        if (data && data.audioBase64) return data.audioBase64;
      }
    } catch (err) {
      console.warn("Fallback localStorage audio read error:", err);
    }
    return null;
  }
}

export async function saveAudioToCache(text: string, voiceId: string, audioBase64: string): Promise<void> {
  const cacheKey = getCacheKey(text, voiceId);
  const record = { key: cacheKey, audioBase64, timestamp: Date.now() };
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      const lsKey = `${FALLBACK_PREFIX}_${cacheKey}`;
      localStorage.setItem(lsKey, JSON.stringify(record));
    } catch (err) {
      console.warn("Fallback localStorage audio save error (quota exceeded?):", err);
    }
  }
}

export async function synthesizeFallbackSpeechAudio(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

export async function preloadCommonAWSDefinitions(): Promise<void> {
  // Preload common terms or no-op
}

export async function getCacheStats(): Promise<{ count: number; sizeBytes: number }> {
  let count = 0;
  let sizeBytes = 0;
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          count++;
          if (cursor.value && cursor.value.audioBase64) {
            sizeBytes += cursor.value.audioBase64.length;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch {
    // Fallback to localStorage stats
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
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback clear localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(FALLBACK_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (err) {
      console.warn("Error clearing localStorage audio cache:", err);
    }
  }
}

