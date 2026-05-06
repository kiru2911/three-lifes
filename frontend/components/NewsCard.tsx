import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { timeAgo } from '@/utils/timeAgo';
import type { NewsItem } from '@/types/feed';

interface Props {
  item: NewsItem;
  style?: ViewStyle;
}

export function NewsCard({ item, style }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [imageFailed, setImageFailed] = useState(false);

  const categoryLabel = item.category ? item.category.toUpperCase() : 'NEWS';
  const tags = item.tags?.length ? item.tags : item.keywords?.slice(0, 4) ?? [];
  const showImage = !!item.image_url && !imageFailed;

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

        {showImage ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : null}

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

        {item.source_url ? (
          <View style={styles.readMoreRow}>
            <TouchableOpacity
              onPress={() => Linking.openURL(item.source_url)}
              style={styles.readMore}
              hitSlop={8}
            >
              <Text style={styles.readMoreText}>Read more</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.news} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.source}>{item.source_name}</Text>
          <View style={styles.actions}>
            <TouchableOpacity hitSlop={8}>
              <Ionicons name="volume-medium-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={8}>
              <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
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
      backgroundColor: c.news,
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
      color: c.news,
      letterSpacing: 0.8,
    },
    timestamp: {
      fontSize: 12,
      color: c.textSecondary,
    },
    image: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: 10,
      backgroundColor: c.tagBg,
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      lineHeight: 25,
      marginBottom: 10,
    },
    summary: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 21,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 14,
    },
    tag: {
      backgroundColor: c.tagBg,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    tagText: {
      fontSize: 12,
      color: c.tagText,
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
      borderTopColor: c.border,
    },
    source: {
      fontSize: 13,
      color: c.textSecondary,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    readMoreRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingBottom: 10,
    },
    readMore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    readMoreText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.news,
    },
  });
