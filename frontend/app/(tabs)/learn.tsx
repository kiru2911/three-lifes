import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { getCategoryMeta } from '@/constants/categories';
import { useConcepts } from '@/hooks/useConcepts';

export default function LearnScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { grouped, randomFeatured } = useConcepts();
  const featuredMeta = getCategoryMeta(randomFeatured?.category ?? '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — no bottom border */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Featured for you ── */}
        <Text style={styles.sectionLabel}>Featured for you</Text>

        {randomFeatured && (
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.featuredWrapper}
            onPress={() =>
              router.push(
                `/concept/${randomFeatured.id}?category=${randomFeatured.category}`
              )
            }
          >
            <LinearGradient
              colors={featuredMeta.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.featuredCard}
            >
              {/* Top row: pill + heart */}
              <View style={styles.featuredTop}>
                <View style={styles.featuredPill}>
                  <Text style={styles.featuredPillText}>Featured today</Text>
                </View>
                <TouchableOpacity hitSlop={8}>
                  <Ionicons name="heart-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Bottom row: title + category/difficulty */}
              <View style={styles.featuredBottom}>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {randomFeatured.title}
                </Text>
                <Text style={styles.featuredMeta}>
                  {featuredMeta.label}
                  {randomFeatured.difficulty ? ` · ${cap(randomFeatured.difficulty)}` : ''}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Categories ── */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Categories</Text>

        <View style={styles.grid}>
          {grouped.map(({ key, concepts }) => {
            const meta = getCategoryMeta(key);
            return (
              <TouchableOpacity
                key={key}
                style={styles.categoryWrapper}
                activeOpacity={0.85}
                onPress={() => router.push(`/learn/${key}`)}
              >
                <LinearGradient
                  colors={meta.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.categoryCard}
                >
                  <View style={styles.categoryBottom}>
                    <Text style={styles.categoryName} numberOfLines={2}>
                      {meta.label}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 12,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 12,
    },
    sectionLabelSpaced: {
      marginTop: 28,
    },

    // Featured card
    featuredWrapper: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    featuredCard: {
      height: 180,
      padding: 16,
      justifyContent: 'space-between',
    },
    featuredTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    featuredPill: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    featuredPillText: {
      fontSize: 11,
      color: '#fff',
      fontWeight: '600',
    },
    featuredBottom: {
      gap: 4,
    },
    featuredTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#fff',
      lineHeight: 24,
    },
    featuredMeta: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
    },

    // Category grid
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    categoryWrapper: {
      width: '47.5%',
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    categoryCard: {
      height: 160,
      padding: 14,
      justifyContent: 'flex-end',
    },
    categoryBottom: {
      gap: 3,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
      lineHeight: 20,
    },
    categoryCount: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
    },
  });
