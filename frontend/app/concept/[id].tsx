import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { getCategoryMeta } from '@/constants/categories';
import { getConceptById, getConceptsByCategory } from '@/hooks/useConcepts';

// Steps 1–5 are content; step 6 is the completion screen.
const CONTENT_STEPS = 5;
const TOTAL_STEPS = 6;

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : text;
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const colors = useColors();
  const styles = useMemo(() => createPbStyles(colors), [colors]);
  const progress = step >= TOTAL_STEPS ? 1 : step / CONTENT_STEPS;
  const showCounter = step < TOTAL_STEPS;

  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>
      {showCounter && (
        <Text style={styles.counter}>
          {step} / {CONTENT_STEPS}
        </Text>
      )}
    </View>
  );
}

const createPbStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 6,
      gap: 10,
    },
    track: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    fill: {
      height: 4,
      backgroundColor: c.primary,
      borderRadius: 2,
    },
    counter: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
      minWidth: 36,
      textAlign: 'right',
    },
  });

// ─── Step label ────────────────────────────────────────────────────────────────

function StepLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 1,
        marginBottom: 20,
      }}
    >
      {text}
    </Text>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ConceptDetailScreen() {
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [colors]);

  const { id, category: categoryParam } = useLocalSearchParams<{
    id: string;
    category?: string;
  }>();

  const [step, setStep] = useState(1);

  // Reset to step 1 whenever the concept id changes (Next concept flow)
  useEffect(() => {
    setStep(1);
  }, [id]);

  const concept = getConceptById(id ?? '');

  if (!concept) {
    return (
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <View style={s.centeredFull}>
          <Text style={s.errorText}>Concept not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const category = categoryParam ?? concept.category;
  const meta = getCategoryMeta(concept.category);

  function advance() {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  function goBack() {
    router.back();
  }

  function goNextConcept() {
    if (!concept) return;
    const siblings = getConceptsByCategory(category);
    const idx = siblings.findIndex((c) => c.id === concept.id);
    const next = siblings[(idx + 1) % siblings.length];
    router.replace(`/concept/${next.id}?category=${category}`);
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <ProgressBar step={step} />

      {/* Back arrow row */}
      <View style={s.headerRow}>
        <TouchableOpacity onPress={goBack} hitSlop={10} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {step === 1 && <StepHook concept={concept} meta={meta} onNext={advance} />}
      {step === 2 && <StepCore concept={concept} onNext={advance} />}
      {step === 3 && <StepAnalogy concept={concept} onNext={advance} />}
      {step === 4 && <StepWhyMatters concept={concept} onNext={advance} />}
      {step === 5 && <StepDeepDive concept={concept} onNext={advance} />}
      {step === 6 && (
        <StepCompletion
          concept={concept}
          onBackToLearn={goBack}
          onNextConcept={goNextConcept}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Step 1: Hook ──────────────────────────────────────────────────────────────

function StepHook({
  concept,
  meta,
  onNext,
}: {
  concept: NonNullable<ReturnType<typeof getConceptById>>;
  meta: ReturnType<typeof getCategoryMeta>;
  onNext: () => void;
}) {
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={s.stepFull}>
      <View style={s.hookContent}>
        <Text style={s.hookTitle}>{concept.title}</Text>
        <Text style={s.hookFirstSentence}>{firstSentence(concept.summary)}</Text>
        <View style={s.hookBadges}>
          <View style={[s.badge, { backgroundColor: meta.colors[0] }]}>
            <Text style={s.badgeText}>{meta.label}</Text>
          </View>
          {concept.difficulty ? (
            <View style={s.badgeOutline}>
              <Text style={s.badgeOutlineText}>{cap(concept.difficulty)}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={s.footer}>
        <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={s.primaryBtnText}>Start learning →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 2: Core concept ──────────────────────────────────────────────────────

function StepCore({
  concept,
  onNext,
}: {
  concept: NonNullable<ReturnType<typeof getConceptById>>;
  onNext: () => void;
}) {
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[s.stepFull, s.whiteStep]}>
      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepLabel text="CONCEPT" />
        <Text style={s.bodyLarge}>{concept.summary}</Text>
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={s.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 3: Analogy ───────────────────────────────────────────────────────────

function StepAnalogy({
  concept,
  onNext,
}: {
  concept: NonNullable<ReturnType<typeof getConceptById>>;
  onNext: () => void;
}) {
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[s.stepFull, s.analogyStep]}>
      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={s.analogyScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepLabel text="ANALOGY" />
        <Text style={s.quoteDecor}>"</Text>
        <Text style={s.analogyText}>
          {concept.analogy || 'No analogy available for this concept.'}
        </Text>
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={s.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 4: Why it matters ────────────────────────────────────────────────────

function StepWhyMatters({
  concept,
  onNext,
}: {
  concept: NonNullable<ReturnType<typeof getConceptById>>;
  onNext: () => void;
}) {
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[s.stepFull, s.whiteStep]}>
      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepLabel text="WHY IT MATTERS" />
        <Text style={s.bodyMedium}>{concept.extra_text}</Text>
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={s.primaryBtnText}>Continue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 5: Deep dive ─────────────────────────────────────────────────────────

function StepDeepDive({
  concept,
  onNext,
}: {
  concept: NonNullable<ReturnType<typeof getConceptById>>;
  onNext: () => void;
}) {
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  const tags = concept.tags?.length ? concept.tags : concept.keywords?.slice(0, 5) ?? [];

  return (
    <View style={[s.stepFull, s.whiteStep]}>
      <ScrollView
        style={s.scrollArea}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StepLabel text="DEEP DIVE" />
        <Text style={s.bodySmall}>{concept.body_text}</Text>
        {tags.length > 0 && (
          <View style={s.tags}>
            {tags.map((tag) => (
              <View key={tag} style={s.tag}>
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={s.footer}>
        <TouchableOpacity style={s.primaryBtn} onPress={onNext} activeOpacity={0.8}>
          <Text style={s.primaryBtnText}>Got it →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 6: Completion ────────────────────────────────────────────────────────

function StepCompletion({
  concept,
  onBackToLearn,
  onNextConcept,
}: {
  concept: NonNullable<ReturnType<typeof getConceptById>>;
  onBackToLearn: () => void;
  onNextConcept: () => void;
}) {
  const colors = useColors();
  const s = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={s.stepFull}>
      <View style={s.completionContent}>
        <View style={s.checkCircle}>
          <Ionicons name="checkmark" size={36} color="#fff" />
        </View>
        <Text style={s.completionTitle}>Nice work!</Text>
        <Text style={s.completionSub}>
          You just learned about{'\n'}
          <Text style={s.completionConceptName}>{concept.title}</Text>
        </Text>
      </View>
      <View style={s.completionButtons}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={onBackToLearn}
          activeOpacity={0.8}
        >
          <Text style={s.primaryBtnText}>Back to Learn</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.outlineBtn}
          onPress={onNextConcept}
          activeOpacity={0.8}
        >
          <Text style={s.outlineBtnText}>Next concept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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
    errorText: {
      fontSize: 16,
      color: c.textSecondary,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    backBtn: {
      padding: 4,
    },

    // Step containers
    stepFull: {
      flex: 1,
    },
    whiteStep: {
      backgroundColor: c.card,
    },
    analogyStep: {
      backgroundColor: c.primaryLight,
    },

    // Scrollable content area
    scrollArea: {
      flex: 1,
    },
    scrollContent: {
      padding: 24,
      paddingBottom: 12,
    },
    analogyScrollContent: {
      padding: 24,
      paddingBottom: 12,
      alignItems: 'center',
    },

    // Step 1 — Hook
    hookContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 28,
      gap: 20,
    },
    hookTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: c.textPrimary,
      textAlign: 'center',
      lineHeight: 32,
    },
    hookFirstSentence: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    hookBadges: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 4,
    },
    badge: {
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    badgeOutline: {
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    badgeOutlineText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
    },

    // Step 2 — Core concept
    bodyLarge: {
      fontSize: 18,
      color: c.textPrimary,
      lineHeight: 32,
    },

    // Step 3 — Analogy
    quoteDecor: {
      fontSize: 80,
      color: c.primary,
      opacity: 0.2,
      lineHeight: 72,
      marginBottom: 4,
      fontWeight: '700',
    },
    analogyText: {
      fontSize: 18,
      fontStyle: 'italic',
      color: c.textPrimary,
      lineHeight: 30,
      textAlign: 'center',
      paddingHorizontal: 8,
    },

    // Step 4 — Why it matters
    bodyMedium: {
      fontSize: 17,
      color: c.textPrimary,
      lineHeight: 28,
    },

    // Step 5 — Deep dive
    bodySmall: {
      fontSize: 16,
      color: c.textPrimary,
      lineHeight: 26,
      marginBottom: 20,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    tag: {
      backgroundColor: c.tagBg,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    tagText: {
      fontSize: 12,
      color: c.tagText,
    },

    // Step 6 — Completion
    completionContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 32,
    },
    checkCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    completionTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: c.textPrimary,
    },
    completionSub: {
      fontSize: 16,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    completionConceptName: {
      color: c.textPrimary,
      fontWeight: '600',
    },
    completionButtons: {
      padding: 24,
      gap: 12,
    },

    // Shared buttons
    footer: {
      padding: 24,
      paddingTop: 16,
    },
    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    outlineBtn: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.primary,
      backgroundColor: c.card,
    },
    outlineBtnText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.primary,
    },
  });
