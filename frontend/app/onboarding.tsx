import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { ProgressIndicator } from '@/components/onboarding/ProgressIndicator';
import {
  InterestSelector,
  INTERESTS,
} from '@/components/onboarding/InterestSelector';
import {
  CardsIllustration,
  FeedIllustration,
  OnboardingSlide,
  PersonaliseIllustration,
} from '@/components/onboarding/OnboardingSlide';
import { useOnboarding } from '@/hooks/useOnboarding';

const TOTAL_SLIDES = 3;

export default function OnboardingScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { complete, selectedInterests: initialInterests } = useOnboarding();

  const [index, setIndex] = useState(0);
  const [interests, setInterests] = useState<string[]>(initialInterests);

  // Seed interests from storage once it's loaded.
  useEffect(() => {
    if (initialInterests.length && interests.length === 0) {
      setInterests(initialInterests);
    }
    // we only want to mirror the initial value, not subsequent changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInterests]);

  // Slide animation (fade + horizontal slide). We animate a single value and
  // re-mount the slide content on index change so the animation is crisp.
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, anim]);

  const slideStyle = {
    opacity: anim,
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };

  const finish = useCallback(
    (interestIds: string[]) => {
      complete(interestIds);
      router.replace('/(tabs)');
    },
    [complete]
  );

  const handleNext = useCallback(() => {
    if (index < TOTAL_SLIDES - 1) {
      setIndex((i) => i + 1);
    } else {
      finish(interests);
    }
  }, [index, interests, finish]);

  const handleSkip = useCallback(() => {
    finish([]);
  }, [finish]);

  const isLast = index === TOTAL_SLIDES - 1;

  const ctaLabel = isLast ? 'Start Learning' : 'Next';
  const ctaDisabled = false;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.frame}>
        <View style={styles.topBar}>
          <ProgressIndicator total={TOTAL_SLIDES} current={index} />
          <Pressable
            onPress={handleSkip}
            hitSlop={10}
            accessibilityLabel="Skip onboarding"
          >
            {({ pressed }) => (
              <Text
                style={[
                  styles.skipText,
                  pressed && { opacity: 0.5 },
                ]}
              >
                Skip
              </Text>
            )}
          </Pressable>
        </View>

        <Animated.View style={[styles.slideArea, slideStyle]}>
          {index === 0 && (
            <OnboardingSlide
              illustration={<FeedIllustration />}
              headline="Learn while you scroll"
              body="Thinkly transforms AI news and tech concepts into short, high-signal micro-learning content."
            />
          )}
          {index === 1 && (
            <OnboardingSlide
              illustration={<CardsIllustration />}
              headline="News + Concepts"
              body="Stay updated with AI news and understand complex topics like RAG, embeddings, and vector databases in minutes."
            />
          )}
          {index === 2 && (
            <OnboardingSlide
              illustration={<PersonaliseIllustration />}
              headline="Personalise your learning"
              body="Choose topics you're interested in so Thinkly can tailor your learning feed."
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.interestsScroll}
              >
                <InterestSelector
                  selected={interests}
                  onChange={setInterests}
                />
                <Text style={styles.helperText}>
                  {interests.length === 0
                    ? 'Pick a few to personalise your feed'
                    : `${interests.length} of ${INTERESTS.length} selected`}
                </Text>
              </ScrollView>
            </OnboardingSlide>
          )}
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            onPress={handleNext}
            disabled={ctaDisabled}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            style={({ pressed }) => [
              styles.cta,
              pressed && styles.ctaPressed,
              ctaDisabled && styles.ctaDisabled,
            ]}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
            {!isLast && (
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: 'center',
    },
    frame: {
      flex: 1,
      width: '100%',
      maxWidth: 390,
      paddingHorizontal: 4,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
    },
    skipText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textSecondary,
    },
    slideArea: {
      flex: 1,
    },
    interestsScroll: {
      paddingBottom: 12,
    },
    helperText: {
      marginTop: 14,
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.primary,
      borderRadius: 16,
      paddingVertical: 16,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
    },
    ctaPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.99 }],
    },
    ctaDisabled: {
      opacity: 0.5,
    },
    ctaText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
  });
