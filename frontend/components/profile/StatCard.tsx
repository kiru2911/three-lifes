import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number;
  label: string;
  tint?: 'primary' | 'news';
}

export function StatCard({ icon, value, label, tint = 'primary' }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tintColor = tint === 'news' ? colors.news : colors.primary;
  const tintBg = tint === 'news' ? colors.newsLight : colors.primaryLight;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
        <Ionicons name={icon} size={16} color={tintColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'flex-start',
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    value: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.4,
    },
    label: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '500',
    },
  });
