import { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { getCategoryMeta } from '@/constants/categories';
import { getConceptsByCategory } from '@/hooks/useConcepts';
import type { ConceptItem } from '@/types/feed';

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function CategoryScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { category } = useLocalSearchParams<{ category: string }>();
  const meta = getCategoryMeta(category ?? '');
  const concepts = getConceptsByCategory(category ?? '');

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Gradient banner with header inside */}
      <LinearGradient
        colors={meta.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.banner, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle} numberOfLines={2}>
            {meta.label}
          </Text>
          <Text style={styles.bannerCount}>
            {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Concept list */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {concepts.map((item) => (
          <ConceptRow key={item.id} item={item} accentColor={meta.colors[0]} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ConceptRow({
  item,
  accentColor,
}: {
  item: ConceptItem;
  accentColor: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={styles.card}
      onPress={() => router.push(`/concept/${item.id}?category=${item.category}`)}
    >
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.difficulty ? (
            <View style={[styles.badge, { backgroundColor: accentColor }]}>
              <Text style={styles.badgeText}>{cap(item.difficulty)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardSummary} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },

    // Header (sits inside the banner)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 32,
    },
    headerSpacer: {
      width: 32,
    },

    // Gradient banner
    banner: {
      paddingHorizontal: 20,
      paddingBottom: 22,
    },
    bannerContent: {
      marginTop: 18,
      gap: 6,
    },
    bannerTitle: {
      fontSize: 34,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: -0.5,
      lineHeight: 40,
    },
    bannerCount: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.85)',
      fontWeight: '500',
    },

    // Concept cards
    list: {
      padding: 16,
      gap: 10,
      paddingBottom: 32,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardAccent: {
      width: 4,
    },
    cardBody: {
      flex: 1,
      padding: 14,
      gap: 6,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    cardTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: c.textPrimary,
      lineHeight: 21,
    },
    badge: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginTop: 1,
      flexShrink: 0,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#fff',
    },
    cardSummary: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
    },
  });
