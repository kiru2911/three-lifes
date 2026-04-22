import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { ConceptItem } from '@/types/feed';

interface Props {
  item: ConceptItem;
  style?: ViewStyle;
}

export function ConceptCard({ item, style }: Props) {
  const categoryLabel = item.category
    ? `CONCEPT · ${item.category.toUpperCase()}`
    : 'CONCEPT';
  const difficulty = item.difficulty || item.subtitle?.split(' · ')[1] || '';
  const tags = item.tags?.length ? item.tags : item.keywords?.slice(0, 4) ?? [];

  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.categoryLabel}>{categoryLabel}</Text>
        {difficulty ? (
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.summary}>{item.summary}</Text>

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.slice(0, 5).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* pushes footer to the bottom when card is tall */}
        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity hitSlop={8}>
            <Text style={styles.readMore}>Read more →</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity hitSlop={8}>
              <Ionicons name="volume-medium-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={8}>
              <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: Colors.primaryLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  difficultyBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 25,
    marginBottom: 10,
  },
  summary: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
  },
  tag: {
    backgroundColor: Colors.tagBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.tagText,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  readMore: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});
