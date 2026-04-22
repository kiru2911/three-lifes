export interface CategoryMeta {
  key: string;
  label: string;
  colors: [string, string]; // gradient start → end
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  foundations: {
    key: 'foundations',
    label: 'Foundations',
    colors: ['#534AB7', '#7F77DD'],
  },
  neural_networks: {
    key: 'neural_networks',
    label: 'Neural Networks',
    colors: ['#185FA5', '#378ADD'],
  },
  llms: {
    key: 'llms',
    label: 'LLMs',
    colors: ['#0F6E56', '#1D9E75'],
  },
  retrieval_and_memory: {
    key: 'retrieval_and_memory',
    label: 'Retrieval & Memory',
    colors: ['#854F0B', '#BA7517'],
  },
  training_and_optimization: {
    key: 'training_and_optimization',
    label: 'Training & Optimization',
    colors: ['#993C1D', '#D85A30'],
  },
  ai_applications: {
    key: 'ai_applications',
    label: 'AI Applications',
    colors: ['#993556', '#D4537E'],
  },
  evaluation_and_safety: {
    key: 'evaluation_and_safety',
    label: 'Evaluation & Safety',
    colors: ['#5F5E5A', '#888780'],
  },
};

export function getCategoryMeta(key: string): CategoryMeta {
  return (
    CATEGORY_META[key] ?? {
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      colors: ['#534AB7', '#7F77DD'],
    }
  );
}
