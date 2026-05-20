import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

interface Props {
  total: number;
  current: number;
}

export function ProgressIndicator({ total, current }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} active={i === current} done={i < current} colors={colors} />
      ))}
    </View>
  );
}

function Dot({
  active,
  done,
  colors,
}: {
  active: boolean;
  done: boolean;
  colors: ThemeColors;
}) {
  const widthAnim = useRef(new Animated.Value(active ? 24 : 8)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: active ? 24 : 8,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [active, widthAnim]);

  const backgroundColor = active || done ? colors.primary : colors.border;

  return (
    <Animated.View
      style={{
        width: widthAnim,
        height: 8,
        borderRadius: 4,
        backgroundColor,
      }}
    />
  );
}

const createStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
  });
