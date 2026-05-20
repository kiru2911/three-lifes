import { useCallback, useMemo } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { useProfile } from '@/hooks/useProfile';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { StatCard } from '@/components/profile/StatCard';
import { InterestPills } from '@/components/profile/InterestPills';
import { SavedContentCard } from '@/components/profile/SavedContentCard';
import { EmptyState } from '@/components/profile/EmptyState';
import { FutureFeaturesCard } from '@/components/profile/FutureFeaturesCard';
import type { FeedItem } from '@/types/feed';

export default function ProfileScreen() {
  const { mode, colors, toggleMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDark = mode === 'dark';

  const {
    savedItems,
    savedCount,
    selectedInterests,
    conceptsViewedCount,
    newsViewedCount,
  } = useProfile();

  const openItem = useCallback((item: FeedItem) => {
    if (item.content_type === 'concept') {
      router.push(`/concept/${item.id}?category=${item.category}`);
    } else if (item.source_url) {
      Linking.openURL(item.source_url);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.frame}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ProfileHeader
            name="Thinkly Learner"
            subtitle="Learning AI one scroll at a time"
            settingsIcon={isDark ? 'sunny-outline' : 'moon-outline'}
            settingsLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onSettingsPress={toggleMode}
          />

          <View style={styles.statsRow}>
            <StatCard
              icon="bookmark-outline"
              value={savedCount}
              label="Saved"
              tint="primary"
            />
            <StatCard
              icon="bulb-outline"
              value={conceptsViewedCount}
              label="Concepts"
              tint="primary"
            />
            <StatCard
              icon="newspaper-outline"
              value={newsViewedCount}
              label="News"
              tint="news"
            />
          </View>

          <Section title="Your Interests">
            <InterestPills interestIds={selectedInterests} />
          </Section>

          <Section title="Saved Content">
            {savedItems.length === 0 ? (
              <EmptyState
                icon="bookmark-outline"
                message="No saved content yet"
              />
            ) : (
              <View style={styles.savedList}>
                {savedItems.map((item) => (
                  <SavedContentCard
                    key={item.id}
                    item={item}
                    onPress={() => openItem(item)}
                  />
                ))}
              </View>
            )}
          </Section>

          <Section>
            <FutureFeaturesCard />
          </Section>

          <View style={styles.footerSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => sectionStyles(colors), [colors]);

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.background,
      alignItems: 'center',
    },
    frame: {
      flex: 1,
      width: '100%',
      maxWidth: 390,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },
    savedList: {
      gap: 10,
    },
    footerSpacer: {
      height: 8,
    },
  });

const sectionStyles = (c: ThemeColors) =>
  StyleSheet.create({
    section: {
      marginTop: 26,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.2,
      marginBottom: 12,
    },
  });
