import { useMemo } from 'react';
import feedData from '@/assets/feed.json';
import type { ConceptItem, FeedItem } from '@/types/feed';

const allConcepts = (feedData as FeedItem[]).filter(
  (i): i is ConceptItem => i.content_type === 'concept'
);

export interface CategoryGroup {
  key: string;
  concepts: ConceptItem[];
}

export function useConcepts() {
  const grouped = useMemo(() => {
    const map = new Map<string, ConceptItem[]>();
    for (const c of allConcepts) {
      const key = c.category || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).map(([key, concepts]) => ({ key, concepts }));
  }, []);

  const randomFeatured = useMemo(() => {
    const idx = Math.floor(Math.random() * allConcepts.length);
    return allConcepts[idx];
  }, []);

  return { concepts: allConcepts, grouped, randomFeatured };
}

export function getConceptsByCategory(category: string): ConceptItem[] {
  return allConcepts.filter((c) => c.category === category);
}

export function getConceptById(id: string): ConceptItem | undefined {
  return allConcepts.find((c) => c.id === id);
}
