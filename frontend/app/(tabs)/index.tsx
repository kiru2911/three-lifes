import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native';
import { useRef, useState, useEffect, useCallback } from 'react';
import { Colors } from '@/constants/colors';
import { useFeed, type FeedFilter } from '@/hooks/useFeed';
import { NewsCard } from '@/components/NewsCard';
import { ConceptCard } from '@/components/ConceptCard';
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
  const { items, filter, setFilter } = useFeed();
  const [pageHeight, setPageHeight] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<FeedItem>>(null);

  useEffect(() => {
    setCurrentIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filter]);

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
        <Text style={styles.appName}>Thinkly</Text>
        {items.length > 0 && (
          <Text style={styles.progress}>
            {currentIndex + 1}/{items.length}
          </Text>
        )}
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
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  progress: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  feedContainer: {
    flex: 1,
  },
});
