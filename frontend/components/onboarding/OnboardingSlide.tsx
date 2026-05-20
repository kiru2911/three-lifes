import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

interface Props {
  illustration: ReactNode;
  headline: string;
  body: string;
  children?: ReactNode;
}

export function OnboardingSlide({ illustration, headline, body, children }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.slide}>
      <View style={styles.illustration}>{illustration}</View>
      <View style={styles.copy}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
      {children ? <View style={styles.extras}>{children}</View> : null}
    </View>
  );
}

// ---- Illustrations -------------------------------------------------------

export function FeedIllustration() {
  const colors = useColors();
  const styles = useMemo(() => illustrationStyles(colors), [colors]);
  return (
    <View style={styles.phoneFrame}>
      <View style={styles.notch} />
      <View style={[styles.feedItem, { backgroundColor: colors.primaryLight }]}>
        <View style={[styles.pillTag, { backgroundColor: colors.primary }]}>
          <Text style={styles.pillTagText}>CONCEPT</Text>
        </View>
        <View style={[styles.lineLong, { backgroundColor: colors.primary }]} />
        <View style={[styles.lineShort, { backgroundColor: colors.primary, opacity: 0.4 }]} />
      </View>
      <View style={[styles.feedItem, { backgroundColor: colors.newsLight }]}>
        <View style={[styles.pillTag, { backgroundColor: colors.news }]}>
          <Text style={styles.pillTagText}>NEWS</Text>
        </View>
        <View style={[styles.lineLong, { backgroundColor: colors.news }]} />
        <View style={[styles.lineShort, { backgroundColor: colors.news, opacity: 0.4 }]} />
      </View>
      <View style={styles.sparkleTop}>
        <Ionicons name="sparkles" size={18} color={colors.primary} />
      </View>
    </View>
  );
}

export function CardsIllustration() {
  const colors = useColors();
  const styles = useMemo(() => illustrationStyles(colors), [colors]);
  return (
    <View style={styles.stackWrap}>
      <View style={[styles.stackCard, styles.stackCardBack, { backgroundColor: colors.newsLight }]}>
        <View style={[styles.pillTag, { backgroundColor: colors.news }]}>
          <Text style={styles.pillTagText}>NEWS</Text>
        </View>
        <View style={[styles.lineLong, { backgroundColor: colors.news }]} />
        <View style={[styles.lineShort, { backgroundColor: colors.news, opacity: 0.4 }]} />
      </View>
      <View style={[styles.stackCard, styles.stackCardMid, { backgroundColor: colors.primaryLight }]}>
        <View style={[styles.pillTag, { backgroundColor: colors.primary }]}>
          <Text style={styles.pillTagText}>CONCEPT</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.primary }]}>RAG</Text>
        <View style={[styles.lineShort, { backgroundColor: colors.primary, opacity: 0.4 }]} />
      </View>
      <View style={[styles.stackCard, styles.stackCardFront, { backgroundColor: colors.card, borderColor: colors.cardElevatedBorder }]}>
        <View style={[styles.pillTag, { backgroundColor: colors.primary }]}>
          <Text style={styles.pillTagText}>CONCEPT</Text>
        </View>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Embeddings</Text>
        <View style={[styles.lineLong, { backgroundColor: colors.textMuted, opacity: 0.5 }]} />
        <View style={[styles.lineShort, { backgroundColor: colors.textMuted, opacity: 0.3 }]} />
      </View>
    </View>
  );
}

export function PersonaliseIllustration() {
  const colors = useColors();
  const styles = useMemo(() => illustrationStyles(colors), [colors]);
  return (
    <View style={styles.orbitWrap}>
      <View style={[styles.orbitRing, { borderColor: colors.border }]} />
      <View style={[styles.orbitRingInner, { borderColor: colors.border }]} />
      <View style={[styles.orbitCenter, { backgroundColor: colors.primary }]}>
        <Ionicons name="bulb" size={28} color="#FFFFFF" />
      </View>
      <View style={[styles.orbitChip, styles.chipTop, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.chipText, { color: colors.primary }]}>LLMs</Text>
      </View>
      <View style={[styles.orbitChip, styles.chipRight, { backgroundColor: colors.newsLight }]}>
        <Text style={[styles.chipText, { color: colors.news }]}>Agents</Text>
      </View>
      <View style={[styles.orbitChip, styles.chipBottom, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.chipText, { color: colors.primary }]}>Vision</Text>
      </View>
      <View style={[styles.orbitChip, styles.chipLeft, { backgroundColor: colors.newsLight }]}>
        <Text style={[styles.chipText, { color: colors.news }]}>ML</Text>
      </View>
    </View>
  );
}

// ---- Styles --------------------------------------------------------------

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 24,
    },
    illustration: {
      height: 260,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    copy: {
      marginTop: 24,
      alignItems: 'center',
    },
    headline: {
      fontSize: 26,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.6,
      textAlign: 'center',
    },
    body: {
      marginTop: 12,
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
    extras: {
      marginTop: 28,
      width: '100%',
    },
  });

const illustrationStyles = (c: ThemeColors) =>
  StyleSheet.create({
    // Phone / feed illustration
    phoneFrame: {
      width: 200,
      height: 240,
      borderRadius: 28,
      backgroundColor: c.surface,
      borderWidth: 2,
      borderColor: c.cardElevatedBorder,
      padding: 14,
      paddingTop: 22,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 6,
    },
    notch: {
      position: 'absolute',
      top: 8,
      alignSelf: 'center',
      width: 50,
      height: 5,
      borderRadius: 3,
      backgroundColor: c.cardElevatedBorder,
    },
    sparkleTop: {
      position: 'absolute',
      top: -8,
      right: -10,
      backgroundColor: c.card,
      borderRadius: 999,
      padding: 8,
      borderWidth: 1,
      borderColor: c.cardElevatedBorder,
    },
    feedItem: {
      borderRadius: 14,
      padding: 12,
      gap: 8,
    },
    pillTag: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    pillTagText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.6,
    },
    lineLong: {
      height: 6,
      borderRadius: 3,
      width: '90%',
    },
    lineShort: {
      height: 6,
      borderRadius: 3,
      width: '60%',
    },

    // Stacked cards illustration
    stackWrap: {
      width: 240,
      height: 240,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stackCard: {
      position: 'absolute',
      width: 220,
      borderRadius: 16,
      padding: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    stackCardBack: {
      transform: [{ translateY: -56 }, { rotate: '-6deg' }, { scale: 0.92 }],
      opacity: 0.85,
    },
    stackCardMid: {
      transform: [{ translateY: 0 }, { rotate: '3deg' }, { scale: 0.96 }],
      opacity: 0.95,
    },
    stackCardFront: {
      transform: [{ translateY: 56 }],
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.3,
    },

    // Personalise / orbit illustration
    orbitWrap: {
      width: 240,
      height: 240,
      alignItems: 'center',
      justifyContent: 'center',
    },
    orbitRing: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 1,
      borderStyle: 'dashed',
    },
    orbitRingInner: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 75,
      borderWidth: 1,
      borderStyle: 'dashed',
      opacity: 0.6,
    },
    orbitCenter: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    orbitChip: {
      position: 'absolute',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '700',
    },
    chipTop: { top: 8, left: 60 },
    chipRight: { right: 6, top: 100 },
    chipBottom: { bottom: 12, right: 50 },
    chipLeft: { left: 0, top: 110 },
  });
