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
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { getCategoryMeta } from '@/constants/categories';
import { getConceptsByCategory } from '@/hooks/useConcepts';
import type { ConceptItem } from '@/types/feed';

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const meta = getCategoryMeta(category ?? '');
  const concepts = getConceptsByCategory(category ?? '');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{meta.label}</Text>
        {/* spacer to balance the back arrow */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Gradient banner */}
      <LinearGradient
        colors={meta.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.banner}
      >
        <Text style={styles.bannerCount}>
          {concepts.length} concept{concepts.length !== 1 ? 's' : ''}
        </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  backButton: {
    width: 32,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 32,
  },

  // Gradient banner
  banner: {
    height: 120,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 18,
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
    backgroundColor: Colors.surface,
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
    color: Colors.textPrimary,
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
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
