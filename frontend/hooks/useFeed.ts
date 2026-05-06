import { useState, useMemo } from 'react';
import feedData from '@/assets/feed.json';
import type { FeedItem, ContentType } from '@/types/feed';

export type FeedFilter = 'all' | ContentType;

const allItems = feedData as FeedItem[];

const newsSources = Array.from(
  new Set(
    allItems
      .filter((i) => i.content_type === 'news')
      .map((i) => i.source_name)
      .filter(Boolean)
  )
).sort();

export function useFeed() {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const items = useMemo(() => {
    let result = filter === 'all' ? allItems : allItems.filter((i) => i.content_type === filter);
    if (selectedSources.length > 0) {
      const set = new Set(selectedSources);
      result = result.filter((i) => i.content_type === 'news' && set.has(i.source_name));
    }
    return result;
  }, [filter, selectedSources]);

  return {
    items,
    filter,
    setFilter,
    selectedSources,
    setSelectedSources,
    sources: newsSources,
  };
}
