import {
  ActivityIndicator,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { getConceptById } from '@/hooks/useConcepts';
import { useConceptAudio } from '@/hooks/useConceptAudio';

const RATES = [0.75, 1, 1.25, 1.5];

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}

export default function ListenScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { id } = useLocalSearchParams<{ id: string }>();
  const concept = getConceptById(id ?? '');
  const audioText = concept?.audio_text ?? '';
  const audio = useConceptAudio(id ?? '', audioText);

  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  trackWidthRef.current = trackWidth;
  const durationRef = useRef(0);
  durationRef.current = audio.durationMs;
  const seekRef = useRef(audio.seek);
  seekRef.current = audio.seek;

  const [scrubMs, setScrubMs] = useState<number | null>(null);
  const scrubRef = useRef<number | null>(null);

  const sentences = useMemo(() => splitSentences(audioText), [audioText]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const w = trackWidthRef.current;
          const d = durationRef.current;
          if (w <= 0 || d <= 0) return;
          const fraction = Math.max(0, Math.min(1, e.nativeEvent.locationX / w));
          const ms = fraction * d;
          scrubRef.current = ms;
          setScrubMs(ms);
        },
        onPanResponderMove: (e) => {
          const w = trackWidthRef.current;
          const d = durationRef.current;
          if (w <= 0 || d <= 0) return;
          const fraction = Math.max(0, Math.min(1, e.nativeEvent.locationX / w));
          const ms = fraction * d;
          scrubRef.current = ms;
          setScrubMs(ms);
        },
        onPanResponderRelease: () => {
          const target = scrubRef.current;
          scrubRef.current = null;
          setScrubMs(null);
          if (target != null) seekRef.current(target);
        },
        onPanResponderTerminate: () => {
          scrubRef.current = null;
          setScrubMs(null);
        },
      }),
    []
  );

  if (!concept) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centeredFull}>
          <Text style={styles.errorText}>Concept not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayedMs = scrubMs ?? audio.positionMs;
  const fraction =
    audio.durationMs > 0 ? Math.max(0, Math.min(1, displayedMs / audio.durationMs)) : 0;

  const activeIdx =
    sentences.length > 0
      ? Math.min(sentences.length - 1, Math.floor(fraction * sentences.length))
      : -1;

  const subTitle = [cap(concept.category), cap(concept.difficulty)].filter(Boolean).join(' · ');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Listen & Learn</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{concept.title}</Text>
        {subTitle ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{subTitle}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.playerArea}>
        {audio.error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.errorText}>Couldn't load audio</Text>
            <Text style={styles.errorSub} numberOfLines={3}>
              {audio.error}
            </Text>
            <TouchableOpacity onPress={audio.retry} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={audio.toggle}
              style={styles.playBtn}
              activeOpacity={0.85}
              disabled={audio.isLoading}
              accessibilityLabel={audio.isPlaying ? 'Pause' : 'Play'}
            >
              {audio.isLoading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Ionicons
                  name={audio.isPlaying ? 'pause' : 'play'}
                  size={40}
                  color="#fff"
                  style={audio.isPlaying ? undefined : styles.playIconOffset}
                />
              )}
            </TouchableOpacity>

            <View style={styles.progressRow}>
              <Text style={styles.timeText}>{formatTime(displayedMs)}</Text>
              <View
                style={styles.trackHit}
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                {...panResponder.panHandlers}
              >
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${fraction * 100}%` }]} />
                </View>
                <View
                  style={[
                    styles.thumb,
                    { left: `${fraction * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(audio.durationMs)}</Text>
            </View>

            <View style={styles.speedRow}>
              {RATES.map((r) => {
                const active = audio.rate === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => audio.setRate(r)}
                    style={[styles.speedPill, active && styles.speedPillActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.speedText, active && styles.speedTextActive]}>
                      {r}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>

      <ScrollView
        style={styles.textScroll}
        contentContainerStyle={styles.textContent}
        showsVerticalScrollIndicator={false}
      >
        {sentences.length > 0 ? (
          <Text style={styles.bodyText}>
            {sentences.map((sent, i) => (
              <Text
                key={i}
                style={i === activeIdx ? styles.bodyTextActive : undefined}
              >
                {sent}
                {i < sentences.length - 1 ? ' ' : ''}
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={styles.bodyText}>{audioText}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    centeredFull: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      padding: 24,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    backBtn: {
      padding: 4,
      width: 30,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.textPrimary,
    },

    titleBlock: {
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 8,
      alignItems: 'center',
      gap: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      lineHeight: 26,
    },
    badge: {
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 5,
      backgroundColor: c.primaryLight,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
      letterSpacing: 0.4,
    },

    playerArea: {
      paddingHorizontal: 24,
      paddingVertical: 24,
      alignItems: 'center',
      gap: 24,
    },
    playBtn: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    playIconOffset: {
      marginLeft: 4,
    },

    progressRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    trackHit: {
      flex: 1,
      height: 28,
      justifyContent: 'center',
    },
    track: {
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    trackFill: {
      height: 4,
      backgroundColor: c.primary,
      borderRadius: 2,
    },
    thumb: {
      position: 'absolute',
      top: 6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: c.primary,
      marginLeft: -8,
    },
    timeText: {
      fontSize: 12,
      color: c.textSecondary,
      fontVariant: ['tabular-nums'],
      minWidth: 36,
      textAlign: 'center',
    },

    speedRow: {
      flexDirection: 'row',
      gap: 8,
    },
    speedPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    speedPillActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    speedText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    speedTextActive: {
      color: '#fff',
    },

    textScroll: {
      flex: 1,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    textContent: {
      padding: 24,
      paddingBottom: 48,
    },
    bodyText: {
      fontSize: 16,
      lineHeight: 26,
      color: c.textSecondary,
    },
    bodyTextActive: {
      color: c.textPrimary,
      backgroundColor: c.primaryLight,
    },

    errorBox: {
      alignItems: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
    },
    errorSub: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 12,
    },
    retryBtn: {
      marginTop: 8,
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    retryBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });
