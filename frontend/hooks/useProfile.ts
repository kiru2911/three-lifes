import { useEffect, useMemo, useState } from 'react';
import feedData from '@/assets/feed.json';
import type { FeedItem } from '@/types/feed';
import {
  EMPTY_VIEWED,
  STORAGE_KEYS,
  getJSON,
  type ViewedItems,
} from '@/utils/storage';

interface ProfileState {
  ready: boolean;
  savedIds: string[];
  selectedInterests: string[];
  viewed: ViewedItems;
}

const allItems = feedData as FeedItem[];

export function useProfile() {
  const [state, setState] = useState<ProfileState>({
    ready: false,
    savedIds: [],
    selectedInterests: [],
    viewed: EMPTY_VIEWED,
  });

  useEffect(() => {
    setState({
      ready: true,
      savedIds: getJSON<string[]>(STORAGE_KEYS.savedItems, []),
      selectedInterests: getJSON<string[]>(STORAGE_KEYS.selectedInterests, []),
      viewed: getJSON<ViewedItems>(STORAGE_KEYS.viewedItems, EMPTY_VIEWED),
    });
  }, []);

  // Resolve saved IDs against the bundled feed in original save order.
  const savedItems = useMemo(() => {
    const byId = new Map(allItems.map((i) => [i.id, i] as const));
    return state.savedIds
      .map((id) => byId.get(id))
      .filter((i): i is FeedItem => Boolean(i));
  }, [state.savedIds]);

  return {
    ready: state.ready,
    savedItems,
    savedCount: savedItems.length,
    selectedInterests: state.selectedInterests,
    conceptsViewedCount: state.viewed.concept.length,
    newsViewedCount: state.viewed.news.length,
  };
}
