import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import * as FS from 'expo-file-system/legacy';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const TTS_URL = 'https://api.openai.com/v1/audio/speech';

function audioDir(): string {
  if (!FS.documentDirectory) {
    throw new Error('No writable document directory on this platform');
  }
  return `${FS.documentDirectory}audio/`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:...;base64," prefix — writeAsStringAsync wants raw base64.
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

async function ensureAudioFile(conceptId: string, text: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  if (!text?.trim()) throw new Error('No audio text for this concept');

  const dir = audioDir();
  const safeId = conceptId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${dir}${safeId}.mp3`;

  const info = await FS.getInfoAsync(filePath);
  if (info.exists && !info.isDirectory && (info.size ?? 0) > 0) {
    return filePath;
  }

  await FS.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});

  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      response_format: 'mp3',
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`TTS request failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const blob = await res.blob();
  const b64 = await blobToBase64(blob);
  await FS.writeAsStringAsync(filePath, b64, { encoding: FS.EncodingType.Base64 });
  return filePath;
}

export interface ConceptAudioState {
  isLoading: boolean;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  rate: number;
  error: string | null;
  toggle: () => void;
  seek: (positionMs: number) => void;
  setRate: (rate: number) => void;
  retry: () => void;
}

export function useConceptAudio(conceptId: string, audioText: string): ConceptAudioState {
  const [isLoading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPosition] = useState(0);
  const [durationMs, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  // Token used to discard async work after unmount or retry.
  const tokenRef = useRef(0);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  const teardown = useCallback(async () => {
    const s = soundRef.current;
    soundRef.current = null;
    if (s) {
      try { await s.stopAsync(); } catch {}
      try { await s.unloadAsync(); } catch {}
    }
  }, []);

  const load = useCallback(async () => {
    const myToken = ++tokenRef.current;
    setError(null);
    setLoading(true);
    setPosition(0);
    setDuration(0);
    setIsPlaying(false);

    await teardown();

    try {
      const uri = await ensureAudioFile(conceptId, audioText);
      if (tokenRef.current !== myToken) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: rateRef.current, shouldCorrectPitch: true }
      );
      if (tokenRef.current !== myToken) {
        try { await sound.unloadAsync(); } catch {}
        return;
      }
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (tokenRef.current !== myToken) return;
        if (!status.isLoaded) return;
        setIsPlaying(status.isPlaying);
        setPosition(status.positionMillis ?? 0);
        if (status.durationMillis && status.durationMillis > 0) {
          setDuration(status.durationMillis);
        }
        if (status.didJustFinish) {
          // Reset to start, paused — caller can press play again.
          sound.setPositionAsync(0).catch(() => {});
          sound.pauseAsync().catch(() => {});
        }
      });

      setLoading(false);
    } catch (err) {
      if (tokenRef.current !== myToken) return;
      console.warn('Concept audio failed to load', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [conceptId, audioText, teardown]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    load();
    return () => {
      tokenRef.current++;
      teardown();
    };
  }, [load, teardown]);

  const toggle = useCallback(async () => {
    const s = soundRef.current;
    if (!s) return;
    const status = await s.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await s.pauseAsync().catch(() => {});
    } else {
      await s.playAsync().catch(() => {});
    }
  }, []);

  const seek = useCallback(async (ms: number) => {
    const s = soundRef.current;
    if (!s) return;
    await s.setPositionAsync(Math.max(0, ms)).catch(() => {});
  }, []);

  const setRate = useCallback(async (newRate: number) => {
    setRateState(newRate);
    rateRef.current = newRate;
    const s = soundRef.current;
    if (!s) return;
    await s.setRateAsync(newRate, true).catch(() => {});
  }, []);

  return {
    isLoading,
    isPlaying,
    positionMs,
    durationMs,
    rate,
    error,
    toggle,
    seek,
    setRate,
    retry: load,
  };
}
