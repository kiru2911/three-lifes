import { useState, useMemo } from 'react';
import feedData from '@/assets/feed.json';
import type { FeedItem, ContentType } from '@/types/feed';

export type FeedFilter = 'all' | ContentType;

const allItems = feedData as FeedItem[];

export function useFeed() {
  const [filter, setFilter] = useState<FeedFilter>('all');

  const items = useMemo(
    () => (filter === 'all' ? allItems : allItems.filter((i) => i.content_type === filter)),
    [filter]
  );

  return { items, filter, setFilter };
}
