import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

interface Props {
  name: string;
  subtitle: string;
  initials?: string;
  onSettingsPress?: () => void;
  settingsIcon?: React.ComponentProps<typeof Ionicons>['name'];
  settingsLabel?: string;
}

export function ProfileHeader({
  name,
  subtitle,
  initials,
  onSettingsPress,
  settingsIcon = 'settings-outline',
  settingsLabel = 'Settings',
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const fallbackInitials =
    initials ??
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');

  return (
    <View style={styles.wrap}>
      {onSettingsPress ? (
        <Pressable
          onPress={onSettingsPress}
          accessibilityLabel={settingsLabel}
          hitSlop={10}
          style={({ pressed }) => [
            styles.settingsBtn,
            pressed && styles.settingsBtnPressed,
          ]}
        >
          <Ionicons name={settingsIcon} size={20} color={colors.textSecondary} />
        </Pressable>
      ) : null}

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{fallbackInitials || 'TL'}</Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 12,
    },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.cardElevatedBorder,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 4,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: -0.5,
    },
    name: {
      marginTop: 14,
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.4,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: c.textSecondary,
    },
    settingsBtn: {
      position: 'absolute',
      top: 12,
      right: 16,
      padding: 6,
      borderRadius: 999,
    },
    settingsBtnPressed: {
      opacity: 0.6,
    },
  });
