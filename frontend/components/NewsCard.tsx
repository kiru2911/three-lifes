import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { timeAgo } from '@/utils/timeAgo';
import type { NewsItem } from '@/types/feed';

interface Props {
  item: NewsItem;
  style?: ViewStyle;
}

export function NewsCard({ item, style }: Props) {
  const categoryLabel = item.category ? item.category.toUpperCase() : 'NEWS';
  const tags = item.tags?.length ? item.tags : item.keywords?.slice(0, 4) ?? [];

  return (
    <View style={[styles.card, style]}>
      <View style={styles.accentBar} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.category}>{categoryLabel}</Text>
          {item.published_at ? (
            <Text style={styles.timestamp}>{timeAgo(item.published_at)}</Text>
          ) : null}
        </View>

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
          <Text style={styles.source}>{item.source_name}</Text>
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
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: Colors.news,
  },
  body: {
    flex: 1,
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.news,
    letterSpacing: 0.8,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  source: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});
