import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';
import { useFeed, type FeedFilter } from '@/hooks/useFeed';
import { NewsCard } from '@/components/NewsCard';
import { ConceptCard } from '@/components/ConceptCard';
import { FilterModal } from '@/components/FilterModal';
import type { FeedItem } from '@/types/feed';

// How much of the next card peeks below the current one
const PEEK_HEIGHT = 36;
// Breathing room above each card (space between pills bar / previous card bottom and card top)
const CARD_GAP = 12;
// Each item slot = full available height minus the peek strip
// The card itself is (ITEM_HEIGHT - CARD_GAP) tall due to marginTop on the card
const ITEM_HEIGHT = (pageHeight: number) => pageHeight - PEEK_HEIGHT;

const FILTERS: { label: string; value: FeedFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'News', value: 'news' },
  { label: 'Concepts', value: 'concept' },
];

export default function FeedScreen() {
  const { mode, colors, toggleMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { items, filter, setFilter, selectedSources, setSelectedSources, sources } = useFeed();
  const [pageHeight, setPageHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const listRef = useRef<FlatList<FeedItem>>(null);

  const filterActive = selectedSources.length > 0;

  useEffect(() => {
    setCurrentIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter, selectedSources]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  );

  const itemHeight = ITEM_HEIGHT(pageHeight);
  // Snap interval equals item slot height — each item starts exactly where the previous ends
  const snapInterval = itemHeight;

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      // marginTop creates the breathing room below the pills / above each card.
      // flex: 1 fills (itemHeight - CARD_GAP), so the card is tall but not flush to the top.
      const cardStyle = {
        flex: 1 as const,
        marginTop: CARD_GAP,
        marginHorizontal: 16,
      };
      return (
        <View style={{ height: itemHeight }}>
          {item.content_type === 'news'
            ? <NewsCard item={item} style={cardStyle} />
            : <ConceptCard item={item} style={cardStyle} />}
        </View>
      );
    },
    [itemHeight]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.appName}>Th</Text>
          <Ionicons name="bulb" size={20} color={colors.primary} style={styles.logoI} />
          <Text style={styles.appName}>nkly</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={toggleMode}
            hitSlop={10}
            style={styles.themeBtn}
            accessibilityLabel={
              mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
          >
            <Ionicons
              name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.pills}>
        {FILTERS.map(({ label, value }) => {
          const active = filter === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setFilter(value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.pill, styles.filterPill, filterActive && styles.filterPillActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={16}
            color={filterActive ? '#FFFFFF' : colors.textSecondary}
          />
          <Text style={[styles.pillText, filterActive && styles.pillTextActive]}>
            Filter{filterActive ? ` (${selectedSources.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        sources={sources}
        selectedSources={selectedSources}
        onChangeSelectedSources={setSelectedSources}
      />

      <View
        style={styles.feedContainer}
        onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
      >
        {pageHeight > 0 && (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            snapToInterval={snapInterval}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            getItemLayout={(_, index) => ({
              length: itemHeight,
              offset: itemHeight * index,
              index,
            })}
            overScrollMode="never"
            bounces={false}
            windowSize={5}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
          />
        )}
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: c.card,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    logo: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    logoI: {
      marginHorizontal: -1,
      marginBottom: 4,
    },
    appName: {
      fontSize: 22,
      fontWeight: '700',
      color: c.textPrimary,
      letterSpacing: -0.7,
    },
    progress: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    themeBtn: {
      padding: 2,
    },
    pills: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.card,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    pill: {
      borderRadius: 20,
      paddingHorizontal: 18,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    pillActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
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
    filterPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginLeft: 'auto',
    },
    filterPillActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    feedContainer: {
      flex: 1,
    },
  });
