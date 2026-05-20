import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import type { FeedItem } from '@/types/feed';

interface Props {
  item: FeedItem;
  onPress?: () => void;
}

export function SavedContentCard({ item, onPress }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isNews = item.content_type === 'news';
  const badgeColor = isNews ? colors.news : colors.primary;
  const badgeBg = isNews ? colors.newsLight : colors.primaryLight;
  const badgeLabel = isNews ? 'NEWS' : 'CONCEPT';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.accent, { backgroundColor: badgeColor }]} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>
              {badgeLabel}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textMuted}
          />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {item.summary}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    cardPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    accent: {
      width: 3,
    },
    body: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.6,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
      lineHeight: 21,
    },
    summary: {
      fontSize: 13,
      color: c.textSecondary,
      lineHeight: 19,
    },
  });
