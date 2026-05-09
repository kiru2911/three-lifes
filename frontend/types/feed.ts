export type ContentType = 'news' | 'concept';

export interface ConceptKeyword {
  term: string;
  explanation: string;
}

interface FeedItemBase {
  id: string;
  content_type: ContentType;
  title: string;
  subtitle: string;
  summary: string;
  extra_text: string;
  body_text: string;
  audio_text: string;
  analogy: string;
  image_url: string;
  category: string;
  difficulty: string;
  tags: string[];
  keywords: string[];
  model: string;
  prompt_version: string;
}

export interface NewsItem extends FeedItemBase {
  content_type: 'news';
  source_name: string;
  source_url: string;
  published_at: string;
  collected_at: string;
}

export interface ConceptItem extends FeedItemBase {
  content_type: 'concept';
  keyword_explanations?: ConceptKeyword[];
  source_name: string;
  source_url: string;
  published_at: string;
  collected_at: string;
}

export type FeedItem = NewsItem | ConceptItem;
