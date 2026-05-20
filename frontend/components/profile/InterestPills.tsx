import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { INTERESTS } from '@/components/onboarding/InterestSelector';

interface Props {
  interestIds: string[];
}

export function InterestPills({ interestIds }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (interestIds.length === 0) {
    return (
      <Text style={styles.emptyText}>No interests selected yet</Text>
    );
  }

  const labelById = new Map(INTERESTS.map((i) => [i.id, i.label] as const));

  return (
    <View style={styles.wrap}>
      {interestIds.map((id) => (
        <View key={id} style={styles.pill}>
          <Text style={styles.pillText}>{labelById.get(id) ?? id}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      backgroundColor: c.primary,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    pillText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 13,
      color: c.textMuted,
    },
  });
