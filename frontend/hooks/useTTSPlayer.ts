import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

const OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const TTS_URL = 'https://api.openai.com/v1/audio/speech';

async function fetchSpeechDataUri(text: string, signal: AbortSignal): Promise<string> {
  if (!OPENAI_KEY) throw new Error('Missing EXPO_PUBLIC_OPENAI_API_KEY');
  const res = await fetch(TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'nova',
      input: text,
      response_format: 'mp3',
    }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`TTS request failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      const result = reader.result as string;
      // FileReader stamps the blob mime; force audio/mpeg so the player picks the mp3 decoder.
      resolve(result.replace(/^data:[^;]+/, 'data:audio/mpeg'));
    };
    reader.readAsDataURL(blob);
  });
}

export interface TTSPlayer {
  activeId: string | null;
  loadingId: string | null;
  toggle: (id: string, text: string) => void;
  stop: () => void;
}

export function useTTSPlayer(): TTSPlayer {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const soundRef = useRef<Audio.Sound | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Monotonic request id — lets us discard stale fetch results when the user moves on.
  const reqRef = useRef(0);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
  }, []);

  const stop = useCallback(async () => {
    reqRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    const s = soundRef.current;
    soundRef.current = null;
    setActiveId(null);
    setLoadingId(null);
    if (s) {
      try { await s.stopAsync(); } catch {}
      try { await s.unloadAsync(); } catch {}
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const toggle = useCallback(
    async (id: string, text: string) => {
      // Tap the same card again — stop whatever it's doing.
      if (activeId === id || loadingId === id) {
        await stop();
        return;
      }
      await stop();
      if (!text?.trim()) return;

      const myReq = ++reqRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      setLoadingId(id);

      try {
        const uri = await fetchSpeechDataUri(text, controller.signal);
        if (reqRef.current !== myReq) return;

        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        if (reqRef.current !== myReq) {
          // Superseded while loading the player — clean up.
          try { await sound.unloadAsync(); } catch {}
          return;
        }

        soundRef.current = sound;
        setLoadingId(null);
        setActiveId(id);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            stop();
          }
        });
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        console.warn('TTS playback failed', err);
        if (reqRef.current === myReq) {
          setLoadingId(null);
          setActiveId(null);
        }
      }
    },
    [activeId, loadingId, stop]
  );

  return { activeId, loadingId, toggle, stop };
}
