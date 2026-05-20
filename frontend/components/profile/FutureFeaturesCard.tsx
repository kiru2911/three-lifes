import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

const FUTURE_FEATURES: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}[] = [
  { icon: 'flame-outline', label: 'Learning streaks' },
  { icon: 'sparkles-outline', label: 'Personalised recommendations' },
  { icon: 'headset-outline', label: 'Audio playlists' },
  { icon: 'map-outline', label: 'AI learning paths' },
];

export function FutureFeaturesCard() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Coming soon</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Soon</Text>
        </View>
      </View>
      <View style={styles.list}>
        {FUTURE_FEATURES.map((f) => (
          <View key={f.label} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={f.icon} size={15} color={colors.primary} />
            </View>
            <Text style={styles.rowText}>{f.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
      opacity: 0.92,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.2,
    },
    tag: {
      backgroundColor: c.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 999,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: 0.6,
    },
    list: {
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      fontSize: 14,
      color: c.textSecondary,
      fontWeight: '500',
    },
  });
