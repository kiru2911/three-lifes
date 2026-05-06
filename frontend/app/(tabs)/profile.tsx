import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

export default function ProfileScreen() {
  const { mode, colors, toggleMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = mode === 'dark';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={toggleMode}
          accessibilityLabel={
            isDark ? 'Switch to light mode' : 'Switch to dark mode'
          }
        >
          <View style={styles.rowLeft}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.rowLabel}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </Text>
          </View>
          <View style={[styles.toggle, isDark && styles.toggleOn]}>
            <View
              style={[styles.toggleKnob, isDark && styles.toggleKnobOn]}
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderTitle}>More coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.card,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.5,
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      letterSpacing: 1,
      marginBottom: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: c.textPrimary,
    },
    toggle: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.border,
      padding: 3,
      justifyContent: 'center',
    },
    toggleOn: {
      backgroundColor: c.primary,
    },
    toggleKnob: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
    },
    toggleKnobOn: {
      transform: [{ translateX: 18 }],
    },
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderTitle: {
      fontSize: 14,
      color: c.textMuted,
    },
  });
