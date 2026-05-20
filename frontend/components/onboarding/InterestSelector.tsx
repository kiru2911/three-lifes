import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

export interface Interest {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export const INTERESTS: Interest[] = [
  { id: 'llms', label: 'LLMs', icon: 'sparkles-outline' },
  { id: 'ai_agents', label: 'AI Agents', icon: 'people-circle-outline' },
  { id: 'machine_learning', label: 'Machine Learning', icon: 'analytics-outline' },
  { id: 'startups', label: 'Startups', icon: 'rocket-outline' },
  { id: 'robotics', label: 'Robotics', icon: 'hardware-chip-outline' },
  { id: 'computer_vision', label: 'Computer Vision', icon: 'eye-outline' },
  { id: 'generative_ai', label: 'Generative AI', icon: 'color-wand-outline' },
  { id: 'programming', label: 'Programming', icon: 'code-slash-outline' },
];

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
}

export function InterestSelector({ selected, onChange }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <View style={styles.wrap}>
      {INTERESTS.map((item) => {
        const active = selected.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(item.id)}
            style={({ pressed }) => [
              styles.pill,
              active && styles.pillActive,
              pressed && styles.pillPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
          >
            <Ionicons
              name={item.icon}
              size={16}
              color={active ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 10,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    pillActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    pillPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.97 }],
    },
    pillText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.textSecondary,
    },
    pillTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
