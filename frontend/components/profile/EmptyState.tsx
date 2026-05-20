import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

interface Props {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  message: string;
}

export function EmptyState({ icon, message }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={22} color={colors.textMuted} />
      </View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 28,
      gap: 10,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    text: {
      fontSize: 13,
      color: c.textMuted,
    },
  });
