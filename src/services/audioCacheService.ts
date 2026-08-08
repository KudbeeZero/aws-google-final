// audioCacheService.ts - LocalStorage Audio Caching & Fallback Speech Service

const AUDIO_CACHE_PREFIX = "aws_clf_c02_audio_cache_v1_";
const MAX_CACHE_ITEMS = 50;

export async function getCachedAudio(text: string, voiceId: string): Promise<string | null> {
  try {
    const key = `${AUDIO_CACHE_PREFIX}_${voiceId}_${btoa(encodeURIComponent(text.slice(0, 50)))}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const data = JSON.parse(cached);
      if (data && data.audioBase64) {
        return data.audioBase64;
      }
    }
  } catch (err) {
    console.warn("Error reading audio cache:", err);
  }
  return null;
}

export async function saveAudioToCache(text: string, voiceId: string, audioBase64: string): Promise<void> {
  try {
    const key = `${AUDIO_CACHE_PREFIX}_${voiceId}_${btoa(encodeURIComponent(text.slice(0, 50)))}`;
    localStorage.setItem(key, JSON.stringify({
      audioBase64,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn("Error saving audio cache (storage full?):", err);
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
  // Preload placeholder or no-op
}

export async function getCacheStats(): Promise<{ count: number; sizeBytes: number }> {
  let count = 0;
  let sizeBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUDIO_CACHE_PREFIX)) {
        count++;
        const val = localStorage.getItem(key);
        if (val) sizeBytes += val.length;
      }
    }
  } catch (err) {
    console.warn("Error getting cache stats:", err);
  }
  return { count, sizeBytes };
}

export async function clearAudioCache(): Promise<void> {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUDIO_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.warn("Error clearing audio cache:", err);
  }
}
